import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.database.types import GUID


class CodeRelationship(Base):
    __tablename__ = "code_relationships"

    id: Mapped[str] = mapped_column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    repository_index_id: Mapped[str] = mapped_column(GUID(), ForeignKey("repository_indexes.id", ondelete="CASCADE"), nullable=False, index=True)
    source_symbol_id: Mapped[str] = mapped_column(GUID(), ForeignKey("code_symbols.id", ondelete="CASCADE"), nullable=False, index=True)
    target_symbol_id: Mapped[Optional[str]] = mapped_column(GUID(), ForeignKey("code_symbols.id", ondelete="SET NULL"), nullable=True, index=True)
    relationship_type: Mapped[str] = mapped_column(String(50), nullable=False)  # calls, imports, inherits, instantiates
    confidence: Mapped[float] = mapped_column(Float, default=1.0)

    # Relationships
    repository_index: Mapped["RepositoryIndex"] = relationship("RepositoryIndex", back_populates="relationships")
    source_symbol: Mapped["CodeSymbol"] = relationship("CodeSymbol", foreign_keys=[source_symbol_id], back_populates="source_relationships")
    target_symbol: Mapped[Optional["CodeSymbol"]] = relationship("CodeSymbol", foreign_keys=[target_symbol_id], back_populates="target_relationships")
