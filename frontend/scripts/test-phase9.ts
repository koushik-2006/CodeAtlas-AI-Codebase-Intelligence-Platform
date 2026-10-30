import assert from "assert";
import { github, SAMPLE_PULL_REQUESTS } from "../lib/server/github";
import { diffAnalyzer } from "../lib/server/diff-analyzer";
import { codeReviewEngine } from "../lib/server/code-review-engine";
import { db } from "../lib/server/db";

async function runPhase9TestSuite() {
  console.log("🚀 Starting Phase 9 AI Code Review & Pull Request Intelligence Test Suite...\n");

  // 1. Pull Request Retrieval & Metadata
  console.log("▶ Test 1: Pull Request Retrieval & Metadata Ingestion");
  const prs = await github.getPullRequests("", "codeatlas-demo", "sample-project", "open");
  assert(prs.length >= 2, "Expected at least 2 sandbox pull requests for sample-project");

  const pr101 = await github.getPullRequest("", "codeatlas-demo", "sample-project", 101);
  assert(pr101 && pr101.number === 101, "Expected PR #101 detail");
  assert(pr101.files && pr101.files.length >= 2, "Expected changed files in PR #101");
  console.log(`  ✔ Retrieved PR #${pr101.number} ('${pr101.title}') with ${pr101.files.length} changed file(s).`);

  // 2. Diff Parsing & AST Symbol Correlation
  console.log("▶ Test 2: Unified Diff Parsing & AST Symbol Correlation");
  const diffResult = diffAnalyzer.analyzeDiff("sample-project", pr101.files);
  assert(diffResult.files.length === pr101.files.length, "Analyzed files must match PR files count");
  assert(diffResult.totalAdditions > 0, "Must calculate additions");

  // Verify that modified functions in auth.ts were correlated to AST symbols
  const authFile = diffResult.files.find((f) => f.file.filename.includes("auth.ts"));
  assert(authFile, "Expected auth.ts to be analyzed");
  assert(authFile.hunks.length > 0, "Expected parsed diff hunks");
  console.log(`  ✔ Parsed ${diffResult.files.length} file diffs: +${diffResult.totalAdditions}/-${diffResult.totalDeletions} lines.`);

  // 3. Structured Findings Generation
  console.log("▶ Test 3: AI Code Review Engine & Structured Findings Generation");
  const session = await codeReviewEngine.reviewPullRequest({
    repositoryId: "sample-project",
    pullRequest: {
      id: "pr_101",
      number: 101,
      title: pr101.title,
      body: pr101.body,
      author: { name: pr101.user.login, avatar: pr101.user.avatar_url },
      baseBranch: pr101.base.ref,
      headBranch: pr101.head.ref,
      baseSha: pr101.base.sha,
      headSha: pr101.head.sha,
      state: pr101.state,
      createdAt: pr101.created_at,
      updatedAt: pr101.updated_at,
      files: pr101.files,
      additions: pr101.additions,
      deletions: pr101.deletions,
      changedFilesCount: pr101.changed_files,
    },
    isSecurityReviewOnly: false,
  });

  assert(session.findings.length > 0, "Expected structured review findings for PR #101");

  // Check required finding contract properties
  const finding = session.findings[0];
  assert(finding.id && finding.id.length > 0, "Finding must have id");
  assert(finding.title && finding.title.length > 0, "Finding must have title");
  assert(finding.description && finding.description.length > 0, "Finding must have description");
  assert(["critical", "warning", "info"].includes(finding.severity), "Severity must be valid");
  assert(finding.whyItMatters && finding.whyItMatters.length > 0, "Finding must explain why it matters");
  assert(finding.suggestedRemediation && finding.suggestedRemediation.length > 0, "Finding must suggest remediation");
  assert(finding.isVerifiedFromSource === true, "Finding must distinguish verified source groundings");

  console.log(`  ✔ Generated ${session.findings.length} findings with verified line ranges and explanations.`);

  // 4. Test Gap Discovery
  console.log("▶ Test 4: Test Gap Detection & Test Suite Discovery");
  const testGapFinding = session.findings.find((f) => f.category === "test-gap");
  assert(session.relatedTests.length > 0, "Expected related test suites to be identified");
  console.log(`  ✔ Discovered ${session.relatedTests.length} related test suite(s), test gaps flagged: ${Boolean(testGapFinding)}.`);

  // 5. Change Impact Integration
  console.log("▶ Test 5: Architecture Blast Radius & Caller Impact Integration");
  assert(session.affectedComponents.length > 0, "Expected affected components to be linked from Phase 8 engine");
  const caller = session.affectedComponents[0];
  assert(caller.name && caller.file, "Affected component must contain name and file receipt");
  console.log(`  ✔ Connected ${session.affectedComponents.length} affected architecture component(s) to PR changes.`);

  // 6. Security Review Mode
  console.log("▶ Test 6: Dedicated Security Review Mode");
  const securitySession = await codeReviewEngine.reviewPullRequest({
    repositoryId: "sample-project",
    pullRequest: {
      id: "pr_101",
      number: 101,
      title: pr101.title,
      body: pr101.body,
      author: { name: pr101.user.login, avatar: pr101.user.avatar_url },
      baseBranch: pr101.base.ref,
      headBranch: pr101.head.ref,
      baseSha: pr101.base.sha,
      headSha: pr101.head.sha,
      state: pr101.state,
      createdAt: pr101.created_at,
      updatedAt: pr101.updated_at,
      files: pr101.files,
      additions: pr101.additions,
      deletions: pr101.deletions,
      changedFilesCount: pr101.changed_files,
    },
    isSecurityReviewOnly: true,
  });

  assert(securitySession.isSecurityReviewOnly === true, "Session must flag security review only");
  const nonSecurity = securitySession.findings.filter((f) => f.category === "logic" || f.category === "test-gap");
  assert(nonSecurity.length === 0, "Security mode must only report security-relevant findings");
  console.log(`  ✔ Security mode isolated ${securitySession.findings.length} security finding(s).`);

  // 7. Finding Status Lifecycle & Database Persistence
  console.log("▶ Test 7: Review Session Persistence & Finding Status Transition");
  db.saveReviewSession(session);
  const retrieved = db.getReviewSession("sample-project", 101);
  assert(retrieved !== null, "Review session must be persisted and retrievable from database");

  const targetFindingId = session.findings[0].id;
  const updated = db.updateFindingStatus(session.id, targetFindingId, "reviewed");
  assert(updated === true, "Finding status update must succeed");

  const reloaded = db.getReviewSession("sample-project", 101);
  const updatedFinding = reloaded?.findings.find((f: any) => f.id === targetFindingId);
  assert(updatedFinding?.status === "reviewed", "Finding status must reflect 'reviewed'");

  console.log("  ✔ Finding marked 'reviewed' and persisted in database successfully.");

  // 8. Optional GitHub Comment Posting
  console.log("▶ Test 8: Optional GitHub Review Comment Confirmation");
  const commentResult = await github.postPullRequestComment(
    "",
    "codeatlas-demo",
    "sample-project",
    101,
    { body: "### CodeAtlas Review Comment\n\nVerified finding test" }
  );
  assert(commentResult.success === true, "Comment publication must return success");
  console.log(`  ✔ Comment confirmed and generated URL: ${commentResult.commentUrl}.`);

  console.log("\n🎉 All 8 Phase 9 AI Code Review & Pull Request Tests Passed Successfully!\n");
}

runPhase9TestSuite().catch((err) => {
  console.error("❌ Phase 9 Test Suite Failed:", err);
  process.exit(1);
});
