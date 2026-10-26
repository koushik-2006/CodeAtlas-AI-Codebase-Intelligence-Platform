export type ReviewSeverity = "critical" | "warning" | "info";
export type ReviewCategory =
  | "logic"
  | "security"
  | "performance"
  | "test-gap"
  | "architecture"
  | "breaking-change";
export type FindingStatus = "open" | "reviewed" | "dismissed";

export interface ReviewFinding {
  id: string;
  title: string;
  description: string;
  severity: ReviewSeverity;
  category: ReviewCategory;
  file: string;
  line?: number;
  lineRange?: string;
  codeSnippet?: string;
  whyItMatters: string;
  suggestedRemediation: string;
  isVerifiedFromSource: boolean;
  status: FindingStatus;
  dismissReason?: string;
  publishedToGitHub?: boolean;
}

export interface ReviewChangedFile {
  filename: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  rawContent?: string;
}

export interface PullRequestDetail {
  id: string;
  number: number;
  title: string;
  body: string;
  author: {
    name: string;
    avatar: string;
  };
  baseBranch: string;
  headBranch: string;
  baseSha: string;
  headSha: string;
  state: "open" | "closed" | "merged";
  createdAt: string;
  updatedAt: string;
  files: ReviewChangedFile[];
  additions: number;
  deletions: number;
  changedFilesCount: number;
}

export interface ReviewAffectedComponent {
  name: string;
  type: string;
  file: string;
  line?: number;
  reason: string;
  relationship: string;
}

export interface ReviewRelatedTest {
  name: string;
  file: string;
  status: "passing" | "needs-update" | "missing-coverage" | "broken";
  coverageStatus: "covered" | "untested";
}

export interface ReviewSession {
  id: string;
  repositoryId: string;
  pullRequestId: string;
  pullRequestNumber: number;
  commitSha: string;
  createdAt: string;
  summary: string;
  findings: ReviewFinding[];
  affectedComponents: ReviewAffectedComponent[];
  relatedTests: ReviewRelatedTest[];
  isSecurityReviewOnly?: boolean;
  isStale?: boolean;
  isSimulated?: boolean;
}
