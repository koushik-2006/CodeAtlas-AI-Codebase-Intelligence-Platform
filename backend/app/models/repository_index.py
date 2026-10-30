import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.database.types import GUID


class RepositoryIndex(Base):
    __tablename__ = "repository_indexes"

    id: Mapped[str] = mapped_column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    repository_id: Mapped[str] = mapped_column(GUID(), ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False, index=True)
    commit_sha: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="unindexed")  # unindexed, queued, indexing, completed, failed
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    repository: Mapped["Repository"] = relationship("Repository", back_populates="indexes")
    source_files: Mapped[List["SourceFile"]] = relationship("SourceFile", back_populates="repository_index", cascade="all, delete-orphan")
    relationships: Mapped[List["CodeRelationship"]] = relationship("CodeRelationship", back_populates="repository_index", cascade="all, delete-orphan")
