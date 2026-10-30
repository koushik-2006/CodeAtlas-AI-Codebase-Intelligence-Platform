from fastapi import APIRouter, Depends
from app.dependencies import get_user_service, get_current_user
from app.services.user_service import UserService
from app.schemas.user import UserProfile

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfile)
async def get_user_profile(
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Retrieve detailed user profile information and connected accounts."""
    profile = await user_service.get_user_profile(current_user["id"])
    return profile or {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user.get("name"),
        "avatar_url": current_user.get("avatar_url"),
        "is_github_connected": False,
        "github_username": None,
        "created_at": current_user.get("created_at")
    }
