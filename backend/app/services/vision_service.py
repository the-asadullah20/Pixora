"""
Gemini Vision service (uses the current `google-genai` SDK, not the
deprecated `google-generativeai` package).

Two jobs:
  1. analyze_image() - looks at an uploaded image and produces a rich text
     description (objects, text, layout, charts, products, landmarks, etc.)
  2. embed_text()    - turns text (the description above, or a user query)
     into a vector, so it can be stored/searched in Pinecone.

We embed the *text description* of an image rather than the raw pixels —
Gemini doesn't expose a direct image-embedding endpoint, so the practical
RAG pattern is: image -> rich text description -> text embedding.
"""
import logging

from google import genai
from google.genai import types

from app.core.config import get_settings

logger = logging.getLogger("pixora.vision")

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


ANALYSIS_PROMPT = """You are an expert image analyst for a visual search engine.
Look at this image carefully and describe it in detail so it can be used as a
search query. Include:

- What the main subject(s) are (objects, people, products, landmarks, etc.)
- Any visible text (signs, labels, documents, screenshots, charts) - transcribe it
- The setting/context (indoor/outdoor, style, type of document, etc.)
- Notable colors, layout, or structure if relevant (e.g. for charts/screenshots)

Write this as a dense, factual paragraph optimized for semantic search matching.
Do not add commentary like "this image shows" - just describe directly.
"""


async def analyze_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """Returns a rich text description of the image, suitable for embedding."""
    client = _get_client()
    settings = get_settings()

    response = await client.aio.models.generate_content(
        model=settings.GEMINI_VISION_MODEL,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ANALYSIS_PROMPT,
        ],
    )
    return response.text.strip()


async def embed_text(text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> list[float]:
    """
    Embeds text into a vector using Gemini's text embedding model.
    task_type: "RETRIEVAL_DOCUMENT" when indexing, "RETRIEVAL_QUERY" when searching.
    """
    client = _get_client()
    settings = get_settings()

    response = await client.aio.models.embed_content(
        model=settings.GEMINI_EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type=task_type),
    )
    return response.embeddings[0].values