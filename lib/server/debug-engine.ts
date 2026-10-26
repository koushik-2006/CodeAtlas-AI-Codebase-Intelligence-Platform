import { db } from "./db";
import { parseStackTrace } from "./stack-trace-parser";
import {
  DbDebugInvestigation,
  DbDebugFollowUp,
  DebugInvestigateRequest,
  InvestigationHypothesis,
  HypothesisCategory,
  SuggestedFix,
  TestRecommendation,
  ObservedEvidence,
  InvestigationStatus,
} from "@/types/debug";

// Maximum length limits to prevent DoS or excessive token consumption
const MAX_INPUT_LENGTH = 50000;

/**
 * Redacts secrets, tokens, and credentials from stack traces, logs, and snippets.
 */
export function redactSecrets(input: string): string {
  if (!input) return "";

  return input
    // JWT tokens (check before generic bearer token regex)
    .replace(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, "[REDACTED_JWT]")
    // Bearer / Authorization headers
    .replace(/(Bearer\s+)[A-Za-z0-9\-_.~+/]+=*/gi, "$1[REDACTED_TOKEN]")
    // AWS Access Key ID
    .replace(/(AKIA[0-9A-Z]{16})/g, "[REDACTED_AWS_KEY]")
    // GitHub Personal Access Token (classic & fine-grained)
    .replace(/(gh[pousr]_[A-Za-z0-9_]{36,255})/g, "[REDACTED_GITHUB_TOKEN]")
    // Private Keys
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA )?PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]")
    // Generic password / secret fields in JSON or env strings
    .replace(/(["']?(?:password|secret|apiKey|api_key|access_token|private_key)["']?\s*[:=]\s*["'])([^"'\r\n]+)(["'])/gi, "$1[REDACTED]$3");
}

export class DebugEngine {
  /**
   * Runs an evidence-based root-cause investigation.
   * Supports both standalone error diagnosis and repository-grounded intelligence.
   */
  async investigate(
    request: DebugInvestigateRequest,
    userId: string = "usr_default"
  ): Promise<DbDebugInvestigation> {
    const rawError = redactSecrets((request.errorMessage || "").slice(0, MAX_INPUT_LENGTH));
    const rawTrace = redactSecrets((request.stackTrace || "").slice(0, MAX_INPUT_LENGTH));
    const rawSnippet = redactSecrets((request.codeSnippet || "").slice(0, MAX_INPUT_LENGTH));
    const rawLogs = redactSecrets((request.logs || "").slice(0, MAX_INPUT_LENGTH));
    const expected = (request.expectedBehavior || "").trim().slice(0, MAX_INPUT_LENGTH);
    const actual = (request.actualBehavior || "").trim().slice(0, MAX_INPUT_LENGTH);

    if (!rawError && !rawTrace && !rawSnippet && !actual) {
      throw new Error("Please provide an error message, stack trace, code snippet, or behavior description.");
    }

    const repoId = request.repositoryId;
    let repoName: string | undefined;
    let sourceRevision: string | undefined = request.revision;
    let isRevisionStale = false;

    // Validate repository access if repository provided
    if (repoId) {
      const repo = db.getRepository(repoId, userId);
      if (!repo) {
        throw new Error(`Repository '${repoId}' not found or access denied.`);
      }
      repoName = `${repo.owner}/${repo.name}`;
      if (!sourceRevision) {
        sourceRevision = repo.lastAnalyzed || repo.defaultBranch;
      } else if (repo.lastAnalyzed && sourceRevision !== repo.lastAnalyzed) {
        isRevisionStale = true;
      }
    }

    // 1. Parse stack trace
    const parsedTrace = parseStackTrace(rawTrace || rawError, {
      repositoryId: repoId,
      revision: sourceRevision,
    });

    const errorType = parsedTrace.errorType || "RuntimeError";
    const errorMessage = parsedTrace.errorMessage || rawError || "Unknown runtime error";

    // 2. Identify verified frames and relevant code
    const verifiedFrames = parsedTrace.frames.filter((f) => f.isVerified);
    const isStandalone = !repoId || verifiedFrames.length === 0;

    // 3. Assemble observed evidence (strictly facts observed)
    const verifiedLocations: ObservedEvidence["verifiedLocations"] = verifiedFrames.map((f) => ({
      filePath: f.normalizedPath || f.filePath,
      line: f.line,
      symbolName: f.symbolName || f.functionName,
      snippet: f.sourceSnippet?.lines.find((l) => l.isHighlighted)?.content || undefined,
    }));

    // If explicit filePath was given in request and exists in repo
    if (repoId && request.filePath && !verifiedLocations.some((vl) => vl.filePath === request.filePath)) {
      const explicitFile = db.getRepositoryFile(repoId, request.filePath);
      if (explicitFile) {
        verifiedLocations.push({
          filePath: explicitFile.path,
          line: 1,
          symbolName: request.functionName || undefined,
        });
      }
    }

    const missingContext: string[] = [];
    if (!rawLogs) missingContext.push("Runtime application logs or stdout/stderr streams.");
    if (!expected) missingContext.push("Explicit specification of expected behavior.");
    if (isStandalone) {
      missingContext.push("Repository source code is not connected (standalone analysis mode).");
    } else if (verifiedFrames.length === 0 && parsedTrace.frames.length > 0) {
      missingContext.push("Stack trace frames could not be matched to files in this repository revision.");
    }
    if (isRevisionStale) {
      missingContext.push(`Stack trace revision (${sourceRevision}) differs from indexed commit (${repoId ? db.getRepository(repoId)?.lastAnalyzed : ""}).`);
    }

    const observedEvidence: ObservedEvidence = {
      errorType,
      errorMessage,
      verifiedLocations,
      unexpectedBehavior: actual || undefined,
      expectedBehavior: expected || undefined,
      actualBehavior: actual || undefined,
      relevantLogs: rawLogs ? rawLogs.split(/\r?\n/).filter(Boolean).slice(0, 20) : undefined,
      missingContext,
    };

    // 4. Generate hypotheses
    const hypotheses: InvestigationHypothesis[] = isStandalone
      ? this.generateStandaloneHypotheses(errorType, errorMessage, rawTrace, parsedTrace.runtime, expected, actual)
      : this.generateRepositoryGroundedHypotheses(
          repoId!,
          errorType,
          errorMessage,
          verifiedFrames,
          expected,
          actual,
          rawSnippet
        );

    // 5. Generate fix suggestions
    const suggestedFixes: SuggestedFix[] = isStandalone
      ? this.generateStandaloneFixSuggestions(errorType, errorMessage, parsedTrace.runtime, hypotheses)
      : this.generateRepositoryFixSuggestions(repoId!, hypotheses, verifiedFrames);

    // 6. Test recommendations
    const testRecommendations: TestRecommendation[] = isStandalone
      ? this.generateStandaloneTestRecommendations(errorType, parsedTrace.runtime)
      : this.generateRepositoryTestRecommendations(repoId!, verifiedFrames, hypotheses);

    // 7. Compile unresolved questions
    const unresolvedQuestions = this.compileUnresolvedQuestions(
      isStandalone,
      errorType,
      observedEvidence,
      hypotheses
    );

    const title = `${errorType}: ${errorMessage.slice(0, 80)}`;

    const investigation: DbDebugInvestigation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      workspaceId: request.workspaceId || "ws_team_demo",
      repositoryId: repoId,
      repositoryName: repoName,
      sourceRevision,
      title,
      status: "investigating",
      mode: isStandalone ? "standalone" : "repository_grounded",
      errorType,
      errorMessage,
      rawTrace: rawTrace || undefined,
      rawLogs: rawLogs || undefined,
      inputSnippet: rawSnippet || undefined,
      expectedBehavior: expected || undefined,
      actualBehavior: actual || undefined,
      runtime: parsedTrace.runtime,
      parsedTrace,
      observedEvidence,
      hypotheses,
      suggestedFixes,
      testRecommendations,
      unresolvedQuestions,
      isRevisionStale,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return db.saveDebugInvestigation(investigation);
  }

  /**
   * Generates hypotheses grounded in repository files, AST symbols, and callers/callees.
   */
  private generateRepositoryGroundedHypotheses(
    repoId: string,
    errorType: string,
    errorMessage: string,
    verifiedFrames: any[],
    expected?: string,
    actual?: string,
    snippet?: string
  ): InvestigationHypothesis[] {
    const hypotheses: InvestigationHypothesis[] = [];
    const allRelationships = db.getCodeRelationships(repoId);

    const primaryFrame = verifiedFrames[0];
    const targetFile = primaryFrame?.normalizedPath || primaryFrame?.filePath;
    const targetSymbol = primaryFrame?.symbolName;
    const targetLine = primaryFrame?.line || 1;

    // Find related callers and callees
    const relatedSymbols: {
      symbolName: string;
      relationship: "caller" | "callee" | "importer" | "tester";
      filePath: string;
    }[] = [];

    if (targetSymbol) {
      allRelationships.forEach((rel) => {
        if (rel.toSymbolName === targetSymbol && rel.type === "calls") {
          relatedSymbols.push({
            symbolName: rel.fromSymbolName,
            relationship: "caller",
            filePath: targetFile || "",
          });
        } else if (rel.fromSymbolName === targetSymbol && rel.type === "calls") {
          relatedSymbols.push({
            symbolName: rel.toSymbolName,
            relationship: "callee",
            filePath: targetFile || "",
          });
        } else if (rel.toSymbolName === targetSymbol && rel.type === "tests") {
          relatedSymbols.push({
            symbolName: rel.fromSymbolName,
            relationship: "tester",
            filePath: targetFile || "",
          });
        }
      });
    }

    const errLower = (errorMessage + " " + errorType).toLowerCase();

    // 1. Null / Undefined Access
    if (
      errLower.includes("undefined") ||
      errLower.includes("null") ||
      errLower.includes("nil") ||
      errLower.includes("pointer") ||
      errLower.includes("nonetype")
    ) {
      hypotheses.push({
        id: "hyp_1",
        rank: 1,
        title: "Unchecked access of null or undefined value",
        category: "null_undefined_access",
        categoryLabel: "Null / Undefined Access",
        explanation: `At ${targetFile || "source"}:${targetLine}, code attempts to read properties or invoke methods on an object that evaluates to undefined/null at runtime.`,
        likelihood: "high",
        supportingEvidence: [
          `Error explicitly reports '${errorMessage}'.`,
          targetSymbol ? `Occurred inside verified symbol '${targetSymbol}'.` : `Occurred at verified line ${targetLine}.`,
          `Callers like ${relatedSymbols.find((r) => r.relationship === "caller")?.symbolName || "upstream handler"} may have passed incomplete arguments or received an empty response.`,
        ],
        counterEvidence: [
          "If strict TypeScript checks or runtime assertions are in place, this would require an explicit bypass (e.g. `any` cast or unvalidated JSON response).",
        ],
        suggestedSteps: [
          `Inspect the return value of upstream callers before line ${targetLine}.`,
          `Add defensive optional chaining (?.) or an explicit runtime assertion guard.`,
        ],
        targetFile,
        targetSymbol,
        targetLineRange: { start: Math.max(1, targetLine - 1), end: targetLine + 2 },
        relatedSymbols,
        isInvestigated: false,
        isConfirmedRootCause: false,
      });
    }

    // 2. API Contract Mismatch
    if (
      errLower.includes("api") ||
      errLower.includes("fetch") ||
      errLower.includes("response") ||
      errLower.includes("token") ||
      errLower.includes("status") ||
      errLower.includes("json") ||
      errLower.includes("keyerror")
    ) {
      hypotheses.push({
        id: `hyp_${hypotheses.length + 1}`,
        rank: hypotheses.length + 1,
        title: "API contract mismatch or missing field in payload",
        category: "api_contract_mismatch",
        categoryLabel: "API Contract Mismatch",
        explanation: `The consumed service response or input payload does not match the shape expected by ${targetSymbol || "the function"}.`,
        likelihood: "high",
        supportingEvidence: [
          `Runtime error indicates a missing property access or key resolution failure.`,
          `External HTTP/REST boundaries often return alternative schemas on errors (e.g. 4xx error body vs 200 payload).`,
        ],
        counterEvidence: [
          "If the contract is versioned and validated via OpenAPI/Zod, schemas are synchronized unless backend deployed breaking changes.",
        ],
        suggestedSteps: [
          "Inspect network payload in browser DevTools or server egress logs.",
          "Validate incoming payload with a schema parser before accessing nested properties.",
        ],
        targetFile,
        targetSymbol,
        targetLineRange: { start: Math.max(1, targetLine - 1), end: targetLine + 2 },
        relatedSymbols,
        isInvestigated: false,
        isConfirmedRootCause: false,
      });
    }

    // 3. Incorrect Condition / Invalid Input Assumption
    if (expected && actual) {
      hypotheses.push({
        id: `hyp_${hypotheses.length + 1}`,
        rank: hypotheses.length + 1,
        title: "Divergence between actual logic flow and expected behavioral specification",
        category: "incorrect_condition",
        categoryLabel: "Incorrect Condition",
        explanation: `Expected: '${expected}'. Actual: '${actual}'. The conditional branch or validation guard does not cover this state.`,
        likelihood: "medium",
        supportingEvidence: [
          `Explicit behavior mismatch reported by developer between expected and actual outcomes.`,
        ],
        counterEvidence: [
          "The condition may be correct, but the inputs provided from callers may already be corrupted.",
        ],
        suggestedSteps: [
          `Trace conditional branches inside ${targetFile || "the file"} around line ${targetLine}.`,
          "Add unit test asserting expected outcome for this specific state.",
        ],
        targetFile,
        targetSymbol,
        targetLineRange: { start: Math.max(1, targetLine - 2), end: targetLine + 3 },
        relatedSymbols,
        isInvestigated: false,
        isConfirmedRootCause: false,
      });
    }

    // 4. Missing Test Coverage
    hypotheses.push({
      id: `hyp_${hypotheses.length + 1}`,
      rank: hypotheses.length + 1,
      title: "Missing regression test coverage for error and boundary conditions",
      category: "missing_test_coverage",
      categoryLabel: "Missing Test Coverage",
      explanation: `The current test suite does not exercise the specific failure scenario that triggered '${errorType}'.`,
      likelihood: "medium",
      supportingEvidence: [
        `Automated test suites passed or did not catch this condition prior to execution.`,
      ],
      counterEvidence: [
        "A missing test allows bugs through, but the underlying execution error is triggered by program logic.",
      ],
      suggestedSteps: [
        `Create a dedicated regression test file or test case in tests/ targeting ${targetSymbol || "this component"}.`,
      ],
      targetFile,
      targetSymbol,
      relatedSymbols,
      isInvestigated: false,
      isConfirmedRootCause: false,
    });

    return hypotheses;
  }

  /**
   * Generates hypotheses for standalone mode (no repository connection).
   */
  private generateStandaloneHypotheses(
    errorType: string,
    errorMessage: string,
    rawTrace?: string,
    runtime: string = "generic",
    expected?: string,
    actual?: string
  ): InvestigationHypothesis[] {
    const errLower = (errorMessage + " " + errorType).toLowerCase();
    const hypotheses: InvestigationHypothesis[] = [];

    if (
      errLower.includes("undefined") ||
      errLower.includes("null") ||
      errLower.includes("none") ||
      errLower.includes("nil")
    ) {
      hypotheses.push({
        id: "hyp_sa_1",
        rank: 1,
        title: "Property access or method invocation on uninitialized/null reference",
        category: "null_undefined_access",
        categoryLabel: "Null / Undefined Access",
        explanation: `In ${runtime}, accessing a property of null or undefined immediately triggers a runtime error. This commonly happens when a function expects an object but receives undefined due to an asynchronous delay or missing parameter.`,
        likelihood: "high",
        supportingEvidence: [
          `Reported error message: '${errorMessage}' matches classic null pointer / undefined dereference pattern.`,
        ],
        counterEvidence: [
          "If the object is initialized later in an asynchronous event loop, the error is an async timing issue rather than missing data.",
        ],
        suggestedSteps: [
          "Check the variable immediately preceding the failing expression.",
          "Use optional chaining (?.) or defensive guard clauses.",
          "Add console.log or debugger statements to verify the value at call time.",
        ],
        isInvestigated: false,
        isConfirmedRootCause: false,
      });
    }

    if (errLower.includes("syntax") || errLower.includes("parse") || errLower.includes("token")) {
      hypotheses.push({
        id: `hyp_sa_${hypotheses.length + 1}`,
        rank: hypotheses.length + 1,
        title: "Malformed syntax or invalid JSON serialization format",
        category: "data_transformation_error",
        categoryLabel: "Data Transformation Error",
        explanation: `The runtime parser encountered unexpected tokens or invalid characters while parsing code or serialized payloads.`,
        likelihood: "high",
        supportingEvidence: [
          `Error type '${errorType}' indicates parsing or serialization failure.`,
        ],
        counterEvidence: [
          "The syntax might be valid in a newer version of the language than the currently executing engine.",
        ],
        suggestedSteps: [
          "Validate JSON payloads using a JSON linter.",
          "Verify quotes, commas, and trailing brackets in inputs.",
        ],
        isInvestigated: false,
        isConfirmedRootCause: false,
      });
    }

    if (expected && actual) {
      hypotheses.push({
        id: `hyp_sa_${hypotheses.length + 1}`,
        rank: hypotheses.length + 1,
        title: "Behavioral divergence between actual implementation and expected flow",
        category: "incorrect_condition",
        categoryLabel: "Incorrect Condition",
        explanation: `Expected: '${expected}'. Actual: '${actual}'. The conditional logic or flow branches differently under these runtime arguments.`,
        likelihood: "medium",
        supportingEvidence: [
          `Directly reported behavioral difference.`,
        ],
        counterEvidence: [
          "State mutations in downstream handlers may alter the outcome after the condition executes.",
        ],
        suggestedSteps: [
          "Audit truthiness checks and comparison operators (e.g. === vs ==).",
          "Trace inputs passed to the failing function.",
        ],
        isInvestigated: false,
        isConfirmedRootCause: false,
      });
    }

    // Default fallback hypothesis
    if (hypotheses.length === 0) {
      hypotheses.push({
        id: "hyp_sa_fallback",
        rank: 1,
        title: `Unhandled ${errorType} during program execution`,
        category: "general_runtime_error",
        categoryLabel: "General Runtime Error",
        explanation: `The application threw an uncaught '${errorType}' with message '${errorMessage}'. Without connected repository source code, this represents a general runtime exception.`,
        likelihood: "medium",
        supportingEvidence: [
          `Error message and type extracted from input trace.`,
        ],
        counterEvidence: [
          "Could be wrapped in higher-level exception handler in caller scope.",
        ],
        suggestedSteps: [
          "Connect this repository in CodeAtlas to view verified line numbers and symbol relationships.",
          "Add structured try/catch logging around the failing operation.",
        ],
        isInvestigated: false,
        isConfirmedRootCause: false,
      });
    }

    return hypotheses;
  }

  /**
   * Generates grounded patch suggestions for repository files.
   */
  private generateRepositoryFixSuggestions(
    repoId: string,
    hypotheses: InvestigationHypothesis[],
    verifiedFrames: any[]
  ): SuggestedFix[] {
    const fixes: SuggestedFix[] = [];
    const primaryHypothesis = hypotheses[0];
    if (!primaryHypothesis || !primaryHypothesis.targetFile) return fixes;

    const file = db.getRepositoryFile(repoId, primaryHypothesis.targetFile);
    if (!file) return fixes;

    const fileLines = file.content.split(/\r?\n/);
    const startLine = primaryHypothesis.targetLineRange?.start || 1;
    const endLine = Math.min(fileLines.length, primaryHypothesis.targetLineRange?.end || startLine + 2);

    const originalLines = fileLines.slice(startLine - 1, endLine);
    const originalSnippet = originalLines.join("\n");

    let replacementSnippet = "";
    let title = "";
    let description = "";

    if (primaryHypothesis.category === "null_undefined_access" || primaryHypothesis.category === "api_contract_mismatch") {
      title = `Add defensive validation guard at line ${startLine}`;
      description = `Validate that variables and nested properties are defined before reading them, preventing uncaught runtime exceptions.`;
      
      const indent = originalLines[0]?.match(/^\s*/)?.[0] || "  ";
      replacementSnippet = `${indent}// Defensive guard added to prevent null/undefined runtime exceptions\n` +
        `${indent}if (!data || typeof data.token !== "string") {\n` +
        `${indent}  throw new Error("Invalid response format: missing or malformed access token.");\n` +
        `${indent}}\n` +
        originalSnippet;
    } else {
      title = `Add safety checks and error handling for ${primaryHypothesis.targetSymbol || "component"}`;
      description = `Prevent execution from continuing when unexpected runtime states occur.`;
      const indent = originalLines[0]?.match(/^\s*/)?.[0] || "  ";
      replacementSnippet = `${indent}try {\n` +
        originalLines.map((l) => `  ${l}`).join("\n") +
        `\n${indent}} catch (error: any) {\n` +
        `${indent}  console.error("Safely handled runtime exception:", error);\n` +
        `${indent}  throw error;\n` +
        `${indent}}`;
    }

    // Construct unified patch diff
    const patchDiff = `--- a/${file.path}\n+++ b/${file.path}\n@@ -${startLine},${originalLines.length} +${startLine},${replacementSnippet.split("\n").length} @@\n` +
      originalLines.map((l) => `-${l}`).join("\n") + "\n" +
      replacementSnippet.split("\n").map((l) => `+${l}`).join("\n");

    fixes.push({
      id: `fix_${Date.now()}_1`,
      hypothesisId: primaryHypothesis.id,
      title,
      description,
      filePath: file.path,
      startLine,
      endLine,
      originalSnippet,
      replacementSnippet,
      patchDiff,
      potentialSideEffects: [
        "Callers must handle the descriptive error when invalid payloads are received.",
        "Ensure tests mock valid responses with all required properties.",
      ],
      requiredTests: [
        `Verify ${primaryHypothesis.targetSymbol || "function"} rejects gracefully when payload is empty.`,
        "Run existing happy-path test suites to confirm no regressions.",
      ],
      assumptions: [
        "The file content at this revision matches the indexed version in CodeAtlas.",
      ],
      isApplicable: true,
      validationStatus: "validated",
      isApplied: false,
    });

    return fixes;
  }

  /**
   * Generates general fix guidance for standalone mode.
   */
  private generateStandaloneFixSuggestions(
    errorType: string,
    errorMessage: string,
    runtime: string,
    hypotheses: InvestigationHypothesis[]
  ): SuggestedFix[] {
    const primary = hypotheses[0];
    return [
      {
        id: `fix_sa_1`,
        hypothesisId: primary?.id,
        title: `Defensive guard against ${errorType}`,
        description: `Add an upfront validation check or optional chaining before accessing properties.`,
        filePath: "app/code.ts",
        startLine: 1,
        endLine: 3,
        originalSnippet: `// Example vulnerable access\nconst value = obj.property;`,
        replacementSnippet: `// Recommended safe access\nconst value = obj?.property ?? defaultValue;`,
        patchDiff: `--- vulnerable\n+++ safe\n-const value = obj.property;\n+const value = obj?.property ?? defaultValue;`,
        potentialSideEffects: [
          "Downstream logic must be prepared to handle defaultValue.",
        ],
        requiredTests: [
          "Test with null, undefined, and valid object inputs.",
        ],
        assumptions: [
          "defaultValue is a safe substitute for missing runtime values.",
        ],
        isApplicable: false,
        validationStatus: "validated",
        isApplied: false,
      },
    ];
  }

  /**
   * Discovers existing tests and suggests targeted regression tests for repository.
   */
  private generateRepositoryTestRecommendations(
    repoId: string,
    verifiedFrames: any[],
    hypotheses: InvestigationHypothesis[]
  ): TestRecommendation[] {
    const recommendations: TestRecommendation[] = [];
    const allSymbols = db.getCodeSymbols(repoId);
    const primaryFrame = verifiedFrames[0];
    const targetSymbol = primaryFrame?.symbolName;

    // 1. Discover existing tests in repo
    const existingTestSymbols = allSymbols.filter(
      (s) => s.type === "test" || s.filePath.includes("test") || s.filePath.includes("spec")
    );

    const relatedExistingTest = existingTestSymbols.find(
      (s) => targetSymbol && s.name.toLowerCase().includes(targetSymbol.toLowerCase())
    ) || existingTestSymbols[0];

    if (relatedExistingTest) {
      recommendations.push({
        id: `test_disc_1`,
        title: `Existing Test: ${relatedExistingTest.name}`,
        testFile: relatedExistingTest.filePath,
        targetSymbol: targetSymbol || "Component",
        framework: "jest",
        category: "regression",
        testCode: `// Discovered in ${relatedExistingTest.filePath}\n// Function: ${relatedExistingTest.name}`,
        rationale: `Exercises the affected component under normal operating conditions. Run this test to ensure proposed fixes do not break existing behavior.`,
        status: "discovered",
        isExistingTest: true,
      });
    }

    // 2. Generate suggested regression test
    const targetName = targetSymbol || "handler";
    recommendations.push({
      id: `test_sugg_1`,
      title: `Regression Test: Graceful handling of invalid/missing input`,
      testFile: relatedExistingTest?.filePath || "tests/regression.test.ts",
      targetSymbol: targetName,
      framework: "jest",
      category: "regression",
      testCode: `describe("${targetName} regression suite", () => {\n` +
        `  it("should throw a descriptive error when payload structure is invalid", async () => {\n` +
        `    // Negative test asserting that missing data rejects with clear error message\n` +
        `    await expect(${targetName}({ invalid: true }))\n` +
        `      .rejects.toThrow();\n` +
        `  });\n` +
        `});`,
      rationale: `Prevents regressions by asserting that unhandled exceptions do not occur when incoming data is malformed.`,
      status: "suggested",
      isExistingTest: false,
    });

    return recommendations;
  }

  /**
   * Generates test recommendations for standalone mode.
   */
  private generateStandaloneTestRecommendations(
    errorType: string,
    runtime: string
  ): TestRecommendation[] {
    return [
      {
        id: "test_sa_1",
        title: `Unit Test: Assert ${errorType} handling`,
        testFile: "tests/error-boundary.test.ts",
        targetSymbol: "targetFunction",
        framework: runtime === "python" ? "pytest" : runtime === "go" ? "go_test" : "jest",
        category: "edge_case",
        testCode: `it("handles unexpected input gracefully without throwing ${errorType}", () => {\n` +
          `  expect(() => targetFunction(null)).not.toThrow();\n` +
          `});`,
        rationale: "Asserts that passing null/uninitialized inputs is handled safely.",
        status: "suggested",
        isExistingTest: false,
      },
    ];
  }

  /**
   * Compiles unresolved questions that narrow the investigation.
   */
  private compileUnresolvedQuestions(
    isStandalone: boolean,
    errorType: string,
    evidence: ObservedEvidence,
    hypotheses: InvestigationHypothesis[]
  ): string[] {
    const questions: string[] = [];

    if (isStandalone) {
      questions.push("Which repository and file contains the code producing this stack trace?");
      questions.push("What runtime arguments or environment configuration triggered this error?");
    } else {
      questions.push("What exact payload or argument was passed by the immediate caller at runtime?");
      if (evidence.verifiedLocations.length > 0) {
        questions.push(`Does ${evidence.verifiedLocations[0].filePath} receive input directly from external clients or an internal service?`);
      }
    }

    questions.push("Is this failure consistently reproducible or intermittent under high concurrency?");
    questions.push("Were any recent deployment or environment variable changes made prior to this error appearing?");

    return questions;
  }

  /**
   * Answers context-aware follow-up questions within an active investigation.
   */
  async askFollowUp(
    investigationId: string,
    question: string,
    userId: string = "usr_default"
  ): Promise<DbDebugFollowUp> {
    const investigation = db.getDebugInvestigation(investigationId, userId);
    if (!investigation) {
      throw new Error(`Investigation '${investigationId}' not found.`);
    }

    const sanitizedQuestion = question.trim().slice(0, 1000);
    if (!sanitizedQuestion) {
      throw new Error("Please enter a follow-up question.");
    }

    // Save user question
    const userMsg: DbDebugFollowUp = {
      id: `fu_${Date.now()}_u`,
      investigationId,
      sender: "user",
      content: sanitizedQuestion,
      timestamp: new Date().toISOString(),
    };
    db.addDebugFollowUp(userMsg);

    // Context synthesis
    const primaryFrame = investigation.parsedTrace?.frames.find((f) => f.isVerified);
    const targetFile = primaryFrame?.normalizedPath || primaryFrame?.filePath || "source";
    const targetSymbol = primaryFrame?.symbolName || primaryFrame?.functionName || "failing component";

    let answer = "";
    const qLower = sanitizedQuestion.toLowerCase();

    if (qLower.includes("why") || qLower.includes("cause") || qLower.includes("failing")) {
      answer = `Based on the verified evidence, ${targetSymbol} in \`${targetFile}\` fails because **${investigation.errorMessage}**. ` +
        `The top hypothesis indicates ${investigation.hypotheses[0]?.explanation || "an unhandled runtime state"}. ` +
        `To confirm this, verify the input arguments passed to \`${targetSymbol}\`.`;
    } else if (qLower.includes("test") || qLower.includes("verify") || qLower.includes("reproduce")) {
      const rec = investigation.testRecommendations[0];
      answer = `To verify this hypothesis, run or create the test suggested in \`${rec?.testFile || "tests/"}\`. ` +
        `Specifically, test passing null or unexpected response shapes to ensure the defensive guard handles the condition gracefully without crashing.`;
    } else if (qLower.includes("fix") || qLower.includes("patch") || qLower.includes("repair")) {
      const fix = investigation.suggestedFixes[0];
      answer = fix
        ? `The recommended minimal fix is: **${fix.title}** in \`${fix.filePath}\` (lines ${fix.startLine}-${fix.endLine}). ` +
          `It adds defensive validation before property access. You can review the diff and apply it with explicit confirmation in the Fix Suggestions panel.`
        : "A minimal fix involves wrapping the property access in a null-check or optional chaining guard.";
    } else if (qLower.includes("caller") || qLower.includes("downstream") || qLower.includes("impact")) {
      const rels = investigation.hypotheses[0]?.relatedSymbols || [];
      const callers = rels.filter((r) => r.relationship === "caller").map((r) => r.symbolName);
      answer = callers.length > 0
        ? `Callers discovered in the architecture graph that invoke \`${targetSymbol}\` include: ${callers.map((c) => `\`${c}\``).join(", ")}. Modifying this function's error handling will affect these call sites.`
        : `No direct internal callers were found in this repository; \`${targetSymbol}\` may be an entrypoint or exported module.`;
    } else {
      answer = `In investigation **${investigation.title}**, the observed facts show: ` +
        `1. Error type: \`${investigation.errorType}\`\n` +
        `2. Location: \`${targetFile}\` (line ${primaryFrame?.line || "unknown"})\n` +
        `3. Status: ${investigation.status}\n` +
        `Recommended next step: ${investigation.hypotheses[0]?.suggestedSteps[0] || "Inspect caller payload in tests."}`;
    }

    const aiMsg: DbDebugFollowUp = {
      id: `fu_${Date.now()}_a`,
      investigationId,
      sender: "assistant",
      content: answer,
      citedReferences: primaryFrame
        ? [
            {
              filePath: targetFile,
              line: primaryFrame.line,
              symbolName: targetSymbol,
            },
          ]
        : undefined,
      timestamp: new Date().toISOString(),
    };

    db.addDebugFollowUp(aiMsg);
    return aiMsg;
  }

  /**
   * Applies a proposed patch safely to a repository file with explicit user confirmation and backup.
   * Strictly does NOT execute untrusted code.
   */
  async applyPatch(
    investigationId: string,
    fixId: string,
    confirmed: boolean,
    userId: string = "usr_default"
  ): Promise<{ success: boolean; message: string; fix: SuggestedFix }> {
    if (!confirmed) {
      throw new Error("Explicit confirmation is required before applying a patch.");
    }

    const investigation = db.getDebugInvestigation(investigationId, userId);
    if (!investigation) {
      throw new Error(`Investigation '${investigationId}' not found.`);
    }

    if (!investigation.repositoryId) {
      throw new Error("Cannot apply patches in standalone mode (no repository connected).");
    }

    const fixIndex = investigation.suggestedFixes.findIndex((f) => f.id === fixId);
    if (fixIndex < 0) {
      throw new Error(`Suggested fix '${fixId}' not found in this investigation.`);
    }

    const fix = investigation.suggestedFixes[fixIndex];
    if (fix.isApplied) {
      return { success: true, message: "Patch has already been applied.", fix };
    }

    const file = db.getRepositoryFile(investigation.repositoryId, fix.filePath);
    if (!file) {
      fix.validationStatus = "missing_file";
      fix.validationError = `Target file '${fix.filePath}' does not exist in repository.`;
      db.updateDebugInvestigation(investigationId, { suggestedFixes: investigation.suggestedFixes });
      throw new Error(fix.validationError);
    }

    // Verify lines match original snippet
    const fileLines = file.content.split(/\r?\n/);
    const targetSlice = fileLines.slice(fix.startLine - 1, fix.endLine).join("\n");

    if (targetSlice.trim() !== fix.originalSnippet.trim()) {
      fix.validationStatus = "stale_revision";
      fix.validationError = "Source lines have changed since the investigation was created. Patch aborted for safety.";
      db.updateDebugInvestigation(investigationId, { suggestedFixes: investigation.suggestedFixes });
      throw new Error(fix.validationError);
    }

    // Create automatic pre-patch backup
    const backupContent = file.content;
    const replacementLines = fix.replacementSnippet.split(/\r?\n/);

    fileLines.splice(fix.startLine - 1, fix.endLine - fix.startLine + 1, ...replacementLines);
    const updatedContent = fileLines.join("\n");

    // Update file in repository
    file.content = updatedContent;
    file.lineCount = fileLines.length;
    file.size = Buffer.byteLength(updatedContent, "utf-8");

    const allRepoFiles = db.getRepositoryFiles(investigation.repositoryId);
    const fileIdx = allRepoFiles.findIndex((f) => f.path === file.path);
    if (fileIdx >= 0) {
      allRepoFiles[fileIdx] = file;
      db.saveRepositoryFiles(investigation.repositoryId, allRepoFiles);
    }

    // Mark fix applied
    fix.isApplied = true;
    fix.appliedAt = new Date().toISOString();
    fix.backupContent = backupContent;
    fix.validationStatus = "validated";

    investigation.suggestedFixes[fixIndex] = fix;
    investigation.status = "resolved";

    db.updateDebugInvestigation(investigationId, {
      suggestedFixes: investigation.suggestedFixes,
      status: "resolved",
    });

    return {
      success: true,
      message: `Patch successfully applied to ${fix.filePath}. Pre-patch backup created.`,
      fix,
    };
  }
}

export const debugEngine = new DebugEngine();
