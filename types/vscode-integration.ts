import { CitationReference } from "./assistant";
import { ReviewFinding } from "./review";
import { ChangeImpactResult } from "./impact";
import { ParsedStackTrace } from "./debug";
import { SymbolNavigationResult } from "./symbol-navigation";

export interface VsCodeStatusResponse {
  success: boolean;
  serverVersion: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  repositories: Array<{
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
  }>;
  multiRepoSupported: boolean;
  activeProvider: string;
}

export interface VsCodeExplainRequest {
  repositoryId?: string;
  filePath?: string;
  code: string;
  language?: string;
  startLine?: number;
  endLine?: number;
}

export interface VsCodeExplainResponse {
  success: boolean;
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
  sourceCitations: CitationReference[];
  isConfigured: boolean;
  provider: string;
}

export interface VsCodeAskRequest {
  repositoryId?: string;
  repositoryIds?: string[];
  question: string;
  selectedCode?: string;
  activeFile?: string;
  activeLine?: number;
}

export interface VsCodeAskResponse {
  success: boolean;
  answer: string;
  sources: CitationReference[];
  confirmedFacts: string[];
  inferredFacts: string[];
  unavailableInfo: string[];
  confidence: "supported" | "inferred" | "unsupported";
  limitations: string[];
  suggestedFollowUps: string[];
  isConfigured: boolean;
  provider: string;
}

export interface VsCodeReviewRequest {
  repositoryId?: string;
  filePath?: string;
  code: string;
  language?: string;
}

export interface VsCodeReviewResponse {
  success: boolean;
  summary: string;
  findings: ReviewFinding[];
  analyzedLines: number;
  timestamp: string;
}

export interface VsCodeImpactRequest {
  repositoryId?: string;
  filePath: string;
  symbolName?: string;
  proposedChange?: string;
}

export interface VsCodeImpactResponse {
  success: boolean;
  data: ChangeImpactResult;
  bufferWarning?: string;
}

export interface VsCodeStackTraceRequest {
  stackTrace: string;
  repositoryId?: string;
  revision?: string;
}

export interface VsCodeStackTraceResponse {
  success: boolean;
  parsed: ParsedStackTrace;
  matchedWorkspaceFrames: number;
}

export interface VsCodeSymbolRequest {
  repositoryId?: string;
  filePath: string;
  line: number;
  symbolName?: string;
}

export interface VsCodeSymbolResponse {
  success: boolean;
  data: SymbolNavigationResult;
}
