"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Bot, RefreshCw, AlertCircle, Plus, Sparkles, CheckCircle2 } from "lucide-react";
import { AgentWorkspaceHeader, AgentFilterTab } from "@/components/agents/AgentWorkspaceHeader";
import { AgentRunCard } from "@/components/agents/AgentRunCard";
import { WorkflowsSection } from "@/components/agents/WorkflowsSection";
import { AgentRunDetailView } from "@/components/agents/AgentRunDetailView";
import { NewAgentRunModal } from "@/components/agents/NewAgentRunModal";
import { AgentPolicyModal } from "@/components/agents/AgentPolicyModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  getStore,
  saveStore,
  getAgentRuns,
  getAgentRun,
  addAgentRun,
  updateAgentRun,
  deleteAgentRun,
  getAgentWorkflows,
  saveCustomWorkflow,
  getAgentPolicy,
  saveAgentPolicy,
  applyAgentDiffToStore,
  logActivity,
  subscribe,
} from "@/lib/demo/store";
import {
  AgentRun,
  WorkflowTemplate,
  AgentPolicy,
  StartAgentRunRequest,
  AgentLogLine,
} from "@/types/agent";
import {
  STANDARD_WORKFLOWS,
  validateRunPolicy,
  createInitialSteps,
  generateInitialLogs,
  generatePlanChecklist,
  synthesizeDiff,
  STEP_DEFINITIONS,
} from "@/lib/demo/agent-engine";
import { aiService } from "@/services/ai-service";

function AgentWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const runIdFromUrl = searchParams.get("id");

  // Store data
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>(STANDARD_WORKFLOWS);
  const [policy, setPolicy] = useState<AgentPolicy>(getAgentPolicy("ws_team_demo"));
  const [repositories, setRepositories] = useState<Array<{ id: string; name: string }>>([]);
  const [repositoryFiles, setRepositoryFiles] = useState<Record<string, Record<string, { code: string; language: string }>>>({});

  // Active selections & filters
  const [selectedRunId, setSelectedRunId] = useState<string | null>(runIdFromUrl || null);
  const [activeTab, setActiveTab] = useState<AgentFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [selectedRepo, setSelectedRepo] = useState<string>("all");

  // Modals
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [prefilledWorkflow, setPrefilledWorkflow] = useState<WorkflowTemplate | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);
  const showToast = (text: string, type: "success" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Initial Load from Store
  const loadStoreData = useCallback(() => {
    const store = getStore();
    const loadedRuns = getAgentRuns();
    setRuns([...loadedRuns]);

    const loadedWfs = getAgentWorkflows();
    setWorkflows([...loadedWfs]);

    const activeWs = store.activeWorkspaceId || "ws_team_demo";
    setPolicy(getAgentPolicy(activeWs));

    const repos = (store.repositories || []).map((r: any) => ({
      id: r.id,
      name: r.name,
    }));
    setRepositories(repos);

    setRepositoryFiles(store.repositoryFiles || {});

    // Sync selectedRunId with URL if valid, or default to null
    if (runIdFromUrl) {
      const found = loadedRuns.find((r) => r.id === runIdFromUrl);
      if (found) setSelectedRunId(found.id);
    }
  }, [runIdFromUrl]);

  useEffect(() => {
    loadStoreData();
    const unsub = subscribe(() => {
      loadStoreData();
    });
    return unsub;
  }, [loadStoreData]);

  // Keep URL query param in sync with selectedRunId
  useEffect(() => {
    if (selectedRunId) {
      const url = new URL(window.location.href);
      url.searchParams.set("id", selectedRunId);
      window.history.replaceState({}, "", url.toString());
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("id");
      window.history.replaceState({}, "", url.toString());
    }
  }, [selectedRunId]);

  // 2. Active Run Simulation / CI Pipeline Execution Engine
  useEffect(() => {
    const activeRuns = runs.filter((r) => r.status === "running");
    if (activeRuns.length === 0) return;

    const timer = setTimeout(() => {
      activeRuns.forEach((run) => {
        const stepIdx = run.currentStepIndex;
        const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        // Clone steps and logs
        const updatedSteps = (run.steps || []).map((s) => ({ ...s }));
        const updatedLogs = [...(run.logs || [])];
        const updatedPlan = (run.planChecklist || []).map((p) => ({ ...p }));

        // Mark current step completed
        if (updatedSteps[stepIdx]) {
          updatedSteps[stepIdx].status = "completed";
          updatedSteps[stepIdx].completedAt = new Date().toISOString();
        }

        // Check off plan checklist item
        if (updatedPlan[stepIdx]) {
          updatedPlan[stepIdx].done = true;
        }

        // Advance to next step or pause for approval
        if (stepIdx === 0) {
          // Finished Step 1 (Plan) -> Move to Step 2 (Read relevant files)
          updatedLogs.push({
            id: `log_${Date.now()}_plan`,
            timestamp: ts,
            level: "info",
            message: `Plan formulated: 5 verification milestones established. Beginning source inspection on ${run.target}.`,
            stepId: "step_read_files",
          });
          if (updatedSteps[1]) {
            updatedSteps[1].status = "running";
            updatedSteps[1].startedAt = new Date().toISOString();
          }
          updateAgentRun(run.id, {
            currentStepIndex: 1,
            steps: updatedSteps,
            logs: updatedLogs,
            planChecklist: updatedPlan,
            durationSeconds: (run.durationSeconds || 0) + 2,
          });
        } else if (stepIdx === 1) {
          // Finished Step 2 (Read files) -> Move to Step 3 (Analyze)
          updatedLogs.push({
            id: `log_${Date.now()}_read`,
            timestamp: ts,
            level: "info",
            message: `Indexed file ${run.target}. Extracted 3 symbols and import relationships.`,
            stepId: "step_analyze",
          });
          if (updatedSteps[2]) {
            updatedSteps[2].status = "running";
            updatedSteps[2].startedAt = new Date().toISOString();
          }
          updateAgentRun(run.id, {
            currentStepIndex: 2,
            steps: updatedSteps,
            logs: updatedLogs,
            planChecklist: updatedPlan,
            durationSeconds: (run.durationSeconds || 0) + 3,
          });
        } else if (stepIdx === 2) {
          // Finished Step 3 (Analyze) -> Move to Step 4 (Propose changes diff)
          const store = getStore();
          const targetFileCode = store.repositoryFiles?.[run.repositoryId]?.[run.target || ""]?.code;
          const generatedDiff = synthesizeDiff(run.templateId || "unit_tests", run.target || "src/services/auth.ts", targetFileCode, run.instructions || "");

          updatedLogs.push({
            id: `log_${Date.now()}_diff`,
            timestamp: ts,
            level: "info",
            message: `Generated targeted patch for ${generatedDiff.file}: +${generatedDiff.additions} additions, -${generatedDiff.deletions} deletions.`,
            stepId: "step_propose_changes",
          });
          if (updatedSteps[3]) {
            updatedSteps[3].status = "running";
            updatedSteps[3].startedAt = new Date().toISOString();
          }
          updateAgentRun(run.id, {
            currentStepIndex: 3,
            diff: generatedDiff,
            steps: updatedSteps,
            logs: updatedLogs,
            planChecklist: updatedPlan,
            durationSeconds: (run.durationSeconds || 0) + 3,
          });
        } else if (stepIdx === 3) {
          // Finished Step 4 (Propose changes) -> Move to Step 5 (Self-check)
          updatedLogs.push({
            id: `log_${Date.now()}_check`,
            timestamp: ts,
            level: "info",
            message: `Running automated self-check: Validating TypeScript AST, contract compatibility, and regression boundaries.`,
            stepId: "step_self_check",
          });
          if (updatedSteps[4]) {
            updatedSteps[4].status = "running";
            updatedSteps[4].startedAt = new Date().toISOString();
          }
          updateAgentRun(run.id, {
            currentStepIndex: 4,
            steps: updatedSteps,
            logs: updatedLogs,
            planChecklist: updatedPlan,
            durationSeconds: (run.durationSeconds || 0) + 2,
          });
        } else if (stepIdx === 4) {
          // Finished Step 5 (Self-check) -> Move to Step 6 (Wait for approval or Apply)
          if (run.requireApproval) {
            updatedLogs.push({
              id: `log_${Date.now()}_gate`,
              timestamp: ts,
              level: "warn",
              message: `Self-check passed (0 errors). Execution halted: Awaiting developer review and explicit authorization gate to apply changes.`,
              stepId: "step_wait_for_approval",
            });
            if (updatedSteps[5]) {
              updatedSteps[5].status = "waiting";
              updatedSteps[5].startedAt = new Date().toISOString();
            }
            updateAgentRun(run.id, {
              status: "awaiting_approval",
              currentStepIndex: 5,
              steps: updatedSteps,
              logs: updatedLogs,
              planChecklist: updatedPlan,
              durationSeconds: (run.durationSeconds || 0) + 2,
            });
            showToast("Agent run paused: Awaiting your approval to apply changes.", "info");
          } else {
            // Auto-apply if approval not required
            applyAgentDiffToStore(run);
          }
        }
      });

      // Reload updated runs state
      setRuns([...getAgentRuns()]);
    }, 1200);

    return () => clearTimeout(timer);
  }, [runs]);

  // 3. User Actions: Start Run, Approve, Request Changes, Reject, Controls
  const handleStartRun = async (request: StartAgentRunRequest) => {
    const store = getStore();
    const activeWs = store.activeWorkspaceId || "ws_team_demo";
    const currentPolicy = getAgentPolicy(activeWs);

    // Policy check
    const policyResult = validateRunPolicy(currentPolicy, request);
    const runId = `run_${Date.now()}`;
    const targetFile = request.target || "src/services/auth.ts";
    const tmplId = request.templateId || "unit_tests";
    const tmpl = workflows.find((w) => w.id === tmplId) || workflows[0];
    const repoObj = repositories.find((r) => r.id === request.repositoryId);

    const initialSteps = createInitialSteps();
    const planItems = generatePlanChecklist(tmplId, targetFile);
    const initialDiff = synthesizeDiff(
      tmplId,
      targetFile,
      store.repositoryFiles?.[request.repositoryId]?.[targetFile]?.code,
      request.instructions || request.taskPrompt
    );

    const newRun: AgentRun = {
      id: runId,
      userId: "usr_demo",
      workspaceId: activeWs,
      repositoryId: request.repositoryId,
      repositoryName: repoObj?.name || request.repositoryId,
      agentType: tmpl?.agentType || "test_generation",
      templateId: tmplId,
      templateName: tmpl?.name || "Autonomous Task",
      taskPrompt: request.taskPrompt,
      title: `${tmpl?.name || "Task"} on ${targetFile}`,
      target: targetFile,
      stackTrace: request.stackTrace,
      instructions: request.instructions || request.taskPrompt,
      requireApproval: request.options?.requireApproval ?? true,
      maxFilesToChange: request.options?.maxFilesToChange ?? 3,
      status: policyResult.allowed ? "running" : "failed",
      currentStepIndex: 0,
      diff: initialDiff,
      steps: initialSteps,
      planChecklist: planItems,
      logs: generateInitialLogs({ repositoryName: repoObj?.name || request.repositoryId, title: request.taskPrompt, requireApproval: request.options?.requireApproval ?? true }),
      filesTouched: [targetFile],
      tokensUsed: 620,
      durationSeconds: 2,
      startedBy: { id: "usr_demo", name: "Alex Chen", email: "alex@codeatlas.dev" },
      findings: [],
      hypotheses: [],
      citations: [],
      actions: [],
      errorDetails: policyResult.allowed ? undefined : policyResult.reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!policyResult.allowed) {
      newRun.logs?.push({
        id: `log_blocked_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: "error",
        message: policyResult.reason || "Blocked by policy.",
        stepId: "step_plan",
      });
      newRun.steps[0].status = "failed";
      newRun.steps[0].error = policyResult.reason;
    }

    addAgentRun(newRun);
    setRuns(getAgentRuns());
    setSelectedRunId(newRun.id);

    if (policyResult.allowed) {
      showToast(`Launched agent run: ${newRun.title}!`);
    } else {
      showToast(`Run blocked by workspace policy: ${policyResult.reason}`, "info");
    }
  };

  const handleApproveAndApply = async () => {
    if (!selectedRunId) return;
    const run = getAgentRun(selectedRunId);
    if (!run || !run.diff) return;

    applyAgentDiffToStore(run);
    setRuns(getAgentRuns());
    showToast("Approved & Applied! Created Pull Request in Code Review.");
  };

  const handleRequestChanges = async (feedback: string) => {
    if (!selectedRunId) return;
    const run = getAgentRun(selectedRunId);
    if (!run) return;

    const ts = new Date().toLocaleTimeString();
    const targetFileCode = repositoryFiles[run.repositoryId]?.[run.target || ""]?.code;
    const regeneratedDiff = synthesizeDiff(run.templateId || "unit_tests", run.target || "src/services/auth.ts", targetFileCode, run.instructions || "", feedback);

    const updatedLogs = [...(run.logs || [])];
    updatedLogs.push({
      id: `log_fb_${Date.now()}`,
      timestamp: ts,
      level: "warn",
      message: `Developer requested changes: "${feedback}". Regenerating unified diff and re-executing self-checks...`,
      stepId: "step_propose_changes",
    });
    updatedLogs.push({
      id: `log_regen_${Date.now()}`,
      timestamp: ts,
      level: "success",
      message: `Regenerated diff patch incorporating requested adjustments: +${regeneratedDiff.additions} additions.`,
      stepId: "step_propose_changes",
    });

    updateAgentRun(run.id, {
      diff: regeneratedDiff,
      logs: updatedLogs,
      status: "awaiting_approval",
    });

    setRuns(getAgentRuns());
    showToast("Feedback submitted! Regenerated diff awaiting approval.");
  };

  const handleReject = async () => {
    if (!selectedRunId) return;
    const run = getAgentRun(selectedRunId);
    if (!run) return;

    const ts = new Date().toLocaleTimeString();
    const updatedLogs = [...(run.logs || [])];
    updatedLogs.push({
      id: `log_rej_${Date.now()}`,
      timestamp: ts,
      level: "error",
      message: "Proposed changes rejected by developer. Run ended with no repository modifications.",
      stepId: "step_wait_for_approval",
    });

    updateAgentRun(run.id, {
      status: "cancelled",
      logs: updatedLogs,
      completedAt: new Date().toISOString(),
    });

    setRuns(getAgentRuns());
    showToast("Run rejected and ended.");
  };

  const handlePause = (runId: string) => {
    updateAgentRun(runId, { status: "paused" });
    setRuns(getAgentRuns());
    showToast("Agent run paused.");
  };

  const handleResume = (runId: string) => {
    updateAgentRun(runId, { status: "running" });
    setRuns(getAgentRuns());
    showToast("Agent run resumed.");
  };

  const handleCancel = (runId: string) => {
    const run = getAgentRun(runId);
    const updatedLogs = [...(run?.logs || [])];
    updatedLogs.push({
      id: `log_cancel_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      level: "warn",
      message: "Run cancelled by user.",
    });

    updateAgentRun(runId, {
      status: "cancelled",
      logs: updatedLogs,
      completedAt: new Date().toISOString(),
    });
    setRuns(getAgentRuns());
    showToast("Agent run cancelled.");
  };

  const handleRetry = (runId: string) => {
    const initialSteps = createInitialSteps();
    updateAgentRun(runId, {
      status: "running",
      currentStepIndex: 0,
      steps: initialSteps,
      errorDetails: undefined,
    });
    setRuns(getAgentRuns());
    showToast("Retrying agent run from Step 1...");
  };

  const handleAskAgent = async (question: string) => {
    if (!selectedRunId) return;
    const run = getAgentRun(selectedRunId);
    if (!run) return;

    const ts = new Date().toLocaleTimeString();
    const updatedLogs = [...(run.logs || [])];
    updatedLogs.push({
      id: `log_q_${Date.now()}`,
      timestamp: ts,
      level: "info",
      message: `User asked: "${question}"`,
    });

    let answer = `Based on the repository context and AST for ${run.target}, the proposed changes isolate runtime null dereferences, satisfy test coverage contracts, and preserve all exported public interfaces.`;

    try {
      if (typeof window !== "undefined") {
        const streamAnswer = await aiService.streamAnswer({
          prompt: `Question about code change in ${run.target}: ${question}\nSummary of task: ${run.instructions}`,
          onChunk: () => {},
        });
        if (streamAnswer && streamAnswer.trim().length > 10) {
          answer = streamAnswer.trim();
        }
      }
    } catch {
      // Fallback pre-written response
    }

    updatedLogs.push({
      id: `log_a_${Date.now()}`,
      timestamp: ts,
      level: "success",
      message: `Agent response: ${answer}`,
    });

    updateAgentRun(run.id, { logs: updatedLogs });
    setRuns(getAgentRuns());
  };

  const handleRunWorkflow = (wf: WorkflowTemplate) => {
    setPrefilledWorkflow(wf);
    setIsNewRunModalOpen(true);
  };

  const handleSavePolicy = (newPolicy: Partial<AgentPolicy>) => {
    const store = getStore();
    const activeWs = store.activeWorkspaceId || "ws_team_demo";
    saveAgentPolicy(activeWs, newPolicy);
    setPolicy(getAgentPolicy(activeWs));
    showToast("Safety policies saved for this workspace.");
  };

  const handleCreateCustomWorkflow = (newWf: WorkflowTemplate) => {
    saveCustomWorkflow(newWf);
    setWorkflows(getAgentWorkflows());
    showToast(`Saved custom workflow: ${newWf.name}`);
  };

  // 4. Filter and Sort Runs
  const filteredRuns = runs.filter((r) => {
    // Tab filter
    if (activeTab === "running" && r.status !== "running") return false;
    if (activeTab === "awaiting_approval" && r.status !== "awaiting_approval") return false;
    if (activeTab === "completed" && r.status !== "completed") return false;
    if (activeTab === "failed" && r.status !== "failed") return false;
    if (activeTab === "cancelled" && r.status !== "cancelled") return false;

    // Repo filter
    if (selectedRepo !== "all" && r.repositoryId !== selectedRepo) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (r.title || "").toLowerCase().includes(q);
      const matchPrompt = (r.taskPrompt || "").toLowerCase().includes(q);
      const matchRepo = (r.repositoryName || r.repositoryId || "").toLowerCase().includes(q);
      const matchTarget = (r.target || "").toLowerCase().includes(q);
      if (!matchTitle && !matchPrompt && !matchRepo && !matchTarget) return false;
    }

    return true;
  });

  const sortedRuns = [...filteredRuns].sort((a, b) => {
    const tA = new Date(a.createdAt || 0).getTime();
    const tB = new Date(b.createdAt || 0).getTime();
    return sortBy === "newest" ? tB - tA : tA - tB;
  });

  // Calculate stats
  const runningCount = runs.filter((r) => r.status === "running").length;
  const waitingApprovalCount = runs.filter((r) => r.status === "awaiting_approval").length;
  const completedCount = runs.filter((r) => r.status === "completed").length;
  const failedCount = runs.filter((r) => r.status === "failed").length;
  const totalFinished = completedCount + failedCount;
  const successRate = totalFinished > 0 ? Math.round((completedCount / totalFinished) * 100) : 95;

  const selectedRun = runs.find((r) => r.id === selectedRunId) || null;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-[#0D111A] border border-[#7C5CFC]/40 text-xs font-semibold text-[#19143D] dark:text-[#F3F5FA] shadow-xl animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header, Stats Bar & Filters */}
      <AgentWorkspaceHeader
        stats={{
          running: runningCount,
          waitingApproval: waitingApprovalCount,
          completedToday: completedCount,
          successRate,
        }}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedRepo={selectedRepo}
        onSelectRepo={setSelectedRepo}
        repositories={repositories}
        onNewRun={() => {
          setPrefilledWorkflow(null);
          setIsNewRunModalOpen(true);
        }}
        onOpenPolicy={() => setIsPolicyModalOpen(true)}
      />

      {/* Main Workspace Area */}
      {selectedRun ? (
        // Split Screen or Dedicated Detail View
        <div className="space-y-6">
          <AgentRunDetailView
            run={selectedRun}
            onApproveAndApply={handleApproveAndApply}
            onRequestChanges={handleRequestChanges}
            onReject={handleReject}
            onPause={() => handlePause(selectedRun.id)}
            onResume={() => handleResume(selectedRun.id)}
            onCancel={() => handleCancel(selectedRun.id)}
            onRetry={() => handleRetry(selectedRun.id)}
            onAskAgent={handleAskAgent}
            onBackToList={() => setSelectedRunId(null)}
          />

          {/* Workflow Templates section below detail view */}
          <WorkflowsSection
            workflows={workflows}
            onRunWorkflow={handleRunWorkflow}
            onCreateCustomWorkflow={handleCreateCustomWorkflow}
          />
        </div>
      ) : (
        // List of Run Cards & Workflows Section
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold text-[#19143D] dark:text-[#F3F5FA] flex items-center gap-2">
                <span>Recent Agent Executions</span>
                <span className="text-xs font-mono font-medium text-[#8E95A8]">
                  ({sortedRuns.length} runs)
                </span>
              </h2>
            </div>

            {sortedRuns.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] space-y-3">
                <Bot className="w-10 h-10 text-[#7C5CFC] mx-auto opacity-70" />
                <h3 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA]">
                  Start your first agent run
                </h3>
                <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] max-w-md mx-auto">
                  No runs match the current criteria. Select a workflow template below or launch a new run to generate tests, fix bugs, or audit code.
                </p>
                <button
                  onClick={() => setIsNewRunModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6A4BE8] text-white text-xs font-semibold shadow-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Launch Agent Run</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedRuns.map((run) => (
                  <AgentRunCard
                    key={run.id}
                    run={run}
                    isSelected={run.id === selectedRunId}
                    onSelect={() => setSelectedRunId(run.id)}
                    onPause={handlePause}
                    onResume={handleResume}
                    onCancel={handleCancel}
                    onRetry={handleRetry}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Workflow Templates Section */}
          <WorkflowsSection
            workflows={workflows}
            onRunWorkflow={handleRunWorkflow}
            onCreateCustomWorkflow={handleCreateCustomWorkflow}
          />
        </div>
      )}

      {/* Modals */}
      <NewAgentRunModal
        isOpen={isNewRunModalOpen}
        onClose={() => setIsNewRunModalOpen(false)}
        onSubmit={handleStartRun}
        workflows={workflows}
        repositories={repositories}
        repositoryFiles={repositoryFiles}
        policy={policy}
        initialWorkflow={prefilledWorkflow}
        initialRepo={selectedRepo !== "all" ? selectedRepo : "sample-project"}
      />

      <AgentPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        policy={policy}
        workflows={workflows}
        onSavePolicy={handleSavePolicy}
      />
    </div>
  );
}

export default function AgentWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#8E95A8]">
          Loading Agent Workspace...
        </div>
      }
    >
      <AgentWorkspaceContent />
    </Suspense>
  );
}
