"""
Image validation and preprocessing helpers.
"""
import io
import logging

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import get_settings

logger = logging.getLogger("pixora.image_utils")

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif",
}
MAX_DIMENSION_PX = 2048


def _normalize_mime_type(content_type: str | None, filename: str | None) -> str:
    if content_type and content_type in ALLOWED_MIME_TYPES:
        return content_type
    if filename:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        guessed = {
            "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
            "webp": "image/webp", "heic": "image/heic", "heif": "image/heif",
        }.get(ext)
        if guessed:
            return guessed
    return content_type or "application/octet-stream"


async def validate_and_read_image(file: UploadFile) -> tuple[bytes, str]:
    settings = get_settings()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    raw = await file.read()
    await file.close()

    if not raw:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")
    if len(raw) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB upload limit.",
        )

    mime_type = _normalize_mime_type(file.content_type, file.filename)
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type '{mime_type}'. Allowed: {sorted(ALLOWED_MIME_TYPES)}.",
        )

    try:
        with Image.open(io.BytesIO(raw)) as img:
            img.verify()
    except (UnidentifiedImageError, OSError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File could not be read as a valid image.",
        ) from e

    return raw, mime_type


def resize_if_needed(image_bytes: bytes, mime_type: str, max_dimension: int = MAX_DIMENSION_PX) -> bytes:
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            width, height = img.size
            if max(width, height) <= max_dimension:
                return image_bytes

            img.thumbnail((max_dimension, max_dimension), Image.LANCZOS)
            fmt = {"image/jpeg": "JPEG", "image/jpg": "JPEG", "image/png": "PNG", "image/webp": "WEBP"}.get(mime_type, "JPEG")
            if fmt == "JPEG" and img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            buffer = io.BytesIO()
            img.save(buffer, format=fmt, quality=90)
            resized = buffer.getvalue()
            logger.info("Resized image from %dx%d (%d -> %d bytes)", width, height, len(image_bytes), len(resized))
            return resized
    except Exception as e:
        logger.warning("Image resize failed, using original bytes: %s", e)
        return image_bytes


async def prepare_image_for_pipeline(file: UploadFile) -> tuple[bytes, str]:
    raw, mime_type = await validate_and_read_image(file)
    processed = resize_if_needed(raw, mime_type)
    return processed, mime_type