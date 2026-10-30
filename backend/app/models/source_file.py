import uuid
from typing import Optional, List
from sqlalchemy import String, ForeignKey, Text, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.database.types import GUID


class SourceFile(Base):
    __tablename__ = "source_files"

    id: Mapped[str] = mapped_column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    repository_index_id: Mapped[str] = mapped_column(GUID(), ForeignKey("repository_indexes.id", ondelete="CASCADE"), nullable=False, index=True)
    path: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    language: Mapped[str] = mapped_column(String(50), default="text")
    content_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    repository_index: Mapped["RepositoryIndex"] = relationship("RepositoryIndex", back_populates="source_files")
    symbols: Mapped[List["CodeSymbol"]] = relationship("CodeSymbol", back_populates="source_file", cascade="all, delete-orphan")
    chunks: Mapped[List["CodeChunk"]] = relationship("CodeChunk", back_populates="source_file", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("repository_index_id", "path", name="uq_source_files_index_path"),
    )
