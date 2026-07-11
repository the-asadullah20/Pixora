"""
Firebase Admin SDK initialization.

Supports two credential sources (checked in this order):
  1. FIREBASE_CREDENTIALS_JSON - full service-account JSON as a single-line string
     (use this on Railway, where there's no persistent file to point to)
  2. FIREBASE_CREDENTIALS_PATH - path to a service-account JSON file (local dev)
"""
import json
import logging
import os

import firebase_admin
from firebase_admin import credentials

from app.core.config import get_settings

logger = logging.getLogger("pixora.firebase")

_app: firebase_admin.App | None = None


def init_firebase() -> firebase_admin.App:
    """Initialize the Firebase Admin app exactly once. Safe to call multiple times."""
    global _app
    if _app is not None:
        return _app

    settings = get_settings()

    if settings.FIREBASE_CREDENTIALS_JSON:
        cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
        cred = credentials.Certificate(cred_dict)
    elif settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
    else:
        raise RuntimeError(
            "No Firebase credentials configured. Set FIREBASE_CREDENTIALS_JSON "
            "(inline, for Render/Railway) or ensure FIREBASE_CREDENTIALS_PATH points to a valid file."
        )

    _app = firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
    logger.info("Firebase Admin initialized for project: %s", settings.FIREBASE_PROJECT_ID)
    return _app
