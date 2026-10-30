import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, ForeignKey, BigInteger, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.database.types import GUID


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[str] = mapped_column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    github_repository_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True, index=True)
    owner: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    default_branch: Mapped[str] = mapped_column(String(100), default="main")
    is_private: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner_user: Mapped["User"] = relationship("User", back_populates="repositories")
    indexes: Mapped[List["RepositoryIndex"]] = relationship("RepositoryIndex", back_populates="repository", cascade="all, delete-orphan")
    analysis_jobs: Mapped[List["AnalysisJob"]] = relationship("AnalysisJob", back_populates="repository", cascade="all, delete-orphan")
    saved_analyses: Mapped[List["SavedAnalysis"]] = relationship("SavedAnalysis", back_populates="repository", cascade="all, delete-orphan")
