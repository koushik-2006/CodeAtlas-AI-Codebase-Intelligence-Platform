from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # 'file' | 'function' | 'class' | 'module'
    file: Optional[str] = None
    line: Optional[int] = None
    properties: Dict[str, Any] = {}


class GraphEdge(BaseModel):
    source: str
    target: str
    type: str  # 'calls' | 'imports' | 'inherits' | 'defines'
    label: Optional[str] = None


class SourceLocation(BaseModel):
    file: str
    start_line: int
    end_line: int


class WorkflowGraphResponse(BaseModel):
    match_status: str  # 'matched' | 'ambiguous' | 'not_found'
    matched_file: Optional[str] = None
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    sources: List[SourceLocation]
    workflow_summary: Optional[str] = None
