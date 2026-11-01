export type ImpactSeverity = "Critical" | "High" | "Medium" | "Low";

export type AnalysisStatus = "idle" | "loading" | "success" | "error" | "empty";

export type ChangeType =
  | "modify_behavior"
  | "change_signature"
  | "rename"
  | "delete"
  | "add_parameter";

export type AffectedItemType =
  | "file"
  | "symbol"
  | "endpoint"
  | "component"
  | "service"
  | "database"
  | "cross_repo"
  | "test"
  | "gap";

export interface DependencyPathStep {
  fromName: string;
  toName: string;
  relationship: string;
  file: string;
  line: number;
}

export interface AffectedItem {
  id: string;
  name: string;
  type: AffectedItemType;
  filePath: string;
  repositoryId: string;
  repositoryName: string;
  line?: number;
  symbolName?: string;
  hop: number; // 0 = target, 1 = direct caller, 2+ = indirect
  severity: ImpactSeverity;
  reason: string;
  codePreview?: string;
  hasTests: boolean;
  path: DependencyPathStep[];
}

export interface EndpointImpact {
  method: string;
  path: string;
  file: string;
  line?: number;
  handlerName?: string;
  repositoryId?: string;
  repositoryName?: string;
}

export interface ComponentImpact {
  name: string;
  file: string;
  callerLine: number;
  repositoryId?: string;
}

export interface ServiceImpact {
  name: string;
  file: string;
  line?: number;
  repositoryId?: string;
}

export interface TestToRerun {
  name: string;
  file: string;
  line?: number;
  repositoryId?: string;
  command?: string;
  status: "passing" | "needs-update" | "broken";
}

export interface CoverageGapItem {
  id: string;
  name: string;
  file: string;
  repositoryId: string;
  repositoryName: string;
  line: number;
  reason: string;
}

export interface AffectedComponent {
  id: string;
  name: string;
  type: "component" | "endpoint" | "service" | "test" | "database" | "external";
  file: string;
  line?: number;
  reason: string;
  severity: ImpactSeverity;
  relationship: string;
}

export interface SuggestedReviewer {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  filesOwnedCount: number;
}

export interface AIRiskReport {
  whatCouldBreak: string;
  edgeCases: string[];
  rolloutPlan: string;
  checklist: string[];
  suggestedReviewers: SuggestedReviewer[];
  isAiGenerated: boolean;
  error?: string;
}

export interface RadialGraphNode {
  id: string;
  name: string;
  label: string;
  type: AffectedItemType;
  hop: number;
  ringRadius: number;
  angle: number;
  x: number;
  y: number;
  severity: ImpactSeverity;
  filePath: string;
  repositoryId: string;
  repositoryName: string;
  line: number;
  item: AffectedItem;
}

export interface RadialGraphEdge {
  id: string;
  source: string;
  target: string;
  hop: number;
}

export interface RadialGraphData {
  nodes: RadialGraphNode[];
  edges: RadialGraphEdge[];
  maxHop: number;
  rings: Array<{ hop: number; radius: number; label: string; count: number }>;
}

export interface ImpactSummaryCounts {
  filesCount: number;
  symbolsCount: number;
  endpointsCount: number;
  reposCount: number;
  testsCount: number;
  gapsCount: number;
  directCount: number;
  indirectCount: number;
}

export interface ChangeImpactResult {
  symbol: string;
  file: string;
  repositoryId?: string;
  repositoryName?: string;
  changeType?: ChangeType;
  maxDepth?: number;
  includeCrossRepo?: boolean;
  riskLevel: ImpactSeverity;
  riskScore: number;
  summaryCounts?: ImpactSummaryCounts;
  radialGraph?: RadialGraphData;
  affectedItems?: AffectedItem[];
  affectedEndpoints: EndpointImpact[];
  affectedComponents: ComponentImpact[];
  affectedServices: ServiceImpact[];
  testsToRerun: TestToRerun[];
  coverageGaps?: CoverageGapItem[];
  directlyDependent: AffectedComponent[];
  downstreamAffected: AffectedComponent[];
  reviewRequired: AffectedComponent[];
  recommendation: string;
  aiRiskReport?: AIRiskReport;
  limitationsNote?: string;
  isSimulated?: boolean;
}

export interface ImpactAnalysisRequest {
  repositoryId: string;
  file: string;
  symbol?: string;
  changeType?: ChangeType;
  depth?: number;
  includeCrossRepo?: boolean;
  options?: {
    includeDownstream?: boolean;
    includeTests?: boolean;
    includeAPIs?: boolean;
  };
}

export interface SavedImpactAnalysis {
  id: string;
  title: string;
  repositoryId: string;
  repositoryName: string;
  targetFile: string;
  targetSymbol: string;
  changeType: ChangeType;
  depth: number;
  includeCrossRepo: boolean;
  riskScore: number;
  riskLevel: ImpactSeverity;
  summaryCounts: ImpactSummaryCounts;
  createdAt: string;
  result: ChangeImpactResult;
}
