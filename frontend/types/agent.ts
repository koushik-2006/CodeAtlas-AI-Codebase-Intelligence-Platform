import { CitationReference } from "./assistant";
import { ReviewFinding } from "./review";
import { ChangeImpactResult } from "./impact";

export type AgentType =
  | "codebase_research"
  | "debugging"
  | "code_review"
  | "refactoring"
  | "test_generation"
  | "documentation";

export type AgentRunStatus =
  | "queued"
  | "planning"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "paused"
  | "failed"
  | "cancelled";

export type StepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "awaiting_approval";

export type ActionType =
  | "apply_patch"
  | "create_file"
  | "modify_file"
  | "post_review_comment"
  | "run_tests"
  | "update_docs";

export type ActionStatus = "pending" | "approved" | "rejected";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface AgentDescriptor {
  type: AgentType;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
  capabilities: string[];
  defaultTools: string[];
  requiresApprovalFor: ActionType[];
  badgeColor: "brand" | "cyan" | "mint" | "coral" | "sun";
}

export interface AgentStep {
  id: string;
  order: number;
  title: string;
  description: string;
  status: StepStatus;
  toolName?: string;
  toolInput?: Record<string, any>;
  toolOutput?: Record<string, any>;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  evidenceSummary?: string;
  isApprovalGate?: boolean;
}

export interface AgentPlan {
  summary: string;
  estimatedSteps: number;
  approach: string;
  riskAssessment: string;
  requiredTools: string[];
}

export interface AgentCitation {
  id: string;
  repositoryId: string;
  filePath: string;
  symbolName?: string;
  startLine: number;
  endLine?: number;
  snippet: string;
  reason: string;
  isVerified: boolean;
}

export interface AgentHypothesis {
  id: string;
  title: string;
  description: string;
  likelihood: "high" | "medium" | "low";
  evidenceFor: string[];
  evidenceAgainst: string[];
  verificationSteps: string[];
  isConfirmed: boolean;
}

export interface ApprovalAction {
  id: string;
  actionType: ActionType;
  title: string;
  description: string;
  rationale: string;
  affectedFiles: string[];
  diffPreview?: string;
  parameters?: Record<string, any>;
  riskLevel: RiskLevel;
  status: ActionStatus;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  executionOutcome?: {
    success: boolean;
    message: string;
    details?: any;
  };
}

export interface AgentFinding {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  category: string;
  file: string;
  line?: number;
  lineRange?: string;
  codeSnippet?: string;
  whyItMatters: string;
  suggestedRemediation?: string;
}

export interface AgentRun {
  id: string;
  userId: string;
  workspaceId?: string;
  repositoryId: string;
  repositoryName: string;
  agentType: AgentType;
  workflowType?: string;
  taskPrompt: string;
  status: AgentRunStatus;
  plan: AgentPlan;
  steps: AgentStep[];
  currentStepIndex: number;
  findings: AgentFinding[];
  hypotheses: AgentHypothesis[];
  citations: AgentCitation[];
  actions: ApprovalAction[];
  outcomeSummary?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  errorDetails?: string;
  isSimulated?: boolean;
}

export interface AgentToolDefinition {
  id: string;
  name: string;
  description: string;
  category: "search" | "source" | "analysis" | "patch" | "testing" | "system";
  isMutating: boolean;
  requiredPermission: string;
  timeoutMs: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  agentType: AgentType;
  description: string;
  defaultPrompt: string;
  stepCount: number;
  steps: string[];
}

export interface StartAgentRunRequest {
  agentType: AgentType;
  repositoryId: string;
  taskPrompt: string;
  workflowType?: string;
  workspaceId?: string;
  options?: {
    autoApproveReadOnly?: boolean;
    preferredDetail?: "concise" | "detailed";
  };
}

export interface AgentActionDecisionRequest {
  actionId: string;
  decision: "approve" | "reject";
  reason?: string;
}

export interface AgentControlRequest {
  command: "pause" | "resume" | "cancel" | "retry";
}
