import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.database.types import GUID


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id: Mapped[str] = mapped_column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    repository_id: Mapped[Optional[str]] = mapped_column(GUID(), ForeignKey("repositories.id", ondelete="SET NULL"), nullable=True, index=True)
    job_type: Mapped[str] = mapped_column(String(50), nullable=False)  # indexing, flowtrace, impact, debug
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, started, completed, failed
    progress: Mapped[int] = mapped_column(Integer, default=0)
    result_reference: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="analysis_jobs")
    repository: Mapped[Optional["Repository"]] = relationship("Repository", back_populates="analysis_jobs")
