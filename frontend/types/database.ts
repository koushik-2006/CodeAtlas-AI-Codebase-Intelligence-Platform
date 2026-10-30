export interface DbUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  createdAt: string;
}

export interface DbConnectedAccount {
  userId: string;
  provider: "github" | "google";
  username: string;
  avatar?: string;
  accessToken: string; // Server-only, never sent to client
  scopes: string[];
  connectedAt: string;
  installationId?: string;
  displayName?: string;
  profileUrl?: string;
  publicRepoCount?: number;
  totalPrivateRepos?: number;
  providerUserId?: string;
}

export interface DbRepository {
  id: string;
  userId: string;
  name: string;
  owner: string;
  description: string;
  visibility: "public" | "private";
  language: string;
  defaultBranch: string;
  url: string;
  status: "ready" | "indexing" | "pending" | "error";
  progress: number;
  currentStage?: string;
  symbolCount: number;
  fileCount: number;
  lastAnalyzed: string;
  error?: string;
  isIndexed: boolean;
  connectionType: "github" | "sample" | "zip" | "git_url";
}

export interface DbIndexingJob {
  id: string;
  repositoryId: string;
  userId: string;
  status: "pending" | "fetching" | "parsing" | "indexing" | "completed" | "failed";
  progress: number;
  stage: string;
  fileCount: number;
  totalFiles: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface DbRepositoryFile {
  id: string;
  repositoryId: string;
  path: string;
  name: string;
  language: string;
  size: number;
  content: string;
  lineCount: number;
}

export interface DbCodeSymbol {
  id: string;
  repositoryId: string;
  filePath: string;
  name: string;
  type: "function" | "class" | "endpoint" | "service" | "test" | "table";
  startLine: number;
  endLine: number;
  parameters?: string[];
  scope?: string;
}

export interface DbCodeRelationship {
  id: string;
  repositoryId: string;
  fromSymbolId: string;
  fromSymbolName: string;
  toSymbolId: string;
  toSymbolName: string;
  type: "calls" | "imports" | "queries" | "tests";
}

export interface DbCodeChunk {
  id: string;
  repositoryId: string;
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  embedding?: number[];
}

export interface DbReviewSession {
  id: string;
  repositoryId: string;
  pullRequestId: string;
  pullRequestNumber: number;
  commitSha: string;
  createdAt: string;
  summary: string;
  findings: any[];
  affectedComponents: any[];
  relatedTests: any[];
  isSecurityReviewOnly?: boolean;
}

export interface DbActivityEvent {
  id: string;
  userId: string;
  repositoryId?: string;
  repositoryName?: string;
  type:
    | "repo_connected"
    | "repo_disconnected"
    | "indexing_completed"
    | "indexing_failed"
    | "code_explained"
    | "question_answered"
    | "architecture_explored"
    | "impact_analyzed"
    | "review_completed"
    | "finding_reviewed";
  title: string;
  description: string;
  timestamp: string; // ISO string
  status: "success" | "warning" | "error" | "info";
  href: string;
  linkText: string;
  metadata?: Record<string, any>;
}

export interface DbNotification {
  id: string;
  userId: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "indexing" | "impact" | "review" | "security" | "system";
  href?: string;
}

export interface DbUserSettings {
  userId: string;
  explanationStyle: "concise" | "detailed" | "socratic";
  responseDetail: "standard" | "exhaustive" | "beginner";
  defaultRepoContext: string;
  preferredModel: "gemini-1.5-pro" | "claude-3-5-sonnet" | "gpt-4o" | "offline-ast";
  useStreaming: boolean;
  showLineNumbers: boolean;
  reducedMotion: boolean;
  updatedAt: string;
}

export interface DbProductOnboarding {
  userId: string;
  completed: boolean;
  skipped: boolean;
  currentStep: number;
  completedSteps: string[];
  selectedRepoId?: string;
  hasSeenTour: boolean;
  lastUpdated: string;
}

import {
  DbWorkspace,
  DbWorkspaceMember,
  DbWorkspaceInvitation,
  DbWorkspaceRepository,
  DbSharedArtifact,
  DbCodeAnnotation,
  DbReviewFindingDiscussion,
  DbFindingDecision,
  DbWorkspaceActivityEvent,
} from "./workspace";

export interface CodeAtlasDatabaseSchema {
  users: DbUser[];
  connectedAccounts: DbConnectedAccount[];
  repositories: DbRepository[];
  indexingJobs: DbIndexingJob[];
  files: DbRepositoryFile[];
  symbols: DbCodeSymbol[];
  relationships: DbCodeRelationship[];
  chunks: DbCodeChunk[];
  reviewSessions?: DbReviewSession[];
  activities?: DbActivityEvent[];
  notifications?: DbNotification[];
  userSettings?: DbUserSettings[];
  onboardingProgress?: Record<string, { completedSteps: string[]; currentStep: string; lastUpdated: string }>;
  learningPathProgress?: Record<string, { completedSteps: string[]; currentStep: string; lastUpdated: string }>;
  dismissedInsights?: Record<string, string[]>;
  productOnboarding?: Record<string, DbProductOnboarding>;
  workspaces?: DbWorkspace[];
  workspaceMembers?: DbWorkspaceMember[];
  workspaceInvitations?: DbWorkspaceInvitation[];
  workspaceRepositories?: DbWorkspaceRepository[];
  sharedArtifacts?: DbSharedArtifact[];
  codeAnnotations?: DbCodeAnnotation[];
  findingDiscussions?: DbReviewFindingDiscussion[];
  findingDecisions?: DbFindingDecision[];
  workspaceActivities?: DbWorkspaceActivityEvent[];
  debugInvestigations?: DbDebugInvestigation[];
  debugFollowUps?: DbDebugFollowUp[];
  refactoringProposals?: DbRefactoringProposal[];
  agentRuns?: AgentRun[];
}

import { DbDebugInvestigation, DbDebugFollowUp } from "./debug";
import { DbRefactoringProposal } from "./refactoring";
import { AgentRun } from "./agent";


