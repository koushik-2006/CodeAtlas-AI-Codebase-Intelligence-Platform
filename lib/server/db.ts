import fs from "fs";
import path from "path";
import {
  CodeAtlasDatabaseSchema,
  DbUser,
  DbConnectedAccount,
  DbRepository,
  DbIndexingJob,
  DbRepositoryFile,
  DbCodeSymbol,
  DbCodeRelationship,
  DbCodeChunk,
  DbReviewSession,
  DbActivityEvent,
  DbNotification,
  DbUserSettings,
} from "@/types/database";
import {
  WorkspaceRole,
  DbWorkspace,
  DbWorkspaceMember,
  DbWorkspaceInvitation,
  DbWorkspaceRepository,
  DbSharedArtifact,
  DbCodeAnnotation,
  DbReviewFindingDiscussion,
  DbFindingDecision,
  DbWorkspaceActivityEvent,
} from "@/types/workspace";
import { SearchResultItem } from "@/types/search";
import { SAMPLE_PROJECT_CODE } from "@/lib/sample-repository-files";
import { DbDebugInvestigation, DbDebugFollowUp } from "@/types/debug";
import { DbRefactoringProposal } from "@/types/refactoring";
import { AgentRun } from "@/types/agent";
import { MULTI_REPO_FIXTURES } from "./multi-repo-fixtures";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "codeatlas-db.json");

// Default seed data
const DEFAULT_USER: DbUser = {
  id: "usr_default",
  email: "alex@codeatlas.dev",
  name: "Alex Mercer",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  role: "Senior Software Engineer",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const SEED_USERS: DbUser[] = [
  DEFAULT_USER,
  {
    id: "usr_sarah",
    email: "sarah@codeatlas.dev",
    name: "Sarah Lin",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    role: "Principal Architect",
    createdAt: "2026-01-05T00:00:00.000Z",
  },
  {
    id: "usr_marcus",
    email: "marcus@codeatlas.dev",
    name: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    role: "Senior Backend Engineer",
    createdAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "usr_elena",
    email: "elena@codeatlas.dev",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
    role: "Security Auditor",
    createdAt: "2026-01-15T00:00:00.000Z",
  },
];

const SEED_WORKSPACES: DbWorkspace[] = [
  {
    id: "ws_personal_usr_default",
    name: "Personal Workspace",
    slug: "personal-workspace",
    description: "Private workspace for personal repositories and individual code exploration.",
    ownerId: "usr_default",
    isPersonal: true,
    settings: {
      allowMemberInvites: false,
      requireReviewDismissalReason: false,
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ws_team_demo",
    name: "Core Engineering",
    slug: "core-engineering",
    description: "Central team workspace collaborating on authentication, AST parsing, and distributed microservices.",
    ownerId: "usr_default",
    isPersonal: false,
    settings: {
      allowMemberInvites: true,
      requireReviewDismissalReason: true,
      defaultRepoId: "sample-project",
    },
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
];

const SEED_WORKSPACE_MEMBERS: DbWorkspaceMember[] = [
  {
    id: "wsm_seed_personal_owner",
    workspaceId: "ws_personal_usr_default",
    userId: "usr_default",
    role: "owner",
    joinedAt: "2026-01-01T00:00:00.000Z",
    userName: "Alex Mercer",
    userEmail: "alex@codeatlas.dev",
  },
  {
    id: "wsm_seed_team_owner",
    workspaceId: "ws_team_demo",
    userId: "usr_default",
    role: "owner",
    joinedAt: "2026-01-02T00:00:00.000Z",
    userName: "Alex Mercer",
    userEmail: "alex@codeatlas.dev",
  },
  {
    id: "wsm_seed_team_sarah",
    workspaceId: "ws_team_demo",
    userId: "usr_sarah",
    role: "admin",
    joinedAt: "2026-01-05T00:00:00.000Z",
    userName: "Sarah Lin",
    userEmail: "sarah@codeatlas.dev",
  },
  {
    id: "wsm_seed_team_marcus",
    workspaceId: "ws_team_demo",
    userId: "usr_marcus",
    role: "member",
    joinedAt: "2026-01-10T00:00:00.000Z",
    userName: "Marcus Vance",
    userEmail: "marcus@codeatlas.dev",
  },
  {
    id: "wsm_seed_team_elena",
    workspaceId: "ws_team_demo",
    userId: "usr_elena",
    role: "viewer",
    joinedAt: "2026-01-15T00:00:00.000Z",
    userName: "Elena Rostova",
    userEmail: "elena@codeatlas.dev",
  },
];

const SEED_WORKSPACE_REPOSITORIES: DbWorkspaceRepository[] = [
  {
    id: "wsr_personal_sample",
    workspaceId: "ws_personal_usr_default",
    repositoryId: "sample-project",
    addedBy: "usr_default",
    addedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "wsr_team_sample",
    workspaceId: "ws_team_demo",
    repositoryId: "sample-project",
    addedBy: "usr_default",
    addedAt: "2026-01-02T00:00:00.000Z",
  },
];

const SEED_SHARED_ARTIFACTS: DbSharedArtifact[] = [
  {
    id: "art_auth_snapshot",
    workspaceId: "ws_team_demo",
    repositoryId: "sample-project",
    title: "Auth Architecture Snapshot",
    description: "Verified symbol call graph and token validation path across LoginForm and auth services.",
    type: "architecture_snapshot",
    creatorId: "usr_default",
    creatorName: "Alex Mercer",
    sourceRevision: "Today at 10:15 AM",
    content: "### Authentication Architecture Blueprint\n\nTraced `LoginForm` -> `handleSubmit` -> `loginUser` -> `UserService`.\n\n- **Token Scheme**: JWT RS256 with 15-minute access token lifespan.\n- **Password Security**: BCrypt with salted rounds.\n- **Call Hierarchy**: Client Form triggers validation in `validation.ts` before delegating to `auth.ts`.",
    visibility: "workspace",
    isStale: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "art_impact_secret",
    workspaceId: "ws_team_demo",
    repositoryId: "sample-project",
    title: "Change Impact: Auth Secret Hardening",
    description: "Evaluated ripple effects for removing insecure fallback environment secrets.",
    type: "change_impact",
    creatorId: "usr_sarah",
    creatorName: "Sarah Lin",
    sourceRevision: "Today at 10:15 AM",
    content: "### Change Impact Evaluation\n\n- **Target Change**: Enforcing `process.env.JWT_SECRET` presence with zero fallback string.\n- **Direct Callers**: 2 modules (`auth.ts`, `session.ts`)\n- **API Endpoints**: `POST /api/auth/login`\n- **Test Coverage**: `tests/auth.test.ts` covers failure scenario.",
    visibility: "workspace",
    isStale: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

const SEED_CODE_ANNOTATIONS: DbCodeAnnotation[] = [
  {
    id: "ann_timing_attack",
    workspaceId: "ws_team_demo",
    repositoryId: "sample-project",
    filePath: "src/services/auth.ts",
    startLine: 18,
    endLine: 42,
    symbolName: "loginUser",
    content: "We deliberately enforce constant-time hash verification here to eliminate timing side-channel vulnerabilities during authentication attempts.",
    category: "decision",
    authorId: "usr_sarah",
    authorName: "Sarah Lin",
    isStale: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: "ann_form_telemetry",
    workspaceId: "ws_team_demo",
    repositoryId: "sample-project",
    filePath: "src/components/LoginForm.tsx",
    startLine: 26,
    endLine: 34,
    symbolName: "handleSubmit",
    content: "Always keep the state lock active until the API Promise settles to prevent double-submit request races.",
    category: "architecture",
    authorId: "usr_marcus",
    authorName: "Marcus Vance",
    isStale: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
];

const SEED_WORKSPACE_ACTIVITIES: DbWorkspaceActivityEvent[] = [
  {
    id: "ws_act_seed_1",
    workspaceId: "ws_team_demo",
    category: "artifacts",
    actorId: "usr_default",
    actorName: "Alex Mercer",
    action: "created shared artifact: Auth Architecture Snapshot",
    target: "Auth Architecture Snapshot",
    targetHref: "/workspaces/ws_team_demo?tab=artifacts",
    status: "success",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "ws_act_seed_2",
    workspaceId: "ws_team_demo",
    category: "members",
    actorId: "usr_sarah",
    actorName: "Sarah Lin",
    action: "joined workspace as admin",
    target: "Sarah Lin",
    targetHref: "/workspaces/ws_team_demo?tab=members",
    status: "info",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: "ws_act_seed_3",
    workspaceId: "ws_team_demo",
    category: "repositories",
    actorId: "usr_default",
    actorName: "Alex Mercer",
    action: "connected repository sample-project",
    target: "sample-project",
    targetHref: "/repositories/sample-project",
    status: "success",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const DEFAULT_USER_SETTINGS: DbUserSettings = {
  userId: "usr_default",
  explanationStyle: "detailed",
  responseDetail: "standard",
  defaultRepoContext: "sample-project",
  preferredModel: "gemini-1.5-pro",
  useStreaming: true,
  showLineNumbers: true,
  reducedMotion: false,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const SEED_ACTIVITIES: DbActivityEvent[] = [
  {
    id: "act_seed_1",
    userId: "usr_default",
    repositoryId: "sample-project",
    repositoryName: "sample-project",
    type: "review_completed",
    title: "Pull Request #101 analyzed",
    description: "AI Code Review identified 1 Critical security finding and 1 Warning in auth pipeline.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: "warning",
    href: "/code-review?repoId=sample-project&pr=101",
    linkText: "View Review",
  },
  {
    id: "act_seed_2",
    userId: "usr_default",
    repositoryId: "sample-project",
    repositoryName: "sample-project",
    type: "impact_analyzed",
    title: "Change impact evaluated for handleSubmit",
    description: "Evaluated ripple effects for handleSubmit: traced 2 callers, 1 API endpoint, and 1 test suite.",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: "info",
    href: "/change-impact?repoId=sample-project",
    linkText: "View Impact",
  },
  {
    id: "act_seed_3",
    userId: "usr_default",
    repositoryId: "sample-project",
    repositoryName: "sample-project",
    type: "architecture_explored",
    title: "Architecture graph explored",
    description: "Mapped 7 nodes and 4 verified call/import relationships in sample-project.",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: "success",
    href: "/architecture?repoId=sample-project",
    linkText: "Open Graph",
  },
  {
    id: "act_seed_4",
    userId: "usr_default",
    repositoryId: "sample-project",
    repositoryName: "sample-project",
    type: "indexing_completed",
    title: "Repository indexed: sample-project",
    description: "Tree-sitter AST parser ingested 5 files and 8 symbols with call relationships.",
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    status: "success",
    href: "/repositories/sample-project",
    linkText: "Explore Repo",
  },
];

const SEED_NOTIFICATIONS: DbNotification[] = [
  {
    id: "notif_1",
    userId: "usr_default",
    title: "Review Complete: PR #101",
    description: "AI Code Review identified 1 Critical security finding for JWT secret fallback.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    type: "review",
    href: "/code-review?repoId=sample-project&pr=101",
  },
  {
    id: "notif_2",
    userId: "usr_default",
    title: "AST Indexing Finished",
    description: "Repository 'sample-project' successfully indexed with 8 symbols.",
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    read: true,
    type: "indexing",
    href: "/repositories/sample-project",
  },
];

const SAMPLE_PROJECT_REPO: DbRepository = {
  id: "sample-project",
  userId: "usr_default",
  name: "sample-project",
  owner: "codeatlas-demo",
  description: "Reference TypeScript authentication and API pipeline for architecture tracing.",
  visibility: "public",
  language: "TypeScript",
  defaultBranch: "main",
  url: "https://github.com/codeatlas-demo/sample-project",
  status: "ready",
  progress: 100,
  currentStage: "Completed",
  symbolCount: 8,
  fileCount: 5,
  lastAnalyzed: "Today at 10:15 AM",
  isIndexed: true,
  connectionType: "sample",
};

const SAMPLE_FILES: DbRepositoryFile[] = Object.entries(SAMPLE_PROJECT_CODE).map(
  ([filePath, entry], idx) => ({
    id: `file_${idx}`,
    repositoryId: "sample-project",
    path: filePath,
    name: filePath.split("/").pop() || filePath,
    language: entry.language,
    size: entry.code.length,
    content: entry.code,
    lineCount: entry.code.split("\n").length,
  })
);

const SAMPLE_SYMBOLS: DbCodeSymbol[] = [
  {
    id: "sym_login_form",
    repositoryId: "sample-project",
    filePath: "src/components/LoginForm.tsx",
    name: "LoginForm",
    type: "class",
    startLine: 11,
    endLine: 45,
    scope: "src/components/LoginForm.tsx",
  },
  {
    id: "sym_handle_submit",
    repositoryId: "sample-project",
    filePath: "src/components/LoginForm.tsx",
    name: "handleSubmit",
    type: "function",
    startLine: 26,
    endLine: 34,
    parameters: ["e: React.FormEvent"],
    scope: "LoginForm",
  },
  {
    id: "sym_login_user",
    repositoryId: "sample-project",
    filePath: "src/services/auth.ts",
    name: "loginUser",
    type: "function",
    startLine: 18,
    endLine: 42,
    parameters: ["email: string", "password: string"],
    scope: "src/services/auth.ts",
  },
  {
    id: "sym_user_service",
    repositoryId: "sample-project",
    filePath: "src/services/auth.ts",
    name: "UserService",
    type: "service",
    startLine: 38,
    endLine: 55,
    scope: "src/services/auth.ts",
  },
  {
    id: "sym_validate_email",
    repositoryId: "sample-project",
    filePath: "src/utils/validation.ts",
    name: "validateEmail",
    type: "function",
    startLine: 4,
    endLine: 12,
    parameters: ["email: string"],
    scope: "src/utils/validation.ts",
  },
  {
    id: "sym_auth_test_success",
    repositoryId: "sample-project",
    filePath: "tests/auth.test.ts",
    name: "testLoginSuccess",
    type: "test",
    startLine: 18,
    endLine: 30,
    scope: "tests/auth.test.ts",
  },
];

const SAMPLE_RELATIONSHIPS: DbCodeRelationship[] = [
  {
    id: "rel_1",
    repositoryId: "sample-project",
    fromSymbolId: "sym_handle_submit",
    fromSymbolName: "handleSubmit",
    toSymbolId: "sym_login_user",
    toSymbolName: "loginUser",
    type: "calls",
  },
  {
    id: "rel_2",
    repositoryId: "sample-project",
    fromSymbolId: "sym_login_user",
    fromSymbolName: "loginUser",
    toSymbolId: "sym_user_service",
    toSymbolName: "UserService",
    type: "calls",
  },
  {
    id: "rel_3",
    repositoryId: "sample-project",
    fromSymbolId: "sym_handle_submit",
    fromSymbolName: "handleSubmit",
    toSymbolId: "sym_validate_email",
    toSymbolName: "validateEmail",
    type: "calls",
  },
  {
    id: "rel_4",
    repositoryId: "sample-project",
    fromSymbolId: "sym_auth_test_success",
    fromSymbolName: "testLoginSuccess",
    toSymbolId: "sym_login_user",
    toSymbolName: "loginUser",
    type: "tests",
  },
];

const SEED_DEBUG_INVESTIGATIONS: DbDebugInvestigation[] = [
  {
    id: "inv_seed_auth_token_null",
    userId: "usr_default",
    workspaceId: "ws_team_demo",
    repositoryId: "sample-project",
    repositoryName: "acme-corp/sample-project",
    sourceRevision: "main@b7f8e12",
    title: "TypeError: Cannot read properties of undefined (reading 'token')",
    status: "root_cause_confirmed",
    mode: "repository_grounded",
    errorType: "TypeError",
    errorMessage: "Cannot read properties of undefined (reading 'token')",
    rawTrace: `TypeError: Cannot read properties of undefined (reading 'token')\n    at loginUser (src/services/auth.ts:41:33)\n    at handleSubmit (src/components/LoginForm.tsx:28:32)`,
    expectedBehavior: "Expected loginUser to handle 4xx/5xx error responses gracefully and throw a descriptive error message without crashing on undefined token property.",
    actualBehavior: "Runtime crash with uncaught TypeError when backend API returns unexpected response body or non-200 error payload.",
    runtime: "nodejs",
    parsedTrace: {
      raw: `TypeError: Cannot read properties of undefined (reading 'token')\n    at loginUser (src/services/auth.ts:41:33)\n    at handleSubmit (src/components/LoginForm.tsx:28:32)`,
      runtime: "nodejs",
      errorType: "TypeError",
      errorMessage: "Cannot read properties of undefined (reading 'token')",
      totalFrames: 2,
      verifiedFramesCount: 2,
      unresolvedFramesCount: 0,
      frames: [
        {
          id: "frame_1",
          order: 1,
          raw: "    at loginUser (src/services/auth.ts:41:33)",
          functionName: "loginUser",
          filePath: "src/services/auth.ts",
          normalizedPath: "src/services/auth.ts",
          line: 41,
          column: 33,
          isExternal: false,
          isVerified: true,
          symbolName: "loginUser",
          sourceSnippet: {
            startLine: 38,
            endLine: 43,
            focusLine: 41,
            lines: [
              { lineNumber: 38, content: "  if (!response.ok) {", isHighlighted: false },
              { lineNumber: 39, content: '    const errorBody = await response.json().catch(() => ({}));', isHighlighted: false },
              { lineNumber: 40, content: "  const data = await response.json();", isHighlighted: false },
              { lineNumber: 41, content: '  localStorage.setItem("session_token", data.token);', isHighlighted: true },
              { lineNumber: 42, content: "", isHighlighted: false },
              { lineNumber: 43, content: "  return {", isHighlighted: false },
            ],
          },
        },
        {
          id: "frame_2",
          order: 2,
          raw: "    at handleSubmit (src/components/LoginForm.tsx:28:32)",
          functionName: "handleSubmit",
          filePath: "src/components/LoginForm.tsx",
          normalizedPath: "src/components/LoginForm.tsx",
          line: 28,
          column: 32,
          isExternal: false,
          isVerified: true,
          symbolName: "handleSubmit",
          sourceSnippet: {
            startLine: 26,
            endLine: 30,
            focusLine: 28,
            lines: [
              { lineNumber: 26, content: "    setLoading(true);", isHighlighted: false },
              { lineNumber: 27, content: "    try {", isHighlighted: false },
              { lineNumber: 28, content: "      const response = await loginUser({ email, password });", isHighlighted: true },
              { lineNumber: 29, content: "      window.location.href = response.redirectUrl;", isHighlighted: false },
              { lineNumber: 30, content: "    } catch (err: any) {", isHighlighted: false },
            ],
          },
        },
      ],
    },
    observedEvidence: {
      errorType: "TypeError",
      errorMessage: "Cannot read properties of undefined (reading 'token')",
      verifiedLocations: [
        {
          filePath: "src/services/auth.ts",
          line: 41,
          symbolName: "loginUser",
          snippet: 'localStorage.setItem("session_token", data.token);',
        },
        {
          filePath: "src/components/LoginForm.tsx",
          line: 28,
          symbolName: "handleSubmit",
          snippet: "const response = await loginUser({ email, password });",
        },
      ],
      unexpectedBehavior: "Application crashed instead of displaying authentication failure banner.",
      expectedBehavior: "Display user-friendly error message on authentication failure.",
      missingContext: [
        "Network request response body and HTTP status code from /api/v1/auth/session",
        "Whether execution occurred in SSR environment where localStorage is undefined",
      ],
    },
    hypotheses: [
      {
        id: "hyp_1",
        rank: 1,
        title: "API contract mismatch or missing token property in JSON response",
        category: "api_contract_mismatch",
        categoryLabel: "API Contract Mismatch",
        explanation: "The response.json() object does not guarantee a 'token' string. If the authentication endpoint returns an unexpected error shape or non-token response, data.token resolves to undefined, causing property access or downstream storage failures.",
        likelihood: "high",
        supportingEvidence: [
          "Line 41 in src/services/auth.ts assumes data.token is always defined without contract validation.",
          "Network status check only verifies response.ok but does not validate data shape.",
        ],
        counterEvidence: [
          "If the endpoint strictly conforms to Swagger/OpenAPI spec, token is always returned on 200 OK.",
        ],
        suggestedSteps: [
          "Inspect network payload received from /api/v1/auth/session in browser DevTools.",
          "Add schema/type validation before accessing data.token.",
        ],
        targetFile: "src/services/auth.ts",
        targetSymbol: "loginUser",
        targetLineRange: { start: 40, end: 42 },
        relatedSymbols: [
          { symbolName: "handleSubmit", relationship: "caller", filePath: "src/components/LoginForm.tsx" },
          { symbolName: "testLoginSuccess", relationship: "tester", filePath: "tests/auth.test.ts" },
        ],
        isInvestigated: true,
        isConfirmedRootCause: true,
      },
      {
        id: "hyp_2",
        rank: 2,
        title: "Unchecked access of data when response.json() resolves to undefined/null",
        category: "null_undefined_access",
        categoryLabel: "Null / Undefined Access",
        explanation: "If the server returns empty body or 204 No Content, JSON parsing produces undefined or null, leading to immediate TypeError when reading properties.",
        likelihood: "high",
        supportingEvidence: [
          "Stack trace points to reading 'token' of undefined directly on line 41.",
        ],
        counterEvidence: [
          "Standard fetch response.json() on empty string throws SyntaxError, not undefined, unless pre-parsed.",
        ],
        suggestedSteps: [
          "Add defensive guard: if (!data || typeof data.token !== 'string') throw new Error(...)",
        ],
        targetFile: "src/services/auth.ts",
        targetSymbol: "loginUser",
        targetLineRange: { start: 40, end: 42 },
        isInvestigated: true,
        isConfirmedRootCause: false,
      },
      {
        id: "hyp_3",
        rank: 3,
        title: "Missing test coverage for malformed or missing token in API response",
        category: "missing_test_coverage",
        categoryLabel: "Missing Test Coverage",
        explanation: "The existing test suite tests/auth.test.ts only mocks happy-path success (testLoginSuccess), leaving malformed payloads untested.",
        likelihood: "medium",
        supportingEvidence: [
          "tests/auth.test.ts only tests valid token responses.",
          "No negative test asserting behavior on invalid JSON response.",
        ],
        counterEvidence: [
          "A missing test allows bugs into production but is not the runtime trigger itself.",
        ],
        suggestedSteps: [
          "Add unit test asserting loginUser rejects with descriptive error when response body is missing token.",
        ],
        targetFile: "tests/auth.test.ts",
        targetSymbol: "testLoginSuccess",
        isInvestigated: false,
        isConfirmedRootCause: false,
      },
    ],
    confirmedRootCauseId: "hyp_1",
    confirmedRootCauseSummary: "src/services/auth.ts does not validate the presence or type of data.token before accessing it and storing it in localStorage.",
    suggestedFixes: [
      {
        id: "fix_1",
        hypothesisId: "hyp_1",
        title: "Validate API response structure before persisting session token",
        description: "Add an explicit validation guard after response.json() to verify that data contains a valid token string, throwing a descriptive error if missing.",
        filePath: "src/services/auth.ts",
        startLine: 40,
        endLine: 42,
        originalSnippet: "  const data = await response.json();\n  localStorage.setItem(\"session_token\", data.token);",
        replacementSnippet: "  const data = await response.json();\n  if (!data || typeof data.token !== \"string\") {\n    throw new Error(\"Invalid auth response: missing access token.\");\n  }\n  localStorage.setItem(\"session_token\", data.token);",
        patchDiff: "--- a/src/services/auth.ts\n+++ b/src/services/auth.ts\n@@ -40,3 +40,6 @@\n   const data = await response.json();\n+  if (!data || typeof data.token !== \"string\") {\n+    throw new Error(\"Invalid auth response: missing access token.\");\n+  }\n   localStorage.setItem(\"session_token\", data.token);",
        potentialSideEffects: [
          "Callers must catch the descriptive Error if backend responds with non-token payload.",
        ],
        requiredTests: [
          "Unit test for loginUser when server returns { success: true } without token.",
          "LoginForm error banner display test.",
        ],
        assumptions: [
          "The backend session endpoint is expected to return { token: string, userId: string, ... }",
        ],
        isApplicable: true,
        validationStatus: "validated",
        isApplied: false,
      },
    ],
    testRecommendations: [
      {
        id: "test_rec_1",
        title: "Existing Test: testLoginSuccess",
        testFile: "tests/auth.test.ts",
        targetSymbol: "loginUser",
        framework: "jest",
        category: "regression",
        testCode: "// Existing test in tests/auth.test.ts exercises loginUser with valid credentials",
        rationale: "Verifies that the happy path remains unbroken after applying defensive token validation.",
        status: "discovered",
        isExistingTest: true,
      },
      {
        id: "test_rec_2",
        title: "Regression Test: Rejects when API response is missing token",
        testFile: "tests/auth.test.ts",
        targetSymbol: "loginUser",
        framework: "jest",
        category: "regression",
        testCode: `it("should throw a descriptive error when session response is missing token", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ status: "ok" }), // missing token
  });

  await expect(loginUser({ email: "user@example.com", password: "password123" }))
    .rejects.toThrow("Invalid auth response: missing access token.");
});`,
        rationale: "Ensures future changes do not reintroduce unhandled TypeError crashes on malformed backend responses.",
        status: "suggested",
        isExistingTest: false,
      },
    ],
    unresolvedQuestions: [
      "Does the backend API occasionally return HTML error pages or 200 OK with error bodies?",
      "Should LoginForm display a retry prompt specifically for transient network issues?",
    ],
    isRevisionStale: false,
    createdAt: "2026-01-15T10:30:00.000Z",
    updatedAt: "2026-01-15T11:00:00.000Z",
  },
];

const SEED_REFACTORING_PROPOSALS: DbRefactoringProposal[] = [
  {
    id: "prop_seed_auth_refactor",
    userId: "usr_default",
    repositoryId: "sample-project",
    repositoryName: "Sample Project",
    sourceRevision: "main@head",
    title: "Extract Token Storage and Session Validation from loginUser",
    operation: "extract_function",
    targetFile: "src/services/auth.ts",
    targetSymbol: "loginUser",
    lineRange: { start: 21, end: 45 },
    purpose: "Separate HTTP network transport from browser localStorage persistence and session validation.",
    expectedBenefits: [
      "Decouples service layer from browser localStorage implementation.",
      "Facilitates unit testing login logic in Node.js/headless test runners without window mock.",
      "Centralizes token persistence error handling and expiry checks.",
    ],
    potentialRisks: [
      "Callers expecting implicit synchronous localStorage write must await the extracted helper if made async.",
      "Exported signature of auth service must remain backward-compatible.",
    ],
    unverifiedAssumptions: [
      "localStorage is always available in target client environment.",
      "Token is received as a valid UTF-8 string.",
    ],
    originalSnippet: "  const data = await response.json();\n  localStorage.setItem(\"session_token\", data.token);\n  return data;",
    proposedSnippet: "  const data = await response.json();\n  persistSessionToken(data.token);\n  return data;",
    patchDiff: "--- a/src/services/auth.ts\n+++ b/src/services/auth.ts\n@@ -40,3 +40,3 @@\n   const data = await response.json();\n-  localStorage.setItem(\"session_token\", data.token);\n+  persistSessionToken(data.token);\n   return data;",
    status: "proposed",
    validationStatus: "validated",
    validationResults: [
      {
        checkName: "Syntax & AST Validity",
        status: "passed",
        detail: "Parsed target file with TypeScript AST without syntax errors.",
      },
      {
        checkName: "Source Revision Verification",
        status: "passed",
        detail: "Matched exact line range (lines 21-45) against current HEAD revision.",
      },
      {
        checkName: "Downstream Callers Check",
        status: "passed",
        detail: "Verified LoginForm.tsx:28 caller signature compatibility.",
      },
      {
        checkName: "Isolated Test Execution",
        status: "skipped",
        detail: "Repository test suite not executed in sandbox.",
      },
    ],
    impactReport: {
      riskLevel: "Low",
      riskScore: 24,
      affectedCallers: [{ name: "handleSubmit", file: "src/components/LoginForm.tsx", line: 28 }],
      downstreamDependents: [{ name: "LoginForm", file: "src/components/LoginForm.tsx", line: 11 }],
      affectedTests: [{ name: "testLoginSuccess", file: "tests/auth.test.ts" }],
      limitationsNote: "AST inspection validated static call sites; runtime dynamic imports were not detected.",
    },
    suggestedLocalChecks: [
      "npm test -- tests/auth.test.ts",
      "npm run typecheck",
      "Verify user login in browser and inspect localStorage key 'session_token'",
    ],
    isApplied: false,
    createdAt: "2026-01-16T09:00:00.000Z",
    updatedAt: "2026-01-16T09:15:00.000Z",
  },
];

const SEED_AGENT_RUNS: AgentRun[] = [
  {
    id: "run_seed_research_1",
    userId: "usr_default",
    workspaceId: "ws_team_demo",
    repositoryId: "sample-project",
    repositoryName: "sample-project",
    agentType: "codebase_research",
    workflowType: "explain_repository",
    taskPrompt: "Explain how authentication and JWT token storage works across the codebase.",
    status: "completed",
    plan: {
      summary: "Trace authentication lifecycle from UI login form through service client and token storage.",
      estimatedSteps: 4,
      approach: "1. Locate login entrypoint in React form.\n2. Trace auth service API request and localStorage mutation.\n3. Identify downstream callers and authorization headers.\n4. Summarize with verified line references.",
      riskAssessment: "Read-only inspection of source code and symbol graph. Zero risk.",
      requiredTools: ["search_codebase", "retrieve_source_context", "find_symbol_references", "inspect_dependencies"],
    },
    steps: [
      {
        id: "step_r1",
        order: 1,
        title: "Search repository for authentication symbols",
        description: "Searched for 'LoginForm', 'loginUser', and 'session_token' in source files.",
        status: "completed",
        toolName: "search_codebase",
        toolInput: { query: "loginUser session_token" },
        toolOutput: { matchCount: 3, files: ["src/services/auth.ts", "src/components/LoginForm.tsx", "tests/auth.test.ts"] },
        startedAt: "2026-01-16T10:00:00.000Z",
        completedAt: "2026-01-16T10:00:02.000Z",
        durationMs: 2000,
        evidenceSummary: "Discovered loginUser definition in src/services/auth.ts and caller in src/components/LoginForm.tsx.",
      },
      {
        id: "step_r2",
        order: 2,
        title: "Retrieve source context for auth service",
        description: "Extracted full implementation of loginUser and session persistence.",
        status: "completed",
        toolName: "retrieve_source_context",
        toolInput: { filePath: "src/services/auth.ts", startLine: 1, endLine: 50 },
        toolOutput: { lineCount: 50, symbol: "loginUser" },
        startedAt: "2026-01-16T10:00:02.000Z",
        completedAt: "2026-01-16T10:00:04.000Z",
        durationMs: 2000,
        evidenceSummary: "loginUser sends credentials to /api/auth/login and sets localStorage item 'session_token' at line 41.",
      },
      {
        id: "step_r3",
        order: 3,
        title: "Inspect caller hierarchy and consumers",
        description: "Verified that handleSubmit in LoginForm invokes loginUser upon form submission.",
        status: "completed",
        toolName: "find_symbol_references",
        toolInput: { symbolName: "loginUser" },
        toolOutput: { references: [{ file: "src/components/LoginForm.tsx", line: 28 }] },
        startedAt: "2026-01-16T10:00:04.000Z",
        completedAt: "2026-01-16T10:00:06.000Z",
        durationMs: 2000,
        evidenceSummary: "LoginForm.handleSubmit awaits loginUser(credentials) and redirects to /dashboard.",
      },
      {
        id: "step_r4",
        order: 4,
        title: "Synthesize evidence-backed architecture report",
        description: "Formatted verified findings with citations and security observations.",
        status: "completed",
        startedAt: "2026-01-16T10:00:06.000Z",
        completedAt: "2026-01-16T10:00:08.000Z",
        durationMs: 2000,
      },
    ],
    currentStepIndex: 3,
    findings: [
      {
        id: "find_r1",
        title: "Direct localStorage token storage without encryption",
        description: "The authentication token is stored directly in browser localStorage ('session_token'), which is accessible to client scripts.",
        severity: "warning",
        category: "security",
        file: "src/services/auth.ts",
        line: 41,
        lineRange: "40-42",
        codeSnippet: "localStorage.setItem(\"session_token\", data.token);",
        whyItMatters: "Tokens in localStorage can be extracted by Cross-Site Scripting (XSS) vectors compared to HttpOnly secure cookies.",
        suggestedRemediation: "Consider migrating session management to HttpOnly SameSite cookies.",
      },
    ],
    hypotheses: [],
    citations: [
      {
        id: "cit_r1",
        repositoryId: "sample-project",
        filePath: "src/services/auth.ts",
        symbolName: "loginUser",
        startLine: 35,
        endLine: 45,
        snippet: "export async function loginUser(credentials: LoginCredentials) {\n  const response = await fetch('/api/auth/login', ...);\n  const data = await response.json();\n  localStorage.setItem('session_token', data.token);\n  return data.user;\n}",
        reason: "Core authentication handler responsible for issuing credentials request and saving token.",
        isVerified: true,
      },
      {
        id: "cit_r2",
        repositoryId: "sample-project",
        filePath: "src/components/LoginForm.tsx",
        symbolName: "handleSubmit",
        startLine: 26,
        endLine: 34,
        snippet: "const handleSubmit = async (e: React.FormEvent) => {\n  e.preventDefault();\n  setIsLoading(true);\n  try {\n    await loginUser({ email, password });\n    router.push('/dashboard');\n  } catch (err) {\n    setError(err.message);\n  }\n};",
        reason: "Form submit handler that initiates the loginUser call.",
        isVerified: true,
      },
    ],
    actions: [],
    outcomeSummary: "Authentication in sample-project is handled by `loginUser` in `src/services/auth.ts:35-45`. Credentials are submitted from `LoginForm.tsx:28`, and the returned bearer token is saved to `localStorage` under `session_token`.",
    createdAt: "2026-01-16T10:00:00.000Z",
    updatedAt: "2026-01-16T10:00:08.000Z",
    completedAt: "2026-01-16T10:00:08.000Z",
  },
  {
    id: "run_seed_refactor_gate",
    userId: "usr_default",
    workspaceId: "ws_team_demo",
    repositoryId: "sample-project",
    repositoryName: "sample-project",
    agentType: "refactoring",
    workflowType: "safe_refactoring",
    taskPrompt: "Refactor loginUser to defensively validate token response before accessing localStorage.",
    status: "awaiting_approval",
    plan: {
      summary: "Add defensive validation guard for data.token in src/services/auth.ts.",
      estimatedSteps: 5,
      approach: "1. Inspect current loginUser function.\n2. Analyze caller impacts and regressions.\n3. Formulate minimal defensive patch.\n4. Present human approval gate with diff preview.\n5. (Post-approval) Apply patch and verify.",
      riskAssessment: "Medium risk: modifies runtime auth behavior if backend returns empty token payload.",
      requiredTools: ["retrieve_source_context", "inspect_dependencies", "generate_patch_preview", "apply_approved_patch"],
    },
    steps: [
      {
        id: "step_rf1",
        order: 1,
        title: "Analyze target function src/services/auth.ts",
        description: "Extracted lines 35-48 to inspect current token handling.",
        status: "completed",
        toolName: "retrieve_source_context",
        startedAt: "2026-01-16T11:00:00.000Z",
        completedAt: "2026-01-16T11:00:02.000Z",
        durationMs: 2000,
        evidenceSummary: "Line 41 assumes data.token is defined string without checking.",
      },
      {
        id: "step_rf2",
        order: 2,
        title: "Assess change impact on LoginForm and tests",
        description: "Inspected downstream callers; verified handleSubmit handles try/catch errors.",
        status: "completed",
        toolName: "inspect_dependencies",
        startedAt: "2026-01-16T11:00:02.000Z",
        completedAt: "2026-01-16T11:00:04.000Z",
        durationMs: 2000,
        evidenceSummary: "LoginForm catch block displays error message gracefully if loginUser throws.",
      },
      {
        id: "step_rf3",
        order: 3,
        title: "Generate defensive validation patch preview",
        description: "Created diff inserting validation guard before localStorage.setItem.",
        status: "completed",
        toolName: "generate_patch_preview",
        startedAt: "2026-01-16T11:00:04.000Z",
        completedAt: "2026-01-16T11:00:06.000Z",
        durationMs: 2000,
      },
      {
        id: "step_rf4",
        order: 4,
        title: "Human Authorization Gate: Apply Patch",
        description: "Awaiting explicit developer approval to modify src/services/auth.ts.",
        status: "awaiting_approval",
        isApprovalGate: true,
        startedAt: "2026-01-16T11:00:06.000Z",
      },
      {
        id: "step_rf5",
        order: 5,
        title: "Apply patch and run test verification",
        description: "Apply patch to repository files and run test suite.",
        status: "pending",
      },
    ],
    currentStepIndex: 3,
    findings: [],
    hypotheses: [],
    citations: [
      {
        id: "cit_rf1",
        repositoryId: "sample-project",
        filePath: "src/services/auth.ts",
        symbolName: "loginUser",
        startLine: 40,
        endLine: 42,
        snippet: "  const data = await response.json();\n  localStorage.setItem(\"session_token\", data.token);",
        reason: "Target lines lacking defensive payload structure check.",
        isVerified: true,
      },
    ],
    actions: [
      {
        id: "act_gate_patch_1",
        actionType: "apply_patch",
        title: "Apply defensive token validation patch",
        description: "Modify src/services/auth.ts to validate data.token before storing in localStorage.",
        rationale: "Prevents runtime crashes with TypeError: Cannot read properties of undefined when API returns unexpected response.",
        affectedFiles: ["src/services/auth.ts"],
        diffPreview: `--- a/src/services/auth.ts\n+++ b/src/services/auth.ts\n@@ -40,3 +40,6 @@\n   const data = await response.json();\n+  if (!data || typeof data.token !== "string") {\n+    throw new Error("Invalid auth response: missing access token.");\n+  }\n   localStorage.setItem("session_token", data.token);`,
        riskLevel: "medium",
        status: "pending",
        createdAt: "2026-01-16T11:00:06.000Z",
      },
    ],
    outcomeSummary: "Refactoring proposal generated with unified diff. Execution is paused awaiting human approval to apply changes to src/services/auth.ts.",
    createdAt: "2026-01-16T11:00:00.000Z",
    updatedAt: "2026-01-16T11:00:06.000Z",
  },
  {
    id: "run_seed_debug_investigation",
    userId: "usr_default",
    workspaceId: "ws_team_demo",
    repositoryId: "sample-project",
    repositoryName: "sample-project",
    agentType: "debugging",
    workflowType: "investigate_bug",
    taskPrompt: "Investigate TypeError: Cannot read properties of undefined (reading 'token') reported in loginUser.",
    status: "completed",
    plan: {
      summary: "Parse stack trace, correlate with AST symbols, evaluate hypotheses, and propose reproduction tests.",
      estimatedSteps: 4,
      approach: "1. Parse stack trace and locate frames.\n2. Verify source code against AST symbols.\n3. Formulate ranked hypotheses with evidence for/against.\n4. Propose targeted reproduction test.",
      riskAssessment: "Read-only source analysis. Zero mutation risk.",
      requiredTools: ["parse_stack_trace", "retrieve_source_context", "inspect_dependencies"],
    },
    steps: [
      {
        id: "step_d1",
        order: 1,
        title: "Parse stack trace and verify frames",
        description: "Parsed 2 stack frames and verified against indexed files.",
        status: "completed",
        toolName: "parse_stack_trace",
        startedAt: "2026-01-16T12:00:00.000Z",
        completedAt: "2026-01-16T12:00:02.000Z",
        durationMs: 2000,
        evidenceSummary: "Frame 1 confirmed at src/services/auth.ts:41 in loginUser; Frame 2 confirmed at src/components/LoginForm.tsx:28.",
      },
      {
        id: "step_d2",
        order: 2,
        title: "Examine surrounding code and error handling",
        description: "Extracted context lines 30-45 in src/services/auth.ts.",
        status: "completed",
        toolName: "retrieve_source_context",
        startedAt: "2026-01-16T12:00:02.000Z",
        completedAt: "2026-01-16T12:00:04.000Z",
        durationMs: 2000,
      },
      {
        id: "step_d3",
        order: 3,
        title: "Formulate and rank root-cause hypotheses",
        description: "Evaluated 2 hypotheses based on verified source facts and call relationships.",
        status: "completed",
        startedAt: "2026-01-16T12:00:04.000Z",
        completedAt: "2026-01-16T12:00:06.000Z",
        durationMs: 2000,
      },
      {
        id: "step_d4",
        order: 4,
        title: "Generate reproduction test and remediation proposal",
        description: "Constructed Jest unit test reproducing malformed response.",
        status: "completed",
        startedAt: "2026-01-16T12:00:06.000Z",
        completedAt: "2026-01-16T12:00:08.000Z",
        durationMs: 2000,
      },
    ],
    currentStepIndex: 3,
    findings: [],
    hypotheses: [
      {
        id: "hyp_d1",
        title: "Missing token property in backend API response body",
        description: "When the backend returns an error JSON or unexpected structure without `token`, accessing `data.token` produces undefined.",
        likelihood: "high",
        evidenceFor: [
          "src/services/auth.ts:41 directly references data.token.",
          "Network status 200 responses with empty payloads bypass non-200 check.",
        ],
        evidenceAgainst: [
          "If response is not ok, lines 38-39 handle it, unless status code is 200 with error body.",
        ],
        verificationSteps: [
          "Simulate backend returning { error: 'invalid_credentials' } with HTTP 200.",
          "Check whether loginUser throws TypeError.",
        ],
        isConfirmed: true,
      },
      {
        id: "hyp_d2",
        title: "Response body was not valid JSON",
        description: "If response.json() fails, the uncaught syntax error would occur earlier.",
        likelihood: "low",
        evidenceFor: ["HTML error page returned by reverse proxy."],
        evidenceAgainst: ["SyntaxError: Unexpected token < in JSON would be raised at line 40, not line 41."],
        verificationSteps: ["Verify error message type."],
        isConfirmed: false,
      },
    ],
    citations: [
      {
        id: "cit_d1",
        repositoryId: "sample-project",
        filePath: "src/services/auth.ts",
        symbolName: "loginUser",
        startLine: 40,
        endLine: 42,
        snippet: "  const data = await response.json();\n  localStorage.setItem(\"session_token\", data.token);",
        reason: "Point of failure where data.token is dereferenced.",
        isVerified: true,
      },
    ],
    actions: [],
    outcomeSummary: "Root cause confirmed: `src/services/auth.ts:41` does not validate `data.token` before storage. Reproduction test and defensive validation patch generated.",
    createdAt: "2026-01-16T12:00:00.000Z",
    updatedAt: "2026-01-16T12:00:08.000Z",
    completedAt: "2026-01-16T12:00:08.000Z",
  },
];

class DatabaseManager {
  private schema: CodeAtlasDatabaseSchema | null = null;

  private ensureDir() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  }

  private load(): CodeAtlasDatabaseSchema {
    if (this.schema) return this.schema;

    this.ensureDir();

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.schema = JSON.parse(raw);
        let changed = false;
        if (!this.schema?.activities) {
          this.schema!.activities = [...SEED_ACTIVITIES];
          changed = true;
        }
        if (!this.schema?.files || this.schema.files.length < SAMPLE_FILES.length) {
          if (!this.schema!.files) this.schema!.files = [];
          for (const sf of SAMPLE_FILES) {
            const exists = this.schema!.files.some(
              (f) => f.repositoryId === sf.repositoryId && f.path === sf.path
            );
            if (!exists) {
              this.schema!.files.push({ ...sf });
              changed = true;
            }
          }
        }
        if (!this.schema?.notifications) {
          this.schema!.notifications = [...SEED_NOTIFICATIONS];
          changed = true;
        }
        if (!this.schema?.userSettings) {
          this.schema!.userSettings = [{ ...DEFAULT_USER_SETTINGS }];
          changed = true;
        }
        if (!this.schema?.workspaces || this.schema.workspaces.length === 0) {
          this.schema!.workspaces = [...SEED_WORKSPACES];
          changed = true;
        }
        if (!this.schema?.workspaceMembers || this.schema.workspaceMembers.length === 0) {
          this.schema!.workspaceMembers = [...SEED_WORKSPACE_MEMBERS];
          changed = true;
        }
        if (!this.schema?.workspaceInvitations) {
          this.schema!.workspaceInvitations = [];
          changed = true;
        }
        if (!this.schema?.workspaceRepositories || this.schema.workspaceRepositories.length === 0) {
          this.schema!.workspaceRepositories = [...SEED_WORKSPACE_REPOSITORIES];
          changed = true;
        }
        if (!this.schema?.sharedArtifacts || this.schema.sharedArtifacts.length === 0) {
          this.schema!.sharedArtifacts = [...SEED_SHARED_ARTIFACTS];
          changed = true;
        }
        if (!this.schema?.codeAnnotations || this.schema.codeAnnotations.length === 0) {
          this.schema!.codeAnnotations = [...SEED_CODE_ANNOTATIONS];
          changed = true;
        }
        if (!this.schema?.findingDiscussions) {
          this.schema!.findingDiscussions = [];
          changed = true;
        }
        if (!this.schema?.findingDecisions) {
          this.schema!.findingDecisions = [];
          changed = true;
        }
        if (!this.schema?.workspaceActivities || this.schema.workspaceActivities.length === 0) {
          this.schema!.workspaceActivities = [...SEED_WORKSPACE_ACTIVITIES];
          changed = true;
        }
        if (!this.schema?.debugInvestigations || this.schema.debugInvestigations.length === 0) {
          this.schema!.debugInvestigations = [...SEED_DEBUG_INVESTIGATIONS];
          changed = true;
        }
        if (!this.schema?.debugFollowUps) {
          this.schema!.debugFollowUps = [];
          changed = true;
        }
        if (!this.schema?.refactoringProposals || this.schema.refactoringProposals.length === 0) {
          this.schema!.refactoringProposals = [...SEED_REFACTORING_PROPOSALS];
          changed = true;
        }
        if (!this.schema?.agentRuns || this.schema.agentRuns.length === 0) {
          this.schema!.agentRuns = [...SEED_AGENT_RUNS];
          changed = true;
        }
        // Ensure seed users exist
        for (const su of SEED_USERS) {
          if (!this.schema!.users.some((u) => u.id === su.id)) {
            this.schema!.users.push(su);
            changed = true;
          }
        }
        // Ensure multi-repo fixtures are present
        for (const repo of MULTI_REPO_FIXTURES.repositories) {
          if (!this.schema!.repositories.some((r) => r.id === repo.id)) {
            this.schema!.repositories.push(repo);
            changed = true;
          }
        }
        for (const f of MULTI_REPO_FIXTURES.files) {
          if (!this.schema!.files.some((file) => file.repositoryId === f.repositoryId && file.path === f.path)) {
            this.schema!.files.push(f);
            changed = true;
          }
        }
        for (const s of MULTI_REPO_FIXTURES.symbols) {
          if (!this.schema!.symbols.some((sym) => sym.id === s.id)) {
            this.schema!.symbols.push(s);
            changed = true;
          }
        }
        for (const rel of MULTI_REPO_FIXTURES.relationships) {
          if (!this.schema!.relationships.some((r) => r.id === rel.id)) {
            this.schema!.relationships.push(rel);
            changed = true;
          }
        }
        if (!this.schema!.workspaceRepositories) {
          this.schema!.workspaceRepositories = [];
        }
        for (const wsr of MULTI_REPO_FIXTURES.workspaceRepositories) {
          if (!this.schema!.workspaceRepositories.some((w) => w.id === wsr.id)) {
            this.schema!.workspaceRepositories.push(wsr);
            changed = true;
          }
        }

        if (changed) {
          this.save(this.schema!);
        }
        return this.schema!;
      } catch (e) {
        console.error("Failed to parse codeatlas-db.json, re-initializing:", e);
      }
    }

    // Initialize with seed data
    const initial: CodeAtlasDatabaseSchema = {
      users: [...SEED_USERS],
      connectedAccounts: [],
      repositories: [SAMPLE_PROJECT_REPO, ...MULTI_REPO_FIXTURES.repositories],
      indexingJobs: [],
      files: [...SAMPLE_FILES, ...MULTI_REPO_FIXTURES.files],
      symbols: [...SAMPLE_SYMBOLS, ...MULTI_REPO_FIXTURES.symbols],
      relationships: [...SAMPLE_RELATIONSHIPS, ...MULTI_REPO_FIXTURES.relationships],
      chunks: [],
      activities: [...SEED_ACTIVITIES],
      notifications: [...SEED_NOTIFICATIONS],
      userSettings: [{ ...DEFAULT_USER_SETTINGS }],
      workspaces: [...SEED_WORKSPACES],
      workspaceMembers: [...SEED_WORKSPACE_MEMBERS],
      workspaceInvitations: [],
      workspaceRepositories: [...SEED_WORKSPACE_REPOSITORIES, ...MULTI_REPO_FIXTURES.workspaceRepositories],
      sharedArtifacts: [...SEED_SHARED_ARTIFACTS],
      codeAnnotations: [...SEED_CODE_ANNOTATIONS],
      findingDiscussions: [],
      findingDecisions: [],
      workspaceActivities: [...SEED_WORKSPACE_ACTIVITIES],
      debugInvestigations: [...SEED_DEBUG_INVESTIGATIONS],
      debugFollowUps: [],
      refactoringProposals: [...SEED_REFACTORING_PROPOSALS],
      agentRuns: [...SEED_AGENT_RUNS],
    };

    this.save(initial);
    this.schema = initial;
    return initial;
  }

  private save(data: CodeAtlasDatabaseSchema) {
    this.ensureDir();
    const tempFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    try {
      fs.renameSync(tempFile, DB_FILE);
    } catch (e: any) {
      if (e.code === "EPERM" || e.code === "EBUSY") {
        // Fallback for Windows file locks / OneDrive file watcher
        try {
          fs.copyFileSync(tempFile, DB_FILE);
          fs.unlinkSync(tempFile);
        } catch {
          fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
        }
      } else {
        throw e;
      }
    }
    this.schema = data;
  }

  // --- User Operations ---
  getUser(userId: string = "usr_default"): DbUser | null {
    const data = this.load();
    return data.users.find((u) => u.id === userId) || null;
  }

  upsertUser(user: DbUser): DbUser {
    const data = this.load();
    const idx = data.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      data.users[idx] = { ...data.users[idx], ...user };
    } else {
      data.users.push(user);
    }
    this.save(data);
    return user;
  }

  // --- GitHub Connected Account Operations ---
  getConnectedAccount(userId: string = "usr_default", provider: "github" = "github"): DbConnectedAccount | null {
    const data = this.load();
    return data.connectedAccounts.find((a) => a.userId === userId && a.provider === provider) || null;
  }

  saveConnectedAccount(account: DbConnectedAccount): void {
    const data = this.load();
    const idx = data.connectedAccounts.findIndex(
      (a) => a.userId === account.userId && a.provider === account.provider
    );
    if (idx >= 0) {
      data.connectedAccounts[idx] = account;
    } else {
      data.connectedAccounts.push(account);
    }
    this.save(data);
  }

  deleteConnectedAccount(userId: string = "usr_default", provider: "github" = "github"): boolean {
    const data = this.load();
    data.connectedAccounts = data.connectedAccounts.filter(
      (a) => !(a.userId === userId && a.provider === provider)
    );
    this.save(data);
    return true;
  }

  // --- Repository Operations ---
  getRepositories(userId: string = "usr_default"): DbRepository[] {
    const data = this.load();
    return data.repositories.filter((r) => r.userId === userId || r.userId === "usr_default");
  }

  getRepository(id: string, userId: string = "usr_default"): DbRepository | null {
    const list = this.getRepositories(userId);
    return list.find((r) => r.id === id) || null;
  }

  saveRepository(repo: DbRepository): DbRepository {
    const data = this.load();
    const idx = data.repositories.findIndex((r) => r.id === repo.id);
    if (idx >= 0) {
      data.repositories[idx] = repo;
    } else {
      data.repositories.unshift(repo);
    }
    this.save(data);
    return repo;
  }

  updateRepository(id: string, updates: Partial<DbRepository>): DbRepository | null {
    const data = this.load();
    const idx = data.repositories.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    data.repositories[idx] = { ...data.repositories[idx], ...updates };
    this.save(data);
    return data.repositories[idx];
  }

  // --- Indexing Job Operations ---
  createIndexingJob(job: DbIndexingJob): DbIndexingJob {
    const data = this.load();
    data.indexingJobs.unshift(job);
    this.save(data);
    return job;
  }

  getIndexingJob(jobId: string): DbIndexingJob | null {
    const data = this.load();
    return data.indexingJobs.find((j) => j.id === jobId) || null;
  }

  getActiveJobForRepo(repoId: string): DbIndexingJob | null {
    const data = this.load();
    return (
      data.indexingJobs.find(
        (j) =>
          j.repositoryId === repoId &&
          (j.status === "pending" ||
            j.status === "fetching" ||
            j.status === "parsing" ||
            j.status === "indexing")
      ) || null
    );
  }

  updateIndexingJob(jobId: string, updates: Partial<DbIndexingJob>): DbIndexingJob | null {
    const data = this.load();
    const idx = data.indexingJobs.findIndex((j) => j.id === jobId);
    if (idx < 0) return null;
    data.indexingJobs[idx] = { ...data.indexingJobs[idx], ...updates };
    this.save(data);
    return data.indexingJobs[idx];
  }

  // --- Files Operations ---
  saveRepositoryFiles(repoId: string, files: DbRepositoryFile[]): void {
    const data = this.load();
    data.files = data.files.filter((f) => f.repositoryId !== repoId);
    data.files.push(...files);
    this.save(data);
  }

  getRepositoryFiles(repoId: string): DbRepositoryFile[] {
    const data = this.load();
    return data.files.filter((f) => f.repositoryId === repoId);
  }

  getRepositoryFile(repoId: string, filePath: string): DbRepositoryFile | null {
    const files = this.getRepositoryFiles(repoId);
    return files.find((f) => f.path === filePath) || null;
  }

  // --- Symbols & Relationships Operations ---
  saveCodeSymbols(repoId: string, symbols: DbCodeSymbol[]): void {
    const data = this.load();
    data.symbols = data.symbols.filter((s) => s.repositoryId !== repoId);
    data.symbols.push(...symbols);
    this.save(data);
  }

  getCodeSymbols(repoId: string): DbCodeSymbol[] {
    const data = this.load();
    return data.symbols.filter((s) => s.repositoryId === repoId);
  }

  getRepositorySymbols(repoId: string): DbCodeSymbol[] {
    return this.getCodeSymbols(repoId);
  }

  saveCodeRelationships(repoId: string, rels: DbCodeRelationship[]): void {
    const data = this.load();
    data.relationships = data.relationships.filter((r) => r.repositoryId !== repoId);
    data.relationships.push(...rels);
    this.save(data);
  }

  getCodeRelationships(repoId: string): DbCodeRelationship[] {
    const data = this.load();
    return data.relationships.filter((r) => r.repositoryId === repoId);
  }

  // --- Search Operations ---
  searchRepositoryCode(
    repoId: string,
    query: string
  ): { file: string; line: number; text: string; matchType: "symbol" | "code" }[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const results: { file: string; line: number; text: string; matchType: "symbol" | "code" }[] = [];
    const symbols = this.getCodeSymbols(repoId);

    // 1. Match symbols
    symbols.forEach((sym) => {
      if (sym.name.toLowerCase().includes(q)) {
        results.push({
          file: sym.filePath,
          line: sym.startLine,
          text: `symbol ${sym.name} (${sym.type})`,
          matchType: "symbol",
        });
      }
    });

    // 2. Match file lines
    const files = this.getRepositoryFiles(repoId);
    files.forEach((file) => {
      const lines = file.content.split("\n");
      lines.forEach((lineText, idx) => {
        if (lineText.toLowerCase().includes(q) && results.length < 50) {
          results.push({
            file: file.path,
            line: idx + 1,
            text: lineText.trim(),
            matchType: "code",
          });
        }
      });
    });

    return results;
  }

  // --- Code Review Operations ---
  getReviewSessions(repoId: string): DbReviewSession[] {
    const data = this.load();
    if (!data.reviewSessions) data.reviewSessions = [];
    return data.reviewSessions.filter((s) => s.repositoryId === repoId);
  }

  getReviewSession(repoId: string, pullRequestNumber: number): DbReviewSession | null {
    const sessions = this.getReviewSessions(repoId);
    return sessions.find((s) => s.pullRequestNumber === pullRequestNumber) || null;
  }

  saveReviewSession(session: DbReviewSession): DbReviewSession {
    const data = this.load();
    if (!data.reviewSessions) data.reviewSessions = [];
    const idx = data.reviewSessions.findIndex(
      (s) => s.repositoryId === session.repositoryId && s.pullRequestNumber === session.pullRequestNumber
    );
    if (idx >= 0) {
      data.reviewSessions[idx] = session;
    } else {
      data.reviewSessions.unshift(session);
    }
    this.save(data);
    return session;
  }

  updateFindingStatus(
    sessionId: string,
    findingId: string,
    status: "open" | "reviewed" | "dismissed",
    dismissReason?: string
  ): boolean {
    const data = this.load();
    if (!data.reviewSessions) return false;
    const session = data.reviewSessions.find((s) => s.id === sessionId);
    if (!session) return false;

    const finding = session.findings.find((f: any) => f.id === findingId);
    if (!finding) return false;

    finding.status = status;
    if (dismissReason !== undefined) {
      finding.dismissReason = dismissReason;
    }
    this.save(data);
    return true;
  }

  // --- Activity Logging Operations ---
  getActivities(
    userId: string = "usr_default",
    filterType?: string,
    repoId?: string,
    limit: number = 30
  ): DbActivityEvent[] {
    const data = this.load();
    if (!data.activities) data.activities = [];
    return data.activities
      .filter((act) => {
        if (act.userId !== userId) return false;
        if (filterType && filterType !== "all" && act.type !== filterType) return false;
        if (repoId && act.repositoryId !== repoId) return false;
        return true;
      })
      .slice(0, limit);
  }

  logActivity(activity: Omit<DbActivityEvent, "id" | "timestamp">): DbActivityEvent {
    const data = this.load();
    if (!data.activities) data.activities = [];
    const newEvent: DbActivityEvent = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    data.activities.unshift(newEvent);
    // Bound activity log size to 200 events
    if (data.activities.length > 200) {
      data.activities = data.activities.slice(0, 200);
    }
    this.save(data);
    return newEvent;
  }

  // --- Notification Operations ---
  getNotifications(userId: string = "usr_default"): DbNotification[] {
    const data = this.load();
    if (!data.notifications) data.notifications = [];
    return data.notifications.filter((n) => n.userId === userId);
  }

  createNotification(notif: Omit<DbNotification, "id" | "timestamp" | "read">): DbNotification {
    const data = this.load();
    if (!data.notifications) data.notifications = [];
    const newNotif: DbNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    data.notifications.unshift(newNotif);
    if (data.notifications.length > 50) {
      data.notifications = data.notifications.slice(0, 50);
    }
    this.save(data);
    return newNotif;
  }

  markNotificationRead(id: string, userId: string = "usr_default"): boolean {
    const data = this.load();
    if (!data.notifications) return false;
    const notif = data.notifications.find((n) => n.id === id && n.userId === userId);
    if (!notif) return false;
    notif.read = true;
    this.save(data);
    return true;
  }

  clearNotifications(userId: string = "usr_default"): boolean {
    const data = this.load();
    if (!data.notifications) return false;
    data.notifications = data.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n));
    this.save(data);
    return true;
  }

  // --- User Settings Operations ---
  getUserSettings(userId: string = "usr_default"): DbUserSettings {
    const data = this.load();
    if (!data.userSettings) data.userSettings = [];
    const existing = data.userSettings.find((s) => s.userId === userId);
    if (existing) return existing;

    const initial = { ...DEFAULT_USER_SETTINGS, userId };
    data.userSettings.push(initial);
    this.save(data);
    return initial;
  }

  updateUserSettings(userId: string = "usr_default", updates: Partial<DbUserSettings>): DbUserSettings {
    const data = this.load();
    if (!data.userSettings) data.userSettings = [];
    let settings = data.userSettings.find((s) => s.userId === userId);
    if (!settings) {
      settings = { ...DEFAULT_USER_SETTINGS, userId, ...updates, updatedAt: new Date().toISOString() };
      data.userSettings.push(settings);
    } else {
      Object.assign(settings, updates, { updatedAt: new Date().toISOString() });
    }
    this.save(data);
    return settings;
  }

  // --- Phase 12: Onboarding Progress Operations ---
  getOnboardingProgress(userId: string = "usr_default", repoId: string = "sample-project"): {
    completedSteps: string[];
    currentStep: string;
    lastUpdated: string;
  } {
    const data = this.load();
    if (!data.onboardingProgress) data.onboardingProgress = {};
    const key = `${userId}_${repoId}`;
    return data.onboardingProgress[key] || {
      completedSteps: ["understand_structure"],
      currentStep: "discover_entry_points",
      lastUpdated: new Date().toISOString(),
    };
  }

  updateOnboardingProgress(
    userId: string = "usr_default",
    repoId: string = "sample-project",
    completedSteps: string[],
    currentStep: string
  ) {
    const data = this.load();
    if (!data.onboardingProgress) data.onboardingProgress = {};
    const key = `${userId}_${repoId}`;
    data.onboardingProgress[key] = {
      completedSteps: Array.from(new Set(completedSteps)),
      currentStep,
      lastUpdated: new Date().toISOString(),
    };
    this.save(data);
    return data.onboardingProgress[key];
  }

  // --- Phase 12: Learning Path Progress Operations ---
  getLearningPathProgress(userId: string = "usr_default", repoId: string = "sample-project"): {
    completedSteps: string[];
    currentStep: string;
    lastUpdated: string;
  } {
    const data = this.load();
    if (!data.learningPathProgress) data.learningPathProgress = {};
    const key = `${userId}_${repoId}`;
    return data.learningPathProgress[key] || {
      completedSteps: [],
      currentStep: "step_overview",
      lastUpdated: new Date().toISOString(),
    };
  }

  updateLearningPathProgress(
    userId: string = "usr_default",
    repoId: string = "sample-project",
    completedSteps: string[],
    currentStep: string
  ) {
    const data = this.load();
    if (!data.learningPathProgress) data.learningPathProgress = {};
    const key = `${userId}_${repoId}`;
    data.learningPathProgress[key] = {
      completedSteps: Array.from(new Set(completedSteps)),
      currentStep,
      lastUpdated: new Date().toISOString(),
    };
    this.save(data);
    return data.learningPathProgress[key];
  }

  // --- Phase 12: Health Insights Dismissal Operations ---
  getDismissedInsights(userId: string = "usr_default", repoId: string = "sample-project"): string[] {
    const data = this.load();
    if (!data.dismissedInsights) data.dismissedInsights = {};
    const key = `${userId}_${repoId}`;
    return data.dismissedInsights[key] || [];
  }

  dismissInsight(userId: string = "usr_default", repoId: string = "sample-project", insightId: string): boolean {
    const data = this.load();
    if (!data.dismissedInsights) data.dismissedInsights = {};
    const key = `${userId}_${repoId}`;
    if (!data.dismissedInsights[key]) data.dismissedInsights[key] = [];
    if (!data.dismissedInsights[key].includes(insightId)) {
      data.dismissedInsights[key].push(insightId);
    }
    this.save(data);
    return true;
  }

  // --- Phase 13: Product Onboarding Lifecycle Operations ---
  getProductOnboarding(userId: string = "usr_default") {
    const data = this.load();
    if (!data.productOnboarding) data.productOnboarding = {};
    return data.productOnboarding[userId] || {
      userId,
      completed: false,
      skipped: false,
      currentStep: 1,
      completedSteps: [],
      selectedRepoId: "sample-project",
      hasSeenTour: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  updateProductOnboarding(
    userId: string = "usr_default",
    updates: Partial<{
      completed: boolean;
      skipped: boolean;
      currentStep: number;
      completedSteps: string[];
      selectedRepoId: string;
      hasSeenTour: boolean;
    }>
  ) {
    const data = this.load();
    if (!data.productOnboarding) data.productOnboarding = {};
    const existing = this.getProductOnboarding(userId);
    data.productOnboarding[userId] = {
      ...existing,
      ...updates,
      completedSteps: updates.completedSteps ? Array.from(new Set(updates.completedSteps)) : existing.completedSteps,
      lastUpdated: new Date().toISOString(),
    };
    this.save(data);
    return data.productOnboarding[userId];
  }

  resetProductOnboarding(userId: string = "usr_default") {
    const data = this.load();
    if (!data.productOnboarding) data.productOnboarding = {};
    data.productOnboarding[userId] = {
      userId,
      completed: false,
      skipped: false,
      currentStep: 1,
      completedSteps: [],
      selectedRepoId: "sample-project",
      hasSeenTour: false,
      lastUpdated: new Date().toISOString(),
    };
    this.save(data);
    return data.productOnboarding[userId];
  }

  // --- Repository Disconnect & Clean Deletion ---
  deleteRepository(repoId: string, userId: string = "usr_default"): boolean {
    const data = this.load();
    const repoIndex = data.repositories.findIndex((r) => r.id === repoId && r.userId === userId);
    if (repoIndex === -1) return false;

    const [deletedRepo] = data.repositories.splice(repoIndex, 1);

    // Clean up local cascading artifacts
    data.files = data.files.filter((f) => f.repositoryId !== repoId);
    data.symbols = data.symbols.filter((s) => s.repositoryId !== repoId);
    data.relationships = data.relationships.filter((rel) => rel.repositoryId !== repoId);
    data.chunks = data.chunks.filter((c) => c.repositoryId !== repoId);
    if (data.reviewSessions) {
      data.reviewSessions = data.reviewSessions.filter((s) => s.repositoryId !== repoId);
    }
    if (data.indexingJobs) {
      data.indexingJobs = data.indexingJobs.filter((j) => j.repositoryId !== repoId);
    }

    // Log the disconnection event
    if (!data.activities) data.activities = [];
    data.activities.unshift({
      id: `act_${Date.now()}_del`,
      userId,
      repositoryId: repoId,
      repositoryName: deletedRepo.name,
      type: "repo_disconnected",
      title: `Repository disconnected: ${deletedRepo.name}`,
      description: "Disconnected from CodeAtlas; local AST symbols removed. GitHub repository was not modified.",
      timestamp: new Date().toISOString(),
      status: "info",
      href: "/repositories",
      linkText: "View Repositories",
    });

    this.save(data);
    return true;
  }

  // --- Global Codebase Search Operations ---
  globalSearch(
    userId: string = "usr_default",
    query: string,
    filters?: {
      repositoryId?: string;
      category?: string;
      language?: string;
      exactSymbol?: boolean;
    }
  ): SearchResultItem[] {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];

    const data = this.load();
    const authorizedRepos = data.repositories.filter(
      (r) => r.userId === userId || r.visibility === "public"
    );
    const authorizedRepoIds = new Set(authorizedRepos.map((r) => r.id));

    const results: SearchResultItem[] = [];

    // 1. Search Repositories
    if (!filters?.category || filters.category === "repository") {
      authorizedRepos.forEach((repo) => {
        if (
          repo.name.toLowerCase().includes(q) ||
          repo.description.toLowerCase().includes(q) ||
          repo.language.toLowerCase().includes(q)
        ) {
          results.push({
            id: `repo_${repo.id}`,
            title: repo.name,
            subtitle: `${repo.language} · ${repo.symbolCount} symbols · ${repo.description}`,
            category: "repository",
            repositoryId: repo.id,
            repositoryName: repo.name,
            href: `/repositories/${repo.id}`,
            badge: repo.status,
          });
        }
      });
    }

    // 2. Search Symbols (Functions, Classes, Services, Endpoints, Tables)
    if (!filters?.category || filters.category === "symbol" || filters.category === "api" || filters.category === "architecture") {
      const symbols = data.symbols.filter((sym) => {
        if (!authorizedRepoIds.has(sym.repositoryId)) return false;
        if (filters?.repositoryId && sym.repositoryId !== filters.repositoryId) return false;
        return true;
      });

      symbols.forEach((sym) => {
        const nameMatch = filters?.exactSymbol
          ? sym.name.toLowerCase() === q
          : sym.name.toLowerCase().includes(q);
        const pathMatch = sym.filePath.toLowerCase().includes(q);

        if (nameMatch || pathMatch) {
          const isEndpoint = sym.type === "endpoint" || sym.name.startsWith("POST") || sym.name.startsWith("GET");
          const isArchitecture = sym.type === "service" || sym.type === "class" || sym.type === "table";

          let cat: "symbol" | "api" | "architecture" = "symbol";
          if (filters?.category === "symbol") {
            cat = "symbol";
          } else if (isEndpoint) {
            cat = "api";
          } else if (isArchitecture) {
            cat = "architecture";
          }

          if (!filters?.category || filters.category === cat) {
            const repo = authorizedRepos.find((r) => r.id === sym.repositoryId);
            results.push({
              id: `sym_${sym.id}`,
              title: sym.name,
              subtitle: `${sym.filePath}:${sym.startLine} · ${sym.type}${sym.scope ? ` (${sym.scope})` : ""}`,
              category: cat,
              repositoryId: sym.repositoryId,
              repositoryName: repo?.name || sym.repositoryId,
              filePath: sym.filePath,
              line: sym.startLine,
              href: cat === "architecture"
                ? `/architecture?repoId=${sym.repositoryId}&nodeId=${encodeURIComponent(sym.name)}`
                : `/repositories/${sym.repositoryId}?file=${encodeURIComponent(sym.filePath)}&line=${sym.startLine}`,
              badge: sym.type,
              symbolType: sym.type,
            });
          }
        }
      });
    }

    // 3. Search Files
    if (!filters?.category || filters.category === "file") {
      const files = data.files.filter((f) => {
        if (!authorizedRepoIds.has(f.repositoryId)) return false;
        if (filters?.repositoryId && f.repositoryId !== filters.repositoryId) return false;
        if (filters?.language && f.language.toLowerCase() !== filters.language.toLowerCase()) return false;
        return true;
      });

      files.forEach((file) => {
        if (file.path.toLowerCase().includes(q) || file.name.toLowerCase().includes(q)) {
          const repo = authorizedRepos.find((r) => r.id === file.repositoryId);
          results.push({
            id: `file_${file.id}`,
            title: file.name,
            subtitle: `${repo?.name}/${file.path} (${file.lineCount} lines, ${file.language})`,
            category: "file",
            repositoryId: file.repositoryId,
            repositoryName: repo?.name || file.repositoryId,
            filePath: file.path,
            href: `/repositories/${file.repositoryId}?file=${encodeURIComponent(file.path)}`,
            badge: file.language,
          });
        }
      });
    }

    // 4. Search Code Content Lines
    if (!filters?.category || filters.category === "file") {
      const files = data.files.filter((f) => {
        if (!authorizedRepoIds.has(f.repositoryId)) return false;
        if (filters?.repositoryId && f.repositoryId !== filters.repositoryId) return false;
        return true;
      });

      let matchCount = 0;
      for (const file of files) {
        if (matchCount >= 20) break;
        const lines = file.content.split("\n");
        for (let idx = 0; idx < lines.length; idx++) {
          const lineText = lines[idx];
          if (lineText.toLowerCase().includes(q) && lineText.trim().length > 3) {
            const lineNum = idx + 1;
            // Avoid duplicate file item if already returned
            results.push({
              id: `code_${file.id}_${lineNum}`,
              title: lineText.trim(),
              subtitle: `${file.path}:${lineNum}`,
              category: "file",
              repositoryId: file.repositoryId,
              filePath: file.path,
              line: lineNum,
              matchSnippet: lineText.trim(),
              href: `/repositories/${file.repositoryId}?file=${encodeURIComponent(file.path)}&line=${lineNum}`,
              badge: `L${lineNum}`,
            });
            matchCount++;
            if (matchCount >= 20) break;
          }
        }
      }
    }

    // 5. Search Pull Requests & Code Reviews
    if (!filters?.category || filters.category === "review") {
      const reviews = (data.reviewSessions || []).filter((s) => {
        if (!authorizedRepoIds.has(s.repositoryId)) return false;
        if (filters?.repositoryId && s.repositoryId !== filters.repositoryId) return false;
        return true;
      });

      reviews.forEach((rev) => {
        const matchesSummary = rev.summary.toLowerCase().includes(q);
        const matchesSha = rev.commitSha.toLowerCase().includes(q);
        const matchesPr = `pr #${rev.pullRequestNumber}`.includes(q) || `pr ${rev.pullRequestNumber}`.includes(q);

        if (matchesSummary || matchesSha || matchesPr) {
          const repo = authorizedRepos.find((r) => r.id === rev.repositoryId);
          results.push({
            id: `rev_${rev.id}`,
            title: `PR #${rev.pullRequestNumber} Code Review`,
            subtitle: `${repo?.name} · ${rev.findings.length} findings · ${rev.summary.slice(0, 70)}...`,
            category: "review",
            repositoryId: rev.repositoryId,
            repositoryName: repo?.name || rev.repositoryId,
            href: `/code-review?repoId=${rev.repositoryId}&pr=${rev.pullRequestNumber}`,
            badge: `${rev.findings.length} findings`,
          });
        }
      });
    }

    return results.slice(0, 60);
  }

  // --- Phase 14: Workspace Operations ---
  ensureWorkspacesSeeded(): void {
    this.load();
  }

  getWorkspaces(): DbWorkspace[] {
    const data = this.load();
    return data.workspaces || [];
  }

  getWorkspace(id: string): DbWorkspace | null {
    const data = this.load();
    return (data.workspaces || []).find((w) => w.id === id) || null;
  }

  addWorkspace(workspace: DbWorkspace): DbWorkspace {
    const data = this.load();
    if (!data.workspaces) data.workspaces = [];
    data.workspaces.push(workspace);
    this.save(data);
    return workspace;
  }

  updateWorkspace(workspace: DbWorkspace): DbWorkspace {
    const data = this.load();
    if (!data.workspaces) data.workspaces = [];
    const idx = data.workspaces.findIndex((w) => w.id === workspace.id);
    if (idx >= 0) {
      data.workspaces[idx] = workspace;
    } else {
      data.workspaces.push(workspace);
    }
    this.save(data);
    return workspace;
  }

  deleteWorkspace(id: string): boolean {
    const data = this.load();
    if (!data.workspaces) return false;
    data.workspaces = data.workspaces.filter((w) => w.id !== id);
    if (data.workspaceMembers) {
      data.workspaceMembers = data.workspaceMembers.filter((m) => m.workspaceId !== id);
    }
    if (data.workspaceInvitations) {
      data.workspaceInvitations = data.workspaceInvitations.filter((i) => i.workspaceId !== id);
    }
    if (data.workspaceRepositories) {
      data.workspaceRepositories = data.workspaceRepositories.filter((r) => r.workspaceId !== id);
    }
    if (data.sharedArtifacts) {
      data.sharedArtifacts = data.sharedArtifacts.filter((a) => a.workspaceId !== id);
    }
    if (data.codeAnnotations) {
      data.codeAnnotations = data.codeAnnotations.filter((a) => a.workspaceId !== id);
    }
    if (data.findingDiscussions) {
      data.findingDiscussions = data.findingDiscussions.filter((d) => d.workspaceId !== id);
    }
    if (data.findingDecisions) {
      data.findingDecisions = data.findingDecisions.filter((d) => d.workspaceId !== id);
    }
    if (data.workspaceActivities) {
      data.workspaceActivities = data.workspaceActivities.filter((a) => a.workspaceId !== id);
    }
    this.save(data);
    return true;
  }

  // --- Phase 14: Workspace Membership Operations ---
  getAllWorkspaceMembers(): DbWorkspaceMember[] {
    const data = this.load();
    return data.workspaceMembers || [];
  }

  getWorkspaceMembers(workspaceId: string): DbWorkspaceMember[] {
    const data = this.load();
    return (data.workspaceMembers || []).filter((m) => m.workspaceId === workspaceId);
  }

  addWorkspaceMember(member: DbWorkspaceMember): DbWorkspaceMember {
    const data = this.load();
    if (!data.workspaceMembers) data.workspaceMembers = [];
    data.workspaceMembers.push(member);
    this.save(data);
    return member;
  }

  updateWorkspaceMemberRole(workspaceId: string, userId: string, role: WorkspaceRole): DbWorkspaceMember {
    const data = this.load();
    if (!data.workspaceMembers) data.workspaceMembers = [];
    const member = data.workspaceMembers.find((m) => m.workspaceId === workspaceId && m.userId === userId);
    if (!member) throw new Error("Member not found in workspace");
    member.role = role;
    this.save(data);
    return member;
  }

  removeWorkspaceMember(workspaceId: string, userId: string): boolean {
    const data = this.load();
    if (!data.workspaceMembers) return false;
    const initialLen = data.workspaceMembers.length;
    data.workspaceMembers = data.workspaceMembers.filter(
      (m) => !(m.workspaceId === workspaceId && m.userId === userId)
    );
    if (data.workspaceMembers.length !== initialLen) {
      this.save(data);
      return true;
    }
    return false;
  }

  // --- Phase 14: Workspace Invitation Operations ---
  getAllWorkspaceInvitations(): DbWorkspaceInvitation[] {
    const data = this.load();
    return data.workspaceInvitations || [];
  }

  getWorkspaceInvitations(workspaceId: string): DbWorkspaceInvitation[] {
    const data = this.load();
    return (data.workspaceInvitations || []).filter((i) => i.workspaceId === workspaceId);
  }

  getWorkspaceInvitation(id: string): DbWorkspaceInvitation | null {
    const data = this.load();
    return (data.workspaceInvitations || []).find((i) => i.id === id) || null;
  }

  addWorkspaceInvitation(invitation: DbWorkspaceInvitation): DbWorkspaceInvitation {
    const data = this.load();
    if (!data.workspaceInvitations) data.workspaceInvitations = [];
    data.workspaceInvitations.push(invitation);
    this.save(data);
    return invitation;
  }

  updateInvitationStatus(
    id: string,
    status: DbWorkspaceInvitation["status"],
    acceptedByUserId?: string
  ): boolean {
    const data = this.load();
    if (!data.workspaceInvitations) return false;
    const inv = data.workspaceInvitations.find((i) => i.id === id);
    if (!inv) return false;
    inv.status = status;
    if (status === "accepted") {
      inv.acceptedByUserId = acceptedByUserId;
      inv.acceptedAt = new Date().toISOString();
    }
    this.save(data);
    return true;
  }

  // --- Phase 14: Workspace Repository Operations ---
  getAllWorkspaceRepositories(): DbWorkspaceRepository[] {
    const data = this.load();
    return data.workspaceRepositories || [];
  }

  getWorkspaceRepositories(workspaceId: string): DbWorkspaceRepository[] {
    const data = this.load();
    return (data.workspaceRepositories || []).filter((r) => r.workspaceId === workspaceId);
  }

  addWorkspaceRepository(repo: DbWorkspaceRepository): DbWorkspaceRepository {
    const data = this.load();
    if (!data.workspaceRepositories) data.workspaceRepositories = [];
    data.workspaceRepositories.push(repo);
    this.save(data);
    return repo;
  }

  removeWorkspaceRepository(workspaceId: string, repositoryId: string): boolean {
    const data = this.load();
    if (!data.workspaceRepositories) return false;
    const initialLen = data.workspaceRepositories.length;
    data.workspaceRepositories = data.workspaceRepositories.filter(
      (r) => !(r.workspaceId === workspaceId && r.repositoryId === repositoryId)
    );
    if (data.workspaceRepositories.length !== initialLen) {
      this.save(data);
      return true;
    }
    return false;
  }

  getAllRepositories(): DbRepository[] {
    const data = this.load();
    return data.repositories || [];
  }

  getRepositoryById(id: string): DbRepository | null {
    const data = this.load();
    return (data.repositories || []).find((r) => r.id === id) || null;
  }

  getFileByPath(repoId: string, filePath: string): DbRepositoryFile | null {
    return this.getRepositoryFile(repoId, filePath);
  }

  // --- Phase 14: Shared Knowledge Artifacts Operations ---
  getSharedArtifacts(workspaceId: string): DbSharedArtifact[] {
    const data = this.load();
    return (data.sharedArtifacts || []).filter((a) => a.workspaceId === workspaceId);
  }

  getSharedArtifact(id: string): DbSharedArtifact | null {
    const data = this.load();
    return (data.sharedArtifacts || []).find((a) => a.id === id) || null;
  }

  addSharedArtifact(artifact: DbSharedArtifact): DbSharedArtifact {
    const data = this.load();
    if (!data.sharedArtifacts) data.sharedArtifacts = [];
    data.sharedArtifacts.push(artifact);
    this.save(data);
    return artifact;
  }

  updateSharedArtifact(artifact: DbSharedArtifact): DbSharedArtifact {
    const data = this.load();
    if (!data.sharedArtifacts) data.sharedArtifacts = [];
    const idx = data.sharedArtifacts.findIndex((a) => a.id === artifact.id);
    if (idx >= 0) {
      data.sharedArtifacts[idx] = artifact;
    } else {
      data.sharedArtifacts.push(artifact);
    }
    this.save(data);
    return artifact;
  }

  deleteSharedArtifact(id: string): boolean {
    const data = this.load();
    if (!data.sharedArtifacts) return false;
    const initialLen = data.sharedArtifacts.length;
    data.sharedArtifacts = data.sharedArtifacts.filter((a) => a.id !== id);
    if (data.sharedArtifacts.length !== initialLen) {
      this.save(data);
      return true;
    }
    return false;
  }

  // --- Phase 14: Code Annotations Operations ---
  getAnnotations(workspaceId: string, repositoryId?: string): DbCodeAnnotation[] {
    const data = this.load();
    return (data.codeAnnotations || []).filter((a) => {
      if (a.workspaceId !== workspaceId) return false;
      if (repositoryId && a.repositoryId !== repositoryId) return false;
      return true;
    });
  }

  getAnnotation(id: string): DbCodeAnnotation | null {
    const data = this.load();
    return (data.codeAnnotations || []).find((a) => a.id === id) || null;
  }

  addAnnotation(ann: DbCodeAnnotation): DbCodeAnnotation {
    const data = this.load();
    if (!data.codeAnnotations) data.codeAnnotations = [];
    data.codeAnnotations.push(ann);
    this.save(data);
    return ann;
  }

  updateAnnotation(ann: DbCodeAnnotation): DbCodeAnnotation {
    const data = this.load();
    if (!data.codeAnnotations) data.codeAnnotations = [];
    const idx = data.codeAnnotations.findIndex((a) => a.id === ann.id);
    if (idx >= 0) {
      data.codeAnnotations[idx] = ann;
    } else {
      data.codeAnnotations.push(ann);
    }
    this.save(data);
    return ann;
  }

  deleteAnnotation(id: string): boolean {
    const data = this.load();
    if (!data.codeAnnotations) return false;
    const initialLen = data.codeAnnotations.length;
    data.codeAnnotations = data.codeAnnotations.filter((a) => a.id !== id);
    if (data.codeAnnotations.length !== initialLen) {
      this.save(data);
      return true;
    }
    return false;
  }

  // --- Phase 14: Review Finding Discussions Operations ---
  getFindingDiscussions(
    workspaceId: string,
    reviewSessionId: string,
    findingId: string
  ): DbReviewFindingDiscussion[] {
    const data = this.load();
    return (data.findingDiscussions || []).filter(
      (d) =>
        d.workspaceId === workspaceId &&
        d.reviewSessionId === reviewSessionId &&
        d.findingId === findingId
    );
  }

  addFindingDiscussion(discussion: DbReviewFindingDiscussion): DbReviewFindingDiscussion {
    const data = this.load();
    if (!data.findingDiscussions) data.findingDiscussions = [];
    data.findingDiscussions.push(discussion);
    this.save(data);
    return discussion;
  }

  getFindingDecision(
    workspaceId: string,
    reviewSessionId: string,
    findingId: string
  ): DbFindingDecision | null {
    const data = this.load();
    return (
      (data.findingDecisions || []).find(
        (d) =>
          d.workspaceId === workspaceId &&
          d.reviewSessionId === reviewSessionId &&
          d.findingId === findingId
      ) || null
    );
  }

  saveFindingDecision(decision: DbFindingDecision): DbFindingDecision {
    const data = this.load();
    if (!data.findingDecisions) data.findingDecisions = [];
    const idx = data.findingDecisions.findIndex(
      (d) =>
        d.workspaceId === decision.workspaceId &&
        d.reviewSessionId === decision.reviewSessionId &&
        d.findingId === decision.findingId
    );
    if (idx >= 0) {
      data.findingDecisions[idx] = decision;
    } else {
      data.findingDecisions.push(decision);
    }
    this.save(data);
    return decision;
  }

  // --- Phase 14: Workspace Activity Feed Operations ---
  getWorkspaceActivities(workspaceId: string): DbWorkspaceActivityEvent[] {
    const data = this.load();
    return (data.workspaceActivities || []).filter((a) => a.workspaceId === workspaceId);
  }

  addWorkspaceActivity(activity: DbWorkspaceActivityEvent): DbWorkspaceActivityEvent {
    const data = this.load();
    if (!data.workspaceActivities) data.workspaceActivities = [];
    data.workspaceActivities.unshift(activity);
    if (data.workspaceActivities.length > 500) {
      data.workspaceActivities = data.workspaceActivities.slice(0, 500);
    }
    this.save(data);
    return activity;
  }

  addNotification(notif: DbNotification): DbNotification {
    const data = this.load();
    if (!data.notifications) data.notifications = [];
    data.notifications.unshift(notif);
    if (data.notifications.length > 50) {
      data.notifications = data.notifications.slice(0, 50);
    }
    this.save(data);
    return notif;
  }

  // --- Phase 15: AI Debug Investigations Operations ---
  getDebugInvestigations(
    userId: string = "usr_default",
    filter?: {
      repositoryId?: string;
      workspaceId?: string;
      search?: string;
      status?: string;
    }
  ): DbDebugInvestigation[] {
    const data = this.load();
    let list = (data.debugInvestigations || []).filter(
      (inv) => inv.userId === userId || inv.userId === "usr_default"
    );

    if (filter?.repositoryId) {
      list = list.filter((inv) => inv.repositoryId === filter.repositoryId);
    }
    if (filter?.workspaceId) {
      list = list.filter((inv) => inv.workspaceId === filter.workspaceId);
    }
    if (filter?.status && filter.status !== "all") {
      list = list.filter((inv) => inv.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.title.toLowerCase().includes(q) ||
          inv.errorMessage.toLowerCase().includes(q) ||
          inv.errorType.toLowerCase().includes(q) ||
          (inv.repositoryName && inv.repositoryName.toLowerCase().includes(q))
      );
    }

    return list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getDebugInvestigation(id: string, userId: string = "usr_default"): DbDebugInvestigation | null {
    const list = this.getDebugInvestigations(userId);
    return list.find((inv) => inv.id === id) || null;
  }

  saveDebugInvestigation(investigation: DbDebugInvestigation): DbDebugInvestigation {
    const data = this.load();
    if (!data.debugInvestigations) data.debugInvestigations = [];
    const idx = data.debugInvestigations.findIndex((inv) => inv.id === investigation.id);
    if (idx >= 0) {
      data.debugInvestigations[idx] = investigation;
    } else {
      data.debugInvestigations.unshift(investigation);
    }
    this.save(data);
    return investigation;
  }

  updateDebugInvestigation(
    id: string,
    updates: Partial<DbDebugInvestigation>
  ): DbDebugInvestigation | null {
    const data = this.load();
    if (!data.debugInvestigations) data.debugInvestigations = [];
    const idx = data.debugInvestigations.findIndex((inv) => inv.id === id);
    if (idx < 0) return null;
    data.debugInvestigations[idx] = {
      ...data.debugInvestigations[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save(data);
    return data.debugInvestigations[idx];
  }

  deleteDebugInvestigation(id: string, userId: string = "usr_default"): boolean {
    const data = this.load();
    if (!data.debugInvestigations) return false;
    const initialLen = data.debugInvestigations.length;
    data.debugInvestigations = data.debugInvestigations.filter(
      (inv) => !(inv.id === id && (inv.userId === userId || inv.userId === "usr_default"))
    );
    if (data.debugInvestigations.length !== initialLen) {
      this.save(data);
      return true;
    }
    return false;
  }

  // --- Phase 15: Debug Follow-Ups Operations ---
  getDebugFollowUps(investigationId: string): DbDebugFollowUp[] {
    const data = this.load();
    return (data.debugFollowUps || []).filter(
      (f) => f.investigationId === investigationId
    );
  }

  addDebugFollowUp(followUp: DbDebugFollowUp): DbDebugFollowUp {
    const data = this.load();
    if (!data.debugFollowUps) data.debugFollowUps = [];
    data.debugFollowUps.push(followUp);
    this.save(data);
    return followUp;
  }

  // --- Phase 16: Refactoring Proposals Operations ---
  getRefactoringProposals(
    userId: string = "usr_default",
    repositoryId?: string
  ): DbRefactoringProposal[] {
    const data = this.load();
    const proposals = data.refactoringProposals || [];
    return proposals.filter((p) => {
      const userMatches = p.userId === userId || p.userId === "usr_default";
      if (!userMatches) return false;
      if (repositoryId && p.repositoryId !== repositoryId) return false;
      return true;
    });
  }

  getRefactoringProposal(id: string, userId: string = "usr_default"): DbRefactoringProposal | null {
    const list = this.getRefactoringProposals(userId);
    return list.find((p) => p.id === id) || null;
  }

  saveRefactoringProposal(proposal: DbRefactoringProposal): DbRefactoringProposal {
    const data = this.load();
    if (!data.refactoringProposals) data.refactoringProposals = [];
    const idx = data.refactoringProposals.findIndex((p) => p.id === proposal.id);
    if (idx >= 0) {
      data.refactoringProposals[idx] = proposal;
    } else {
      data.refactoringProposals.unshift(proposal);
    }
    this.save(data);
    return proposal;
  }

  updateRefactoringProposal(
    id: string,
    updates: Partial<DbRefactoringProposal>
  ): DbRefactoringProposal | null {
    const data = this.load();
    if (!data.refactoringProposals) data.refactoringProposals = [];
    const idx = data.refactoringProposals.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    data.refactoringProposals[idx] = {
      ...data.refactoringProposals[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save(data);
    return data.refactoringProposals[idx];
  }

  deleteRefactoringProposal(id: string, userId: string = "usr_default"): boolean {
    const data = this.load();
    if (!data.refactoringProposals) return false;
    const initialLen = data.refactoringProposals.length;
    data.refactoringProposals = data.refactoringProposals.filter(
      (p) => !(p.id === id && (p.userId === userId || p.userId === "usr_default"))
    );
    if (data.refactoringProposals.length !== initialLen) {
      this.save(data);
      return true;
    }
    return false;
  }

  // --- Phase 19: AI Developer Agent Runs Operations ---
  getAgentRuns(
    userId: string = "usr_default",
    filter?: { repositoryId?: string; agentType?: string; status?: string }
  ): AgentRun[] {
    const data = this.load();
    const runs = data.agentRuns || [];
    return runs.filter((r) => {
      if (r.userId !== userId) return false;
      if (filter?.repositoryId && r.repositoryId !== filter.repositoryId) return false;
      if (filter?.agentType && r.agentType !== filter.agentType) return false;
      if (filter?.status && r.status !== filter.status) return false;
      return true;
    });
  }

  getAgentRun(id: string, userId: string = "usr_default"): AgentRun | null {
    const runs = this.getAgentRuns(userId);
    return runs.find((r) => r.id === id) || null;
  }

  saveAgentRun(run: AgentRun): AgentRun {
    const data = this.load();
    if (!data.agentRuns) data.agentRuns = [];
    const idx = data.agentRuns.findIndex((r) => r.id === run.id);
    if (idx >= 0) {
      data.agentRuns[idx] = run;
    } else {
      data.agentRuns.unshift(run);
    }
    this.save(data);
    return run;
  }

  updateAgentRun(id: string, updates: Partial<AgentRun>): AgentRun | null {
    const data = this.load();
    if (!data.agentRuns) data.agentRuns = [];
    const idx = data.agentRuns.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    data.agentRuns[idx] = {
      ...data.agentRuns[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save(data);
    return data.agentRuns[idx];
  }

  deleteAgentRun(id: string, userId: string = "usr_default"): boolean {
    const data = this.load();
    if (!data.agentRuns) return false;
    const initialLen = data.agentRuns.length;
    data.agentRuns = data.agentRuns.filter(
      (r) => !(r.id === id && r.userId === userId)
    );
    if (data.agentRuns.length !== initialLen) {
      this.save(data);
      return true;
    }
    return false;
  }
}

export const db = new DatabaseManager();
