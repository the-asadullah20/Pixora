"""
Centralized prompt templates, built with LangChain's PromptTemplate.
"""
from langchain_core.prompts import PromptTemplate

IMAGE_ANALYSIS_PROMPT = """You are an expert image analyst for a visual search engine.
Look at this image carefully and describe it in detail so it can be used as a
search query. Include:

- What the main subject(s) are (objects, people, products, landmarks, etc.)
- Any visible text (signs, labels, documents, screenshots, charts) - transcribe it
- The setting/context (indoor/outdoor, style, type of document, etc.)
- Notable colors, layout, or structure if relevant (e.g. for charts/screenshots)

Write this as a dense, factual paragraph optimized for semantic search matching.
Do not add commentary like "this image shows" - just describe directly.
"""

RAG_SYSTEM_INSTRUCTION = """You are Pixora's AI assistant. The user searched using an
image instead of text. You are given:
  1. A description of what's in their image
  2. Retrieved context (from an internal knowledge base or the live web)

Answer the user's implicit question - "what is this, and what should I know
about it?" - using ONLY the retrieved context plus the image description.
If the context doesn't fully answer it, say what's missing rather than
guessing. Be concise, factual, and well-organized. Cite sources by name/URL
when context items have them.
"""

RAG_ANSWER_PROMPT = PromptTemplate(
    input_variables=["image_description", "context_block"],
    template="""## Image Description
{image_description}

## Retrieved Context
{context_block}

## Task
Based on the above, answer what the user most likely wants to know about
this image. Reference specific context items where relevant.
""",
)

PICTURE_SEARCH_SYSTEM_INSTRUCTION = (
    RAG_SYSTEM_INSTRUCTION
    + "\nThe retrieved context here comes from Pixora's own indexed knowledge "
    "base (Pinecone) — treat it as internal, curated data rather than the "
    "open web.\n"
)

INTERNET_SEARCH_SYSTEM_INSTRUCTION = (
    RAG_SYSTEM_INSTRUCTION
    + "\nThe retrieved context here comes from live web search results and "
    "scraped pages — note that it may be time-sensitive, and prefer the most "
    "recent/authoritative-looking sources when they conflict.\n"
)


def format_context_block(context_items: list[dict]) -> str:
    if not context_items:
        return "(No relevant context was retrieved.)"
    blocks = []
    for i, item in enumerate(context_items, start=1):
        source = item.get("source") or item.get("url") or item.get("title") or "Unknown source"
        content = item.get("content") or item.get("description") or ""
        blocks.append(f"[{i}] Source: {source}\n{content}")
    return "\n\n".join(blocks)


def build_rag_prompt(image_description: str, context_items: list[dict]) -> str:
    return RAG_ANSWER_PROMPT.format(
        image_description=image_description,
        context_block=format_context_block(context_items),
    )


def system_instruction_for_mode(mode: str) -> str:
    if mode == "picture":
        return PICTURE_SEARCH_SYSTEM_INSTRUCTION
    if mode == "internet":
        return INTERNET_SEARCH_SYSTEM_INSTRUCTION
    return RAG_SYSTEM_INSTRUCTION