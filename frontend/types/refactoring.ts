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
  | "inconsistent_patterns"
  | "large_file"
  | "too_many_parameters"
  | "missing_test";

export type QualityFindingSeverity =
  | "critical"
  | "warning"
  | "info"
  | "high"
  | "medium"
  | "low";

export type FindingStatus = "open" | "ignored" | "fixed";

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
  | "improve_type_clarity"
  | "improve_naming"
  | "split_file"
  | "custom";

export interface CodeQualityFinding {
  id: string;
  repositoryId?: string;
  repositoryName?: string;
  title: string;
  category: QualityFindingCategory | string;
  categoryLabel: string;
  severity: QualityFindingSeverity;
  status?: FindingStatus;
  ignoreReason?: string;
  effortHours?: number;
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
  codeSnippet?: string;
}

export interface ComplexityHotspot {
  filePath: string;
  symbolName?: string;
  lineRange: { start: number; end: number };
  complexityScore: number;
  lineCount: number;
  nestingDepth: number;
  rationale: string;
  repositoryId?: string;
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

export interface TopFileToFix {
  filePath: string;
  repositoryId: string;
  repositoryName?: string;
  findingCount: number;
  totalEffortHours: number;
  accumulatedDebtScore: number;
  primarySeverity: QualityFindingSeverity;
  reason: string;
  recommendedOp?: RefactoringOperationType;
}

export interface HistoricalScanSnapshot {
  id: string;
  timestamp: string;
  dateLabel: string;
  score: number;
  findingsCount: number;
  effortHours: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

export interface PerRepoDebtSummary {
  repositoryId: string;
  repositoryName: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  findingsCount: number;
  effortHours: number;
  criticalCount: number;
  warningCount: number;
  trend: number; // positive = improved (+2), negative = degraded (-3)
}

export interface CategoryDistribution {
  category: string;
  label: string;
  count: number;
  severity: QualityFindingSeverity;
  percentage: number;
}

export interface TechnicalDebtOverview {
  repositoryId: string;
  repositoryName: string;
  revision: string;
  compositeScore: number; // 0-100 (100 = pristine, lower = higher debt)
  overallScore?: number;
  debtRating: "A" | "B" | "C" | "D" | "F";
  grade?: string;
  scoreFormula: string;
  totalDebtHours?: number;
  findingsCount: {
    critical: number;
    warning: number;
    info: number;
    low?: number;
    total: number;
  };
  categories?: CategoryDistribution[];
  topFilesToFix?: TopFileToFix[];
  historicalScans?: HistoricalScanSnapshot[];
  perRepoDebt?: PerRepoDebtSummary[];
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

export interface BeforeAfterMetrics {
  linesBefore: number;
  linesAfter: number;
  complexityBefore: number;
  complexityAfter: number;
  effortReductionHours?: number;
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
  operationType?: RefactoringOperationType;
  targetFile: string;
  filePath?: string;
  targetSymbol?: string;
  symbolName?: string;
  lineRange: { start: number; end: number };
  purpose: string;
  rationale?: string;
  expectedBenefits: string[];
  potentialRisks: string[];
  unverifiedAssumptions: string[];
  stepList?: string[];
  originalSnippet: string;
  proposedSnippet: string;
  patchDiff: string;
  diff?: string;
  beforeAfterMetrics?: BeforeAfterMetrics;
  status: "draft" | "proposed" | "accepted" | "rejected" | "applied" | "open" | "pending";
  validationStatus: "validated" | "syntax_error" | "stale_revision" | "unverified";
  validationResults: ValidationCheckResult[];
  impactReport: RefactoringImpactReport;
  suggestedLocalChecks: string[];
  isApplied: boolean;
  appliedAt?: string;
  pullRequestId?: string;
  pullRequestNumber?: number;
  backupContent?: string;
  isStaleRevision?: boolean;
  relatedFindingId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SymbolRenameReference {
  filePath: string;
  line: number;
  column?: number;
  contextSnippet: string;
  beforeLine?: string;
  afterLine?: string;
  isResolvedAstReference: boolean;
  isAmbiguous: boolean;
  checked?: boolean;
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
  findingId?: string;
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

export type RefactoringHistoryType = "scan" | "proposal" | "rename";

export interface RefactoringHistoryItem {
  id: string;
  type: RefactoringHistoryType;
  title: string;
  description: string;
  repositoryId: string;
  timestamp: string;
  author: {
    name: string;
    avatar?: string;
  };
  status?: string;
  proposalId?: string;
  metadata?: Record<string, any>;
}
