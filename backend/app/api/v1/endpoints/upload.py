"""
Upload endpoint — indexes an image into Pixora's Picture Search knowledge base.

This is the ingestion side (adds new searchable items to Pinecone), as
opposed to /search which only reads from it. Requires a verified account.
"""
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.chains import picture_search_chain
from app.core.security import CurrentUser, get_current_verified_user
from app.models.schemas import UploadResponse
from app.utils.image_utils import prepare_image_for_pipeline

logger = logging.getLogger("pixora.endpoints.upload")

router = APIRouter()


@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    image: UploadFile = File(..., description="Image to index into the knowledge base."),
    title: str | None = Form(default=None, description="Human-readable label for this item."),
    tags: str | None = Form(default=None, description="Comma-separated tags."),
    user: CurrentUser = Depends(get_current_verified_user),
):
    """
    Analyzes an image with Gemini Vision and stores its description +
    embedding in Pinecone so future Picture Searches can retrieve it.
    """
    image_bytes, mime_type = await prepare_image_for_pipeline(image)

    metadata: dict = {"uploaded_by": user.uid}
    if title:
        metadata["title"] = title
    if tags:
        metadata["tags"] = [t.strip() for t in tags.split(",") if t.strip()]

    try:
        result = await picture_search_chain.index_image(
            image_bytes, mime_type, extra_metadata=metadata
        )
    except Exception as e:
        logger.exception("Failed to index image")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index image: {e}",
        ) from e

    return UploadResponse(vector_id=result["vector_id"], description=result["description"])