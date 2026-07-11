"""
Shared retry policy for transient Gemini API errors.

Gemini occasionally returns 503 ServerError ("This model is currently
experiencing high demand...") or 429 rate-limit errors — both are transient
and usually resolve within a few seconds. Rather than failing the whole
search/upload on a brief blip, we retry with exponential backoff.

Anything else (invalid request, auth failure, etc.) is NOT retried and
propagates immediately.
"""
import logging

from google.genai import errors as genai_errors
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

logger = logging.getLogger("pixora.retry")


def _is_transient_gemini_error(exc: BaseException) -> bool:
    """True for 5xx ServerErrors and 429 rate-limit ClientErrors."""
    if isinstance(exc, genai_errors.ServerError):
        return True
    if isinstance(exc, genai_errors.ClientError) and getattr(exc, "code", None) == 429:
        return True
    return False


def _log_retry(retry_state) -> None:
    exc = retry_state.outcome.exception() if retry_state.outcome else None
    logger.warning(
        "Retrying Gemini call after transient error (attempt %s): %s",
        retry_state.attempt_number,
        exc,
    )


# Up to 4 attempts total, backing off 1s -> 2s -> 4s -> 8s between them.
# `reraise=True` means the original exception (not a tenacity wrapper) is
# what callers see if every attempt fails.
gemini_retry = retry(
    retry=retry_if_exception(_is_transient_gemini_error),
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    before_sleep=_log_retry,
    reraise=True,
)