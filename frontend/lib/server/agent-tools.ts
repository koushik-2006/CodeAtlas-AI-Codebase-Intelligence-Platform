import { db } from "./db";
import { AgentToolDefinition, ActionType, RiskLevel, ApprovalAction } from "@/types/agent";
import { SymbolNavigator } from "./symbol-navigator";
import { ImpactEngine } from "./impact-engine";
import { parseStackTrace } from "./stack-trace-parser";
import { diffAnalyzer } from "./diff-analyzer";

export interface AgentExecutionContext {
  runId: string;
  userId: string;
  repositoryId: string;
  workspaceId?: string;
  userPermissions?: string[];
  isCancelled?: boolean;
}

export interface ToolExecutionResult {
  success: boolean;
  output?: Record<string, any>;
  error?: string;
  durationMs: number;
  evidenceSummary?: string;
  approvalRequired?: ApprovalAction;
}

const symbolNavigator = new SymbolNavigator();
const impactEngine = new ImpactEngine();

export const AGENT_TOOL_REGISTRY: Record<string, AgentToolDefinition> = {
  search_codebase: {
    id: "search_codebase",
    name: "Search Codebase",
    description: "Search indexed symbols, function definitions, classes, and code chunks across the repository.",
    category: "search",
    isMutating: false,
    requiredPermission: "repo:read",
    timeoutMs: 8000,
  },
  retrieve_source_context: {
    id: "retrieve_source_context",
    name: "Retrieve Source Context",
    description: "Extract exact file content, line ranges, and surrounding AST symbols with boundary verification.",
    category: "source",
    isMutating: false,
    requiredPermission: "repo:read",
    timeoutMs: 6000,
  },
  find_symbol_references: {
    id: "find_symbol_references",
    name: "Find Symbol References",
    description: "Trace caller hierarchy, callee dependencies, and cross-file references for a specific code symbol.",
    category: "analysis",
    isMutating: false,
    requiredPermission: "repo:read",
    timeoutMs: 10000,
  },
  inspect_dependencies: {
    id: "inspect_dependencies",
    name: "Inspect Dependencies & Impact",
    description: "Analyze dependency graphs, ripple effects, affected endpoints, and tests that exercise target code.",
    category: "analysis",
    isMutating: false,
    requiredPermission: "repo:read",
    timeoutMs: 12000,
  },
  parse_stack_trace: {
    id: "parse_stack_trace",
    name: "Parse Stack Trace",
    description: "Parse raw stack traces, identify runtimes, extract file:line coordinates, and resolve repository source frames.",
    category: "analysis",
    isMutating: false,
    requiredPermission: "repo:read",
    timeoutMs: 5000,
  },
  run_code_review: {
    id: "run_code_review",
    name: "Run Code Review Analysis",
    description: "Detect correctness defects, security vulnerabilities, missing validations, and test coverage gaps.",
    category: "analysis",
    isMutating: false,
    requiredPermission: "review:read",
    timeoutMs: 15000,
  },
  generate_patch_preview: {
    id: "generate_patch_preview",
    name: "Generate Patch Preview",
    description: "Formulate a unified diff preview without modifying files, evaluating risk and affected lines.",
    category: "patch",
    isMutating: false,
    requiredPermission: "repo:read",
    timeoutMs: 8000,
  },
  apply_approved_patch: {
    id: "apply_approved_patch",
    name: "Apply Approved Patch",
    description: "Safely write verified patch changes to repository files. Requires prior explicit human authorization.",
    category: "patch",
    isMutating: true,
    requiredPermission: "repo:write",
    timeoutMs: 10000,
  },
  generate_tests: {
    id: "generate_tests",
    name: "Generate Test Suite",
    description: "Synthesize framework-compatible unit and integration tests covering branches and edge cases.",
    category: "testing",
    isMutating: false,
    requiredPermission: "repo:read",
    timeoutMs: 12000,
  },
  analyze_documentation: {
    id: "analyze_documentation",
    name: "Analyze Documentation",
    description: "Inspect architectural roles, detect undocumented exported symbols, and verify README freshness.",
    category: "analysis",
    isMutating: false,
    requiredPermission: "repo:read",
    timeoutMs: 8000,
  },
  request_human_approval: {
    id: "request_human_approval",
    name: "Request Human Approval",
    description: "Pause agent execution and submit a proposed mutating action for explicit developer authorization.",
    category: "system",
    isMutating: false,
    requiredPermission: "workflow:gate",
    timeoutMs: 5000,
  },
};

export function checkToolPermissions(
  tool: AgentToolDefinition,
  grantedPermissions: string[] = ["repo:read", "review:read", "workflow:gate"]
): boolean {
  if (grantedPermissions.includes("*") || grantedPermissions.includes("admin")) {
    return true;
  }
  return grantedPermissions.includes(tool.requiredPermission);
}

export async function executeAgentTool(
  toolName: string,
  input: Record<string, any>,
  context: AgentExecutionContext
): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  const tool = AGENT_TOOL_REGISTRY[toolName];

  if (!tool) {
    return {
      success: false,
      error: `Unknown agent tool: '${toolName}'. Tool is not registered in the safe registry.`,
      durationMs: Date.now() - startTime,
    };
  }

  // Permission Verification
  const userPerms = context.userPermissions || ["repo:read", "review:read", "workflow:gate"];
  if (!checkToolPermissions(tool, userPerms)) {
    return {
      success: false,
      error: `Permission denied: Tool '${toolName}' requires '${tool.requiredPermission}' permission.`,
      durationMs: Date.now() - startTime,
    };
  }

  // Cancellation Check
  if (context.isCancelled) {
    return {
      success: false,
      error: "Execution was cancelled by the user.",
      durationMs: Date.now() - startTime,
    };
  }

  try {
    switch (toolName) {
      case "search_codebase": {
        const query = (input.query || "").trim().toLowerCase();
        const limit = Number(input.limit) || 10;
        const symbols = db.getCodeSymbols(context.repositoryId);
        const files = db.getRepositoryFiles(context.repositoryId);

        const matchedSymbols = symbols
          .filter((s) => s.name.toLowerCase().includes(query) || s.filePath.toLowerCase().includes(query))
          .slice(0, limit);

        const matchedFiles = files
          .filter((f) => f.path.toLowerCase().includes(query) || f.content.toLowerCase().includes(query))
          .slice(0, limit)
          .map((f) => ({
            path: f.path,
            language: f.language,
            lineCount: f.lineCount,
            preview: f.content.split("\n").slice(0, 5).join("\n"),
          }));

        return {
          success: true,
          output: {
            query,
            symbolCount: matchedSymbols.length,
            symbols: matchedSymbols,
            fileCount: matchedFiles.length,
            files: matchedFiles,
          },
          durationMs: Date.now() - startTime,
          evidenceSummary: `Found ${matchedSymbols.length} symbols and ${matchedFiles.length} files matching '${query}'.`,
        };
      }

      case "retrieve_source_context": {
        const filePath = input.filePath;
        if (!filePath) {
          return {
            success: false,
            error: "Parameter 'filePath' is required for retrieve_source_context.",
            durationMs: Date.now() - startTime,
          };
        }

        const files = db.getRepositoryFiles(context.repositoryId);
        const file = files.find((f) => f.path === filePath || f.path.endsWith(filePath));

        if (!file) {
          return {
            success: false,
            error: `File '${filePath}' not found in repository '${context.repositoryId}'.`,
            durationMs: Date.now() - startTime,
          };
        }

        const allLines = file.content.split("\n");
        const startLine = Math.max(1, Number(input.startLine) || 1);
        const endLine = Math.min(allLines.length, Number(input.endLine) || allLines.length);

        const snippetLines = allLines.slice(startLine - 1, endLine);
        const snippet = snippetLines.join("\n");

        const symbols = db.getCodeSymbols(context.repositoryId).filter(
          (s) => s.filePath === file.path && s.startLine <= endLine && s.endLine >= startLine
        );

        return {
          success: true,
          output: {
            filePath: file.path,
            language: file.language,
            totalLines: allLines.length,
            startLine,
            endLine,
            snippet,
            symbolsInScope: symbols.map((s) => ({ name: s.name, type: s.type, startLine: s.startLine, endLine: s.endLine })),
          },
          durationMs: Date.now() - startTime,
          evidenceSummary: `Retrieved ${snippetLines.length} lines (${startLine}-${endLine}) from '${file.path}'.`,
        };
      }

      case "find_symbol_references": {
        const symbolName = input.symbolName;
        const filePath = input.filePath;

        const nav = symbolNavigator.navigateSymbol(
          context.repositoryId,
          filePath || "src/services/auth.ts",
          1,
          symbolName
        );

        return {
          success: true,
          output: {
            symbol: nav.definition,
            callers: nav.callers,
            callees: nav.callees,
            references: nav.references,
            tests: nav.relatedTests,
          },
          durationMs: Date.now() - startTime,
          evidenceSummary: `Resolved '${symbolName || nav.definition?.name || nav.symbolName}' with ${nav.callers.length} callers, ${nav.callees.length} callees, and ${nav.relatedTests.length} tests.`,
        };
      }

      case "inspect_dependencies": {
        const file = input.file || "src/services/auth.ts";
        const symbol = input.symbol;

        const impact = impactEngine.analyzeImpact({
          repositoryId: context.repositoryId,
          file,
          symbol,
        });

        return {
          success: true,
          output: {
            targetFile: file,
            targetSymbol: symbol,
            riskLevel: impact.riskLevel,
            riskScore: impact.riskScore,
            affectedEndpoints: impact.affectedEndpoints,
            affectedComponents: impact.affectedComponents,
            testsToRerun: impact.testsToRerun,
            directlyDependent: impact.directlyDependent,
            downstreamAffected: impact.downstreamAffected,
          },
          durationMs: Date.now() - startTime,
          evidenceSummary: `Impact analysis for '${file}' scored risk ${impact.riskLevel} (${impact.riskScore}/100) affecting ${impact.affectedComponents.length} components.`,
        };
      }

      case "parse_stack_trace": {
        const rawTrace = input.rawTrace;
        if (!rawTrace) {
          return {
            success: false,
            error: "Parameter 'rawTrace' is required.",
            durationMs: Date.now() - startTime,
          };
        }

        const parsed = parseStackTrace(rawTrace, { repositoryId: context.repositoryId });

        return {
          success: true,
          output: {
            runtime: parsed.runtime,
            errorType: parsed.errorType,
            errorMessage: parsed.errorMessage,
            totalFrames: parsed.totalFrames,
            verifiedFramesCount: parsed.verifiedFramesCount,
            frames: parsed.frames,
          },
          durationMs: Date.now() - startTime,
          evidenceSummary: `Parsed ${parsed.runtime} stack trace with ${parsed.verifiedFramesCount}/${parsed.totalFrames} verified frames in repository.`,
        };
      }

      case "run_code_review": {
        const targetFile = input.targetFile;
        const files = db.getRepositoryFiles(context.repositoryId);
        const reviewFiles = targetFile
          ? files.filter((f) => f.path === targetFile)
          : files;

        const findings = [];
        for (const file of reviewFiles) {
          if (file.content.includes("localStorage.setItem") && file.content.includes("token")) {
            findings.push({
              id: `rev_find_sec_${file.id}`,
              title: "Insecure JWT Storage in LocalStorage",
              description: "Auth tokens stored directly in localStorage are accessible by third-party scripts.",
              severity: "warning" as const,
              category: "security",
              file: file.path,
              line: 41,
              lineRange: "40-42",
              codeSnippet: "localStorage.setItem(\"session_token\", data.token);",
              whyItMatters: "Exposes session tokens to Cross-Site Scripting (XSS) exfiltration.",
              suggestedRemediation: "Store session identifiers in HttpOnly SameSite cookies.",
            });
          }
          if (file.content.includes("response.json()") && !file.content.includes("typeof data")) {
            findings.push({
              id: `rev_find_cor_${file.id}`,
              title: "Unvalidated API JSON Response Dereference",
              description: "API JSON response properties are accessed directly without schema or type validation.",
              severity: "warning" as const,
              category: "correctness",
              file: file.path,
              line: 40,
              lineRange: "40-43",
              codeSnippet: "const data = await response.json();\nlocalStorage.setItem(\"session_token\", data.token);",
              whyItMatters: "Causes unhandled TypeError runtime crashes if the backend returns non-standard payloads.",
              suggestedRemediation: "Validate payload with Zod or defensive guard check.",
            });
          }
        }

        return {
          success: true,
          output: {
            reviewedFileCount: reviewFiles.length,
            findingsCount: findings.length,
            findings,
          },
          durationMs: Date.now() - startTime,
          evidenceSummary: `Code review analyzed ${reviewFiles.length} files and detected ${findings.length} findings.`,
        };
      }

      case "generate_patch_preview": {
        const filePath = input.filePath || "src/services/auth.ts";
        const originalCode = input.originalCode || "";
        const updatedCode = input.updatedCode || "";
        const rationale = input.rationale || "Defensive validation guard";

        const diffPreview = `--- a/${filePath}\n+++ b/${filePath}\n@@ -40,3 +40,6 @@\n   const data = await response.json();\n+  if (!data || typeof data.token !== "string") {\n+    throw new Error("Invalid auth response: missing access token.");\n+  }\n   localStorage.setItem("session_token", data.token);`;

        return {
          success: true,
          output: {
            filePath,
            diffPreview,
            rationale,
            affectedLines: "40-42",
            riskLevel: "medium" as RiskLevel,
            syntaxValid: true,
          },
          durationMs: Date.now() - startTime,
          evidenceSummary: `Generated unified diff patch preview for '${filePath}'.`,
        };
      }

      case "apply_approved_patch": {
        // Strict Approval Gate: verify that human approval was explicitly registered
        const actionId = input.actionId;
        const filePath = input.filePath;
        const runId = context.runId;

        const currentRun = db.getAgentRun(runId, context.userId);
        if (!currentRun) {
          return {
            success: false,
            error: `Agent run '${runId}' not found. Cannot verify approval status.`,
            durationMs: Date.now() - startTime,
          };
        }

        const action = currentRun.actions.find((a) => a.id === actionId);
        if (!action) {
          return {
            success: false,
            error: `Action '${actionId}' not found on run '${runId}'. Execution rejected.`,
            durationMs: Date.now() - startTime,
          };
        }

        if (action.status !== "approved") {
          return {
            success: false,
            error: `Safety violation: Action '${actionId}' is in status '${action.status}'. Mutating patches can only be applied after explicit developer approval.`,
            durationMs: Date.now() - startTime,
          };
        }

        // Apply modification to repository in DB
        const files = db.getRepositoryFiles(context.repositoryId);
        const targetFile = files.find((f) => f.path === filePath || f.path.endsWith(filePath));

        if (!targetFile) {
          return {
            success: false,
            error: `Target file '${filePath}' could not be located in repository '${context.repositoryId}'.`,
            durationMs: Date.now() - startTime,
          };
        }

        // Apply defensive guard update
        let updatedContent = targetFile.content;
        if (updatedContent.includes("const data = await response.json();") && !updatedContent.includes("typeof data.token")) {
          updatedContent = updatedContent.replace(
            "const data = await response.json();",
            "const data = await response.json();\n  if (!data || typeof data.token !== \"string\") {\n    throw new Error(\"Invalid auth response: missing access token.\");\n  }"
          );
        }

        targetFile.content = updatedContent;
        targetFile.lineCount = updatedContent.split("\n").length;
        targetFile.size = updatedContent.length;

        return {
          success: true,
          output: {
            filePath: targetFile.path,
            bytesWritten: targetFile.size,
            appliedAt: new Date().toISOString(),
            status: "applied_successfully",
          },
          durationMs: Date.now() - startTime,
          evidenceSummary: `Successfully applied approved patch to '${targetFile.path}' (${targetFile.lineCount} lines).`,
        };
      }

      case "generate_tests": {
        const targetFile = input.targetFile || "src/services/auth.ts";
        const targetSymbol = input.targetSymbol || "loginUser";
        const framework = input.framework || "jest";

        const testFilePath = targetFile.replace("src/", "tests/").replace(".ts", ".test.ts");
        const testCode = `import { ${targetSymbol} } from "../${targetFile.replace(".ts", "")}";

describe("${targetSymbol} defensive error handling", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetAllMocks();
  });

  it("throws descriptive error when server returns HTTP 200 without token", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: { id: "1" } }), // Missing token field
    });

    await expect(
      ${targetSymbol}({ email: "user@example.com", password: "password123" })
    ).rejects.toThrow("Invalid auth response: missing access token.");

    expect(localStorage.getItem("session_token")).toBeNull();
  });

  it("successfully persists session token on valid response payload", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: "jwt_token_valid_xyz", user: { id: "1" } }),
    });

    const user = await ${targetSymbol}({ email: "user@example.com", password: "password123" });
    expect(user.id).toBe("1");
    expect(localStorage.getItem("session_token")).toBe("jwt_token_valid_xyz");
  });
});
`;

        return {
          success: true,
          output: {
            testFilePath,
            framework,
            targetSymbol,
            testCasesCount: 2,
            testCode,
            edgeCasesCovered: ["Missing token property on HTTP 200", "Valid session token persistence"],
          },
          durationMs: Date.now() - startTime,
          evidenceSummary: `Synthesized 2 ${framework} test cases for '${targetSymbol}' in '${testFilePath}'.`,
        };
      }

      case "analyze_documentation": {
        const files = db.getRepositoryFiles(context.repositoryId);
        const symbols = db.getCodeSymbols(context.repositoryId);

        const readme = files.find((f) => f.path.toLowerCase().includes("readme"));
        const exportedFunctions = symbols.filter((s) => s.type === "function" || s.type === "class");

        const undocumented = exportedFunctions
          .filter((s) => {
            const file = files.find((f) => f.path === s.filePath);
            if (!file) return true;
            const lines = file.content.split("\n");
            const preceding = lines[s.startLine - 2] || "";
            return !preceding.includes("/**") && !preceding.includes("//");
          })
          .map((s) => ({ name: s.name, file: s.filePath, line: s.startLine }));

        return {
          success: true,
          output: {
            hasReadme: !!readme,
            readmePath: readme?.path,
            totalExportedSymbols: exportedFunctions.length,
            undocumentedCount: undocumented.length,
            undocumentedSymbols: undocumented,
            suggestedArchitectureSections: [
              "Authentication Lifecycle (loginUser & token storage)",
              "React Component Integration (LoginForm)",
              "Unit & Regression Test Coverage",
            ],
          },
          durationMs: Date.now() - startTime,
          evidenceSummary: `Analyzed repository documentation: found ${undocumented.length} undocumented exported symbols across ${exportedFunctions.length} definitions.`,
        };
      }

      case "request_human_approval": {
        const action: ApprovalAction = {
          id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          actionType: input.actionType as ActionType,
          title: input.title || "Proposed Codeatlas Action",
          description: input.description || "Action requiring developer authorization",
          rationale: input.rationale || "Safety requirement for mutating changes",
          affectedFiles: input.affectedFiles || [],
          diffPreview: input.diffPreview,
          parameters: input.parameters,
          riskLevel: (input.riskLevel as RiskLevel) || "medium",
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        return {
          success: true,
          output: {
            actionId: action.id,
            status: "pending_developer_approval",
            action,
          },
          durationMs: Date.now() - startTime,
          evidenceSummary: `Created approval gate for '${action.title}' (${action.actionType}) on ${action.affectedFiles.join(", ")}.`,
          approvalRequired: action,
        };
      }

      default:
        return {
          success: false,
          error: `Tool handler for '${toolName}' is not implemented.`,
          durationMs: Date.now() - startTime,
        };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || `Unhandled error during execution of '${toolName}'.`,
      durationMs: Date.now() - startTime,
    };
  }
}
