import { SourceCitation } from "./source-code";

export interface SourceSnippet {
  code: string;
  language: string;
  lineCount: number;
  characterCount: number;
}

export interface UploadedImageMetadata {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  timestamp: number;
}

export interface OCRExtractionResult {
  code: string;
  confidence?: number;
  languageDetected?: string;
  lineCount: number;
  sourceType: "upload" | "camera" | "manual";
}

export interface StandaloneExplanation {
  summary: string;
  language: string;
  purpose: string;
  lineByLine: { line: number; text: string; explanation: string }[];
  keyFunctions: { name: string; description: string; scope?: string }[];
  keyVariables: { name: string; type?: string; description: string }[];
  algorithmLogic: string;
  potentialIssues: string[];
  complexity: {
    time: string;
    space: string;
    notes?: string;
  };
  exampleOutput?: string;
  isSimulated: boolean;
}

export interface WorkflowNode {
  id: string;
  label: string;
  nodeType: "caller" | "endpoint" | "function" | "service" | "database" | "test";
  sourceFile: string;
  line?: number;
  lineRange?: string;
  description: string;
  confidence?: number;
  isSnippetLocation?: boolean;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface WorkflowTraceData {
  repositoryId: string;
  matched: boolean;
  matchScore: number;
  matchedFile?: string;
  matchedLineRange?: string;
  confidenceLabel: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  summary: string;
  isVerified: boolean;
  testCoverageFile?: string;
  testCoverageLine?: number;
}

export interface AnalysisRequest {
  code: string;
  language: string;
  repositoryId?: string;
  mode: "explain-code" | "explain-workflow";
}
