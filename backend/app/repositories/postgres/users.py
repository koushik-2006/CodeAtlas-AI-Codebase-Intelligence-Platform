import uuid
import logging
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import func
from app.repositories.interfaces import IUserRepository
from app.models.user import User

logger = logging.getLogger("uvicorn.error")


class PostgresUserRepository(IUserRepository):
    """PostgreSQL implementation of IUserRepository."""

    def __init__(self, db: Session):
        self.db = db

    def _to_dict(self, user: User) -> Dict[str, Any]:
        return {
            "id": str(user.id),
            "email": user.email,
            "hashed_password": user.hashed_password,
            "name": user.display_name,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            user = self.db.query(User).filter(User.id == str(user_id)).first()
            if not user:
                return None
            return self._to_dict(user)
        except SQLAlchemyError as exc:
            self.db.rollback()
            logger.error(f"[PostgresUserRepository] get_by_id error: {type(exc).__name__}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable. Please try again later."
            )

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        try:
            user = self.db.query(User).filter(func.lower(User.email) == email.lower().strip()).first()
            if not user:
                return None
            return self._to_dict(user)
        except SQLAlchemyError as exc:
            self.db.rollback()
            logger.error(f"[PostgresUserRepository] get_by_email error: {type(exc).__name__}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable. Please try again later."
            )

    async def create(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = user_data.get("id") or str(uuid.uuid4())
        user = User(
            id=user_id,
            email=user_data["email"].lower().strip(),
            hashed_password=user_data.get("hashed_password"),
            display_name=user_data.get("display_name") or user_data.get("name"),
            avatar_url=user_data.get("avatar_url"),
            is_active=user_data.get("is_active", True)
        )
        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            return self._to_dict(user)
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists."
            )
        except SQLAlchemyError as exc:
            self.db.rollback()
            logger.error(f"[PostgresUserRepository] create error: {type(exc).__name__}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable. Please try again later."
            )

    async def update(self, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            user = self.db.query(User).filter(User.id == str(user_id)).first()
            if not user:
                return None
            if "name" in update_data and "display_name" not in update_data:
                update_data["display_name"] = update_data["name"]

            for key, value in update_data.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            self.db.commit()
            self.db.refresh(user)
            return self._to_dict(user)
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists."
            )
        except SQLAlchemyError as exc:
            self.db.rollback()
            logger.error(f"[PostgresUserRepository] update error: {type(exc).__name__}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable. Please try again later."
            )
