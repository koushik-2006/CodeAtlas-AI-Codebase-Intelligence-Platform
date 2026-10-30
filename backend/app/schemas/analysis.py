from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class DebugAnalyzeRequest(BaseModel):
    repository_id: Optional[str] = None
    error_message: Optional[str] = None
    stack_trace: Optional[str] = None
    environment: Optional[str] = None


class LikelyCause(BaseModel):
    title: str
    description: str
    file: Optional[str] = None
    line: Optional[int] = None
    confidence: float


class DebugAnalyzeResponse(BaseModel):
    error_summary: str
    likely_causes: List[LikelyCause]
    debugging_steps: List[str]
    suggested_fix: Optional[str] = None
    related_files: List[str] = []


class ImpactAnalyzeRequest(BaseModel):
    repository_id: str
    file_path: str
    changed_symbols: List[str] = []
    diff_or_code: Optional[str] = None


class AffectedComponent(BaseModel):
    file: str
    symbol_name: Optional[str] = None
    relationship: str  # 'caller' | 'importer' | 'dependent'
    risk_level: str  # 'low' | 'medium' | 'high'
    reason: str


class ImpactAnalyzeResponse(BaseModel):
    summary: str
    overall_risk: str  # 'low' | 'medium' | 'high'
    affected_components: List[AffectedComponent]
    recommended_checks: List[str]


class TestDiscoverRequest(BaseModel):
    repository_id: str
    target_file: Optional[str] = None


class DiscoveredTestCase(BaseModel):
    test_file: str
    test_name: str
    targets: List[str] = []


class TestDiscoverResponse(BaseModel):
    repository_id: str
    total_test_files: int
    test_cases: List[DiscoveredTestCase]
    untested_areas: List[str] = []
    suggested_tests: List[str] = []


class LearningTopic(BaseModel):
    id: str
    title: str
    description: str
    file_references: List[str] = []
    difficulty: str  # 'beginner' | 'intermediate' | 'advanced'


class SaveAnalysisRequest(BaseModel):
    repository_id: Optional[str] = None
    title: str
    analysis_type: str  # 'explain' | 'workflow' | 'debug' | 'impact'
    data: Dict[str, Any]


class SavedAnalysisItem(BaseModel):
    id: str
    user_id: str
    repository_id: Optional[str] = None
    title: str
    analysis_type: str
    data: Dict[str, Any]
    created_at: datetime
