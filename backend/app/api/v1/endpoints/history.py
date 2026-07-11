"""
Search history endpoints — lets a logged-in user list, fetch, and delete
their own past Picture/Internet searches.

Every query is scoped to the caller's own uid (from their verified Firebase
token) — there is no way for one user to read or delete another user's
history through this API.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import CurrentUser, get_current_user
from app.models.schemas import HistoryItem, HistoryListResponse
from app.services import history_service

logger = logging.getLogger("pixora.endpoints.history")

router = APIRouter()


@router.get("", response_model=HistoryListResponse)
def list_history(
    limit: int = Query(default=20, ge=1, le=100),
    before: str | None = Query(
        default=None, description="ISO timestamp cursor (from a previous page's next_cursor)."
    ),
    user: CurrentUser = Depends(get_current_user),
):
    """Returns the caller's own past searches, newest first."""
    try:
        items = history_service.list_history(user.uid, limit=limit, before=before)
    except Exception as e:
        logger.exception("Failed to list history for user=%s", user.uid)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load history: {e}",
        ) from e

    next_cursor = items[-1]["created_at"] if len(items) == limit and items else None
    return HistoryListResponse(
        items=[HistoryItem(**item) for item in items],
        next_cursor=next_cursor,
    )


@router.get("/{item_id}", response_model=HistoryItem)
def get_history_item(item_id: str, user: CurrentUser = Depends(get_current_user)):
    """Returns one of the caller's own past searches by id."""
    item = history_service.get_history_item(user.uid, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History item not found.")
    return HistoryItem(**item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history_item(item_id: str, user: CurrentUser = Depends(get_current_user)):
    """Deletes one of the caller's own past searches."""
    deleted = history_service.delete_history_item(user.uid, item_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History item not found.")
    return None