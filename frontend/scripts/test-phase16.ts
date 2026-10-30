/**
 * CodeAtlas Phase 16 Verification Test Suite
 * Tests Code Quality Analysis Engine, Technical Debt Index & Formula,
 * Safe Refactoring Proposals (Extract Function, Simplify Conditionals, etc.),
 * AST-Aware Symbol Rename, Unified Patch Preview & Application,
 * Stale Revision Safety, Behavior-Preservation Validation, and Refactoring History.
 */

import assert from "assert";
import { db } from "../lib/server/db";
import { codeQualityEngine } from "../lib/server/code-quality-engine";
import { refactoringEngine } from "../lib/server/refactoring-engine";
import { DbRefactoringProposal } from "../types/refactoring";

async function runPhase16Tests() {
  console.log("\n=========================================================================");
  console.log("🚀 Starting CodeAtlas Phase 16 AI Code Refactoring & Technical Debt Tests");
  console.log("=========================================================================\n");

  const testUserId = "usr_phase16_tester";
  db.upsertUser({
    id: testUserId,
    email: "refactor@codeatlas.dev",
    name: "Phase 16 Refactoring Architect",
    createdAt: new Date().toISOString(),
  });

  // --- TEST 1: Code Quality Analysis Engine ---
  console.log("▶ TEST 1: Code Quality Analysis Engine & 10 Maintainability Categories");

  const debtOverview = codeQualityEngine.analyzeRepositoryDebt("sample-project");
  assert.ok(debtOverview, "Debt overview should be generated");
  assert.strictEqual(debtOverview.repositoryId, "sample-project");
  assert.ok(typeof debtOverview.compositeScore === "number", "Composite score should be a number");
  assert.ok(debtOverview.compositeScore >= 0 && debtOverview.compositeScore <= 100, "Composite score between 0-100");
  assert.ok(["A", "B", "C", "D", "F"].includes(debtOverview.debtRating), "Rating should be A-F");

  // Verify findings count
  assert.ok(debtOverview.findings.length > 0, "Should detect code quality findings in sample repository");
  assert.strictEqual(
    debtOverview.findingsCount.total,
    debtOverview.findings.length,
    "Findings total should match findings array length"
  );
  assert.strictEqual(
    debtOverview.findingsCount.critical + debtOverview.findingsCount.warning + debtOverview.findingsCount.info,
    debtOverview.findingsCount.total,
    "Severity counts sum must equal total"
  );

  // Verify distinction between verified AST metrics and heuristics
  const verifiedFindings = debtOverview.findings.filter((f) => f.isVerifiedMetric);
  const heuristicFindings = debtOverview.findings.filter((f) => !f.isVerifiedMetric);
  assert.ok(verifiedFindings.length > 0, "Must have verified AST metric findings");
  assert.ok(heuristicFindings.length > 0, "Must have pattern heuristic findings");

  for (const f of verifiedFindings) {
    assert.ok(f.lineRange, `Verified finding ${f.title} must have verified lineRange`);
    assert.ok(f.metricValue !== undefined, `Verified finding ${f.title} must have metricValue`);
    assert.ok(f.supportingEvidence.length > 0, `Verified finding ${f.title} must have supporting evidence`);
  }
  console.log(`  ✔ Verified ${debtOverview.findings.length} findings (${verifiedFindings.length} AST metrics, ${heuristicFindings.length} heuristics).`);

  // --- TEST 2: Deterministic Scoring Formula & Hotspots ---
  console.log("▶ TEST 2: Deterministic Technical Debt Scoring Formula & Complexity Hotspots");

  assert.ok(debtOverview.scoreFormula.includes("compositeScore = Math.max(0"), "Formula must be documented");

  // Verify Hotspots
  assert.ok(debtOverview.hotspots.length > 0, "Should detect complexity hotspots");
  const topHotspot = debtOverview.hotspots[0];
  assert.ok(topHotspot.complexityScore >= 1, "Hotspot complexity must be >= 1");
  assert.ok(topHotspot.lineCount > 0, "Hotspot lineCount must be > 0");
  assert.ok(topHotspot.filePath.length > 0, "Hotspot must have filePath");
  assert.ok(topHotspot.lineRange.start > 0, "Hotspot lineRange start > 0");

  // Verify Module Coupling Metrics
  assert.ok(debtOverview.couplingMetrics.length > 0, "Should calculate module coupling metrics");
  const authCoupling = debtOverview.couplingMetrics.find((m) => m.modulePath.includes("auth.ts"));
  assert.ok(authCoupling, "Coupling metrics should include auth.ts");
  assert.ok(typeof authCoupling?.fanOut === "number", "fanOut should be numeric");
  assert.ok(typeof authCoupling?.fanIn === "number", "fanIn should be numeric");
  assert.ok(typeof authCoupling?.couplingRatio === "number", "couplingRatio should be numeric");

  console.log(`  ✔ Score: ${debtOverview.compositeScore}/100 (Grade ${debtOverview.debtRating}). Top hotspot: ${topHotspot.symbolName || "module"} (complexity ${topHotspot.complexityScore}).`);

  // --- TEST 3: Safe Refactoring Proposal Engine (Extract Function) ---
  console.log("▶ TEST 3: Safe Refactoring Proposal Generation (Extract Function)");

  const proposal = await refactoringEngine.proposeRefactoring(
    {
      repositoryId: "sample-project",
      filePath: "src/services/auth.ts",
      symbolName: "loginUser",
      operation: "extract_function",
      customInstructions: "Extract token storage and validation into a separate helper.",
    },
    testUserId
  );

  assert.ok(proposal.id.startsWith("prop_"), "Proposal ID should start with prop_");
  assert.strictEqual(proposal.targetFile, "src/services/auth.ts");
  assert.strictEqual(proposal.operation, "extract_function");
  assert.ok(proposal.patchDiff.includes("--- a/src/services/auth.ts"), "Patch must have valid diff header");
  assert.ok(proposal.patchDiff.includes("+++ b/src/services/auth.ts"), "Patch must have valid diff header");
  assert.ok(proposal.expectedBenefits.length > 0, "Must list expected benefits");
  assert.ok(proposal.potentialRisks.length > 0, "Must list potential risks");
  assert.ok(proposal.unverifiedAssumptions.length > 0, "Must declare unverified assumptions");
  assert.strictEqual(proposal.isApplied, false, "Proposal must not be applied upon creation");

  // Change Impact Verification
  assert.ok(proposal.impactReport, "Proposal must include change impact report");
  assert.ok(["Low", "Medium", "High"].includes(proposal.impactReport.riskLevel), "Risk level must be Low/Medium/High");
  assert.ok(proposal.impactReport.affectedCallers.length > 0, "Should identify callers (LoginForm)");
  assert.ok(
    proposal.impactReport.affectedCallers.some((c) => c.name === "handleSubmit" || c.file.includes("LoginForm")),
    "Should identify handleSubmit in LoginForm as direct caller"
  );
  assert.ok(proposal.impactReport.affectedTests.length > 0, "Should discover related tests (auth.test.ts)");

  // Validation Checks
  assert.ok(proposal.validationResults.length >= 4, "Must contain at least 4 validation checks");
  const syntaxCheck = proposal.validationResults.find((c) => c.checkName.includes("Syntax"));
  assert.ok(syntaxCheck && syntaxCheck.status === "passed", "Syntax check should pass");
  const lineMatchCheck = proposal.validationResults.find((c) => c.checkName.includes("Line Match"));
  assert.ok(lineMatchCheck && lineMatchCheck.status === "passed", "Line match check should pass");

  console.log(`  ✔ Proposal synthesized: "${proposal.title}" (Risk: ${proposal.impactReport.riskLevel}, ${proposal.impactReport.affectedCallers.length} caller(s)).`);

  // --- TEST 4: Multiple Supported Refactoring Operations ---
  console.log("▶ TEST 4: Multiple Supported Refactoring Operations");

  const operations: Array<"simplify_conditionals" | "separate_responsibilities" | "improve_error_handling" | "reduce_duplication" | "improve_type_clarity"> = [
    "simplify_conditionals",
    "separate_responsibilities",
    "improve_error_handling",
    "reduce_duplication",
    "improve_type_clarity",
  ];

  for (const op of operations) {
    const p = await refactoringEngine.proposeRefactoring(
      {
        repositoryId: "sample-project",
        filePath: "src/services/auth.ts",
        symbolName: "loginUser",
        operation: op,
      },
      testUserId
    );
    assert.strictEqual(p.operation, op);
    assert.ok(p.patchDiff.length > 0, `Diff must be generated for ${op}`);
    assert.ok(p.expectedBenefits.length > 0, `Benefits must be provided for ${op}`);
  }
  console.log(`  ✔ Successfully generated proposals for all ${operations.length} operations.`);

  // --- TEST 5: Symbol-Aware Rename Workflow ---
  console.log("▶ TEST 5: Symbol-Aware Rename Workflow & Reference Resolution");

  const renamePreview = await refactoringEngine.previewSymbolRename({
    repositoryId: "sample-project",
    filePath: "src/services/auth.ts",
    symbolName: "loginUser",
    newSymbolName: "authenticateUser",
  });

  assert.strictEqual(renamePreview.symbolName, "loginUser");
  assert.strictEqual(renamePreview.newSymbolName, "authenticateUser");
  assert.strictEqual(renamePreview.declarationFile, "src/services/auth.ts");
  assert.strictEqual(renamePreview.isSupportedLanguage, true);
  assert.ok(renamePreview.totalReferences >= 2, "Should find declaration and call sites across repository");
  assert.ok(
    renamePreview.affectedFiles.some((f) => f.includes("LoginForm.tsx")),
    "Affected files must include LoginForm.tsx"
  );

  const astResolved = renamePreview.references.filter((r) => r.isResolvedAstReference);
  assert.ok(astResolved.length >= 2, "Must resolve declaration and caller via AST");

  console.log(`  ✔ Resolved ${renamePreview.totalReferences} references in ${renamePreview.affectedFiles.length} file(s).`);

  // --- TEST 6: Safe Patch Application with Pre-Patch Backup ---
  console.log("▶ TEST 6: Safe Patch Application with Mandatory Confirmation & Backup");

  // Save proposal to db
  db.saveRefactoringProposal(proposal);

  const initialAuthContent = db.getRepositoryFile("sample-project", "src/services/auth.ts")?.content || "";

  // 6a. Attempt apply without confirmation -> must reject
  let unconfirmedRejected = false;
  try {
    await refactoringEngine.applyProposal(proposal.id, false, testUserId);
  } catch (err: any) {
    unconfirmedRejected = true;
    assert.ok(err.message.includes("confirmation is required"), "Error message must state confirmation is required");
  }
  assert.strictEqual(unconfirmedRejected, true, "Must reject application without confirmation");

  // 6b. Apply with explicit confirmation
  const applyRes = await refactoringEngine.applyProposal(proposal.id, true, testUserId);
  assert.strictEqual(applyRes.success, true);
  assert.strictEqual(applyRes.proposal.isApplied, true);
  assert.strictEqual(applyRes.proposal.status, "applied");
  assert.ok(applyRes.proposal.backupContent, "Pre-patch backup must be created");

  // Verify file in repository was updated safely
  const updatedFile = db.getRepositoryFile("sample-project", "src/services/auth.ts");
  assert.ok(updatedFile, "File must exist in DB");
  assert.ok(
    updatedFile?.content.includes("persistSessionToken") || updatedFile?.content.includes(proposal.proposedSnippet.trim().split("\n")[0]),
    "Target file content must contain proposed refactoring"
  );
  console.log(`  ✔ Safe patch applied with automated pre-patch backup (${applyRes.proposal.backupContent?.length} bytes).`);

  // --- TEST 7: Stale Revision Safety ---
  console.log("▶ TEST 7: Stale Revision Detection & Abort Safety");

  // Generate a proposal for a file
  const staleProposal = await refactoringEngine.proposeRefactoring(
    {
      repositoryId: "sample-project",
      filePath: "src/services/auth.ts",
      symbolName: "logoutUser",
      operation: "improve_error_handling",
    },
    testUserId
  );
  db.saveRefactoringProposal(staleProposal);

  // Now simulate an external edit to auth.ts modifying the target lines
  const allRepoFiles = db.getRepositoryFiles("sample-project");
  const authIdx = allRepoFiles.findIndex((f) => f.path === "src/services/auth.ts");
  assert.ok(authIdx >= 0, "auth.ts must be in repo files");
  const preMutateContent = allRepoFiles[authIdx].content;
  allRepoFiles[authIdx].content = preMutateContent + "\n// External commit modifying revision\n";
  db.saveRepositoryFiles("sample-project", allRepoFiles);

  // Attempt to apply proposal with altered snippet
  staleProposal.originalSnippet = "COMPLETELY_DIFFERENT_CODE_LINE_NOT_IN_FILE";
  db.saveRefactoringProposal(staleProposal);

  let staleRejected = false;
  try {
    await refactoringEngine.applyProposal(staleProposal.id, true, testUserId);
  } catch (err: any) {
    staleRejected = true;
    assert.ok(err.message.includes("Source lines have changed"), "Should reject stale revision");
  }
  assert.strictEqual(staleRejected, true, "Applying patch on stale revision must be aborted");

  // Re-verify validation checks
  const valResult = await refactoringEngine.validateProposal(staleProposal.id, testUserId);
  assert.strictEqual(valResult.validationStatus, "stale_revision", "Validation status must reflect stale revision");
  console.log("  ✔ Stale revision detected correctly. Refactoring application safely aborted without code corruption.");

  // Restore file cleanly to initial fixture state
  allRepoFiles[authIdx].content = initialAuthContent;
  db.saveRepositoryFiles("sample-project", allRepoFiles);

  // --- TEST 8: Refactoring History, Status Workflow & Cross-User Isolation ---
  console.log("▶ TEST 8: Refactoring History, Status Updates & Cross-User Authorization");

  // List proposals for tester
  const userProposals = db.getRefactoringProposals(testUserId, "sample-project");
  assert.ok(userProposals.length >= 2, "User proposals should include saved proposals");

  // Status update
  const updatedProposal = db.updateRefactoringProposal(proposal.id, { status: "accepted" });
  assert.strictEqual(updatedProposal?.status, "accepted", "Proposal status updated to accepted");

  // Cross-user isolation: User B cannot delete or access User A's private proposals
  const otherUserId = "usr_phase16_other_developer";
  const otherList = db.getRefactoringProposals(otherUserId);
  // Default user proposals are visible, but other user shouldn't delete tester's proposal
  const deleteForbidden = db.deleteRefactoringProposal(proposal.id, otherUserId);
  assert.strictEqual(deleteForbidden, false, "Other user cannot delete proposal");

  // Test proposal deletion by owner
  const deleteSuccess = db.deleteRefactoringProposal(staleProposal.id, testUserId);
  assert.strictEqual(deleteSuccess, true, "Owner can delete their proposal");
  const postDelete = db.getRefactoringProposal(staleProposal.id, testUserId);
  assert.strictEqual(postDelete, null, "Deleted proposal should not exist");

  console.log("  ✔ Refactoring history, status workflow, and user isolation verified.");

  console.log("\n=========================================================================");
  console.log("🎉 ALL CODEATLAS PHASE 16 REFACTORING & TECHNICAL DEBT TESTS PASSED!");
  console.log("=========================================================================\n");
}

runPhase16Tests().catch((err) => {
  console.error("❌ Phase 16 Test Failure:", err);
  process.exit(1);
});
