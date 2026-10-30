export type KnowledgeNodeType =
  | "file"
  | "directory"
  | "function"
  | "method"
  | "class"
  | "interface"
  | "import"
  | "export"
  | "endpoint"
  | "service"
  | "model"
  | "test"
  | "config"
  | "package"
  | "doc";

export type KnowledgeEdgeType =
  | "imports"
  | "calls"
  | "defines"
  | "references"
  | "implements"
  | "extends"
  | "handles_api"
  | "invokes_service"
  | "accesses_db"
  | "tests"
  | "configures"
  | "inferred_workflow";

export interface KnowledgeGraphEvidence {
  sourceFile: string;
  startLine?: number;
  endLine?: number;
  syntaxEvidence: string;
  confidence: number; // 0.0 to 1.0
  parserType: "ast_static" | "heuristic_text" | "manifest_parsed";
}

export interface KnowledgeGraphNode {
  id: string;
  name: string;
  type: KnowledgeNodeType;
  filePath: string;
  startLine?: number;
  endLine?: number;
  description?: string;
  scope?: string;
  isExported?: boolean;
  metadata?: Record<string, any>;
  inDegree: number;
  outDegree: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  type: KnowledgeEdgeType;
  isVerified: boolean; // true if proven by AST, false if heuristic
  evidence: KnowledgeGraphEvidence;
  metadata?: Record<string, any>;
}

export interface KnowledgeGraphMetrics {
  totalEntities: number;
  totalRelationships: number;
  verifiedPercentage: number;
  entityTypeDistribution: Record<string, number>;
  relationshipTypeDistribution: Record<string, number>;
  completenessScore: number; // 0 to 100
  indexingStatus: "complete" | "partial" | "stale";
  lastGenerated: string;
}

export interface KnowledgeGraphData {
  repositoryId: string;
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  metrics: KnowledgeGraphMetrics;
}

export interface KnowledgeGraphQueryOptions {
  nodeTypes?: KnowledgeNodeType[];
  verifiedOnly?: boolean;
  searchQuery?: string;
  focusNodeId?: string;
  neighborhoodRadius?: number;
  limit?: number;
}
