/**
 * CodeAtlas Audit Trail & Activity Event Types
 */

export type ActivityModule =
  | "workspaces"
  | "repositories"
  | "indexing"
  | "multi-repo"
  | "agents"
  | "explorer"
  | "assistant"
  | "debugger"
  | "refactoring"
  | "architecture"
  | "change-impact"
  | "code-review"
  | "settings"
  | "auth";

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "index"
  | "analyze"
  | "approve"
  | "reject"
  | "merge"
  | "close"
  | "reopen"
  | "run"
  | "apply"
  | "login"
  | "logout"
  | "export"
  | "connect"
  | "disconnect"
  | "comment"
  | "scan";

export type ActivityStatus = "success" | "warning" | "failed" | "info";

export interface ActivityActor {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  role?: string;
}

export interface ActivityTarget {
  type: string; // "workspace" | "repository" | "pr" | "agent" | "file" | "investigation" | "proposal" | "settings" | "session"
  id: string;
  name: string;
  path?: string;
}

export interface ActivityEvent {
  id: string;
  time: string; // ISO timestamp
  timestamp: string; // backward compat with older references
  actor: ActivityActor;
  userId?: string;
  type: string;
  module: ActivityModule;
  action: ActivityAction | string;
  target: ActivityTarget | string;
  status: ActivityStatus;
  shortDescription: string;
  description: string;
  title: string;
  link: string;
  href: string; // backward compat
  linkText?: string;
  workspaceId?: string;
  repositoryId?: string;
  details?: {
    before?: any;
    after?: any;
    diff?: string;
    changedFields?: string[];
    metadata?: Record<string, any>;
  };
}

export interface ActivityFilterState {
  search: string;
  modules: ActivityModule[];
  action: string;
  status: string;
  actor: string;
  workspace: string;
  repository: string;
  dateRange: "today" | "7d" | "30d" | "all" | "custom";
  customDate?: string; // YYYY-MM-DD
}
