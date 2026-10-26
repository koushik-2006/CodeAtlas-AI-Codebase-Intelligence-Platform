export interface RepositoryInfo {
  id: string;
  name: string;
  owner: string;
  defaultBranch: string;
  language: string;
  status: "indexed" | "indexing" | "stale" | "failed";
  commitSha: string;
  fileCount: number;
  symbolCount: number;
  lastIndexedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ConnectionState {
  isConnected: boolean;
  serverUrl: string;
  user: UserProfile | null;
  repositories: RepositoryInfo[];
  selectedRepositoryId: string | null;
  lastError: string | null;
}

export interface CitationItem {
  id: string;
  file: string;
  line: number;
  endLine: number;
  snippet: string;
  explanation: string;
  isVerified: boolean;
}

export interface ExplanationResult {
  summary: string;
  purpose: string;
  howItWorks: Array<{ line: number; text: string; explanation: string }>;
  inputsAndOutputs: {
    parameters: string[];
    returnType: string;
  };
  dependencies: string[];
  edgeCases: string[];
  potentialIssues: string[];
  complexity: {
    time: string;
    space: string;
    notes?: string;
  };
  relatedSymbols: Array<{
    name: string;
    kind: string;
    file?: string;
    line?: number;
  }>;
  sourceCitations: CitationItem[];
}

export interface QAResult {
  answer: string;
  sources: CitationItem[];
  confirmedFacts: string[];
  inferredFacts: string[];
  unavailableInfo: string[];
  confidence: "supported" | "inferred" | "unsupported";
  limitations: string[];
  suggestedFollowUps: string[];
}

export interface ReviewFindingItem {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  category: "security" | "logic" | "performance" | "architecture";
  file: string;
  line: number;
  lineRange: string;
  codeSnippet: string;
  whyItMatters: string;
  suggestedRemediation: string;
  isVerifiedFromSource: boolean;
  status: "open" | "resolved" | "dismissed";
}

export interface ReviewResult {
  summary: string;
  findings: ReviewFindingItem[];
  analyzedLines: number;
  timestamp: string;
}

export interface ImpactResult {
  impactScore: number;
  severity: "low" | "medium" | "high" | "critical";
  affectedComponents: Array<{
    id: string;
    name: string;
    type: string;
    file: string;
    line?: number;
    impactType: string;
  }>;
  directCallers: Array<{
    name: string;
    file: string;
    line: number;
  }>;
  recommendedTests: Array<{
    name: string;
    file: string;
    type: string;
    line?: number;
  }>;
  explanation: string;
  bufferWarning?: string;
}

export interface StackTraceFrameItem {
  raw: string;
  method: string;
  file: string;
  line: number;
  column?: number;
  isInternal: boolean;
  matchedFile?: string;
}

export interface StackTraceResult {
  errorType: string;
  errorMessage: string;
  frames: StackTraceFrameItem[];
  rootCauseHypothesis: string;
  suggestedFix: string;
  matchedWorkspaceFrames: number;
}

export type WebviewIncomingMessage =
  | { type: "askQuestion"; question: string; selectedCode?: string }
  | { type: "explainCode"; code?: string }
  | { type: "reviewCode" }
  | { type: "analyzeImpact" }
  | { type: "analyzeStackTrace"; stackTrace?: string }
  | { type: "openFile"; file: string; line?: number; endLine?: number }
  | { type: "selectRepository"; repositoryId: string }
  | { type: "connect"; serverUrl?: string; token?: string }
  | { type: "disconnect" }
  | { type: "openDashboard" }
  | { type: "refreshState" };

export type WebviewOutgoingMessage =
  | { type: "setConnectionState"; state: ConnectionState }
  | { type: "showResult"; category: "explain" | "qa" | "review" | "impact" | "debug"; data: any }
  | { type: "setLoading"; loading: boolean; message?: string }
  | { type: "setError"; message: string }
  | {
      type: "selectionChanged";
      code: string;
      file: string;
      line: number;
      endLine: number;
      language: string;
    };
