"""
Picture Search chain.

Flow:
  1. Vision: analyze the uploaded image -> rich text description
  2. Embed that description -> vector
  3. Pinecone: query for the top-k most similar indexed items
  4. Return (description, sources) — the caller (endpoint) then streams the
     final answer via rag_service.generate_answer_stream(description, sources)

Also provides index_image(), used by the /upload endpoint to add new images
into the searchable Pinecone index.
"""
import logging
from typing import Any

from app.services import pinecone_service, vision_service

logger = logging.getLogger("pixora.chains.picture_search")


async def search_by_image(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    top_k: int = 5,
) -> tuple[str, list[dict[str, Any]]]:
    """
    Runs the Picture Search retrieval pipeline.
    Returns (image_description, sources) where sources is a list of
    {id, score, metadata} dicts from Pinecone, ready for rag_service.
    """
    description = await vision_service.analyze_image(image_bytes, mime_type)
    logger.info("Image analyzed: %s", description[:120])

    query_embedding = await vision_service.embed_text(description, task_type="RETRIEVAL_QUERY")

    matches = pinecone_service.query_similar(query_embedding, top_k=top_k)

    sources = [
        {
            "source": match["metadata"].get("title") or match["id"],
            "content": match["metadata"].get("description", ""),
            "score": match["score"],
        }
        for match in matches
    ]

    return description, sources


async def index_image(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    extra_metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Analyzes an image and stores it in Pinecone so future Picture Searches
    can find it. Used by the /upload endpoint (admin/ingestion side).
    Returns {vector_id, description}.
    """
    pinecone_service.ensure_index_exists()

    description = await vision_service.analyze_image(image_bytes, mime_type)
    embedding = await vision_service.embed_text(description, task_type="RETRIEVAL_DOCUMENT")

    vector_id = pinecone_service.upsert_vector(
        embedding=embedding,
        description=description,
        metadata=extra_metadata or {},
    )

    logger.info("Indexed image as vector_id=%s", vector_id)
    return {"vector_id": vector_id, "description": description}