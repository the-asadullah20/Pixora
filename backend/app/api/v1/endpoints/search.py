"""
Search endpoints — Picture Search & Internet Search.

Both modes share the same request/response shape: upload an image, get back
either a single JSON SearchResponse or a stream of Server-Sent Events
('description' -> 'sources' -> 'token'* -> 'done' | 'error').

Every completed search is also saved to Firestore (history_service) under
the caller's uid, so /history can list it back later. Saving is best-effort
and never fails the search itself — if Firestore write fails, we log it and
still return the answer to the user.
"""
import json
import logging

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import StreamingResponse

from app.chains import internet_search_chain, picture_search_chain
from app.core.security import CurrentUser, get_current_user
from app.models.schemas import SearchMode, SearchResponse, SourceItem
from app.services import history_service, rag_service
from app.utils.image_utils import prepare_image_for_pipeline

logger = logging.getLogger("pixora.endpoints.search")

router = APIRouter()

_CHAINS = {
    SearchMode.PICTURE: picture_search_chain,
    SearchMode.INTERNET: internet_search_chain,
}


def _sse(event_type: str, data) -> str:
    """Formats one Server-Sent Event line: 'data: {...}\n\n'."""
    payload = json.dumps({"type": event_type, "data": data})
    return f"data: {payload}\n\n"


def _save_history(user_id: str, mode: SearchMode, description: str, sources: list[dict], answer: str) -> str | None:
    """Best-effort save — never raises, so a Firestore hiccup can't break a search."""
    try:
        return history_service.save_search(
            user_id=user_id,
            mode=mode.value,
            image_description=description,
            sources=sources,
            answer=answer,
        )
    except Exception:
        logger.exception("Failed to save search history for user=%s", user_id)
        return None


async def _stream_search(mode: SearchMode, image_bytes: bytes, mime_type: str, top_k: int, user_id: str):
    chain = _CHAINS[mode]

    try:
        description, sources = await chain.search_by_image(image_bytes, mime_type, top_k)
    except Exception as e:
        logger.exception("Retrieval failed for mode=%s", mode.value)
        yield _sse("error", {"detail": f"Retrieval failed: {e}"})
        return

    yield _sse("description", description)
    yield _sse("sources", sources)

    answer_parts: list[str] = []
    try:
        async for token in rag_service.generate_answer_stream(description, sources):
            answer_parts.append(token)
            yield _sse("token", token)
    except Exception as e:
        logger.exception("Answer generation failed for mode=%s", mode.value)
        yield _sse("error", {"detail": f"Answer generation failed: {e}"})
        return

    answer = "".join(answer_parts)
    history_id = _save_history(user_id, mode, description, sources, answer)

    yield _sse("done", {"history_id": history_id})


@router.post("", response_model=None)
async def search(
    image: UploadFile = File(..., description="Image to search with."),
    mode: SearchMode = Form(default=SearchMode.PICTURE),
    top_k: int = Form(default=5, ge=1, le=20),
    stream: bool = Form(default=True),
    user: CurrentUser = Depends(get_current_user),
):
    """
    Runs Picture Search (internal vector DB) or Internet Search (live web)
    on an uploaded image. Saves the completed search to the caller's history.
    """
    image_bytes, mime_type = await prepare_image_for_pipeline(image)

    if stream:
        return StreamingResponse(
            _stream_search(mode, image_bytes, mime_type, top_k, user.uid),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    chain = _CHAINS[mode]
    description, sources = await chain.search_by_image(image_bytes, mime_type, top_k)
    answer = await rag_service.generate_answer(description, sources)
    history_id = _save_history(user.uid, mode, description, sources, answer)

    return SearchResponse(
        mode=mode,
        image_description=description,
        sources=[SourceItem(**s) for s in sources],
        answer=answer,
        history_id=history_id,
    )