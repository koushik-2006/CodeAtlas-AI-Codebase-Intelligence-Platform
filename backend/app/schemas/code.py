from typing import List, Optional
from pydantic import BaseModel, Field


class LineExplanation(BaseModel):
    line: int
    text: str


class CodeExplainRequest(BaseModel):
    code: str = Field(..., min_length=1, description="Source code snippet to explain")
    language: Optional[str] = "python"
    level: Optional[str] = Field("developer", description="beginner | developer | interview")


class CodeExplainResponse(BaseModel):
    language: str
    summary: str
    explanation: List[LineExplanation]
    complexity: Optional[str] = None
    potential_risks: List[str] = []
    limitations: List[str] = []


class CodeCompareRequest(BaseModel):
    code_a: str = Field(..., description="First code snippet (e.g. original)")
    code_b: str = Field(..., description="Second code snippet (e.g. modified)")
    language: Optional[str] = "python"


class DifferenceDetail(BaseModel):
    type: str  # 'added' | 'removed' | 'modified'
    description: str
    lines_a: Optional[str] = None
    lines_b: Optional[str] = None


class CodeCompareResponse(BaseModel):
    summary: str
    differences: List[DifferenceDetail]
    breaking_changes: List[str] = []
    performance_impact: Optional[str] = None
    recommendations: List[str] = []
