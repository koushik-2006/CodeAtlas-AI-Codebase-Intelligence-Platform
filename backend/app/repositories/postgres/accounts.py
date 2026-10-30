from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.repositories.interfaces import IAccountRepository
from app.models.connected_account import ConnectedAccount


class PostgresAccountRepository(IAccountRepository):
    """PostgreSQL implementation of IAccountRepository."""

    def __init__(self, db: Session):
        self.db = db

    def _to_dict(self, acc: ConnectedAccount) -> Dict[str, Any]:
        return {
            "id": str(acc.id),
            "user_id": str(acc.user_id),
            "provider": acc.provider,
            "provider_user_id": acc.provider_user_id,
            "provider_account_id": acc.provider_user_id,
            "username": acc.username,
            "avatar_url": acc.avatar_url,
            "access_token_encrypted": acc.access_token_encrypted,
            "refresh_token_encrypted": acc.refresh_token_encrypted,
            "token_expires_at": acc.token_expires_at,
            "created_at": acc.created_at,
            "updated_at": acc.updated_at,
        }

    async def get_by_provider_account_id(self, provider: str, account_id: str) -> Optional[Dict[str, Any]]:
        acc = self.db.query(ConnectedAccount).filter(
            ConnectedAccount.provider == provider,
            ConnectedAccount.provider_user_id == str(account_id)
        ).first()
        if not acc:
            return None
        return self._to_dict(acc)

    async def get_by_user_id(self, user_id: str, provider: str) -> Optional[Dict[str, Any]]:
        acc = self.db.query(ConnectedAccount).filter(
            ConnectedAccount.user_id == str(user_id),
            ConnectedAccount.provider == provider
        ).first()
        if not acc:
            return None
        return self._to_dict(acc)

    async def save_account(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = str(account_data["user_id"])
        provider = account_data["provider"]
        provider_user_id = str(account_data.get("provider_user_id") or account_data.get("provider_account_id"))

        acc = self.db.query(ConnectedAccount).filter(
            ConnectedAccount.user_id == user_id,
            ConnectedAccount.provider == provider
        ).first()

        if acc:
            acc.provider_user_id = provider_user_id
            acc.username = account_data.get("username", acc.username)
            acc.avatar_url = account_data.get("avatar_url", acc.avatar_url)
            acc.access_token_encrypted = account_data.get("access_token_encrypted", acc.access_token_encrypted)
            acc.refresh_token_encrypted = account_data.get("refresh_token_encrypted", acc.refresh_token_encrypted)
        else:
            acc = ConnectedAccount(
                user_id=user_id,
                provider=provider,
                provider_user_id=provider_user_id,
                username=account_data.get("username"),
                avatar_url=account_data.get("avatar_url"),
                access_token_encrypted=account_data.get("access_token_encrypted"),
                refresh_token_encrypted=account_data.get("refresh_token_encrypted"),
            )
            self.db.add(acc)

        self.db.commit()
        self.db.refresh(acc)
        return self._to_dict(acc)

    async def delete_by_user_id(self, user_id: str, provider: str) -> bool:
        deleted = self.db.query(ConnectedAccount).filter(
            ConnectedAccount.user_id == str(user_id),
            ConnectedAccount.provider == provider
        ).delete()
        self.db.commit()
        return deleted > 0
