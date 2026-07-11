"""
Pydantic request/response schemas shared across the API layer.

Images themselves travel as multipart UploadFile (not JSON), so the
"request" schemas below only model the non-file form fields; the response
schemas model everything that comes back out of the search/upload/auth
endpoints.
"""
from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Shared enums
# ---------------------------------------------------------------------------


class SearchMode(str, Enum):
    """The two core search modes Pixora supports."""

    PICTURE = "picture"
    INTERNET = "internet"


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


class SearchRequest(BaseModel):
    mode: SearchMode = Field(default=SearchMode.PICTURE)
    top_k: int = Field(default=5, ge=1, le=20)
    stream: bool = Field(default=True)


class SourceItem(BaseModel):
    """One piece of retrieved context, from either Pinecone or the web."""

    source: str = Field(..., description="Title, URL, or id identifying where this came from.")
    content: str = Field(..., description="The text content used as context for the LLM.")
    score: float = Field(..., description="Similarity/relevance score (0-1, higher is better).")


class SearchResponse(BaseModel):
    """Full, non-streamed result of a search — returned when `stream=false`."""

    mode: SearchMode
    image_description: str = Field(..., description="Gemini Vision's description of the uploaded image.")
    sources: list[SourceItem] = Field(default_factory=list)
    answer: str = Field(..., description="The final RAG-generated answer.")
    history_id: str | None = Field(
        default=None, description="Id of the saved history entry for this search, if it was saved."
    )


class SearchStreamChunk(BaseModel):
    """Shape of each Server-Sent Event payload emitted during a streamed search."""

    type: str = Field(..., description="'description' | 'sources' | 'token' | 'done' | 'error'")
    data: Any = Field(default=None, description="Payload for this chunk; shape depends on `type`.")


# ---------------------------------------------------------------------------
# Upload / indexing
# ---------------------------------------------------------------------------


class UploadMetadata(BaseModel):
    title: str | None = Field(default=None)
    tags: list[str] = Field(default_factory=list)
    extra: dict[str, Any] = Field(default_factory=dict)


class UploadResponse(BaseModel):
    vector_id: str
    description: str
    indexed: bool = True


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


class UserResponse(BaseModel):
    uid: str
    email: str | None = None
    email_verified: bool = False
    provider: str | None = None


# ---------------------------------------------------------------------------
# Search history  <-- THIS is the "messages/chats per user" piece
# ---------------------------------------------------------------------------


class HistoryItem(BaseModel):
    """One saved past search, scoped to whichever user created it."""

    id: str
    mode: SearchMode | None = None
    image_description: str = ""
    sources: list[SourceItem] = Field(default_factory=list)
    answer: str = ""
    created_at: str | None = Field(default=None, description="ISO 8601 timestamp.")


class HistoryListResponse(BaseModel):
    items: list[HistoryItem] = Field(default_factory=list)
    next_cursor: str | None = Field(
        default=None, description="Pass as `before` on the next call to page further back."
    )


# ---------------------------------------------------------------------------
# Generic / shared
# ---------------------------------------------------------------------------


class HealthResponse(BaseModel):
    status: str = "healthy"


class ErrorResponse(BaseModel):
    detail: str
    error_code: str | None = None