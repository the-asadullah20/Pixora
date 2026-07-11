"""
Search history service — persists every completed search to Firestore so
each user can revisit their own past Picture/Internet searches.

Firestore collection: "search_history"
Doc shape:
{
    "user_id": str,            # Firebase uid — used to scope every query
    "mode": "picture" | "internet",
    "image_description": str,
    "sources": [{"source": str, "content": str, "score": float}, ...],
    "answer": str,
    "created_at": server timestamp,
}

Uses the same Firebase Admin app as auth (app.utils.firebase.init_firebase),
so no extra credentials or services are needed beyond what's already
configured for login.
"""
import logging
from datetime import datetime
from typing import Any

from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from app.utils.firebase import init_firebase

logger = logging.getLogger("pixora.history")

_COLLECTION = "search_history"

_db = None


def _get_db():
    """Lazily creates the Firestore client, reusing the already-initialized Firebase app."""
    global _db
    if _db is not None:
        return _db
    init_firebase()
    _db = firestore.client()
    return _db


def save_search(
    user_id: str,
    mode: str,
    image_description: str,
    sources: list[dict[str, Any]],
    answer: str,
) -> str:
    """Persists one completed search. Returns the new Firestore document id."""
    db = _get_db()
    doc_ref = db.collection(_COLLECTION).document()
    doc_ref.set(
        {
            "user_id": user_id,
            "mode": mode,
            "image_description": image_description,
            # Firestore can't store arbitrary objects — make sure sources are plain dicts.
            "sources": [dict(s) for s in sources],
            "answer": answer,
            "created_at": firestore.SERVER_TIMESTAMP,
        }
    )
    return doc_ref.id


def _doc_to_dict(doc) -> dict[str, Any]:
    data = doc.to_dict() or {}
    created_at = data.get("created_at")
    return {
        "id": doc.id,
        "mode": data.get("mode"),
        "image_description": data.get("image_description", ""),
        "sources": data.get("sources", []),
        "answer": data.get("answer", ""),
        "created_at": created_at.isoformat() if hasattr(created_at, "isoformat") else None,
    }


def list_history(user_id: str, limit: int = 20, before: str | None = None) -> list[dict[str, Any]]:
    """
    Returns this user's own past searches, newest first.
    `before`: ISO timestamp cursor (from the previous page's last item) —
    when set, only returns items older than that, for pagination.
    """
    db = _get_db()
    query = (
        db.collection(_COLLECTION)
        .where(filter=FieldFilter("user_id", "==", user_id))
        .order_by("created_at", direction=firestore.Query.DESCENDING)
    )

    if before:
        cursor_dt = datetime.fromisoformat(before)
        query = query.start_after({"created_at": cursor_dt})

    docs = query.limit(limit).stream()
    return [_doc_to_dict(doc) for doc in docs]


def get_history_item(user_id: str, item_id: str) -> dict[str, Any] | None:
    """Returns one history item, or None if it doesn't exist or isn't owned by user_id."""
    db = _get_db()
    doc = db.collection(_COLLECTION).document(item_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    if data.get("user_id") != user_id:
        # Exists, but belongs to someone else — treat it as not found rather
        # than leaking a 403 (avoids confirming the id exists to a non-owner).
        return None
    return _doc_to_dict(doc)


def delete_history_item(user_id: str, item_id: str) -> bool:
    """Deletes one history item if it exists and is owned by user_id. Returns True if deleted."""
    db = _get_db()
    doc_ref = db.collection(_COLLECTION).document(item_id)
    doc = doc_ref.get()
    if not doc.exists:
        return False
    data = doc.to_dict() or {}
    if data.get("user_id") != user_id:
        return False
    doc_ref.delete()
    return True