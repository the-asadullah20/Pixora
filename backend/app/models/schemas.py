"""
Pydantic request/response schemas shared across the API layer.
"""
from __future__ import annotations
from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class SearchMode(str, Enum):
    PICTURE = "picture"
    INTERNET = "internet"


class SearchRequest(BaseModel):
    mode: SearchMode = Field(default=SearchMode.PICTURE)
    top_k: int = Field(default=5, ge=1, le=20)
    stream: bool = Field(default=True)


class SourceItem(BaseModel):
    source: str
    content: str
    score: float


class SearchResponse(BaseModel):
    mode: SearchMode
    image_description: str
    sources: list[SourceItem] = Field(default_factory=list)
    answer: str


class SearchStreamChunk(BaseModel):
    type: str  # 'description' | 'sources' | 'token' | 'done' | 'error'
    data: Any = None


class UploadMetadata(BaseModel):
    title: str | None = None
    tags: list[str] = Field(default_factory=list)
    extra: dict[str, Any] = Field(default_factory=dict)


class UploadResponse(BaseModel):
    vector_id: str
    description: str
    indexed: bool = True


class UserResponse(BaseModel):
    uid: str
    email: str | None = None
    email_verified: bool = False
    provider: str | None = None


class HealthResponse(BaseModel):
    status: str = "healthy"


class ErrorResponse(BaseModel):
    detail: str
    error_code: str | None = None