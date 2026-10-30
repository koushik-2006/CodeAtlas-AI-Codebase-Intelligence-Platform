from typing import List, Optional
from pydantic import BaseModel, Field


class ExtractCodeResponse(BaseModel):
    extracted_code: str
    detected_language: str
    confidence: float
    notes: Optional[str] = None


class VisualAnalyzeRequest(BaseModel):
    code: str
    language: Optional[str] = None
    level: Optional[str] = "developer"
    repository_id: Optional[str] = None


class SourceRange(BaseModel):
    file: str
    start_line: int
    end_line: int
    match_score: float = 1.0


class SnippetMatchRequest(BaseModel):
    repository_id: str
    code: str
    language: Optional[str] = None


class SnippetMatchResponse(BaseModel):
    match_status: str  # 'matched' | 'ambiguous' | 'not_found'
    matched_file: Optional[str] = None
    confidence: float
    sources: List[SourceRange] = []
    symbol_name: Optional[str] = None
    symbol_type: Optional[str] = None
