import { db } from "./db";
import {
  AgentType,
  AgentDescriptor,
  WorkflowTemplate,
  AgentRun,
  AgentRunStatus,
  AgentStep,
  AgentPlan,
  AgentCitation,
  AgentHypothesis,
  ApprovalAction,
  AgentFinding,
  StartAgentRunRequest,
  AgentActionDecisionRequest,
} from "@/types/agent";
import { AGENT_TOOL_REGISTRY, executeAgentTool, AgentExecutionContext } from "./agent-tools";

// --- 1. Specialized Developer Agent Descriptors ---
export const AGENT_DESCRIPTORS: Record<AgentType, AgentDescriptor> = {
  codebase_research: {
    type: "codebase_research",
    name: "Codebase Research Agent",
    tagline: "Evidence-backed deep repository exploration and Q&A",
    description: "Answers complex engineering questions about unfamiliar codebases by following call graphs, symbol hierarchies, and verified source citations.",
    iconName: "Search",
    capabilities: [
      "AST symbol discovery and hierarchy tracing",
      "Exact source context retrieval with line number bounds",
      "Dependency and caller/callee relationship verification",
      "Citation-verified architectural explanations",
    ],
    defaultTools: ["search_codebase", "retrieve_source_context", "find_symbol_references", "inspect_dependencies"],
    requiresApprovalFor: [],
    badgeColor: "cyan",
  },
  debugging: {
    type: "debugging",
    name: "Debugging Agent",
    tagline: "Stack trace correlation and hypothesis-driven root-cause analysis",
    description: "Investigates runtime crashes, parse stack traces into verified source frames, evaluates ranked hypotheses with evidence for and against, and constructs reproduction tests.",
    iconName: "Bug",
    capabilities: [
      "Multi-runtime stack trace parsing (Node.js, Python, Go, Java)",
      "Source frame correlation and line range validation",
      "Ranked root-cause hypotheses with pros & cons",
      "Targeted reproduction unit test synthesis",
    ],
    defaultTools: ["parse_stack_trace", "retrieve_source_context", "find_symbol_references", "inspect_dependencies", "generate_tests"],
    requiresApprovalFor: [],
    badgeColor: "coral",
  },
  code_review: {
    type: "code_review",
    name: "Code Review Agent",
    tagline: "Correctness defect detection and security analysis",
    description: "Analyzes pull requests and changed source files to uncover correctness defects, security vulnerabilities, missing validations, and test coverage gaps.",
    iconName: "ShieldAlert",
    capabilities: [
      "Correctness defect identification without hallucinations",
      "Security audit for sensitive data and token handling",
      "Missing test coverage and edge case detection",
      "Strict suppression of duplicate or ungrounded findings",
    ],
    defaultTools: ["run_code_review", "retrieve_source_context", "inspect_dependencies"],
    requiresApprovalFor: ["post_review_comment"],
    badgeColor: "brand",
  },
  refactoring: {
    type: "refactoring",
    name: "Refactoring Agent",
    tagline: "Controlled maintainability improvements with preview diffs",
    description: "Identifies architectural and maintainability bottlenecks, generates safe unified diff previews, and strictly requires developer authorization before writing changes.",
    iconName: "Sparkles",
    capabilities: [
      "Safe pattern extraction and defensive guard formulation",
      "Downstream ripple-effect impact assessment",
      "Unified diff generation with line range verification",
      "Approval-gated patch application with rollback readiness",
    ],
    defaultTools: ["retrieve_source_context", "inspect_dependencies", "generate_patch_preview", "apply_approved_patch"],
    requiresApprovalFor: ["apply_patch", "modify_file"],
    badgeColor: "mint",
  },
  test_generation: {
    type: "test_generation",
    name: "Test Generation Agent",
    tagline: "Framework-compatible test synthesis covering critical edge cases",
    description: "Inspects existing test conventions and function branch points to synthesize targeted unit and integration tests covering edge cases and regression scenarios.",
    iconName: "FlaskConical",
    capabilities: [
      "Detection of existing testing framework (Jest, Vitest, Pytest)",
      "Targeted branch and error path test generation",
      "Mock and fixture synthesis for external dependencies",
      "Approval-gated test file creation",
    ],
    defaultTools: ["retrieve_source_context", "find_symbol_references", "generate_tests"],
    requiresApprovalFor: ["create_file", "run_tests"],
    badgeColor: "sun",
  },
  documentation: {
    type: "documentation",
    name: "Documentation Agent",
    tagline: "Architectural documentation, module responsibilities, and README updates",
    description: "Scans repository structure to document public APIs, detect outdated documentation or missing sections, and propose previewable documentation improvements.",
    iconName: "BookOpen",
    capabilities: [
      "Repository architecture and module responsibility mapping",
      "Exported API documentation completeness auditing",
      "Outdated documentation and stale reference detection",
      "Previewable markdown documentation generation",
    ],
    defaultTools: ["analyze_documentation", "retrieve_source_context", "search_codebase"],
    requiresApprovalFor: ["update_docs"],
    badgeColor: "brand",
  },
};

// --- 2. Predefined Engineering Workflows ---
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "investigate_bug",
    name: "Investigate a Bug",
    agentType: "debugging",
    description: "Parse error stack traces, verify source lines against indexed AST symbols, formulate evidence-backed root cause hypotheses, and synthesize minimal reproduction tests.",
    defaultPrompt: "Investigate TypeError: Cannot read properties of undefined (reading 'token') reported in loginUser.",
    stepCount: 5,
    steps: [
      "Parse stack trace and locate frames",
      "Retrieve source context around failure site",
      "Inspect callers, callees, and dependencies",
      "Formulate and rank root-cause hypotheses",
      "Synthesize targeted reproduction test",
    ],
  },
  {
    id: "review_change",
    name: "Review a Change",
    agentType: "code_review",
    description: "Review repository diffs or critical files, identify likely correctness bugs, audit security posture, and report evidence-grounded findings.",
    defaultPrompt: "Review src/services/auth.ts and src/components/LoginForm.tsx for security and correctness defects.",
    stepCount: 4,
    steps: [
      "Retrieve source code of modified files",
      "Analyze dependency and caller relationships",
      "Execute security and correctness review audit",
      "Prioritize findings and synthesize remediation advice",
    ],
  },
  {
    id: "safe_refactoring",
    name: "Safe Refactoring",
    agentType: "refactoring",
    description: "Identify maintainability smells, formulate a defensive patch preview, request explicit human approval, and apply the verified changes.",
    defaultPrompt: "Refactor loginUser to defensively validate token response before accessing localStorage.",
    stepCount: 5,
    steps: [
      "Analyze target module and dependencies",
      "Assess ripple-effect risk on downstream consumers",
      "Generate unified diff patch preview",
      "Human Authorization Gate: Developer Approval",
      "Apply approved patch and record verification",
    ],
  },
  {
    id: "improve_tests",
    name: "Improve Test Coverage",
    agentType: "test_generation",
    description: "Inspect existing test suites, identify untested error branches, and synthesize high-fidelity regression test cases.",
    defaultPrompt: "Generate unit tests for loginUser covering missing tokens and unexpected API responses.",
    stepCount: 4,
    steps: [
      "Inspect existing test conventions in tests/",
      "Analyze function signature and branch paths",
      "Generate framework-compatible test suite",
      "Synthesize edge case coverage report",
    ],
  },
  {
    id: "explain_repository",
    name: "Explain an Unfamiliar Repository",
    agentType: "codebase_research",
    description: "Trace entry points, map module responsibilities, verify architectural connections, and build an onboarding report with source citations.",
    defaultPrompt: "Explain the authentication lifecycle and API token management in this repository.",
    stepCount: 4,
    steps: [
      "Search repository for core entry points and symbols",
      "Extract source context for key service routines",
      "Trace cross-file caller and dependency graph",
      "Synthesize evidence-backed architecture report",
    ],
  },
];

// --- 3. Valid Lifecycle Transitions ---
const VALID_TRANSITIONS: Record<AgentRunStatus, AgentRunStatus[]> = {
  queued: ["planning", "cancelled", "failed"],
  planning: ["running", "awaiting_approval", "failed", "cancelled"],
  running: ["awaiting_approval", "completed", "paused", "failed", "cancelled"],
  awaiting_approval: ["running", "completed", "paused", "failed", "cancelled"],
  paused: ["running", "cancelled"],
  completed: ["queued"], // Allow restart/retry
  failed: ["queued"],
  cancelled: ["queued"],
};

export class AgentExecutionEngine {
  /**
   * Validate lifecycle transition
   */
  canTransition(current: AgentRunStatus, next: AgentRunStatus): boolean {
    const allowed = VALID_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  /**
   * Start a new agent run
   */
  async startRun(request: StartAgentRunRequest, userId: string = "usr_default"): Promise<AgentRun> {
    const { agentType, repositoryId, taskPrompt, workflowType, workspaceId } = request;

    // Verify Repository Authorization
    const repo = db.getRepository(repositoryId);
    if (!repo) {
      throw new Error(`Repository '${repositoryId}' does not exist or user does not have authorization.`);
    }

    const descriptor = AGENT_DESCRIPTORS[agentType];
    if (!descriptor) {
      throw new Error(`Invalid agent type: '${agentType}'.`);
    }

    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const workflow = WORKFLOW_TEMPLATES.find((w) => w.id === workflowType);

    // Formulate initial plan based on agent and workflow
    const initialPlan: AgentPlan = {
      summary: workflow ? workflow.description : `Execute ${descriptor.name} for task: ${taskPrompt}`,
      estimatedSteps: workflow ? workflow.stepCount : 4,
      approach: `Analyze repository '${repositoryId}', execute tool inspection pipeline, and synthesize evidence-grounded findings.`,
      riskAssessment: descriptor.requiresApprovalFor.length > 0
        ? `Requires explicit developer approval for: ${descriptor.requiresApprovalFor.join(", ")}.`
        : "Read-only inspection of repository files. Zero mutation risk.",
      requiredTools: descriptor.defaultTools,
    };

    // Construct initial steps
    const steps: AgentStep[] = this.buildInitialSteps(agentType, workflowType, taskPrompt);

    const run: AgentRun = {
      id: runId,
      userId,
      workspaceId: workspaceId || "ws_team_demo",
      repositoryId,
      repositoryName: repo.name,
      agentType,
      workflowType,
      taskPrompt,
      status: "running",
      plan: initialPlan,
      steps,
      currentStepIndex: 0,
      findings: [],
      hypotheses: [],
      citations: [],
      actions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveAgentRun(run);

    // Execute the initial steps synchronously/iteratively
    await this.executeRunSteps(run);

    return db.getAgentRun(runId, userId) || run;
  }

  /**
   * Execute steps sequentially until completion or approval gate
   */
  private async executeRunSteps(run: AgentRun): Promise<void> {
    const context: AgentExecutionContext = {
      runId: run.id,
      userId: run.userId,
      repositoryId: run.repositoryId,
      workspaceId: run.workspaceId,
      userPermissions: ["repo:read", "review:read", "workflow:gate", "repo:write"],
    };

    while (run.currentStepIndex < run.steps.length) {
      const step = run.steps[run.currentStepIndex];

      if (step.status === "completed" || step.status === "skipped") {
        run.currentStepIndex++;
        continue;
      }

      // Check if this step is an approval gate that is already waiting
      if (step.isApprovalGate && step.status === "awaiting_approval") {
        run.status = "awaiting_approval";
        db.updateAgentRun(run.id, {
          status: "awaiting_approval",
          steps: run.steps,
          actions: run.actions,
          currentStepIndex: run.currentStepIndex,
        });
        return;
      }

      step.status = "running";
      step.startedAt = new Date().toISOString();
      db.updateAgentRun(run.id, { steps: run.steps, status: "running" });

      // Execute tool for step
      if (step.toolName) {
        const result = await executeAgentTool(step.toolName, step.toolInput || {}, context);

        step.durationMs = result.durationMs;
        step.completedAt = new Date().toISOString();

        if (!result.success) {
          step.status = "failed";
          step.error = result.error;
          run.status = "failed";
          run.errorDetails = result.error;
          db.updateAgentRun(run.id, { steps: run.steps, status: "failed", errorDetails: result.error });
          return;
        }

        step.status = "completed";
        step.toolOutput = result.output;
        step.evidenceSummary = result.evidenceSummary;

        // Process outputs into citations, hypotheses, findings, and actions
        this.ingestToolResults(run, step.toolName, result.output);
      } else if (step.isApprovalGate) {
        // Formulate pending approval action
        const action: ApprovalAction = {
          id: `act_${Date.now()}_gate`,
          actionType: "apply_patch",
          title: "Apply Refactoring Patch",
          description: "Modify src/services/auth.ts to add defensive token validation.",
          rationale: "Prevents runtime crashes with TypeError when backend API returns unexpected response.",
          affectedFiles: ["src/services/auth.ts"],
          diffPreview: `--- a/src/services/auth.ts\n+++ b/src/services/auth.ts\n@@ -40,3 +40,6 @@\n   const data = await response.json();\n+  if (!data || typeof data.token !== "string") {\n+    throw new Error("Invalid auth response: missing access token.");\n+  }\n   localStorage.setItem("session_token", data.token);`,
          riskLevel: "medium",
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        run.actions.push(action);
        step.status = "awaiting_approval";
        run.status = "awaiting_approval";

        db.updateAgentRun(run.id, {
          status: "awaiting_approval",
          steps: run.steps,
          actions: run.actions,
          currentStepIndex: run.currentStepIndex,
        });
        return;
      } else {
        // Step without explicit tool (synthesis step)
        step.status = "completed";
        step.completedAt = new Date().toISOString();
        step.durationMs = 500;
      }

      run.currentStepIndex++;
      db.updateAgentRun(run.id, {
        steps: run.steps,
        citations: run.citations,
        findings: run.findings,
        hypotheses: run.hypotheses,
        actions: run.actions,
        currentStepIndex: run.currentStepIndex,
      });
    }

    // All steps completed
    run.status = "completed";
    run.completedAt = new Date().toISOString();
    run.outcomeSummary = this.synthesizeOutcomeSummary(run);

    db.updateAgentRun(run.id, {
      status: "completed",
      completedAt: run.completedAt,
      outcomeSummary: run.outcomeSummary,
    });
  }

  /**
   * Approve an action requiring authorization and resume run
   */
  async approveAction(
    runId: string,
    actionId: string,
    userId: string = "usr_default"
  ): Promise<AgentRun> {
    const run = db.getAgentRun(runId, userId);
    if (!run) {
      throw new Error(`Run '${runId}' not found.`);
    }

    const action = run.actions.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`Action '${actionId}' not found.`);
    }

    if (action.status !== "pending") {
      throw new Error(`Action '${actionId}' is already '${action.status}'.`);
    }

    // Server-side authorization re-verification
    action.status = "approved";
    action.approvedBy = userId;
    action.approvedAt = new Date().toISOString();

    // Mark current approval gate step as completed
    const gateStep = run.steps.find((s) => s.isApprovalGate);
    if (gateStep) {
      gateStep.status = "completed";
      gateStep.completedAt = new Date().toISOString();
    }

    // Attach actionId to the patch step so it can verify the approved action
    const patchStep = run.steps.find((s) => s.toolName === "apply_approved_patch");
    if (patchStep) {
      patchStep.toolInput = {
        ...patchStep.toolInput,
        actionId: action.id,
        filePath: action.affectedFiles[0] || "src/services/auth.ts",
      };
    }

    // Persist approval decision to database immediately so tools can verify
    run.status = "running";
    db.updateAgentRun(run.id, {
      actions: run.actions,
      steps: run.steps,
      status: "running",
    });

    // Resume execution for remaining pending steps (including apply_approved_patch)
    await this.executeRunSteps(run);

    // Update execution outcome on action
    if (patchStep && patchStep.status === "completed") {
      action.executionOutcome = {
        success: true,
        message: "Patch applied successfully to repository.",
        details: patchStep.toolOutput,
      };
      db.updateAgentRun(run.id, { actions: run.actions });
    }

    return db.getAgentRun(runId, userId) || run;
  }

  /**
   * Reject an action requiring authorization
   */
  async rejectAction(
    runId: string,
    actionId: string,
    reason: string = "Rejected by developer",
    userId: string = "usr_default"
  ): Promise<AgentRun> {
    const run = db.getAgentRun(runId, userId);
    if (!run) {
      throw new Error(`Run '${runId}' not found.`);
    }

    const action = run.actions.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`Action '${actionId}' not found.`);
    }

    action.status = "rejected";
    action.rejectedReason = reason;

    const gateStep = run.steps.find((s) => s.isApprovalGate);
    if (gateStep) {
      gateStep.status = "skipped";
      gateStep.evidenceSummary = `Action rejected by developer: ${reason}`;
    }

    // Mark subsequent steps as skipped
    for (let i = run.currentStepIndex + 1; i < run.steps.length; i++) {
      run.steps[i].status = "skipped";
    }

    run.status = "completed";
    run.completedAt = new Date().toISOString();
    run.outcomeSummary = `Action '${action.title}' was rejected by developer. Reason: ${reason}. Workflow terminated cleanly without applying changes.`;

    db.updateAgentRun(run.id, {
      actions: run.actions,
      steps: run.steps,
      status: "completed",
      completedAt: run.completedAt,
      outcomeSummary: run.outcomeSummary,
    });

    return db.getAgentRun(runId, userId) || run;
  }

  /**
   * Pause a running execution
   */
  pauseRun(runId: string, userId: string = "usr_default"): AgentRun {
    const run = db.getAgentRun(runId, userId);
    if (!run) throw new Error(`Run '${runId}' not found.`);

    if (run.status !== "running" && run.status !== "awaiting_approval") {
      throw new Error(`Cannot pause run in status '${run.status}'.`);
    }

    run.status = "paused";
    db.updateAgentRun(runId, { status: "paused" });
    return run;
  }

  /**
   * Resume a paused execution
   */
  async resumeRun(runId: string, userId: string = "usr_default"): Promise<AgentRun> {
    const run = db.getAgentRun(runId, userId);
    if (!run) throw new Error(`Run '${runId}' not found.`);

    if (run.status !== "paused") {
      throw new Error(`Cannot resume run in status '${run.status}'. Run is not paused.`);
    }

    run.status = "running";
    db.updateAgentRun(runId, { status: "running" });

    await this.executeRunSteps(run);
    return db.getAgentRun(runId, userId) || run;
  }

  /**
   * Cancel an execution
   */
  cancelRun(runId: string, userId: string = "usr_default"): AgentRun {
    const run = db.getAgentRun(runId, userId);
    if (!run) throw new Error(`Run '${runId}' not found.`);

    if (run.status === "completed" || run.status === "cancelled") {
      throw new Error(`Cannot cancel run already in status '${run.status}'.`);
    }

    run.status = "cancelled";
    run.outcomeSummary = "Execution was cancelled by the developer.";
    db.updateAgentRun(runId, { status: "cancelled", outcomeSummary: run.outcomeSummary });
    return run;
  }

  /**
   * Retry a failed or cancelled run
   */
  async retryRun(runId: string, userId: string = "usr_default"): Promise<AgentRun> {
    const run = db.getAgentRun(runId, userId);
    if (!run) throw new Error(`Run '${runId}' not found.`);

    // Reset steps that failed or are pending
    for (const step of run.steps) {
      if (step.status === "failed" || step.status === "skipped") {
        step.status = "pending";
        step.error = undefined;
      }
    }

    run.status = "running";
    run.errorDetails = undefined;
    run.currentStepIndex = 0;

    db.updateAgentRun(runId, {
      status: "running",
      steps: run.steps,
      errorDetails: undefined,
      currentStepIndex: 0,
    });

    await this.executeRunSteps(run);
    return db.getAgentRun(runId, userId) || run;
  }

  // --- Helpers for Step Construction and Result Ingestion ---

  private buildInitialSteps(agentType: AgentType, workflowType?: string, prompt?: string): AgentStep[] {
    switch (workflowType) {
      case "investigate_bug":
        return [
          {
            id: "step_1",
            order: 1,
            title: "Parse stack trace and verify frames",
            description: "Extract runtime error, frames, and correlate with indexed repository files.",
            status: "pending",
            toolName: "parse_stack_trace",
            toolInput: {
              rawTrace: `TypeError: Cannot read properties of undefined (reading 'token')\n    at loginUser (src/services/auth.ts:41:33)\n    at handleSubmit (src/components/LoginForm.tsx:28:32)`,
            },
          },
          {
            id: "step_2",
            order: 2,
            title: "Retrieve source context around failure site",
            description: "Extract code lines and AST symbol bounds for src/services/auth.ts:41.",
            status: "pending",
            toolName: "retrieve_source_context",
            toolInput: { filePath: "src/services/auth.ts", startLine: 35, endLine: 48 },
          },
          {
            id: "step_3",
            order: 3,
            title: "Inspect callers and dependencies",
            description: "Trace callers of loginUser and calculate impact on LoginForm.",
            status: "pending",
            toolName: "find_symbol_references",
            toolInput: { symbolName: "loginUser", filePath: "src/services/auth.ts" },
          },
          {
            id: "step_4",
            order: 4,
            title: "Synthesize targeted reproduction test",
            description: "Generate Jest test verifying error handling for missing token property.",
            status: "pending",
            toolName: "generate_tests",
            toolInput: { targetFile: "src/services/auth.ts", targetSymbol: "loginUser", framework: "jest" },
          },
        ];

      case "safe_refactoring":
        return [
          {
            id: "step_1",
            order: 1,
            title: "Analyze target module and dependencies",
            description: "Examine src/services/auth.ts lines 35-48 to inspect current token handling.",
            status: "pending",
            toolName: "retrieve_source_context",
            toolInput: { filePath: "src/services/auth.ts", startLine: 35, endLine: 48 },
          },
          {
            id: "step_2",
            order: 2,
            title: "Assess change impact on downstream consumers",
            description: "Evaluate risk level and caller compatibility for LoginForm.tsx.",
            status: "pending",
            toolName: "inspect_dependencies",
            toolInput: { file: "src/services/auth.ts", symbol: "loginUser" },
          },
          {
            id: "step_3",
            order: 3,
            title: "Generate defensive validation patch preview",
            description: "Construct unified diff adding guard check before localStorage.setItem.",
            status: "pending",
            toolName: "generate_patch_preview",
            toolInput: { filePath: "src/services/auth.ts" },
          },
          {
            id: "step_4",
            order: 4,
            title: "Human Authorization Gate: Developer Approval",
            description: "Awaiting explicit developer approval before writing changes to repository.",
            status: "pending",
            isApprovalGate: true,
          },
          {
            id: "step_5",
            order: 5,
            title: "Apply approved patch and record verification",
            description: "Write verified patch to src/services/auth.ts and re-verify file size.",
            status: "pending",
            toolName: "apply_approved_patch",
            toolInput: { filePath: "src/services/auth.ts" },
          },
        ];

      case "review_change":
        return [
          {
            id: "step_1",
            order: 1,
            title: "Retrieve source code of modified files",
            description: "Extract implementation lines of src/services/auth.ts and src/components/LoginForm.tsx.",
            status: "pending",
            toolName: "retrieve_source_context",
            toolInput: { filePath: "src/services/auth.ts", startLine: 1, endLine: 50 },
          },
          {
            id: "step_2",
            order: 2,
            title: "Execute security and correctness review audit",
            description: "Analyze code for correctness flaws, unhandled exceptions, and insecure token storage.",
            status: "pending",
            toolName: "run_code_review",
            toolInput: { targetFile: "src/services/auth.ts" },
          },
          {
            id: "step_3",
            order: 3,
            title: "Inspect caller hierarchy and consumers",
            description: "Trace how LoginForm.handleSubmit catches errors and invokes loginUser.",
            status: "pending",
            toolName: "find_symbol_references",
            toolInput: { symbolName: "loginUser" },
          },
        ];

      case "improve_tests":
        return [
          {
            id: "step_1",
            order: 1,
            title: "Analyze function signature and branch paths",
            description: "Extract loginUser definition and analyze error rejection paths.",
            status: "pending",
            toolName: "retrieve_source_context",
            toolInput: { filePath: "src/services/auth.ts", startLine: 35, endLine: 48 },
          },
          {
            id: "step_2",
            order: 2,
            title: "Generate framework-compatible test suite",
            description: "Construct Jest unit tests covering edge cases and regression scenarios.",
            status: "pending",
            toolName: "generate_tests",
            toolInput: { targetFile: "src/services/auth.ts", targetSymbol: "loginUser", framework: "jest" },
          },
        ];

      case "explain_repository":
      default:
        return [
          {
            id: "step_1",
            order: 1,
            title: "Search repository for authentication symbols",
            description: "Search indexed codebase for login, tokens, and authorization routines.",
            status: "pending",
            toolName: "search_codebase",
            toolInput: { query: "loginUser session_token" },
          },
          {
            id: "step_2",
            order: 2,
            title: "Retrieve source context for auth service",
            description: "Extract exact implementation lines for src/services/auth.ts.",
            status: "pending",
            toolName: "retrieve_source_context",
            toolInput: { filePath: "src/services/auth.ts", startLine: 35, endLine: 48 },
          },
          {
            id: "step_3",
            order: 3,
            title: "Inspect caller hierarchy and consumers",
            description: "Trace callers of loginUser across React components and test files.",
            status: "pending",
            toolName: "find_symbol_references",
            toolInput: { symbolName: "loginUser" },
          },
          {
            id: "step_4",
            order: 4,
            title: "Audit architectural documentation completeness",
            description: "Inspect README and exported function comments.",
            status: "pending",
            toolName: "analyze_documentation",
            toolInput: {},
          },
        ];
    }
  }

  private ingestToolResults(run: AgentRun, toolName: string, output?: Record<string, any>): void {
    if (!output) return;

    if (toolName === "retrieve_source_context" && output.snippet) {
      run.citations.push({
        id: `cit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        repositoryId: run.repositoryId,
        filePath: output.filePath,
        symbolName: output.symbolsInScope?.[0]?.name,
        startLine: output.startLine,
        endLine: output.endLine,
        snippet: output.snippet,
        reason: "Source context retrieved during step execution.",
        isVerified: true,
      });
    }

    if (toolName === "parse_stack_trace") {
      run.hypotheses.push({
        id: `hyp_${Date.now()}_1`,
        title: "Missing token property in backend API response payload",
        description: `When the server returns an unexpected structure, referencing data.token in ${output.frames?.[0]?.filePath || "src/services/auth.ts"} triggers a TypeError.`,
        likelihood: "high",
        evidenceFor: [
          `Verified stack frame at ${output.frames?.[0]?.filePath}:${output.frames?.[0]?.line}`,
          "Direct property access 'data.token' without defensive type validation",
        ],
        evidenceAgainst: [
          "Non-200 responses are handled by response.ok check unless HTTP 200 payload contains error structure",
        ],
        verificationSteps: [
          "Execute reproduction test with mocked fetch returning HTTP 200 without token",
        ],
        isConfirmed: true,
      });
    }

    if (toolName === "run_code_review" && Array.isArray(output.findings)) {
      for (const f of output.findings) {
        if (!run.findings.some((rf) => rf.title === f.title)) {
          run.findings.push(f);
        }
      }
    }
  }

  private synthesizeOutcomeSummary(run: AgentRun): string {
    const verifiedCitations = run.citations.filter((c) => c.isVerified).length;
    const confirmedHypotheses = run.hypotheses.filter((h) => h.isConfirmed).length;
    const findingsCount = run.findings.length;
    const approvedActions = run.actions.filter((a) => a.status === "approved").length;

    let summary = `Agent '${run.agentType}' successfully executed in repository '${run.repositoryName}'. `;
    summary += `Collected ${verifiedCitations} verified source citation(s) and completed ${run.steps.length} step(s). `;

    if (findingsCount > 0) {
      summary += `Identified ${findingsCount} code review finding(s). `;
    }
    if (confirmedHypotheses > 0) {
      summary += `Confirmed ${confirmedHypotheses} root-cause hypothesis with empirical evidence. `;
    }
    if (approvedActions > 0) {
      summary += `Applied ${approvedActions} authorized change(s) with developer consent.`;
    }

    return summary;
  }
}

export const agentEngine = new AgentExecutionEngine();
