export type StackTraceRuntime = "nodejs" | "python" | "go" | "java" | "rust" | "ruby" | "generic";

export interface ParsedStackFrame {
  id: string;
  order: number;
  raw: string;
  functionName: string;
  filePath: string;
  normalizedPath?: string;
  line?: number;
  column?: number;
  isExternal: boolean;
  isVerified: boolean;
  unresolvedReason?: string;
  sourceSnippet?: {
    startLine: number;
    endLine: number;
    focusLine?: number;
    lines: { lineNumber: number; content: string; isHighlighted: boolean }[];
  };
  symbolName?: string;
}

export interface ParsedStackTrace {
  raw: string;
  runtime: StackTraceRuntime;
  errorType: string;
  errorMessage: string;
  frames: ParsedStackFrame[];
  totalFrames: number;
  verifiedFramesCount: number;
  unresolvedFramesCount: number;
  hasRevisionMismatchWarning?: boolean;
  revisionWarningMessage?: string;
}

export type HypothesisCategory =
  | "incorrect_condition"
  | "null_undefined_access"
  | "invalid_input_assumption"
  | "data_transformation_error"
  | "exception_propagation"
  | "api_contract_mismatch"
  | "database_access_failure"
  | "configuration_mismatch"
  | "auth_permission_error"
  | "dependency_incompatibility"
  | "async_timing_issue"
  | "resource_management"
  | "missing_test_coverage"
  | "general_runtime_error";

export interface InvestigationHypothesis {
  id: string;
  rank: number;
  title: string;
  category: HypothesisCategory;
  categoryLabel: string;
  explanation: string;
  likelihood: "high" | "medium" | "low";
  supportingEvidence: string[];
  counterEvidence: string[];
  suggestedSteps: string[];
  targetFile?: string;
  targetSymbol?: string;
  targetLineRange?: { start: number; end: number };
  relatedSymbols?: {
    symbolName: string;
    relationship: "caller" | "callee" | "importer" | "tester";
    filePath: string;
  }[];
  isInvestigated: boolean;
  isConfirmedRootCause: boolean;
  investigatedAt?: string;
}

export interface SuggestedFix {
  id: string;
  hypothesisId?: string;
  title: string;
  description: string;
  filePath: string;
  startLine: number;
  endLine: number;
  originalSnippet: string;
  replacementSnippet: string;
  patchDiff: string;
  potentialSideEffects: string[];
  requiredTests: string[];
  assumptions: string[];
  isApplicable: boolean;
  validationStatus: "validated" | "syntax_error" | "stale_revision" | "missing_file";
  validationError?: string;
  isApplied: boolean;
  appliedAt?: string;
  backupContent?: string;
}

export interface TestRecommendation {
  id: string;
  title: string;
  testFile: string;
  targetSymbol: string;
  framework: "jest" | "vitest" | "mocha" | "pytest" | "go_test" | "junit" | "generic";
  category: "regression" | "edge_case" | "integration";
  testCode: string;
  rationale: string;
  status: "discovered" | "suggested" | "executed_passed" | "executed_failed" | "not_run";
  isExistingTest: boolean;
  executionOutput?: string;
}

export interface ObservedEvidence {
  errorType: string;
  errorMessage: string;
  verifiedLocations: {
    filePath: string;
    line?: number;
    symbolName?: string;
    snippet?: string;
  }[];
  unexpectedBehavior?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  relevantLogs?: string[];
  missingContext: string[];
}

export type InvestigationStatus =
  | "investigating"
  | "root_cause_confirmed"
  | "fix_suggested"
  | "resolved";

export interface DbDebugInvestigation {
  id: string;
  userId: string;
  workspaceId?: string;
  repositoryId?: string;
  repositoryName?: string;
  sourceRevision?: string;
  title: string;
  status: InvestigationStatus;
  mode: "standalone" | "repository_grounded";
  errorType: string;
  errorMessage: string;
  rawTrace?: string;
  rawLogs?: string;
  inputSnippet?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  runtime: StackTraceRuntime;
  parsedTrace?: ParsedStackTrace;
  observedEvidence: ObservedEvidence;
  hypotheses: InvestigationHypothesis[];
  confirmedRootCauseId?: string;
  confirmedRootCauseSummary?: string;
  suggestedFixes: SuggestedFix[];
  testRecommendations: TestRecommendation[];
  unresolvedQuestions: string[];
  isRevisionStale?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbDebugFollowUp {
  id: string;
  investigationId: string;
  sender: "user" | "assistant";
  content: string;
  citedReferences?: {
    filePath: string;
    line?: number;
    symbolName?: string;
  }[];
  timestamp: string;
}

export interface DebugInvestigateRequest {
  errorMessage?: string;
  stackTrace?: string;
  codeSnippet?: string;
  repositoryId?: string;
  filePath?: string;
  functionName?: string;
  logs?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  revision?: string;
  workspaceId?: string;
}

export interface DebugFollowUpRequest {
  investigationId: string;
  question: string;
}

export interface ApplyPatchRequest {
  investigationId: string;
  fixId: string;
  confirmed: boolean;
}

export interface UpdateInvestigationStatusRequest {
  status?: InvestigationStatus;
  confirmedRootCauseId?: string;
  confirmedRootCauseSummary?: string;
  investigatedHypothesisId?: string;
  isInvestigated?: boolean;
}
