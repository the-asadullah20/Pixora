"""
RAG (Retrieval-Augmented Generation) service.

This is where everything comes together: the image's description +
retrieved context (from Pinecone for Picture Search, or from web
search/scraping for Internet Search) get assembled into a prompt and sent
to Gemini for a final, streamed answer.

Both search chains (picture_search_chain.py, internet_search_chain.py) call
into this — it doesn't care where the context came from.
"""
import logging
from collections.abc import AsyncIterator
from typing import Any

from google import genai
from google.genai import types

from app.core.config import get_settings

logger = logging.getLogger("pixora.rag")

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is not None:
        return _client
    settings = get_settings()
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set in .env")
    _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


SYSTEM_INSTRUCTION = """You are Pixora's AI assistant. The user searched using an
image instead of text. You are given:
  1. A description of what's in their image
  2. Retrieved context (from an internal knowledge base or the live web)

Answer the user's implicit question — "what is this, and what should I know
about it?" — using ONLY the retrieved context plus the image description.
If the context doesn't fully answer it, say what's missing rather than
guessing. Be concise, factual, and well-organized. Cite sources by name/URL
when context items have them.
"""


def _format_context(context_items: list[dict[str, Any]]) -> str:
    """Turns retrieved context (from Pinecone or web search) into a numbered block."""
    if not context_items:
        return "(No relevant context was retrieved.)"

    blocks = []
    for i, item in enumerate(context_items, start=1):
        source = item.get("source") or item.get("url") or item.get("title") or "Unknown source"
        content = item.get("content") or item.get("description") or ""
        blocks.append(f"[{i}] Source: {source}\n{content}")
    return "\n\n".join(blocks)


def build_prompt(image_description: str, context_items: list[dict[str, Any]]) -> str:
    context_block = _format_context(context_items)
    return f"""## Image Description
{image_description}

## Retrieved Context
{context_block}

## Task
Based on the above, answer what the user most likely wants to know about
this image. Reference specific context items where relevant.
"""


async def generate_answer_stream(
    image_description: str,
    context_items: list[dict[str, Any]],
) -> AsyncIterator[str]:
    """Streams the final RAG answer chunk by chunk (for SSE / streaming responses)."""
    client = _get_client()
    settings = get_settings()

    prompt = build_prompt(image_description, context_items)

    stream = await client.aio.models.generate_content_stream(
        model=settings.GEMINI_TEXT_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION),
    )

    async for chunk in stream:
        if chunk.text:
            yield chunk.text


async def generate_answer(
    image_description: str,
    context_items: list[dict[str, Any]],
) -> str:
    """Non-streaming variant — returns the full answer as one string."""
    parts = []
    async for chunk in generate_answer_stream(image_description, context_items):
        parts.append(chunk)
    return "".join(parts)