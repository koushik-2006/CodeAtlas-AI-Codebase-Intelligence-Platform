/**
 * CodeAtlas Phase 15 Verification Test Suite
 * Tests AI Debugging, Multi-Runtime Stack-Trace Parsing, Source Resolution,
 * Evidence-Based Root-Cause Hypotheses, Fix Suggestions, Safe Patch Application,
 * Test-Driven Debugging, Investigation History, Follow-Ups, and Secret Redaction.
 */

import assert from "assert";
import { db } from "../lib/server/db";
import { parseStackTrace } from "../lib/server/stack-trace-parser";
import { debugEngine, redactSecrets } from "../lib/server/debug-engine";

async function runPhase15Tests() {
  console.log("\n=========================================================================");
  console.log("🚀 Starting CodeAtlas Phase 15 AI Debugging & Root-Cause Intelligence Tests");
  console.log("=========================================================================\n");

  const testUserId = "usr_phase15_tester";
  db.upsertUser({
    id: testUserId,
    email: "debugger@codeatlas.dev",
    name: "Phase 15 Debug Specialist",
    createdAt: new Date().toISOString(),
  });

  // --- TEST 1: Multi-Format Stack-Trace Parsing ---
  console.log("▶ TEST 1: Multi-Format Stack-Trace Parsing (Node.js, Python, Go, Java)");

  // 1a. Node.js / V8
  const nodeTrace = `TypeError: Cannot read properties of undefined (reading 'token')
    at loginUser (src/services/auth.ts:41:33)
    at handleSubmit (src/components/LoginForm.tsx:28:32)
    at Object.invoke (/app/node_modules/express/lib/router.js:45:10)`;
  const parsedNode = parseStackTrace(nodeTrace, { repositoryId: "sample-project" });
  assert.strictEqual(parsedNode.runtime, "nodejs", "Should detect Node.js runtime");
  assert.strictEqual(parsedNode.errorType, "TypeError", "Should extract TypeError");
  assert.strictEqual(parsedNode.errorMessage, "Cannot read properties of undefined (reading 'token')");
  assert.strictEqual(parsedNode.frames.length, 3, "Should extract 3 frames");
  assert.strictEqual(parsedNode.frames[0].isVerified, true, "First frame in auth.ts should be verified");
  assert.strictEqual(parsedNode.frames[2].isExternal, true, "node_modules frame should be marked external");

  // 1b. Python
  const pyTrace = `Traceback (most recent call last):
  File "/app/services/auth.py", line 42, in generate_token
    return jwt.encode(payload, secret)
KeyError: 'secret'`;
  const parsedPy = parseStackTrace(pyTrace);
  assert.strictEqual(parsedPy.runtime, "python", "Should detect Python runtime");
  assert.strictEqual(parsedPy.errorType, "KeyError", "Should extract KeyError");
  assert.strictEqual(parsedPy.errorMessage, "'secret'");
  assert.strictEqual(parsedPy.frames.length, 1);
  assert.strictEqual(parsedPy.frames[0].functionName, "generate_token");

  // 1c. Go
  const goTrace = `panic: runtime error: invalid memory address or nil pointer dereference
[signal SIGSEGV: code=0x1 addr=0x0 pc=0x10a2b4]
main.ProcessSession(0x0)
    /go/src/app/services/session.go:28 +0x3a
main.main()
    /go/src/app/main.go:14 +0x24`;
  const parsedGo = parseStackTrace(goTrace);
  assert.strictEqual(parsedGo.runtime, "go", "Should detect Go runtime");
  assert.strictEqual(parsedGo.frames.length, 2, "Should extract 2 Go frames");

  // 1d. Java
  const javaTrace = `java.lang.NullPointerException: Cannot invoke "String.length()" because "secret" is null
    at com.example.service.AuthService.generateToken(AuthService.java:42)
    at com.example.controller.AuthController.login(AuthController.java:25)`;
  const parsedJava = parseStackTrace(javaTrace);
  assert.strictEqual(parsedJava.runtime, "java", "Should detect Java runtime");
  assert.strictEqual(parsedJava.frames.length, 2, "Should extract 2 Java frames");

  console.log("  ✔ Multi-runtime stack traces parsed with high fidelity.");

  // --- TEST 2: Source Verification & Line Bounds Checks ---
  console.log("\n▶ TEST 2: Source Resolution & Line Bounds Validation");
  const outOfBoundsTrace = `TypeError: Invalid index access\n    at loginUser (src/services/auth.ts:9999:10)`;
  const parsedOutOfBounds = parseStackTrace(outOfBoundsTrace, { repositoryId: "sample-project" });
  assert.strictEqual(parsedOutOfBounds.frames[0].isVerified, false, "Frame exceeding file lineCount must NOT be verified");
  assert.ok(parsedOutOfBounds.frames[0].unresolvedReason?.includes("outside source bounds"), "Should explain line bounds error");

  const nonexistentTrace = `Error: Missing file\n    at testFunc (src/services/missing_module.ts:10:5)`;
  const parsedNonexistent = parseStackTrace(nonexistentTrace, { repositoryId: "sample-project" });
  assert.strictEqual(parsedNonexistent.frames[0].isVerified, false, "Nonexistent file must NOT be verified");
  assert.ok(parsedNonexistent.frames[0].unresolvedReason?.includes("not found in indexed repository"));

  console.log("  ✔ Line bounds and missing source files correctly identified without fabricating matches.");

  // --- TEST 3: Revision Mismatch Warning ---
  console.log("\n▶ TEST 3: Revision Mismatch Detection");
  const mismatched = parseStackTrace(nodeTrace, {
    repositoryId: "sample-project",
    revision: "v1.0.0-outdated-commit",
  });
  assert.strictEqual(mismatched.hasRevisionMismatchWarning, true, "Should flag revision mismatch");
  assert.ok(mismatched.revisionWarningMessage?.includes("v1.0.0-outdated-commit"), "Should explain revision difference");
  console.log("  ✔ Revision mismatch warnings generated correctly.");

  // --- TEST 4: Standalone Debugging (No Repository Connection) ---
  console.log("\n▶ TEST 4: Standalone Debugging Mode");
  const standaloneInv = await debugEngine.investigate(
    {
      errorMessage: "ReferenceError: activeSession is not defined",
      stackTrace: `ReferenceError: activeSession is not defined
    at authenticate (client.js:52:12)`,
      actualBehavior: "Client crashes on page load with uncaught ReferenceError",
      expectedBehavior: "Default to anonymous guest session",
    },
    testUserId
  );
  assert.strictEqual(standaloneInv.mode, "standalone", "Should operate in standalone mode");
  assert.ok(standaloneInv.hypotheses.length > 0, "Should generate standalone hypotheses");
  assert.ok(standaloneInv.suggestedFixes.length > 0, "Should generate general fix guidance");
  assert.ok(standaloneInv.testRecommendations.length > 0, "Should generate test suggestions");
  console.log("  ✔ Standalone error investigation completed successfully without requiring repository.");

  // --- TEST 5: Repository-Grounded Investigation ---
  console.log("\n▶ TEST 5: Repository-Grounded Root-Cause Investigation");
  const repoInv = await debugEngine.investigate(
    {
      repositoryId: "sample-project",
      errorMessage: "TypeError: Cannot read properties of undefined (reading 'token')",
      stackTrace: `TypeError: Cannot read properties of undefined (reading 'token')
    at loginUser (src/services/auth.ts:41:33)
    at handleSubmit (src/components/LoginForm.tsx:28:32)`,
      expectedBehavior: "Expected loginUser to reject with descriptive message on 401 response",
      actualBehavior: "Uncaught TypeError crashed LoginForm",
      logs: "[AUTH] POST /api/v1/auth/session returned 200 with missing token property",
    },
    testUserId
  );
  assert.strictEqual(repoInv.mode, "repository_grounded");
  assert.strictEqual(repoInv.parsedTrace?.verifiedFramesCount, 2, "Both frames should be verified");
  assert.ok(repoInv.hypotheses.length >= 2, "Should generate multiple ranked hypotheses");

  // Check fact vs hypothesis separation
  const topHyp = repoInv.hypotheses[0];
  assert.ok(topHyp.supportingEvidence.length > 0, "Hypothesis must contain supporting evidence");
  assert.ok(topHyp.counterEvidence.length > 0, "Hypothesis must contain counter evidence");
  assert.ok(topHyp.suggestedSteps.length > 0, "Hypothesis must suggest actionable investigation steps");
  assert.ok(["high", "medium", "low"].includes(topHyp.likelihood), "Likelihood must be high/medium/low without fake percentages");

  // Check relationship linking
  assert.ok(topHyp.relatedSymbols !== undefined, "Should explore symbol relationships");
  console.log("  ✔ Repository-grounded investigation assembled observed facts and ranked hypotheses.");

  // --- TEST 6: Fix Suggestion Engine & Diff Validation ---
  console.log("\n▶ TEST 6: Fix Suggestion Engine & Minimal Diff Generation");
  assert.ok(repoInv.suggestedFixes.length > 0, "Must provide at least one grounded fix suggestion");
  const primaryFix = repoInv.suggestedFixes[0];
  assert.strictEqual(primaryFix.validationStatus, "validated", "Fix should validate against repository lines");
  assert.ok(primaryFix.patchDiff.includes("--- a/src/services/auth.ts"), "Diff must be unified format");
  assert.ok(primaryFix.potentialSideEffects.length > 0, "Must document potential side effects");
  assert.ok(primaryFix.assumptions.length > 0, "Must document verification assumptions");
  console.log("  ✔ Fix suggestion generated grounded diff and passed line validation.");

  // --- TEST 7: Safe Patch Preview & Safe Application ---
  console.log("\n▶ TEST 7: Safe Patch Preview & Application Security");
  // Refuses application without confirmation
  try {
    await debugEngine.applyPatch(repoInv.id, primaryFix.id, false, testUserId);
    assert.fail("Should throw when confirmation is false");
  } catch (err: any) {
    assert.ok(err.message.includes("confirmation is required"), "Must block unconfirmed application");
  }

  // Applies safely with confirmation
  const applyRes = await debugEngine.applyPatch(repoInv.id, primaryFix.id, true, testUserId);
  assert.strictEqual(applyRes.success, true, "Patch should apply successfully");
  assert.strictEqual(applyRes.fix.isApplied, true, "Fix must be marked applied");
  assert.ok(applyRes.fix.backupContent, "Must retain pre-patch backup of source file");

  // Verify file in db was updated
  const updatedFile = db.getRepositoryFile("sample-project", "src/services/auth.ts");
  assert.ok(updatedFile?.content.includes("Defensive guard added to prevent null/undefined"), "File content must reflect patch");

  // Restore file content from backup for test hygiene
  if (applyRes.fix.backupContent) {
    const allFiles = db.getRepositoryFiles("sample-project");
    const fIdx = allFiles.findIndex((f) => f.path === "src/services/auth.ts");
    if (fIdx >= 0) {
      allFiles[fIdx].content = applyRes.fix.backupContent;
      db.saveRepositoryFiles("sample-project", allFiles);
    }
  }
  console.log("  ✔ Safe patch execution validated with mandatory confirmation and pre-patch backup.");

  // --- TEST 8: Test-Driven Debugging ---
  console.log("\n▶ TEST 8: Test-Driven Debugging & Framework-Aligned Recommendations");
  assert.ok(repoInv.testRecommendations.length > 0, "Must have test recommendations");
  const discoveredTest = repoInv.testRecommendations.find((t) => t.isExistingTest);
  assert.ok(discoveredTest, "Should discover existing test in sample repository");
  assert.strictEqual(discoveredTest?.status, "discovered");

  const suggestedTest = repoInv.testRecommendations.find((t) => !t.isExistingTest);
  assert.ok(suggestedTest, "Should suggest regression test");
  assert.strictEqual(suggestedTest?.status, "suggested");
  assert.ok(suggestedTest?.testCode.includes("describe(") || suggestedTest?.testCode.includes("it("));
  console.log("  ✔ Test-driven debugging discovered existing test and suggested framework regression tests.");

  // --- TEST 9: Context-Aware Follow-Up Q&A ---
  console.log("\n▶ TEST 9: Context-Aware Follow-Up Q&A");
  const followUp1 = await debugEngine.askFollowUp(
    repoInv.id,
    "Why is line 193 in src/services/auth.ts failing?",
    testUserId
  );
  assert.strictEqual(followUp1.sender, "assistant");
  assert.ok(followUp1.content.length > 20, "Should generate substantive answer");
  assert.ok(followUp1.citedReferences && followUp1.citedReferences.length > 0, "Must cite verified source locations");

  const followUp2 = await debugEngine.askFollowUp(
    repoInv.id,
    "Which callers invoke loginUser?",
    testUserId
  );
  assert.strictEqual(followUp2.sender, "assistant");
  assert.ok(followUp2.content.includes("handleSubmit"), "Must identify handleSubmit caller from architecture graph");
  console.log("  ✔ Context-aware follow-up Q&A answered questions with symbol citations.");

  // --- TEST 10: Investigation History, Status & Deletion ---
  console.log("\n▶ TEST 10: Investigation History Persistence, Filtering & Status Updates");
  const historyList = db.getDebugInvestigations(testUserId);
  assert.ok(historyList.some((h) => h.id === repoInv.id), "Investigation must be persisted in history");

  // Update status: mark hypothesis investigated
  const updatedHyp = db.updateDebugInvestigation(repoInv.id, {
    status: "root_cause_confirmed",
    confirmedRootCauseId: "hyp_1",
    confirmedRootCauseSummary: "Confirmed missing token in auth API response payload.",
  });
  assert.strictEqual(updatedHyp?.status, "root_cause_confirmed");
  assert.strictEqual(updatedHyp?.confirmedRootCauseId, "hyp_1");

  // Delete test investigation
  const deleted = db.deleteDebugInvestigation(repoInv.id, testUserId);
  assert.strictEqual(deleted, true, "Investigation should be deleted successfully");
  const postDelete = db.getDebugInvestigation(repoInv.id, testUserId);
  assert.strictEqual(postDelete, null, "Deleted investigation must not be retrievable");

  // Clean up standalone test investigation
  db.deleteDebugInvestigation(standaloneInv.id, testUserId);
  console.log("  ✔ Investigation history persistence, status updates, and deletion verified.");

  // --- TEST 11: Security & Sensitive Secret Redaction ---
  console.log("\n▶ TEST 11: Security & Sensitive Secret Redaction");
  const dummyAwsKey = ["AKIA", "IOSFODNN7EXAMPLE"].join("");
  const dummyGhp = ["ghp", "1234567890abcdefghijklmnopqrstuvwxyz1234"].join("_");
  const leakedString = `Error at api.ts: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThis
Authorization: Bearer my-secret-api-key-1234567890
AWS Key: ${dummyAwsKey}
GitHub: ${dummyGhp}
Password: "mySuperSecretPassword123"`;

  const redacted = redactSecrets(leakedString);
  assert.ok(!redacted.includes("eyJhbGci"), "JWT token must be redacted");
  assert.ok(!redacted.includes("my-secret-api-key"), "Bearer token must be redacted");
  assert.ok(!redacted.includes(dummyAwsKey), "AWS key must be redacted");
  assert.ok(!redacted.includes(dummyGhp), "GitHub token must be redacted");
  assert.ok(!redacted.includes("mySuperSecretPassword123"), "Password must be redacted");
  assert.ok(redacted.includes("[REDACTED_JWT]"), "Should place [REDACTED_JWT] marker");
  assert.ok(redacted.includes("[REDACTED_AWS_KEY]"), "Should place [REDACTED_AWS_KEY] marker");
  console.log("  ✔ Sensitive tokens and secrets proactively redacted prior to processing.");

  console.log("\n=========================================================================");
  console.log("🎉 ALL PHASE 15 TESTS PASSED SUCCESSFULLY! (11/11 Suites)");
  console.log("=========================================================================\n");
}

runPhase15Tests().catch((err) => {
  console.error("\n❌ Phase 15 Test Suite Failed:", err);
  process.exit(1);
});
