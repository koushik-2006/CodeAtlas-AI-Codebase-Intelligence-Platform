import uuid
from typing import Optional, List
from sqlalchemy import String, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.database.types import GUID


class CodeSymbol(Base):
    __tablename__ = "code_symbols"

    id: Mapped[str] = mapped_column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_file_id: Mapped[str] = mapped_column(GUID(), ForeignKey("source_files.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    qualified_name: Mapped[Optional[str]] = mapped_column(String(512), nullable=True, index=True)
    symbol_type: Mapped[str] = mapped_column(String(50), nullable=False)  # function, class, method, variable
    start_line: Mapped[int] = mapped_column(Integer, nullable=False)
    end_line: Mapped[int] = mapped_column(Integer, nullable=False)
    signature: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    source_file: Mapped["SourceFile"] = relationship("SourceFile", back_populates="symbols")
    source_relationships: Mapped[List["CodeRelationship"]] = relationship(
        "CodeRelationship",
        foreign_keys="CodeRelationship.source_symbol_id",
        back_populates="source_symbol",
        cascade="all, delete-orphan"
    )
    target_relationships: Mapped[List["CodeRelationship"]] = relationship(
        "CodeRelationship",
        foreign_keys="CodeRelationship.target_symbol_id",
        back_populates="target_symbol"
    )
