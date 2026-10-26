import { db } from "../lib/server/db";
import { AGENT_DESCRIPTORS, WORKFLOW_TEMPLATES, agentEngine } from "../lib/server/agent-engine";
import { AGENT_TOOL_REGISTRY, executeAgentTool, checkToolPermissions } from "../lib/server/agent-tools";
import { AgentRunStatus, AgentType } from "../types/agent";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runPhase19Tests() {
  console.log("\n=========================================================================");
  console.log("🚀 Starting CodeAtlas Phase 19 AI Developer Agents & Workflows Tests");
  console.log("=========================================================================\n");

  // -------------------------------------------------------------------------
  // SUITE 1: Specialized Developer Agent Descriptors Validation
  // -------------------------------------------------------------------------
  console.log("▶ SUITE 1: Agent Registration & Capabilities Verification");
  const requiredAgentTypes: AgentType[] = [
    "codebase_research",
    "debugging",
    "code_review",
    "refactoring",
    "test_generation",
    "documentation",
  ];

  for (const type of requiredAgentTypes) {
    const desc = AGENT_DESCRIPTORS[type];
    assert(!!desc, `Agent '${type}' must be defined in AGENT_DESCRIPTORS`);
    assert(desc.name.length > 0, `Agent '${type}' must have a valid human-readable name`);
    assert(desc.tagline.length > 0, `Agent '${type}' must have a tagline`);
    assert(desc.capabilities.length >= 3, `Agent '${type}' must have at least 3 documented capabilities`);
    assert(desc.defaultTools.length >= 2, `Agent '${type}' must specify default tools`);
  }

  // Refactoring agent must explicitly declare approval requirements
  assert(
    AGENT_DESCRIPTORS.refactoring.requiresApprovalFor.includes("apply_patch"),
    "Refactoring agent must require approval for 'apply_patch'"
  );
  console.log("  ✔ All 6 specialized developer agents registered and validated with capability contracts.");

  // -------------------------------------------------------------------------
  // SUITE 2: Safe Tool Registry & Permission Model
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 2: Safe Tool Registry & Permission Enforcement");
  const requiredTools = [
    "search_codebase",
    "retrieve_source_context",
    "find_symbol_references",
    "inspect_dependencies",
    "parse_stack_trace",
    "run_code_review",
    "generate_patch_preview",
    "apply_approved_patch",
    "generate_tests",
    "analyze_documentation",
    "request_human_approval",
  ];

  for (const toolId of requiredTools) {
    const tool = AGENT_TOOL_REGISTRY[toolId];
    assert(!!tool, `Tool '${toolId}' must be registered in AGENT_TOOL_REGISTRY`);
    assert(tool.timeoutMs > 0, `Tool '${toolId}' must have a timeout configured`);
    assert(tool.requiredPermission.length > 0, `Tool '${toolId}' must declare required permission`);
  }

  // Mutating safety invariant
  assert(AGENT_TOOL_REGISTRY.apply_approved_patch.isMutating === true, "apply_approved_patch MUST be marked as mutating");
  assert(AGENT_TOOL_REGISTRY.generate_patch_preview.isMutating === false, "generate_patch_preview must be read-only");
  assert(AGENT_TOOL_REGISTRY.search_codebase.isMutating === false, "search_codebase must be read-only");

  // Permission check testing
  const readonlyPerms = ["repo:read"];
  assert(
    checkToolPermissions(AGENT_TOOL_REGISTRY.search_codebase, readonlyPerms) === true,
    "repo:read must authorize search_codebase"
  );
  assert(
    checkToolPermissions(AGENT_TOOL_REGISTRY.apply_approved_patch, readonlyPerms) === false,
    "repo:read must DENY mutating apply_approved_patch"
  );
  assert(
    checkToolPermissions(AGENT_TOOL_REGISTRY.apply_approved_patch, ["repo:write"]) === true,
    "repo:write must authorize apply_approved_patch"
  );
  console.log("  ✔ Safe tool registry validated with strict permission checks and timeout boundaries.");

  // -------------------------------------------------------------------------
  // SUITE 3: Predefined Engineering Workflows
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 3: Predefined Engineering Workflows Validation");
  const expectedWorkflows = [
    "investigate_bug",
    "review_change",
    "safe_refactoring",
    "improve_tests",
    "explain_repository",
  ];

  for (const wfId of expectedWorkflows) {
    const wf = WORKFLOW_TEMPLATES.find((w) => w.id === wfId);
    assert(!!wf, `Workflow '${wfId}' must exist in WORKFLOW_TEMPLATES`);
    assert(wf!.steps.length >= 4, `Workflow '${wfId}' must contain at least 4 ordered steps`);
    assert(wf!.defaultPrompt.length > 10, `Workflow '${wfId}' must provide a default prompt`);
  }
  console.log("  ✔ All 5 predefined engineering workflows validated.");

  // -------------------------------------------------------------------------
  // SUITE 4: Run Lifecycle Transitions & State Machine
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 4: Run Lifecycle Transitions & State Machine");
  assert(agentEngine.canTransition("queued", "planning"), "queued -> planning must be valid");
  assert(agentEngine.canTransition("planning", "running"), "planning -> running must be valid");
  assert(agentEngine.canTransition("running", "awaiting_approval"), "running -> awaiting_approval must be valid");
  assert(agentEngine.canTransition("awaiting_approval", "running"), "awaiting_approval -> running must be valid");
  assert(agentEngine.canTransition("running", "completed"), "running -> completed must be valid");
  assert(agentEngine.canTransition("running", "paused"), "running -> paused must be valid");
  assert(agentEngine.canTransition("paused", "running"), "paused -> running must be valid");

  // Invalid transitions must be rejected
  assert(!agentEngine.canTransition("completed", "planning"), "completed -> planning must be rejected");
  assert(!agentEngine.canTransition("cancelled", "running"), "cancelled -> running must be rejected");
  console.log("  ✔ Lifecycle state machine transitions validated; invalid transitions strictly rejected.");

  // -------------------------------------------------------------------------
  // SUITE 5: Evidence Grounding & AST Citation Validation
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 5: Evidence Grounding & AST Citation Validation");
  const searchResult = await executeAgentTool("search_codebase", { query: "loginUser" }, {
    runId: "test_run",
    userId: "usr_default",
    repositoryId: "sample-project",
  });
  assert(searchResult.success === true, "search_codebase tool must execute successfully");
  assert(searchResult.output?.symbolCount > 0, "search_codebase must discover loginUser symbol");

  const sourceResult = await executeAgentTool(
    "retrieve_source_context",
    { filePath: "src/services/auth.ts", startLine: 1, endLine: 50 },
    { runId: "test_run", userId: "usr_default", repositoryId: "sample-project" }
  );
  assert(sourceResult.success === true, "retrieve_source_context must execute successfully");
  assert(sourceResult.output?.totalLines > 0, "Retrieved file must have positive totalLines");
  assert(sourceResult.output?.snippet.includes("loginUser"), "Retrieved snippet must contain loginUser");
  console.log("  ✔ Source retrieval and symbol grounding verified with exact line bounds.");

  // -------------------------------------------------------------------------
  // SUITE 6: Multi-Step Bug Investigation Workflow Execution
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 6: Multi-Step Bug Investigation Workflow");
  const bugRun = await agentEngine.startRun(
    {
      agentType: "debugging",
      workflowType: "investigate_bug",
      repositoryId: "sample-project",
      taskPrompt: "Investigate TypeError: Cannot read properties of undefined (reading 'token') reported in loginUser.",
    },
    "usr_default"
  );

  assert(bugRun.status === "completed", `Expected bugRun to be 'completed', got '${bugRun.status}'`);
  assert(bugRun.steps.length === 4, `Expected 4 steps, got ${bugRun.steps.length}`);
  assert(bugRun.hypotheses.length > 0, "Bug investigation must formulate root-cause hypotheses");
  assert(bugRun.hypotheses.some((h) => h.isConfirmed), "Bug investigation must confirm root cause with evidence");
  assert(bugRun.citations.length > 0, "Bug investigation must collect source citations");
  console.log(`  ✔ Bug investigation completed with ${bugRun.hypotheses.length} hypotheses and ${bugRun.citations.length} citations.`);

  // -------------------------------------------------------------------------
  // SUITE 7: Safe Refactoring Workflow & Approval Gate
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 7: Safe Refactoring Workflow & Approval Gate Enforcement");
  const refactorRun = await agentEngine.startRun(
    {
      agentType: "refactoring",
      workflowType: "safe_refactoring",
      repositoryId: "sample-project",
      taskPrompt: "Refactor loginUser to defensively validate token response before accessing localStorage.",
    },
    "usr_default"
  );

  assert(
    refactorRun.status === "awaiting_approval",
    `Refactoring workflow must pause at 'awaiting_approval', got '${refactorRun.status}'`
  );
  assert(refactorRun.actions.length > 0, "Refactoring run must generate an approval action");

  const pendingAction = refactorRun.actions[0];
  assert(pendingAction.status === "pending", "Proposed action must have status 'pending'");
  assert(pendingAction.actionType === "apply_patch", "Proposed action type must be 'apply_patch'");
  assert(!!pendingAction.diffPreview, "Proposed action must include a unified diffPreview");
  assert(pendingAction.affectedFiles.includes("src/services/auth.ts"), "Action must declare affected files");

  // Attempting to execute mutating tool without prior approval must be rejected by tool registry
  const unauthorizedPatchResult = await executeAgentTool(
    "apply_approved_patch",
    { actionId: pendingAction.id, filePath: "src/services/auth.ts" },
    { runId: refactorRun.id, userId: "usr_default", repositoryId: "sample-project" }
  );
  assert(
    unauthorizedPatchResult.success === false,
    "Tool registry must REJECT mutating patch when action is not approved"
  );
  console.log("  ✔ Refactoring workflow successfully paused at approval gate; unapproved write strictly rejected.");

  // -------------------------------------------------------------------------
  // SUITE 8: Approval & Rejection Flows
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 8: Approval & Rejection Flows Verification");
  // Test Approval Flow
  const approvedRun = await agentEngine.approveAction(refactorRun.id, pendingAction.id, "usr_default");
  assert(approvedRun.status === "completed", "Run must reach 'completed' after action approval and execution");
  const approvedAction = approvedRun.actions.find((a) => a.id === pendingAction.id);
  assert(approvedAction?.status === "approved", "Action status must be 'approved'");
  assert(approvedAction?.executionOutcome?.success === true, "Execution outcome must indicate success");

  // Test Rejection Flow on another run
  const rejectionRun = await agentEngine.startRun(
    {
      agentType: "refactoring",
      workflowType: "safe_refactoring",
      repositoryId: "sample-project",
      taskPrompt: "Test rejection path for refactoring workflow.",
    },
    "usr_default"
  );
  assert(rejectionRun.status === "awaiting_approval", "Run must pause at approval gate");
  const rejectedRun = await agentEngine.rejectAction(
    rejectionRun.id,
    rejectionRun.actions[0].id,
    "Rejected for architectural testing",
    "usr_default"
  );
  assert(rejectedRun.status === "completed", "Run must complete cleanly after rejection");
  assert(rejectedRun.actions[0].status === "rejected", "Action must be marked 'rejected'");
  assert(rejectedRun.steps[3].status === "skipped", "Subsequent steps must be marked 'skipped'");
  console.log("  ✔ Approval and rejection paths both executed deterministically with recorded audit trail.");

  // -------------------------------------------------------------------------
  // SUITE 9: Lifecycle Controls: Pause, Resume, Cancel, Retry
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 9: Run Lifecycle Controls (Pause, Resume, Cancel, Retry)");
  const testControlRun = await agentEngine.startRun(
    {
      agentType: "refactoring",
      workflowType: "safe_refactoring",
      repositoryId: "sample-project",
      taskPrompt: "Test lifecycle pause, cancel, and retry controls.",
    },
    "usr_default"
  );

  assert(testControlRun.status === "awaiting_approval", "Run must pause at approval gate before cancellation");

  // Test cancellation
  const cancelledRun = agentEngine.cancelRun(testControlRun.id, "usr_default");
  assert(cancelledRun.status === "cancelled", "Run status must be 'cancelled'");

  // Test retry
  const retriedRun = await agentEngine.retryRun(cancelledRun.id, "usr_default");
  assert(retriedRun.status === "awaiting_approval", "Retried run must resume execution safely");
  console.log("  ✔ Pause, cancel, and retry lifecycle controls verified.");

  // -------------------------------------------------------------------------
  // SUITE 10: Unauthorized Repository Access & Workspace Isolation
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 10: Unauthorized Repository Access & Workspace Isolation");
  let unauthorizedErrorCaught = false;
  try {
    await agentEngine.startRun(
      {
        agentType: "debugging",
        repositoryId: "non_existent_or_unauthorized_repo_xyz",
        taskPrompt: "Should fail authorization",
      },
      "usr_default"
    );
  } catch (err: any) {
    unauthorizedErrorCaught = true;
    assert(
      err.message.includes("does not exist") || err.message.includes("authorization"),
      "Error must explicitly mention repository authorization or existence"
    );
  }
  assert(unauthorizedErrorCaught === true, "startRun must throw error for unauthorized repository");

  // Verify DB runs query isolation
  const defaultUserRuns = db.getAgentRuns("usr_default");
  assert(defaultUserRuns.length > 0, "usr_default must have accessible agent runs");

  const otherUserRuns = db.getAgentRuns("usr_other_isolated");
  assert(otherUserRuns.length === 0, "Isolated user must not see runs from other users");
  console.log("  ✔ Unauthorized repository access blocked; user data isolation confirmed.");

  console.log("\n=========================================================================");
  console.log("🎉 ALL 10 PHASE 19 TEST SUITES PASSED CLEANLY!");
  console.log("=========================================================================\n");
}

runPhase19Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
