import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from app.repositories.interfaces import IAccountRepository


class MemoryAccountRepository(IAccountRepository):
    """Temporary in-memory account repository for connected Google/GitHub credentials."""

    def __init__(self):
        self._accounts: Dict[str, Dict[str, Any]] = {}

    async def get_by_provider_account_id(self, provider: str, account_id: str) -> Optional[Dict[str, Any]]:
        for account in self._accounts.values():
            if account.get("provider") == provider and str(account.get("provider_account_id")) == str(account_id):
                return account
        return None

    async def get_by_user_id(self, user_id: str, provider: str) -> Optional[Dict[str, Any]]:
        for account in self._accounts.values():
            if account.get("user_id") == user_id and account.get("provider") == provider:
                return account
        return None

    async def save_account(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = account_data["user_id"]
        provider = account_data["provider"]
        existing = await self.get_by_user_id(user_id, provider)

        if existing:
            existing.update(account_data)
            existing["updated_at"] = datetime.utcnow()
            return existing

        account_id = account_data.get("id") or str(uuid.uuid4())
        record = {
            "id": account_id,
            "user_id": user_id,
            "provider": provider,
            "provider_account_id": str(account_data["provider_account_id"]),
            "username": account_data.get("username"),
            "avatar_url": account_data.get("avatar_url"),
            "access_token_encrypted": account_data.get("access_token_encrypted"),
            "refresh_token_encrypted": account_data.get("refresh_token_encrypted"),
            "scopes": account_data.get("scopes", ""),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self._accounts[account_id] = record
        return record

    async def delete_by_user_id(self, user_id: str, provider: str) -> bool:
        to_delete = [
            aid for aid, acc in self._accounts.items()
            if acc.get("user_id") == user_id and acc.get("provider") == provider
        ]
        for aid in to_delete:
            del self._accounts[aid]
        return len(to_delete) > 0
