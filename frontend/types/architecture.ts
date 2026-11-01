export type ArchitectureLevel = "layers" | "modules" | "files" | "symbols";
export type ArchitectureLayout = "hierarchical" | "left-right" | "force" | "radial";
export type ArchitectureLayerName = "UI" | "API" | "Services" | "Data" | "Utils" | "Tests" | "External";

export type ArchitectureNodeType =
  | "layer"
  | "module"
  | "file"
  | "class"
  | "function"
  | "external"
  | "Source file"
  | "Function"
  | "Class"
  | "API endpoint"
  | "Service"
  | "Database model or table"
  | "Test"
  | "External dependency"
  | (string & {});

export type ArchitectureRelationshipType =
  | "Imports"
  | "Function calls"
  | "Contains"
  | "API calls"
  | "Data access"
  | "Test coverage"
  | "Dependency"
  | "imports"
  | "calls"
  | "defines"
  | "sync"
  | "async"
  | "test";

export interface NodeRelationship {
  nodeId: string;
  nodeName: string;
  nodeType: ArchitectureNodeType | string;
  file?: string;
  relationship: ArchitectureRelationshipType | string;
  description?: string;
  line?: number;
}

export interface ArchitectureNode {
  id: string;
  label: string;
  name?: string;
  type: ArchitectureNodeType | string;
  layer?: ArchitectureLayerName | string;
  file: string;
  filePath?: string;
  line?: number;
  lines?: string;
  loc?: number;
  fanIn?: number;
  fanOut?: number;
  centralityRank?: string;
  health?: "healthy" | "warning" | "violation";
  symbolName?: string;
  description: string;
  code?: string;
  symbols?: string[];
  isCycleMember?: boolean;
  hasViolation?: boolean;
  callers?: string[];
  callees?: string[];
  tests?: string[];
  incomingRelationships?: NodeRelationship[];
  outgoingRelationships?: NodeRelationship[];
  color?: string;
  x?: number;
  y?: number;
  // Isometric City coordinates
  cx?: number;
  cy?: number;
  a?: number;
  h?: number;
  tone?: "coral" | "brand" | "sun" | "mint" | "cyan" | "purple";
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: ArchitectureRelationshipType | string;
  referencesCount?: number;
  isCycle?: boolean;
  isViolation?: boolean;
  violationRule?: string;
  evidence?: string;
  sourceLine?: number;
}

export interface LayerRule {
  id: string;
  sourceLayer: ArchitectureLayerName;
  targetLayer: ArchitectureLayerName;
  allowed: boolean;
  description: string;
}

export interface LayerViolation {
  edgeId: string;
  sourceId: string;
  targetId: string;
  sourceFile: string;
  targetFile: string;
  sourceLayer: string;
  targetLayer: string;
  line: number;
  ruleDescription: string;
  snippet?: string;
}

export interface CycleFinding {
  id: string;
  nodes: string[];
  nodeLabels: string[];
  length: number;
  description: string;
}

export interface ArchitectureMetricsSummary {
  mostDepended: Array<{ id: string; label: string; file: string; fanIn: number; layer: string }>;
  mostDependent: Array<{ id: string; label: string; file: string; fanOut: number; layer: string }>;
  largestModules: Array<{ path: string; loc: number; fileCount: number; layer: string }>;
  moduleInstability: Array<{ module: string; afferent: number; efferent: number; instability: number; rating: string }>;
}

export interface ArchitectureGraphData {
  repositoryId: string;
  level?: ArchitectureLevel;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  cycles?: CycleFinding[];
  violations?: LayerViolation[];
  metrics?: ArchitectureMetricsSummary;
}
