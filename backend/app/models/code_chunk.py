import uuid
from typing import Optional, List, Any
from sqlalchemy import ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.database.types import GUID, JSONType


class CodeChunk(Base):
    __tablename__ = "code_chunks"

    id: Mapped[str] = mapped_column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_file_id: Mapped[str] = mapped_column(GUID(), ForeignKey("source_files.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    start_line: Mapped[int] = mapped_column(Integer, nullable=False)
    end_line: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[Optional[Any]] = mapped_column(JSONType, nullable=True)

    # Relationships
    source_file: Mapped["SourceFile"] = relationship("SourceFile", back_populates="chunks")
