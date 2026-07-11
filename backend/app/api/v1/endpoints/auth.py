"""
Auth endpoints.

Actual sign-in/sign-up happens client-side via Firebase Auth SDK (frontend).
The backend's job is just to verify the resulting ID token on protected routes.
"""
from fastapi import APIRouter, Depends

from app.core.security import CurrentUser, get_current_user

router = APIRouter()


@router.get("/me")
def get_me(user: CurrentUser = Depends(get_current_user)):
    """Returns the caller's identity, decoded from their Firebase ID token."""
    return {
        "uid": user.uid,
        "email": user.email,
        "email_verified": user.email_verified,
        "provider": user.provider,
    }
