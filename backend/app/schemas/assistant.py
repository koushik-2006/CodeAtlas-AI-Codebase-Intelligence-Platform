from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.graph import SourceLocation


class AssistantAskRequest(BaseModel):
    repository_id: Optional[str] = None
    query: str = Field(..., min_length=1, description="Question about the repository or code")
    chat_id: Optional[str] = None


class SourceReference(BaseModel):
    file: str
    lines: Optional[str] = None
    excerpt: Optional[str] = None


class AssistantAskResponse(BaseModel):
    chat_id: str
    answer: str
    sources: List[SourceReference] = []
    suggested_questions: List[str] = []
    confidence: float = 0.95


class SearchRequest(BaseModel):
    repository_id: str
    query: str = Field(..., min_length=1)
    type: str = "keyword"  # 'keyword' | 'symbol' | 'semantic'
    limit: int = 20


class SearchResultItem(BaseModel):
    file: str
    line: int
    content: str
    type: str  # 'symbol' | 'line' | 'chunk'
    score: float
    context: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]
