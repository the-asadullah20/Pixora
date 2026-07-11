"""
Health check endpoint (v1, for symmetry with other API routes).
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("")
def health_check():
    return {"status": "healthy"}
