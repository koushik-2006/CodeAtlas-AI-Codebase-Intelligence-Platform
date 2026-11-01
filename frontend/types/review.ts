export type ReviewSeverity = "critical" | "warning" | "info";
export type ReviewCategory =
  | "logic"
  | "bug"
  | "security"
  | "performance"
  | "test-gap"
  | "architecture"
  | "breaking-change"
  | "maintainability"
  | "style";
export type FindingStatus = "open" | "reviewed" | "dismissed" | "accepted";
export type PRSource = "Demo" | "Agent" | "Debugger" | "Refactoring" | "GitHub";
export type PRReviewStatus = "pending" | "approved" | "changes_requested" | "commented";

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
  suggestionDiff?: string;
  isVerifiedFromSource: boolean;
  status: FindingStatus;
  dismissReason?: string;
  publishedToGitHub?: boolean;
  isLocalCheck?: boolean;
  accepted?: boolean;
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

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface TimelineEvent {
  id: string;
  type: "opened" | "reviewed" | "commented" | "approved" | "changes_requested" | "merged" | "closed" | "reopened";
  title: string;
  actor: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  description?: string;
}

export interface InlineCommentReply {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
}

export interface InlineComment {
  id: string;
  file: string;
  line: number;
  author: {
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
  resolved?: boolean;
  replies?: InlineCommentReply[];
}

export interface FindingDiscussionComment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
  reactions?: Record<string, number>;
}

export interface FindingDiscussion {
  id: string;
  findingId: string;
  comments: FindingDiscussionComment[];
  resolved?: boolean;
}

export interface AISummary {
  what: string;
  why: string;
  risk: string;
  recommendedAction?: string;
}

export interface PullRequestDetail {
  id: string;
  number: number;
  repositoryId?: string;
  source?: PRSource;
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
  reviewStatus?: PRReviewStatus;
  riskLevel?: "Low" | "Medium" | "High" | "Critical";
  riskScore?: number;
  labels?: string[];
  createdAt: string;
  updatedAt: string;
  files: ReviewChangedFile[];
  additions: number;
  deletions: number;
  changedFilesCount: number;
  checklist?: ChecklistItem[];
  timeline?: TimelineEvent[];
  inlineComments?: InlineComment[];
  discussions?: Record<string, FindingDiscussion>;
  viewedFiles?: Record<string, boolean>;
  isRealGitHubPr?: boolean;
  githubUrl?: string;
  aiSummary?: AISummary;
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
  riskLevel?: "Low" | "Medium" | "High" | "Critical";
  riskScore?: number;
}
