"""
App-wide logging configuration.
"""
import logging
import sys

from app.core.config import get_settings

_NOISY_LOGGERS = [
    "httpx", "httpcore", "urllib3", "google_genai", "google.genai",
    "pinecone", "pinecone_plugin_interface", "uvicorn.access",
]
_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logging() -> None:
    settings = get_settings()
    root = logging.getLogger()
    if getattr(root, "_pixora_configured", False):
        return

    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    root.setLevel(level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT))
    root.handlers = [handler]

    noisy_level = logging.DEBUG if level <= logging.DEBUG else logging.WARNING
    for name in _NOISY_LOGGERS:
        logging.getLogger(name).setLevel(noisy_level)

    root._pixora_configured = True  # type: ignore[attr-defined]
    logging.getLogger("pixora.core.logging").info(
        "Logging configured (level=%s, environment=%s)",
        settings.LOG_LEVEL, settings.ENVIRONMENT,
    )


def get_logger(name: str) -> logging.Logger:
    if not name.startswith("pixora"):
        name = f"pixora.{name}"
    return logging.getLogger(name)