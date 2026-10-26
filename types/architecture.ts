export type ArchitectureNodeType =
  | "Source file"
  | "Function"
  | "Class"
  | "API endpoint"
  | "Service"
  | "Database model or table"
  | "Test"
  | "External dependency";

export type ArchitectureRelationshipType =
  | "Imports"
  | "Function calls"
  | "Contains"
  | "API calls"
  | "Data access"
  | "Test coverage"
  | "Dependency";

export interface NodeRelationship {
  nodeId: string;
  nodeName: string;
  nodeType: ArchitectureNodeType;
  file?: string;
  relationship: ArchitectureRelationshipType;
  description?: string;
}

export interface ArchitectureNode {
  id: string;
  label: string;
  name?: string;
  type: ArchitectureNodeType;
  file: string;
  line?: number;
  lines?: string;
  symbolName?: string;
  description: string;
  code?: string;
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
  type?: ArchitectureRelationshipType | "sync" | "async" | "test";
}

export interface ArchitectureGraphData {
  repositoryId: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}
