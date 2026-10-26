export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export type WorkspacePermission =
  | "view_workspace"
  | "view_repositories"
  | "connect_repository"
  | "disconnect_repository"
  | "run_indexing"
  | "access_source_code"
  | "view_ai_conversations"
  | "manage_artifacts"
  | "manage_notes"
  | "manage_code_reviews"
  | "invite_members"
  | "manage_members"
  | "change_settings"
  | "delete_workspace";

export interface WorkspaceSettings {
  allowMemberInvites: boolean;
  defaultRepoId?: string;
  requireReviewDismissalReason: boolean;
}

export interface DbWorkspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerId: string;
  isPersonal: boolean;
  settings: WorkspaceSettings;
  createdAt: string;
  updatedAt: string;
}

export interface DbWorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export interface DbWorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: "admin" | "member" | "viewer";
  tokenHash: string;
  token?: string; // Provided on creation / mock link in dev
  expiresAt: string;
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  invitedBy: string;
  invitedByName?: string;
  createdAt: string;
  acceptedByUserId?: string;
  acceptedAt?: string;
}

export interface DbWorkspaceRepository {
  id: string;
  workspaceId: string;
  repositoryId: string;
  addedBy: string;
  addedAt: string;
}

export type SharedArtifactType =
  | "architecture_snapshot"
  | "knowledge_report"
  | "workflow_trace"
  | "change_impact"
  | "code_explanation"
  | "onboarding_guide";

export interface DbSharedArtifact {
  id: string;
  workspaceId: string;
  repositoryId?: string;
  title: string;
  description: string;
  type: SharedArtifactType;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  sourceRevision?: string;
  content: string; // Markdown or structured summary
  metadata?: Record<string, any>;
  visibility: "workspace" | "private";
  isStale?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbCodeAnnotation {
  id: string;
  workspaceId: string;
  repositoryId: string;
  filePath: string;
  startLine: number;
  endLine: number;
  symbolName?: string;
  content: string;
  category: "architecture" | "decision" | "limitation" | "tip" | "review";
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  isStale?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbReviewFindingDiscussion {
  id: string;
  workspaceId: string;
  repositoryId: string;
  reviewSessionId: string;
  findingId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  comment: string;
  createdAt: string;
}

export interface DbFindingDecision {
  id: string;
  workspaceId: string;
  repositoryId: string;
  reviewSessionId: string;
  findingId: string;
  status: "open" | "acknowledged" | "dismissed";
  dismissalReason?: string;
  assigneeId?: string;
  assigneeName?: string;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
}

export interface DbWorkspaceActivityEvent {
  id: string;
  workspaceId: string;
  category: "members" | "repositories" | "artifacts" | "reviews" | "annotations" | "settings";
  actorId: string;
  actorName: string;
  action: string;
  target: string;
  targetHref?: string;
  status: "success" | "warning" | "error" | "info";
  timestamp: string;
  metadata?: Record<string, any>;
}
