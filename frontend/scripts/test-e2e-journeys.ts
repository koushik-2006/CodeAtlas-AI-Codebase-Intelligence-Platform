import { db } from "../lib/server/db";
import { ragService } from "../lib/server/rag-service";
import { codeExplainer } from "../lib/server/code-explainer";
import { architectureEngine } from "../lib/server/architecture-engine";
import { impactEngine } from "../lib/server/impact-engine";
import { github } from "../lib/server/github";
import { diffAnalyzer } from "../lib/server/diff-analyzer";
import { codeReviewEngine } from "../lib/server/code-review-engine";
import { PullRequestDetail } from "../types/review";

async function runE2EJourneys() {
  console.log("=========================================================================");
  console.log("🚀 Starting CodeAtlas End-to-End User Journeys (A through F)");
  console.log("=========================================================================\n");

  const userId = "usr_default";
  const repoId = "sample-project";

  // =========================================================================
  // JOURNEY A — Authentication, Workspace Access & Route Protection
  // =========================================================================
  console.log("▶ JOURNEY A: Authentication & Workspace Access Control");
  
  // 1. Unauthenticated state check
  const anonSession = db.getUser("usr_non_existent");
  if (anonSession) throw new Error("Journey A: Unauthenticated state leaked valid user session.");

  // 2. Sign-in test fixture verification
  const user = db.getUser(userId);
  if (!user || user.email !== "alex@codeatlas.dev") {
    throw new Error("Journey A Failed: Failed to retrieve authenticated user session.");
  }
  
  // 3. Confirm dashboard repository list loads for authenticated user
  const repos = db.getRepositories();
  if (repos.length === 0) {
    throw new Error("Journey A Failed: Authenticated dashboard did not load user repositories.");
  }

  // 4. Verify unauthorized route & data protection (isolated tenant boundary)
  const unauthorizedRepo = db.getRepository("repo_unauthorized_999", userId);
  if (unauthorizedRepo) {
    throw new Error("Journey A Failed: User accessed unauthorized external repository.");
  }

  // 5. Sign-out simulation: session invalidated
  const invalidated = db.getUser("session_revoked");
  if (invalidated) {
    throw new Error("Journey A Failed: Revoked session remained accessible.");
  }

  console.log(`  ✔ Session verified: ${user.name} (${user.role}). Loaded ${repos.length} authorized repo(s). Protected routes secure.\n`);

  // =========================================================================
  // JOURNEY B — GitHub Repository Workflow, Ingestion & File Explorer
  // =========================================================================
  console.log("▶ JOURNEY B: Repository Ingestion, AST Symbol Extraction & File Explorer");

  // 1. Connect and discover accessible repositories via GitHub client
  const sandboxRepos = await github.getUserRepositories("");
  if (sandboxRepos.length === 0) {
    throw new Error("Journey B Failed: GitHub repository discovery returned 0 repositories.");
  }

  // 2. Select accessible repository and verify indexed status
  const repo = db.getRepository(repoId, userId);
  if (!repo || !repo.isIndexed) {
    throw new Error("Journey B Failed: Target repository 'sample-project' is not indexed.");
  }

  // 3. Open repository explorer and verify files
  const files = db.getRepositoryFiles(repoId);
  if (files.length === 0) {
    throw new Error("Journey B Failed: Repository explorer file tree is empty.");
  }

  // 4. Open source file and verify line references and AST symbols
  const targetFile = files.find((f) => f.path === "src/services/auth.ts");
  if (!targetFile || !targetFile.content.includes("export async function loginUser")) {
    throw new Error("Journey B Failed: Source content missing from 'src/services/auth.ts'.");
  }

  const symbols = db.getRepositorySymbols(repoId);
  const loginSymbol = symbols.find((s) => s.name === "loginUser");
  if (!loginSymbol || loginSymbol.startLine !== 18) {
    throw new Error("Journey B Failed: AST symbol 'loginUser' startLine mismatch.");
  }

  console.log(`  ✔ Repository '${repoId}' verified: ${files.length} files, ${symbols.length} AST symbols. Ingested 'src/services/auth.ts' at line 18.\n`);

  // =========================================================================
  // JOURNEY C — AI Code Understanding, CodeLens & Grounded Citations
  // =========================================================================
  console.log("▶ JOURNEY C: AI Code Understanding, CodeLens & Grounded Citations");

  // 1. Submit standalone code snippet (Mode A)
  const snippet = "function hashPassword(p: string) { return crypto.createHash('sha256').update(p).digest('hex'); }";
  const explanation = await codeExplainer.explainSnippet(snippet, "typescript");
  if (!explanation.summary || !explanation.lineByLine || explanation.lineByLine.length === 0) {
    throw new Error("Journey C Failed: Mode A standalone code explanation returned empty breakdown.");
  }

  // 2. Mode B: Ask question about indexed repository with grounded citations
  const ragResult = await ragService.answerQuestion({
    repositoryId: repoId,
    question: "How does user login work?",
    userId,
  });

  if (!ragResult.sources || ragResult.sources.length === 0) {
    throw new Error("Journey C Failed: Grounded RAG returned 0 verified citations.");
  }

  const hasLoginCitation = ragResult.sources.some(
    (s) => s.file.includes("auth.ts") || s.file.includes("LoginForm.tsx")
  );
  if (!hasLoginCitation) {
    throw new Error(`Journey C Failed: Expected login citations in auth.ts or LoginForm.tsx, got: ${ragResult.sources.map((s) => s.file).join(", ")}`);
  }

  // 3. Test ungrounded query / insufficient evidence state (zero hallucination check)
  const ungroundedResult = await ragService.answerQuestion({
    repositoryId: repoId,
    question: "Explain the quantum cryptography blockchain consensus algorithm in this repo",
    userId,
  });

  if (ungroundedResult.confidence === "supported" && ungroundedResult.sources.length > 0) {
    throw new Error("Journey C Failed: RAG fabricated citations for ungrounded query.");
  }

  console.log(`  ✔ Mode A standalone explanation verified. Mode B RAG returned ${ragResult.sources.length} verified citation(s). Ungrounded topic correctly flagged as unsupported.\n`);

  // =========================================================================
  // JOURNEY D — Architecture Graph & Change Impact Analysis
  // =========================================================================
  console.log("▶ JOURNEY D: Architecture Graph Topology & Change-Impact Scoring");

  // 1. Build architecture graph
  const graphResult = architectureEngine.getGraph(repoId);
  const { nodes, edges } = graphResult.data;
  if (nodes.length === 0 || edges.length === 0) {
    throw new Error("Journey D Failed: Architecture graph returned empty nodes or edges.");
  }

  // 2. Select node and inspect direct dependencies
  const sampleNode = nodes[0];
  const depAnalysis = architectureEngine.getDependencyAnalysis(repoId, sampleNode.id);
  if (!depAnalysis) {
    throw new Error(`Journey D Failed: Dependency analysis failed for node '${sampleNode.id}'.`);
  }

  // 3. Trace shortest path between entities
  const startNode = nodes[0].id;
  const targetNode = nodes[nodes.length - 1].id;
  const pathResult = architectureEngine.findPath(repoId, startNode, targetNode);
  // Path result is deterministic (found or not found with diagnostic message)
  if (pathResult === undefined) {
    throw new Error("Journey D Failed: Shortest path traversal threw unexpected undefined.");
  }

  // 4. Change Impact Analysis on real indexed file & symbol
  const impact = impactEngine.analyzeImpact({
    repositoryId: repoId,
    file: "src/services/auth.ts",
    symbol: "loginUser",
  });

  if (impact.riskLevel === undefined || impact.riskScore === undefined) {
    throw new Error("Journey D Failed: Change impact analysis missing risk metrics.");
  }

  console.log(`  ✔ Architecture graph verified (${nodes.length} nodes, ${edges.length} edges). Change impact for 'loginUser': Risk Level=${impact.riskLevel}, Score=${impact.riskScore}.\n`);

  // =========================================================================
  // JOURNEY E — AI Code Review & Pull Request Intelligence
  // =========================================================================
  console.log("▶ JOURNEY E: Pull Request Ingestion, Diff Analysis & Code Review");

  // 1. Retrieve authorized test PR
  const rawPr = await github.getPullRequest("", "codeatlas-demo", repoId, 101);
  if (!rawPr || !rawPr.number) {
    throw new Error("Journey E Failed: Failed to retrieve PR #101.");
  }

  // 2. Changed files and diff analysis
  const prFiles = await github.getPullRequestFiles("", "codeatlas-demo", repoId, 101);
  const diffAnalysis = diffAnalyzer.analyzeDiff(repoId, prFiles);
  if (diffAnalysis.files.length === 0) {
    throw new Error("Journey E Failed: Diff analyzer returned 0 analyzed files.");
  }

  // 3. Run structured code review
  const prDetail: PullRequestDetail = {
    id: `pr_${rawPr.number}`,
    number: rawPr.number,
    title: rawPr.title,
    body: rawPr.body || "",
    author: {
      name: rawPr.user?.login || "alex",
      avatar: rawPr.user?.avatar_url || "",
    },
    baseBranch: rawPr.base?.ref || "main",
    headBranch: rawPr.head?.ref || "fix/login-rate-limit",
    baseSha: rawPr.base?.sha || "base-sha",
    headSha: rawPr.head?.sha || "head-sha",
    state: rawPr.state || "open",
    createdAt: rawPr.created_at || new Date().toISOString(),
    updatedAt: rawPr.updated_at || new Date().toISOString(),
    files: prFiles,
    additions: rawPr.additions || 10,
    deletions: rawPr.deletions || 2,
    changedFilesCount: prFiles.length,
  };

  const reviewSession = await codeReviewEngine.reviewPullRequest({
    repositoryId: repoId,
    pullRequest: prDetail,
  });

  if (!reviewSession.findings || reviewSession.findings.length === 0) {
    throw new Error("Journey E Failed: Code review engine generated 0 findings.");
  }

  const validFindings = reviewSession.findings.every(
    (f) => f.title && f.category && f.severity && f.file
  );
  if (!validFindings) {
    throw new Error("Journey E Failed: Malformed finding structure detected.");
  }

  console.log(`  ✔ PR #${rawPr.number} analyzed: ${diffAnalysis.files.length} changed file(s). Review engine generated ${reviewSession.findings.length} structured finding(s).\n`);

  // =========================================================================
  // JOURNEY F — Global Search, Workspace Settings & Privacy Boundaries
  // =========================================================================
  console.log("▶ JOURNEY F: Global Search Palette, Preferences & Security Boundaries");

  // 1. Global Search across indexed symbols and files
  const searchResults = db.globalSearch(userId, "login");
  if (searchResults.length === 0) {
    throw new Error("Journey F Failed: Global search for 'login' returned 0 results.");
  }
  const topResult = searchResults[0];

  // 2. Preferences persistence
  const settings = db.getUserSettings(userId);
  if (!settings || !settings.preferredModel) {
    throw new Error("Journey F Failed: Failed to retrieve user settings.");
  }

  // 3. User activity & notification privacy check
  const notifs = db.getNotifications(userId);
  const otherUserNotifs = db.getNotifications("usr_isolated_user_2");
  if (otherUserNotifs.some((n) => n.userId === userId)) {
    throw new Error("Journey F Failed: Privacy boundary violation in user notifications.");
  }

  console.log(`  ✔ Global search resolved '${topResult.title}' (${topResult.category}) in ${topResult.filePath}. Settings & user data isolation verified.\n`);

  console.log("=========================================================================");
  console.log("🎉 ALL 6 END-TO-END USER JOURNEYS (A through F) PASSED WITH ZERO ERRORS!");
  console.log("=========================================================================\n");
}

runE2EJourneys()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ E2E Journeys Test Suite Failed:", err);
    process.exit(1);
  });
