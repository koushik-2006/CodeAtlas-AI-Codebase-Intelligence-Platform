from typing import Any, Dict, Optional
from app.repositories.interfaces import IUserRepository, IAccountRepository


class UserService:
    def __init__(self, user_repo: IUserRepository, account_repo: IAccountRepository):
        self.user_repo = user_repo
        self.account_repo = account_repo

    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return None

        github_acc = await self.account_repo.get_by_user_id(user_id, "github")
        return {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name"),
            "avatar_url": user.get("avatar_url"),
            "is_github_connected": github_acc is not None,
            "github_username": github_acc.get("username") if github_acc else None,
            "created_at": user.get("created_at"),
            "updated_at": user.get("updated_at"),
        }
