import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from app.repositories.interfaces import IUserRepository


class MemoryUserRepository(IUserRepository):
    """Temporary in-memory user repository for development/testing (Phase A)."""

    def __init__(self):
        self._users: Dict[str, Dict[str, Any]] = {}
        self._email_index: Dict[str, str] = {}

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self._users.get(user_id)

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        user_id = self._email_index.get(email.lower())
        if user_id:
            return self._users.get(user_id)
        return None

    async def create(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = user_data.get("id") or str(uuid.uuid4())
        record = {
            "id": user_id,
            "email": user_data["email"],
            "hashed_password": user_data.get("hashed_password"),
            "name": user_data.get("name") or user_data.get("display_name"),
            "display_name": user_data.get("display_name") or user_data.get("name"),
            "avatar_url": user_data.get("avatar_url"),
            "is_active": user_data.get("is_active", True),
            "created_at": user_data.get("created_at") or datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self._users[user_id] = record
        self._email_index[record["email"].lower()] = user_id
        return record

    async def update(self, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        user = self._users.get(user_id)
        if not user:
            return None
        user.update(update_data)
        user["updated_at"] = datetime.utcnow()
        if "email" in update_data:
            self._email_index[update_data["email"].lower()] = user_id
        return user
