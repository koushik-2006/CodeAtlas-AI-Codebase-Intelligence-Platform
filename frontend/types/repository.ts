export type RepositoryVisibility = "public" | "private";
export type IndexingStatus = "ready" | "indexing" | "pending" | "error";
export type RepositoryConnection = "github" | "zip" | "git_url" | "sample";

export interface Repository {
  id: string;
  name: string;
  owner: string;
  description: string;
  visibility: RepositoryVisibility;
  language: string;
  lastAnalyzed: string;
  status: IndexingStatus;
  progress: number;
  symbolCount: number;
  connectionType: RepositoryConnection;
  stars?: number;
  branch?: string;
  loc?: number;
}

export interface RepositoryFilterOptions {
  searchQuery: string;
  language: string;
  visibility: "all" | RepositoryVisibility;
  status?: "all" | IndexingStatus;
}
