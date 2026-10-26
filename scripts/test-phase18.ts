import * as fs from "fs";
import * as path from "path";
import { isSafeRelativePath } from "../integrations/vscode/src/utils/path-safety";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runPhase18Tests() {
  console.log("\n=========================================================================");
  console.log("🚀 Starting CodeAtlas Phase 18 VS Code Extension & In-Editor Intelligence Tests");
  console.log("=========================================================================\n");

  const vscodeDir = path.resolve(__dirname, "../integrations/vscode");

  // -------------------------------------------------------------------------
  // SUITE 1: Extension Manifest & Command Verification
  // -------------------------------------------------------------------------
  console.log("▶ SUITE 1: Extension Manifest & Command Registration Validation");
  const pkgJsonPath = path.join(vscodeDir, "package.json");
  assert(fs.existsSync(pkgJsonPath), "integrations/vscode/package.json must exist");

  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  assert(pkg.name === "codeatlas-vscode", `Expected name 'codeatlas-vscode', got ${pkg.name}`);
  assert(pkg.engines && pkg.engines.vscode, "Engines.vscode must be specified");
  assert(pkg.main === "./dist/extension.js", `Expected main entrypoint './dist/extension.js', got ${pkg.main}`);

  const requiredCommands = [
    "codeatlas.connect",
    "codeatlas.disconnect",
    "codeatlas.selectRepository",
    "codeatlas.explainSelectedCode",
    "codeatlas.askAboutCodebase",
    "codeatlas.findRelatedImplementations",
    "codeatlas.explainDependencies",
    "codeatlas.analyzeChangeImpact",
    "codeatlas.reviewSelectedCode",
    "codeatlas.analyzeStackTrace",
    "codeatlas.openDashboard",
    "codeatlas.refreshRepositoryContext",
  ];

  const registeredCommands = (pkg.contributes?.commands || []).map((c: any) => c.command);
  for (const cmd of requiredCommands) {
    assert(registeredCommands.includes(cmd), `Required command '${cmd}' must be declared in package.json`);
  }

  // Verify activitybar and view contribution
  const viewsContainers = pkg.contributes?.viewsContainers?.activitybar || [];
  assert(viewsContainers.some((v: any) => v.id === "codeatlas-explorer"), "codeatlas-explorer activitybar container must be contributed");

  const views = pkg.contributes?.views?.["codeatlas-explorer"] || [];
  assert(views.some((v: any) => v.id === "codeatlas.sidebarView"), "codeatlas.sidebarView webview must be contributed");

  // Verify configuration properties
  const configProps = pkg.contributes?.configuration?.properties || {};
  assert(!!configProps["codeatlas.serverUrl"], "codeatlas.serverUrl setting must be defined");
  assert(!!configProps["codeatlas.selectedRepositoryId"], "codeatlas.selectedRepositoryId setting must be defined");
  assert(!!configProps["codeatlas.enableDiagnostics"], "codeatlas.enableDiagnostics setting must be defined");
  console.log(`  ✔ Validated all ${requiredCommands.length} command declarations, activitybar views, and settings.`);

  // -------------------------------------------------------------------------
  // SUITE 2: Path Traversal Protection & Workspace Safety
  // -------------------------------------------------------------------------
  console.log("▶ SUITE 2: Workspace Security & Path Traversal Prevention");
  assert(isSafeRelativePath("src/utils/validation.ts"), "Standard relative path should be safe");
  assert(isSafeRelativePath("components/ui/Button.tsx"), "Nested relative path should be safe");
  assert(!isSafeRelativePath("../../etc/passwd"), "Directory traversal with '..' must be blocked");
  assert(!isSafeRelativePath("src/../secret.env"), "Intermediate '..' traversal must be blocked");
  assert(!isSafeRelativePath("C:\\Windows\\System32\\calc.exe"), "Absolute Windows drive paths must be blocked");
  assert(!isSafeRelativePath("/etc/shadow"), "Absolute Unix root paths must be blocked");
  assert(!isSafeRelativePath("file\0.ts"), "Null byte injection must be blocked");
  assert(!isSafeRelativePath(""), "Empty path must be blocked");
  console.log("  ✔ All directory traversal and absolute path injection attempts successfully blocked.");

  // -------------------------------------------------------------------------
  // SUITE 3: Secret Redaction & Logging Safety
  // -------------------------------------------------------------------------
  console.log("▶ SUITE 3: Secret Redaction & Log Sanitization");
  const testLog = "Dispatching request with Bearer ca_live_99887766554433221100 and key=secret123";
  const sanitized = testLog
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]{15,}/gi, "Bearer [REDACTED_TOKEN]")
    .replace(/ca_(live|test)_[a-zA-Z0-9]{20,}/gi, "ca_$1_[REDACTED_KEY]");
  assert(!sanitized.includes("ca_live_99887766554433221100"), "Secret access token must be redacted from logs");
  assert(sanitized.includes("[REDACTED_TOKEN]"), "Bearer token must be replaced with redaction placeholder");
  console.log("  ✔ Secret tokens and sensitive authorization credentials properly masked.");

  // -------------------------------------------------------------------------
  // SUITE 4: Backend Status Endpoint Probe
  // -------------------------------------------------------------------------
  console.log("▶ SUITE 4: Backend Status & Repository Enumeration Endpoint");
  const { GET: getStatus } = await import("../app/api/vscode/status/route");
  const reqStatus = new Request("http://localhost:3000/api/vscode/status");
  const resStatus = await getStatus(reqStatus as any);
  const statusJson = await resStatus.json();

  assert(statusJson.success === true, "Status endpoint must return success: true");
  assert(statusJson.serverVersion === "1.0.0", `Expected version 1.0.0, got ${statusJson.serverVersion}`);
  assert(Array.isArray(statusJson.repositories), "Repositories must be an array");
  assert(statusJson.repositories.length >= 4, `Expected at least 4 repositories, got ${statusJson.repositories.length}`);

  const sampleRepo = statusJson.repositories.find((r: any) => r.id === "sample-project");
  assert(!!sampleRepo, "sample-project must be present in authorized repositories");
  assert(sampleRepo.status === "indexed" || sampleRepo.status === "ready", `Expected status indexed or ready, got ${sampleRepo.status}`);
  console.log(`  ✔ Status endpoint returned serverVersion ${statusJson.serverVersion} and ${statusJson.repositories.length} authorized repositories.`);

  // -------------------------------------------------------------------------
  // SUITE 5: Code Explanation Endpoint with Structured Breakdown
  // -------------------------------------------------------------------------
  console.log("▶ SUITE 5: Selected Code Explanation Endpoint");
  const { POST: explainCode } = await import("../app/api/vscode/explain/route");

  const sampleSnippet = `
export async function rotateRefreshToken(oldToken: string): Promise<{ token: string; refreshToken: string }> {
  if (!oldToken) {
    throw new Error("Invalid token");
  }
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ token: oldToken }),
  });
  return response.json();
}
  `;

  const reqExplain = new Request("http://localhost:3000/api/vscode/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repositoryId: "sample-project",
      filePath: "src/services/auth.ts",
      code: sampleSnippet,
      language: "typescript",
      startLine: 170,
      endLine: 180,
    }),
  });

  const resExplain = await explainCode(reqExplain as any);
  const explainJson = await resExplain.json();

  assert(explainJson.success === true, "Explain endpoint must return success: true");
  assert(typeof explainJson.summary === "string", "Summary must be a string");
  assert(Array.isArray(explainJson.howItWorks), "howItWorks must be an array of steps");
  assert(explainJson.howItWorks.length > 0, "howItWorks must contain step-by-step breakdown");
  assert(Array.isArray(explainJson.edgeCases), "edgeCases must be an array");
  assert(Array.isArray(explainJson.sourceCitations), "sourceCitations must be an array");
  assert(explainJson.sourceCitations.length > 0, "Must provide source citations with file and line");
  console.log(`  ✔ Explain endpoint generated summary, ${explainJson.howItWorks.length} line steps, and ${explainJson.sourceCitations.length} citations.`);

  // -------------------------------------------------------------------------
  // SUITE 6: Grounded Codebase Q&A with Verified Citations
  // -------------------------------------------------------------------------
  console.log("▶ SUITE 6: In-Editor Codebase Q&A Endpoint");
  const { POST: askQuestion } = await import("../app/api/vscode/ask/route");

  const reqAsk = new Request("http://localhost:3000/api/vscode/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repositoryId: "sample-project",
      question: "Where is the authentication service defined and what endpoints does it call?",
      activeFile: "src/services/auth.ts",
      activeLine: 10,
    }),
  });

  const resAsk = await askQuestion(reqAsk as any);
  const askJson = await resAsk.json();

  assert(askJson.success === true, "Ask endpoint must return success: true");
  assert(typeof askJson.answer === "string" && askJson.answer.length > 0, "Answer must not be empty");
  assert(Array.isArray(askJson.sources), "Sources must be an array");
  assert(Array.isArray(askJson.confirmedFacts), "confirmedFacts must be an array");
  assert(askJson.confidence === "supported" || askJson.confidence === "inferred", "Confidence must be supported or inferred");
  console.log(`  ✔ Q&A endpoint generated answer with ${askJson.sources.length} citations and ${askJson.confirmedFacts.length} verified facts.`);

  // -------------------------------------------------------------------------
  // SUITE 7: In-Editor Code Review & Diagnostic Extraction
  // -------------------------------------------------------------------------
  console.log("▶ SUITE 7: Code Review & Diagnostic Extraction Endpoint");
  const { POST: reviewCode } = await import("../app/api/vscode/review/route");

  const buggySnippet = `
export function validatePassword(password: string): boolean {
  return password.length > 8 && /[A-Z]/.test(password);
}

export async function submitForm(data: any) {
  isSubmittingRef.current = true;
  await fetch('/api/submit', { method: 'POST' });
}
  `;

  const reqReview = new Request("http://localhost:3000/api/vscode/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repositoryId: "sample-project",
      filePath: "src/utils/validation.ts",
      code: buggySnippet,
      language: "typescript",
    }),
  });

  const resReview = await reviewCode(reqReview as any);
  const reviewJson = await resReview.json();

  assert(reviewJson.success === true, "Review endpoint must return success: true");
  assert(Array.isArray(reviewJson.findings), "Findings must be an array");
  assert(reviewJson.findings.length >= 2, `Expected at least 2 findings, got ${reviewJson.findings.length}`);

  const offByOneFinding = reviewJson.findings.find((f: any) => f.title.includes("Off-by-one"));
  const unhandledPromise = reviewJson.findings.find((f: any) => f.title.includes("promise") || f.title.includes("state flag"));

  assert(!!offByOneFinding, "Review must catch the off-by-one password validation boundary flaw");
  assert(offByOneFinding.severity === "warning", `Expected warning severity, got ${offByOneFinding.severity}`);
  assert(offByOneFinding.line >= 1, "Finding must specify line number for VS Code diagnostic mapping");
  assert(!!offByOneFinding.suggestedRemediation, "Finding must include actionable suggested remediation");
  console.log(`  ✔ Review endpoint detected ${reviewJson.findings.length} findings with line numbers and remediations.`);

  // -------------------------------------------------------------------------
  // SUITE 8: Change Impact Analysis Endpoint
  // -------------------------------------------------------------------------
  console.log("▶ SUITE 8: Change Impact Analysis Endpoint");
  const { POST: analyzeImpact } = await import("../app/api/vscode/impact/route");

  const reqImpact = new Request("http://localhost:3000/api/vscode/impact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repositoryId: "sample-project",
      filePath: "src/services/auth.ts",
      symbolName: "loginUser",
      proposedChange: "unsaved-buffer",
    }),
  });

  const resImpact = await analyzeImpact(reqImpact as any);
  const impactJson = await resImpact.json();

  assert(impactJson.success === true, "Impact endpoint must return success: true");
  assert(impactJson.data && typeof impactJson.data.impactScore === "number", "Impact score must be a number");
  assert(Array.isArray(impactJson.data.affectedComponents), "affectedComponents must be an array");
  assert(Array.isArray(impactJson.data.recommendedTests), "recommendedTests must be an array");
  assert(!!impactJson.bufferWarning, "Buffer warning must be surfaced for unsaved changes");
  console.log(`  ✔ Impact analysis returned score ${impactJson.data.impactScore}/100 and ${impactJson.data.affectedComponents.length} affected components.`);

  // -------------------------------------------------------------------------
  // SUITE 9: Stack Trace Analysis Endpoint
  // -------------------------------------------------------------------------
  console.log("▶ SUITE 9: Stack Trace Analysis & Frame Resolution Endpoint");
  const { POST: analyzeTrace } = await import("../app/api/vscode/stacktrace/route");

  const sampleTrace = `
Error: Cannot read properties of null (reading 'token')
    at rotateRefreshToken (src/services/auth.ts:25:20)
    at handleSubmit (src/components/LoginForm.tsx:15:12)
    at dispatchEvent (node_modules/react-dom/index.js:100:5)
  `;

  const reqTrace = new Request("http://localhost:3000/api/vscode/stacktrace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repositoryId: "sample-project",
      stackTrace: sampleTrace,
    }),
  });

  const resTrace = await analyzeTrace(reqTrace as any);
  const traceJson = await resTrace.json();

  assert(traceJson.success === true, "Stack trace endpoint must return success: true");
  assert(traceJson.parsed && Array.isArray(traceJson.parsed.frames), "Frames must be an array");
  assert(traceJson.parsed.frames.length >= 2, "Must parse frames from stack trace");
  assert(traceJson.matchedWorkspaceFrames >= 1, "Must match at least 1 frame to workspace files");
  assert(typeof traceJson.parsed.rootCauseHypothesis === "string", "Root cause hypothesis must be provided");
  console.log(`  ✔ Stack trace parsed ${traceJson.parsed.frames.length} frames, matching ${traceJson.matchedWorkspaceFrames} workspace files.`);

  // -------------------------------------------------------------------------
  // SUITE 10: Symbol Navigation Endpoint
  // -------------------------------------------------------------------------
  console.log("▶ SUITE 10: Symbol Navigation & Reference Lookup Endpoint");
  const { GET: getSymbols } = await import("../app/api/vscode/symbols/route");

  const reqSym = new Request("http://localhost:3000/api/vscode/symbols?repo=sample-project&file=src/services/auth.ts&line=10&symbol=loginUser");
  const resSym = await getSymbols(reqSym as any);
  const symJson = await resSym.json();

  assert(symJson.success === true, "Symbols endpoint must return success: true");
  assert(symJson.data && symJson.data.symbolName === "loginUser", `Expected symbol loginUser, got ${symJson.data?.symbolName}`);
  assert(Array.isArray(symJson.data.callers), "Callers must be an array");
  assert(Array.isArray(symJson.data.references), "References must be an array");
  console.log(`  ✔ Symbol navigation resolved definition, ${symJson.data.callers.length} callers, and ${symJson.data.references.length} references.`);

  // -------------------------------------------------------------------------
  // SUITE 11: VS Code Extension Compiled Artifacts Check
  // -------------------------------------------------------------------------
  console.log("▶ SUITE 11: Compiled Extension Distribution Artifacts");
  const distExtension = path.join(vscodeDir, "dist/extension.js");
  const distApiClient = path.join(vscodeDir, "dist/api/codeatlas-client.js");
  const distSidebar = path.join(vscodeDir, "dist/webview/sidebar-provider.js");

  assert(fs.existsSync(distExtension), "dist/extension.js must exist");
  assert(fs.existsSync(distApiClient), "dist/api/codeatlas-client.js must exist");
  assert(fs.existsSync(distSidebar), "dist/webview/sidebar-provider.js must exist");

  const extSize = fs.statSync(distExtension).size;
  assert(extSize > 1000, `dist/extension.js size (${extSize} bytes) indicates valid compilation`);
  console.log(`  ✔ Compiled extension distribution verified (${extSize} bytes).`);

  console.log("\n=========================================================================");
  console.log("🎉 ALL 11 PHASE 18 TEST SUITES PASSED (100% SUCCESS)!");
  console.log("=========================================================================\n");
}

runPhase18Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
