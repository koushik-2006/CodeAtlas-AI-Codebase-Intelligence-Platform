export type QualityFindingCategory =
  | "excessive_complexity"
  | "deep_nesting"
  | "code_duplication"
  | "repeated_constants"
  | "unclear_responsibilities"
  | "excessive_coupling"
  | "circular_dependency"
  | "unused_symbol"
  | "missing_error_handling"
  | "inconsistent_patterns";

export type QualityFindingSeverity = "critical" | "warning" | "info";

export type DetectionMethod =
  | "ast_metric"
  | "static_pattern"
  | "dependency_cycle_analysis"
  | "fan_out_analysis"
  | "heuristic";

export type RefactoringOperationType =
  | "extract_function"
  | "rename_symbol"
  | "simplify_conditionals"
  | "reduce_duplication"
  | "improve_error_handling"
  | "separate_responsibilities"
  | "improve_type_clarity";

export interface CodeQualityFinding {
  id: string;
  title: string;
  category: QualityFindingCategory;
  categoryLabel: string;
  severity: QualityFindingSeverity;
  filePath: string;
  symbolName?: string;
  lineRange?: { start: number; end: number };
  detectionMethod: DetectionMethod;
  isVerifiedMetric: boolean;
  metricValue?: string | number;
  threshold?: string | number;
  supportingEvidence: string[];
  impactRationale: string;
  suggestedAction: string;
  suggestedRefactoringOp?: RefactoringOperationType;
}

export interface ComplexityHotspot {
  filePath: string;
  symbolName?: string;
  lineRange: { start: number; end: number };
  complexityScore: number;
  lineCount: number;
  nestingDepth: number;
  rationale: string;
}

export interface ModuleCouplingMetric {
  modulePath: string;
  fanOut: number; // number of outgoing call/import edges
  fanIn: number;  // number of incoming call/import edges
  couplingRatio: number; // fanOut / (fanOut + fanIn + 1)
  isHighCoupling: boolean;
  dependentModules: string[];
}

export interface CircularDependencyFinding {
  id: string;
  cycle: string[]; // e.g. ["src/services/auth.ts", "src/services/user.ts", "src/services/auth.ts"]
  description: string;
  edgeCount: number;
  severity: "critical" | "warning";
  suggestedDecoupling: string;
}

export interface DuplicateCodeCandidate {
  id: string;
  fileA: string;
  fileB: string;
  lineRangeA: { start: number; end: number };
  lineRangeB: { start: number; end: number };
  lineCount: number;
  duplicateSnippet: string;
  similarityPercentage: number;
  suggestedConsolidation: string;
}

export interface TechnicalDebtOverview {
  repositoryId: string;
  repositoryName: string;
  revision: string;
  compositeScore: number; // 0-100 (100 = pristine, lower = higher debt)
  debtRating: "A" | "B" | "C" | "D" | "F";
  scoreFormula: string;
  findingsCount: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  hotspots: ComplexityHotspot[];
  couplingMetrics: ModuleCouplingMetric[];
  circularDependencies: CircularDependencyFinding[];
  duplicateCandidates: DuplicateCodeCandidate[];
  findings: CodeQualityFinding[];
  isStale: boolean;
  analyzedAt: string;
}

export interface ValidationCheckResult {
  checkName: string;
  status: "passed" | "failed" | "skipped" | "blocked";
  detail: string;
}

export interface RefactoringImpactReport {
  riskLevel: "Low" | "Medium" | "High";
  riskScore: number;
  affectedCallers: { name: string; file: string; line?: number }[];
  downstreamDependents: { name: string; file: string; line?: number }[];
  affectedTests: { name: string; file: string; line?: number }[];
  limitationsNote: string;
}

export interface DbRefactoringProposal {
  id: string;
  userId: string;
  workspaceId?: string;
  repositoryId: string;
  repositoryName?: string;
  sourceRevision: string;
  title: string;
  operation: RefactoringOperationType;
  targetFile: string;
  targetSymbol?: string;
  lineRange: { start: number; end: number };
  purpose: string;
  expectedBenefits: string[];
  potentialRisks: string[];
  unverifiedAssumptions: string[];
  originalSnippet: string;
  proposedSnippet: string;
  patchDiff: string;
  status: "draft" | "proposed" | "accepted" | "rejected" | "applied";
  validationStatus: "validated" | "syntax_error" | "stale_revision" | "unverified";
  validationResults: ValidationCheckResult[];
  impactReport: RefactoringImpactReport;
  suggestedLocalChecks: string[];
  isApplied: boolean;
  appliedAt?: string;
  backupContent?: string;
  isStaleRevision?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SymbolRenameReference {
  filePath: string;
  line: number;
  column?: number;
  contextSnippet: string;
  isResolvedAstReference: boolean;
  isAmbiguous: boolean;
}

export interface RenameSymbolPreview {
  symbolName: string;
  newSymbolName: string;
  declarationFile: string;
  declarationLine: number;
  isSupportedLanguage: boolean;
  language: string;
  references: SymbolRenameReference[];
  totalReferences: number;
  affectedFiles: string[];
  warnings: string[];
}

export interface ProposeRefactoringRequest {
  repositoryId: string;
  filePath: string;
  symbolName?: string;
  startLine?: number;
  endLine?: number;
  operation: RefactoringOperationType;
  customInstructions?: string;
  revision?: string;
}

export interface ApplyRefactoringRequest {
  proposalId: string;
  confirmed: boolean;
}

export interface UpdateProposalStatusRequest {
  status: "proposed" | "accepted" | "rejected";
  decisionNotes?: string;
}

export interface RenamePreviewRequest {
  repositoryId: string;
  filePath: string;
  symbolName: string;
  newSymbolName: string;
}
