"""
Pinecone vector database service.

Handles:
  - ensuring the index exists (auto-creates it on first run)
  - upserting (image description + embedding + metadata) into the index
  - querying by embedding to get the top-k most similar results

Each vector's metadata carries enough info to build a response without a
second DB lookup: description, source type, and whatever extra fields the
caller passes in (e.g. image_url, user_id, title).
"""
import logging
import uuid
from typing import Any

from pinecone import Pinecone, ServerlessSpec

from app.core.config import get_settings

logger = logging.getLogger("pixora.pinecone")

_pc: Pinecone | None = None


def _get_client() -> Pinecone:
    global _pc
    if _pc is not None:
        return _pc
    settings = get_settings()
    if not settings.PINECONE_API_KEY:
        raise RuntimeError("PINECONE_API_KEY is not set in .env")
    _pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    return _pc


def ensure_index_exists() -> None:
    """Creates the Pinecone index if it doesn't already exist. Safe to call repeatedly."""
    pc = _get_client()
    settings = get_settings()

    if pc.has_index(settings.PINECONE_INDEX_NAME):
        return

    logger.info("Creating Pinecone index: %s", settings.PINECONE_INDEX_NAME)
    pc.create_index(
        name=settings.PINECONE_INDEX_NAME,
        dimension=settings.PINECONE_EMBEDDING_DIM,
        metric="cosine",
        spec=ServerlessSpec(cloud=settings.PINECONE_CLOUD, region=settings.PINECONE_REGION),
    )


def _get_index():
    pc = _get_client()
    settings = get_settings()
    return pc.Index(settings.PINECONE_INDEX_NAME)


def upsert_vector(
    embedding: list[float],
    description: str,
    metadata: dict[str, Any] | None = None,
    vector_id: str | None = None,
    namespace: str = "",
) -> str:
    """
    Stores one embedding + its metadata in Pinecone. Returns the vector's id.
    `description` is always stored in metadata under the key "description"
    so search results can be rendered without a separate lookup.
    """
    index = _get_index()
    vector_id = vector_id or str(uuid.uuid4())

    payload_metadata = {"description": description, **(metadata or {})}

    index.upsert(
        vectors=[{"id": vector_id, "values": embedding, "metadata": payload_metadata}],
        namespace=namespace,
    )
    return vector_id


def query_similar(
    embedding: list[float],
    top_k: int = 5,
    namespace: str = "",
    filter: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """
    Returns the top-k most similar vectors as a list of
    {id, score, metadata} dicts.
    """
    index = _get_index()
    result = index.query(
        vector=embedding,
        top_k=top_k,
        namespace=namespace,
        filter=filter,
        include_metadata=True,
    )
    return [
        {"id": match.id, "score": match.score, "metadata": match.metadata}
        for match in result.matches
    ]