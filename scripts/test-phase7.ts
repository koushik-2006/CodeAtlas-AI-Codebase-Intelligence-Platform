import assert from "assert";
import { ragService } from "../lib/server/rag-service";
import { codeExplainer } from "../lib/server/code-explainer";
import { workflowTracer } from "../lib/server/workflow-tracer";
import { aiProvider } from "../lib/server/ai-provider";
import { db } from "../lib/server/db";

async function runPhase7Tests() {
  console.log("🚀 Starting Phase 7 Grounded AI, RAG & OCR Test Suite...\n");

  // Test 1: Grounded RAG Retrieval & Source Citations
  console.log("▶ Test 1: Grounded RAG Retrieval on Indexed Codebase");
  const ragResult = await ragService.answerQuestion({
    repositoryId: "sample-project",
    question: "Where does authentication happen and which function verifies the password?",
    userId: "usr_default",
  });

  assert(ragResult.sources.length > 0, "RAG should return verified source citations");
  assert(
    ragResult.sources.some((s) => s.file === "src/services/auth.ts" || s.file === "src/components/LoginForm.tsx"),
    "Citations must point to real source files in sample-project"
  );
  assert(ragResult.confirmedFacts.length > 0, "Confirmed facts must be derived from code");
  assert.strictEqual(ragResult.confidence, "supported", "Confidence should be 'supported' for indexed matches");

  // Verify cited file actually exists in DB
  for (const src of ragResult.sources) {
    const fileExists = db.getRepositoryFile("sample-project", src.file);
    assert(fileExists, `Cited file ${src.file} MUST exist in repository index`);
    assert(typeof src.startLine === "number", "Citations must include numeric startLine");
  }
  console.log(`  ✔ Returned ${ragResult.sources.length} verified citations with exact line numbers and confirmed facts.`);

  // Test 2: Unmatched / Missing Repository Grounding Honesty
  console.log("▶ Test 2: Unmatched Repository & Ungrounded Query Safety");
  const ungroundedResult = await ragService.answerQuestion({
    repositoryId: "non-existent-repo",
    question: "What does this code do?",
    userId: "usr_default",
  });

  assert.strictEqual(ungroundedResult.confidence, "unsupported", "Should mark confidence as 'unsupported'");
  assert.strictEqual(ungroundedResult.sources.length, 0, "Must NEVER fabricate citations for non-existent repositories");
  assert(ungroundedResult.limitations.length > 0, "Must report clear limitations");
  console.log("  ✔ Ungrounded query cleanly handled without fabricating paths or line numbers.");

  // Test 3: Mode A — Explain This Code (Standalone Snippet)
  console.log("▶ Test 3: Mode A — Standalone Code Explanation (No Repo Required)");
  const standaloneSnippet = `
export async function calculateInvoice(subtotal: number, taxRate: number): Promise<number> {
  if (subtotal < 0 || taxRate < 0) {
    throw new Error("Invalid invoice calculations");
  }
  const tax = subtotal * taxRate;
  return subtotal + tax;
}
`;
  const explanation = await codeExplainer.explainSnippet(standaloneSnippet, "typescript");
  assert(explanation.summary.length > 10, "Should generate summary");
  assert(explanation.lineByLine.length >= 5, "Should generate line-by-line breakdown");
  assert(explanation.keyFunctions.length > 0, "Should extract key functions");
  assert(explanation.potentialIssues.length > 0, "Should identify potential edge cases / boundary issues");
  assert(explanation.complexity.time.includes("O("), "Should provide computational complexity estimate");
  console.log("  ✔ Standalone Mode A produced line-by-line breakdown, complexity, and variables.");

  // Test 4: Mode B — Explain Complete Workflow (Verified AST Match)
  console.log("▶ Test 4: Mode B — Verified Repository Workflow Tracing");
  const workflowSnippet = `
const result = await loginUser(email, password);
`;
  const traceResult = await workflowTracer.traceWorkflow(workflowSnippet, "sample-project");
  assert(traceResult.matched, "Should match symbol loginUser in sample-project");
  assert(traceResult.trace, "Should generate workflow trace");
  assert(traceResult.trace?.nodes.length! >= 2, "Trace should connect multiple workflow nodes");
  assert.strictEqual(traceResult.trace?.matchedFile, "src/services/auth.ts");
  assert.strictEqual(traceResult.trace?.isVerified, true, "Trace must be verified against actual AST relationships");
  console.log(`  ✔ Verified workflow trace connected ${traceResult.trace?.nodes.length} nodes (caller -> endpoint -> service).`);

  // Test 5: Mode B — Honest Fallback for Unmatched Snippet
  console.log("▶ Test 5: Mode B — Honest Fallback for Unmatched Snippet");
  const unmatchedSnippet = `
def render_3d_mesh_shader(vertex_buffer, normal_vector):
    return gl_draw_elements(vertex_buffer)
`;
  const unmatchedTrace = await workflowTracer.traceWorkflow(unmatchedSnippet, "sample-project");
  assert.strictEqual(unmatchedTrace.matched, false, "Must report matched=false for unrelated snippet");
  assert(unmatchedTrace.unmatchedReason?.includes("No matching AST symbols"), "Must clearly explain why match failed");
  console.log("  ✔ Correctly rejected unverified snippet and offered standalone fallback.");

  // Test 6: OCR & Vision Extraction Pipeline
  console.log("▶ Test 6: OCR Code Extraction Pipeline");
  const mockBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const ocrResult = await aiProvider.extractCodeFromImage(mockBase64, "image/png");
  assert(ocrResult.code.length > 0, "Should extract code from screenshot");
  assert(typeof ocrResult.confidence === "number", "Should report extraction confidence");
  console.log(`  ✔ Extracted ${ocrResult.code.split("\n").length} lines with language '${ocrResult.language}' via ${ocrResult.provider}.`);

  // Test 7: Dynamic Repository Suggested Questions
  console.log("▶ Test 7: Dynamic Suggested Questions from Repository Symbols");
  const suggestions = ragService.generateSuggestionsForRepo("sample-project");
  assert(suggestions.length >= 3, "Should generate at least 3 contextual questions");
  assert(
    suggestions.some((s) => s.includes("LoginForm") || s.includes("loginUser") || s.includes("auth")),
    "Suggestions must be grounded in actual symbols present in sample-project"
  );
  console.log(`  ✔ Generated ${suggestions.length} dynamic suggestions tailored to sample-project AST symbols.`);

  console.log("\n🎉 All 7 Phase 7 Grounded AI, RAG & OCR Integration Tests Passed Successfully!\n");
}

runPhase7Tests().catch((e) => {
  console.error("❌ Phase 7 Test failed:", e);
  process.exit(1);
});
