from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class APIResponse(BaseModel, Generic[DataT]):
    success: bool = True
    message: Optional[str] = None
    data: Optional[DataT] = None


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None


class APIErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    has_next: bool


class PaginatedResponse(BaseModel, Generic[DataT]):
    items: List[DataT]
    meta: PaginationMeta
