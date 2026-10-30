import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.database.types import GUID, JSONType


class SavedAnalysis(Base):
    __tablename__ = "saved_analyses"

    id: Mapped[str] = mapped_column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    repository_id: Mapped[Optional[str]] = mapped_column(GUID(), ForeignKey("repositories.id", ondelete="SET NULL"), nullable=True, index=True)
    analysis_type: Mapped[str] = mapped_column(String(50), nullable=False)  # explain, workflow, debug, impact
    input_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, nullable=True)
    result_data: Mapped[Dict[str, Any]] = mapped_column(JSONType, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="saved_analyses")
    repository: Mapped[Optional["Repository"]] = relationship("Repository", back_populates="saved_analyses")
