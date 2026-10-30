from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    """Check API health and status."""
    return {
        "status": "ok",
        "service": "CodeAtlas API",
        "version": "1.0.0"
    }
