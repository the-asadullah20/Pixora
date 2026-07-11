"""
Pixora backend entrypoint.
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.utils.firebase import init_firebase

settings = get_settings()

setup_logging()
logger = logging.getLogger("pixora.main")

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="Multimodal AI-powered RAG platform — image-to-search backend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.on_event("startup")
def on_startup():
    try:
        init_firebase()
    except RuntimeError as e:
        # Don't crash the whole app if Firebase isn't configured yet during early dev.
        logger.warning("Firebase not initialized: %s", e)


@app.get("/")
def root():
    return {"status": "ok", "service": settings.APP_NAME}


@app.get("/health")
def health():
    return {"status": "healthy"}