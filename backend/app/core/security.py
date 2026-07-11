"""
Firebase ID token verification -> current user dependency.

Frontend flow: user signs in via Firebase Auth (Google/GitHub/Email),
gets an ID token client-side, sends it as:
    Authorization: Bearer <id_token>
on every request to protected endpoints.
"""
import logging
from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth

from app.utils.firebase import init_firebase

logger = logging.getLogger("pixora.security")

_bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    uid: str
    email: str | None
    email_verified: bool
    provider: str | None


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> CurrentUser:
    """FastAPI dependency: verifies the Firebase ID token and returns the caller."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        init_firebase()
    except RuntimeError:
        logger.exception("Firebase is not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Auth is not configured on the server.",
        )

    try:
        decoded = firebase_auth.verify_id_token(credentials.credentials)
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired.")
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail="Token revoked.")
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")
    except Exception:
        logger.exception("Unexpected error verifying Firebase token")
        raise HTTPException(status_code=401, detail="Could not validate credentials.")

    provider = None
    firebase_claims = decoded.get("firebase", {})
    if isinstance(firebase_claims, dict):
        provider = firebase_claims.get("sign_in_provider")

    return CurrentUser(
        uid=decoded["uid"],
        email=decoded.get("email"),
        email_verified=decoded.get("email_verified", False),
        provider=provider,
    )


def get_current_verified_user(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Same as get_current_user, but rejects unverified emails (for email/password sign-in)."""
    if user.provider == "password" and not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email before continuing.",
        )
    return user
