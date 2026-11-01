"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/hooks/useTheme";
import {
  Bug,
  Plus,
  Layers,
  TrendingUp,
  Wrench,
  FlaskConical,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  FolderGit2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Download,
  Printer,
  Check,
  Ban,
  Clock,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import StackTraceInput from "@/components/debug/StackTraceInput";
import StackTraceFramesView from "@/components/debug/StackTraceFramesView";
import HypothesesExplorer from "@/components/debug/HypothesesExplorer";
import FixSuggestionCard from "@/components/debug/FixSuggestionCard";
import TestRecommendationsView from "@/components/debug/TestRecommendationsView";
import DebugFollowUpPanel from "@/components/debug/DebugFollowUpPanel";
import InvestigationHistorySidebar from "@/components/debug/InvestigationHistorySidebar";
import {
  DbDebugInvestigation,
  DbDebugFollowUp,
  DebugInvestigateRequest,
} from "@/types/debug";
import {
  getDebugInvestigations,
  getDebugInvestigation,
  saveDebugInvestigation,
  deleteDebugInvestigation,
  updateInvestigationStatus,
  toggleHypothesisStatus,
  applyDebugFixToStore,
  getDebugFollowUps,
  addDebugFollowUp,
  getStore,
} from "@/lib/demo/store";
import {
  runDebugInvestigation,
  SAMPLE_DEBUG_BUGS,
} from "@/lib/demo/debug-engine";
import { aiService } from "@/services/ai-service";

function DebugContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const urlId = searchParams?.get("id") || searchParams?.get("investigation");
  const urlRepo = searchParams?.get("repo");
  const urlTrace = searchParams?.get("trace");

  const [investigations, setInvestigations] = useState<DbDebugInvestigation[]>([]);
  const [activeInvestigation, setActiveInvestigation] = useState<DbDebugInvestigation | null>(null);
  const [activeFollowUps, setActiveFollowUps] = useState<DbDebugFollowUp[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "hypotheses" | "fixes" | "tests" | "qa">("overview");

  const [isInvestigating, setIsInvestigating] = useState(false);
  const [investigationStep, setInvestigationStep] = useState<string>("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Load history from store
  const refreshHistory = () => {
    try {
      const list = getDebugInvestigations();
      setInvestigations([...list]);
      return list;
    } catch (e) {
      console.error("Failed to load debug investigations:", e);
      return [];
    }
  };

  // Select investigation
  const selectInvestigation = (id: string) => {
    const inv = getDebugInvestigation(id);
    if (inv) {
      setActiveInvestigation(inv);
      const followUps = getDebugFollowUps(id);
      setActiveFollowUps(followUps);
      setIsCreatingNew(false);
      setAiWarning(null);
      setResolutionNoteInput(inv.resolutionNote || "");
    }
  };

  // Initial mount & URL deep links
  useEffect(() => {
    const list = refreshHistory();

    // Check deep link: /debug?repo=...&trace=...
    if (urlRepo && urlTrace) {
      try {
        const decodedTrace = decodeURIComponent(urlTrace);
        handleStartInvestigation({
          repositoryId: urlRepo,
          stackTrace: decodedTrace,
        });
        return;
      } catch (e) {
        console.warn("Could not parse deep link trace param:", e);
      }
    }

    if (urlId) {
      selectInvestigation(urlId);
    } else if (list.length > 0) {
      selectInvestigation(list[0].id);
    } else {
      setIsCreatingNew(true);
    }
  }, [urlId, urlRepo, urlTrace]);

  // Handle start investigation
  const handleStartInvestigation = async (req: DebugInvestigateRequest) => {
    try {
      setIsInvestigating(true);
      setAiWarning(null);
      setInvestigationStep("Parsing stack frames and detecting runtime...");

      const store = getStore();
      const repoFiles = store.repositoryFiles?.[req.repositoryId || "sample-project"];

      setTimeout(() => setInvestigationStep("Inspecting AST & verified symbol call hierarchy..."), 300);
      setTimeout(() => setInvestigationStep("Evaluating plausible root-cause hypotheses..."), 700);

      const res = await runDebugInvestigation(req, repoFiles);

      if (!res.usedAI && res.aiError) {
        setAiWarning(`AI Service Notice: ${res.aiError}. Displaying deterministic local AST investigation.`);
      }

      saveDebugInvestigation(res.investigation);
      const updatedList = refreshHistory();
      setActiveInvestigation(res.investigation);
      setActiveFollowUps([]);
      setIsCreatingNew(false);
      setActiveTab("overview");
    } catch (e: any) {
      console.error("Investigation run failed:", e);
      setAiWarning(e.message || "Failed to complete investigation.");
    } finally {
      setIsInvestigating(false);
      setInvestigationStep("");
    }
  };

  // Retry with AI
  const handleRetryAI = async () => {
    if (!activeInvestigation) return;
    await handleStartInvestigation({
      stackTrace: activeInvestigation.rawTrace,
      repositoryId: activeInvestigation.repositoryId,
      errorMessage: activeInvestigation.errorMessage,
      logs: activeInvestigation.rawLogs,
      expectedBehavior: activeInvestigation.expectedBehavior,
      actualBehavior: activeInvestigation.actualBehavior,
    });
  };

  // Toggle hypothesis investigated
  const handleUpdateHypothesis = async (hypothesisId: string, isInvestigated: boolean) => {
    if (!activeInvestigation) return;
    toggleHypothesisStatus(activeInvestigation.id, hypothesisId, "investigated");
    selectInvestigation(activeInvestigation.id);
  };

  // Confirm root cause
  const handleConfirmRootCause = async (hypothesisId: string, summary: string) => {
    if (!activeInvestigation) return;
    toggleHypothesisStatus(activeInvestigation.id, hypothesisId, "confirmed");
    selectInvestigation(activeInvestigation.id);
  };

  // Rule out hypothesis
  const handleRuleOutHypothesis = async (hypothesisId: string) => {
    if (!activeInvestigation) return;
    toggleHypothesisStatus(activeInvestigation.id, hypothesisId, "ruled_out");
    selectInvestigation(activeInvestigation.id);
  };

  // Apply fix safely
  const handleApplyPatch = async (fixId: string, confirmed: boolean) => {
    if (!activeInvestigation) {
      throw new Error("No active investigation");
    }
    const result = applyDebugFixToStore(activeInvestigation.id, fixId);
    selectInvestigation(activeInvestigation.id);
    refreshHistory();
    return result;
  };

  // Follow-up question
  const handleAskFollowUp = async (questionText: string) => {
    if (!activeInvestigation) {
      throw new Error("No active investigation");
    }

    let responseContent = "";
    try {
      const prompt = `Context: Runtime error ${activeInvestigation.errorType}: ${activeInvestigation.errorMessage} in ${activeInvestigation.repositoryName || "repository"}.
Stack Trace:
${activeInvestigation.rawTrace || ""}
Developer question: "${questionText}"
Provide a clear, targeted, concise technical explanation with code references.`;

      responseContent = await aiService.explainCode({
        code: prompt,
        language: "markdown",
        mode: "find-bugs",
      });
    } catch (e) {
      // Local fallback contextual answer
      const qLower = questionText.toLowerCase();
      if (qLower.includes("caller") || qLower.includes("call")) {
        responseContent = `Based on the call stack, the culprit function was invoked from \`${activeInvestigation.parsedTrace?.frames[1]?.functionName || "upstream handler"}\` in \`${activeInvestigation.parsedTrace?.frames[1]?.filePath || "caller file"}\`. Check argument propagation at that call site.`;
      } else if (qLower.includes("null") || qLower.includes("undefined")) {
        responseContent = `The null/undefined dereference occurs because the expected object was not populated before property access. We recommend adding optional chaining or an early null guard.`;
      } else if (qLower.includes("fix") || qLower.includes("patch")) {
        responseContent = `The most minimal and defensive repair is to check that the container object exists prior to dereferencing the property, and throw a descriptive business error or return 400 Bad Request if missing.`;
      } else {
        responseContent = `In ${activeInvestigation.errorType}, execution failed due to an invalid state assumption. Reviewing the verified frames in the Call Stack tab confirms that the culprit line is directly targeted in the proposed patch.`;
      }
    }

    const newFollowUp: DbDebugFollowUp = {
      id: `msg_a_${Date.now()}`,
      investigationId: activeInvestigation.id,
      sender: "assistant",
      content: responseContent,
      timestamp: new Date().toISOString(),
      citedReferences: activeInvestigation.parsedTrace?.frames
        .filter((f) => f.isVerified)
        .map((f) => ({
          filePath: f.normalizedPath || f.filePath,
          line: f.line,
          symbolName: f.symbolName,
        })),
    };

    addDebugFollowUp(activeInvestigation.id, newFollowUp);
    const updated = getDebugFollowUps(activeInvestigation.id);
    setActiveFollowUps(updated);
    return newFollowUp;
  };

  // Delete investigation
  const handleDeleteInvestigation = async (id: string) => {
    deleteDebugInvestigation(id);
    const updatedList = refreshHistory();
    if (activeInvestigation?.id === id) {
      if (updatedList.length > 0) {
        selectInvestigation(updatedList[0].id);
      } else {
        setActiveInvestigation(null);
        setIsCreatingNew(true);
      }
    }
  };

  // Rename investigation
  const handleRenameInvestigation = (id: string, newTitle: string) => {
    const inv = getDebugInvestigation(id);
    if (inv) {
      inv.title = newTitle;
      saveDebugInvestigation(inv);
      refreshHistory();
      if (activeInvestigation?.id === id) {
        setActiveInvestigation({ ...inv });
      }
    }
  };

  // Toggle status (Open vs Resolved)
  const handleToggleStatus = (status: "investigating" | "resolved") => {
    if (!activeInvestigation) return;
    updateInvestigationStatus(activeInvestigation.id, status, resolutionNoteInput);
    selectInvestigation(activeInvestigation.id);
    refreshHistory();
    setIsEditingNote(false);
  };

  // Export report as Markdown
  const handleExportMarkdown = () => {
    if (!activeInvestigation) return;
    const inv = activeInvestigation;
    const md = `# CodeAtlas AI Debugger Investigation Report

**Investigation ID:** \`${inv.id}\`
**Title:** ${inv.title}
**Status:** ${inv.status.toUpperCase()}
**Repository:** ${inv.repositoryName || inv.repositoryId || "Standalone"}
**Runtime:** ${inv.runtime}
**Generated At:** ${new Date(inv.createdAt).toLocaleString()}
${inv.resolutionNote ? `\n**Resolution Note:** ${inv.resolutionNote}\n` : ""}

---

## 1. Observed Error & Divergence
- **Error Type:** \`${inv.errorType}\`
- **Error Message:** ${inv.errorMessage}
- **Expected Behavior:** ${inv.expectedBehavior || "Not specified"}
- **Actual Behavior:** ${inv.actualBehavior || inv.errorMessage}

### Raw Call Stack
\`\`\`
${inv.rawTrace || "No raw trace available"}
\`\`\`

---

## 2. Ranked Hypotheses & Evidence
${inv.hypotheses
  .map(
    (h) => `### #${h.rank} ${h.title}
- **Category:** ${h.categoryLabel}
- **Likelihood:** ${h.likelihood.toUpperCase()}
- **Confirmed Root Cause:** ${h.isConfirmedRootCause ? "YES (Verified by Developer)" : h.isRuledOut ? "RULED OUT" : "UNCONFIRMED"}
- **Explanation:** ${h.explanation}
${h.supportingEvidence.length > 0 ? `- **Supporting Evidence:**\n${h.supportingEvidence.map((e) => `  - ${e}`).join("\n")}` : ""}
${h.suggestedSteps.length > 0 ? `- **Suggested Next Steps:**\n${h.suggestedSteps.map((s) => `  - ${s}`).join("\n")}` : ""}
`
  )
  .join("\n")}

---

## 3. Repair Suggestions & Minimal Diffs
${(inv.suggestedFixes || inv.proposedFixes || [])
  .map(
    (f) => `### ${f.title}
- **File:** \`${f.filePath}\` (Lines ${f.startLine}-${f.endLine})
- **Description:** ${f.description}
- **Status:** ${f.isApplied ? `APPLIED at ${f.appliedAt}` : "PENDING"}

\`\`\`diff
${f.patchDiff || f.replacementSnippet}
\`\`\`
`
  )
  .join("\n")}

---

## 4. Test Recommendations
${inv.testRecommendations
  .map(
    (t) => `### ${t.title}
- **Target File:** \`${t.testFile}\`
- **Framework:** ${t.framework}
- **Rationale:** ${t.rationale}

\`\`\`
${t.testCode}
\`\`\`
`
  )
  .join("\n")}
`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inv.id}-debug-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="AI Debugger & Root-Cause Intelligence"
        sub="Diagnose runtime crashes, trace verified repository AST call hierarchies, evaluate ranked hypotheses, and apply verified code repairs."
      >
        <div className="flex items-center gap-2 flex-wrap">
          {activeInvestigation && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMarkdown}
                className="text-xs"
                title="Download full analysis as Markdown document"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export Report
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs"
                title="Print or save as PDF"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print / PDF
              </Button>
            </>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setIsCreatingNew(true);
              setAiWarning(null);
            }}
            className="text-xs font-semibold bg-[#7C5CFC] hover:bg-[#6846f9] text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Investigation
          </Button>
        </div>
      </PageHeader>

      {/* AI Warning / Friendly Retry Banner */}
      {aiWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-amber-500">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Offline / Fallback Analysis Active: </span>
              <span>{aiWarning}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryAI}
            className="text-xs text-amber-500 border-amber-500/40 hover:bg-amber-500/10 shrink-0 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Retry with AI
          </Button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left / Center 3 Columns */}
        <div className="lg:col-span-3 space-y-6">
          {/* New Investigation Form */}
          {isCreatingNew ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Create New Investigation
                </span>
                {activeInvestigation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-xs text-[var(--text-secondary)]"
                  >
                    Back to Active Session
                  </Button>
                )}
              </div>
              <StackTraceInput
                onInvestigate={handleStartInvestigation}
                isLoading={isInvestigating}
              />
            </div>
          ) : isInvestigating ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  AI Debugger Analyzing Crash Scenario
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
                  {investigationStep || "Evaluating call frames and repository AST..."}
                </p>
              </div>
              <div className="w-48 h-1.5 bg-[var(--bg-primary)] rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-[#7C5CFC] animate-pulse rounded-full w-2/3" />
              </div>
            </div>
          ) : activeInvestigation ? (
            <div className="space-y-6">
              {/* Active Session Summary Bar */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                        {activeInvestigation.errorType}
                      </span>
                      <h2 className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {activeInvestigation.title}
                      </h2>
                      {activeInvestigation.status === "resolved" ? (
                        <Badge variant="mint">
                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> Resolved
                        </Badge>
                      ) : activeInvestigation.status === "root_cause_confirmed" ? (
                        <Badge variant="coral">
                          <ShieldCheck className="w-3 h-3 mr-0.5" /> Root Cause Confirmed
                        </Badge>
                      ) : (
                        <Badge variant="brand">
                          <Clock className="w-3 h-3 mr-0.5" /> Open Investigation
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                      {activeInvestigation.errorMessage}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {activeInvestigation.status === "resolved" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus("investigating")}
                        className="text-xs text-[var(--text-secondary)] hover:text-amber-500"
                      >
                        Reopen Investigation
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsEditingNote(true)}
                        className="text-xs font-semibold bg-[#2FD6A0] hover:bg-[#25b586] text-black"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Mark as Resolved
                      </Button>
                    )}
                  </div>
                </div>

                {/* Resolution Note Editor or Display */}
                {isEditingNote ? (
                  <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-2">
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                      Resolution Summary / Root Cause Notes
                    </label>
                    <textarea
                      rows={2}
                      value={resolutionNoteInput}
                      onChange={(e) => setResolutionNoteInput(e.target.value)}
                      placeholder="Explain how this issue was resolved (e.g. Applied defensive null guard and opened PR #102)..."
                      className="w-full text-xs bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingNote(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleToggleStatus("resolved")}
                        className="text-xs font-semibold bg-[#2FD6A0] hover:bg-[#25b586] text-black"
                      >
                        Confirm Resolution
                      </Button>
                    </div>
                  </div>
                ) : (
                  activeInvestigation.resolutionNote && (
                    <div className="p-2.5 rounded-lg bg-[#2FD6A0]/10 border border-[#2FD6A0]/20 text-xs text-[#1BA97B] dark:text-[#2FD6A0] flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Resolution Note: </span>
                        <span>{activeInvestigation.resolutionNote}</span>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 shrink-0 border-b-2 ${
                    activeTab === "overview"
                      ? "border-[#7C5CFC] text-[#7C5CFC] bg-[#7C5CFC]/5"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Overview & Call Stack
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-primary)] font-mono">
                    {activeInvestigation.parsedTrace?.verifiedFramesCount || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("hypotheses")}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 shrink-0 border-b-2 ${
                    activeTab === "hypotheses"
                      ? "border-[#7C5CFC] text-[#7C5CFC] bg-[#7C5CFC]/5"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Hypotheses & Root Cause
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-primary)] font-mono">
                    {activeInvestigation.hypotheses?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("fixes")}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 shrink-0 border-b-2 ${
                    activeTab === "fixes"
                      ? "border-[#7C5CFC] text-[#7C5CFC] bg-[#7C5CFC]/5"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Fix Suggestions & Patch
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-primary)] font-mono">
                    {(activeInvestigation.suggestedFixes || activeInvestigation.proposedFixes || []).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("tests")}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 shrink-0 border-b-2 ${
                    activeTab === "tests"
                      ? "border-[#7C5CFC] text-[#7C5CFC] bg-[#7C5CFC]/5"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Test Recommendations
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-primary)] font-mono">
                    {activeInvestigation.testRecommendations?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("qa")}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 shrink-0 border-b-2 ${
                    activeTab === "qa"
                      ? "border-[#7C5CFC] text-[#7C5CFC] bg-[#7C5CFC]/5"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Investigation Q&A
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-primary)] font-mono">
                    {activeFollowUps?.length || 0}
                  </span>
                </button>
              </div>

              {/* Tab 1: Overview & Stack Trace */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Observed Evidence Card */}
                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Observed Runtime Evidence & Verification State
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Expected vs Actual */}
                      <div className="space-y-2 text-xs">
                        <span className="font-semibold text-[var(--text-primary)]">
                          Behavioral Divergence:
                        </span>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-1.5">
                          <div>
                            <span className="text-[10px] font-bold text-[#2FD6A0] uppercase">
                              Expected:
                            </span>{" "}
                            <span className="text-[var(--text-secondary)]">
                              {activeInvestigation.expectedBehavior || "No expected specification provided"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-red-500 uppercase">
                              Actual:
                            </span>{" "}
                            <span className="text-[var(--text-secondary)]">
                              {activeInvestigation.actualBehavior || activeInvestigation.errorMessage}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Missing Context */}
                      <div className="space-y-2 text-xs">
                        <span className="font-semibold text-[var(--text-primary)]">
                          Missing Context & External Information:
                        </span>
                        <ul className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1 text-amber-500 text-xs">
                          {activeInvestigation.observedEvidence?.missingContext && activeInvestigation.observedEvidence.missingContext.length > 0 ? (
                            activeInvestigation.observedEvidence.missingContext.map((mc, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="font-bold">•</span>
                                <span>{mc}</span>
                              </li>
                            ))
                          ) : (
                            <li className="italic">All required contextual symbols resolved from repository index.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Stack Trace Frames View */}
                  {activeInvestigation.parsedTrace && (
                    <StackTraceFramesView
                      parsedTrace={activeInvestigation.parsedTrace}
                      repositoryId={activeInvestigation.repositoryId}
                      sourceRevision={activeInvestigation.sourceRevision}
                    />
                  )}
                </div>
              )}

              {/* Tab 2: Hypotheses Explorer */}
              {activeTab === "hypotheses" && (
                <HypothesesExplorer
                  investigationId={activeInvestigation.id}
                  hypotheses={activeInvestigation.hypotheses}
                  confirmedRootCauseId={activeInvestigation.confirmedRootCauseId}
                  repositoryId={activeInvestigation.repositoryId}
                  onUpdateHypothesis={handleUpdateHypothesis}
                  onConfirmRootCause={handleConfirmRootCause}
                  onRuleOutHypothesis={handleRuleOutHypothesis}
                />
              )}

              {/* Tab 3: Fix Suggestions */}
              {activeTab === "fixes" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-[#7C5CFC]" />
                        Targeted Repair Suggestions
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Grounded minimal code fixes with readable diffs and safe preview.
                      </p>
                    </div>
                  </div>

                  {(activeInvestigation.suggestedFixes || activeInvestigation.proposedFixes || []).length === 0 ? (
                    <div className="text-center py-8 text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl">
                      No repair suggestions available. Verify source files in indexed repository.
                    </div>
                  ) : (
                    (activeInvestigation.suggestedFixes || activeInvestigation.proposedFixes || []).map((fix: any) => (
                      <FixSuggestionCard
                        key={fix.id}
                        fix={fix}
                        investigationId={activeInvestigation.id}
                        repositoryId={activeInvestigation.repositoryId}
                        isStandalone={activeInvestigation.mode === "standalone"}
                        onApplyPatch={handleApplyPatch}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Test Recommendations */}
              {activeTab === "tests" && (
                <TestRecommendationsView
                  recommendations={activeInvestigation.testRecommendations}
                  repositoryId={activeInvestigation.repositoryId}
                  isStandalone={activeInvestigation.mode === "standalone"}
                />
              )}

              {/* Tab 5: Q&A */}
              {activeTab === "qa" && (
                <DebugFollowUpPanel
                  investigationId={activeInvestigation.id}
                  initialFollowUps={activeFollowUps}
                  onAskQuestion={handleAskFollowUp}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl">
              <Bug className="w-8 h-8 text-[#7C5CFC] mx-auto mb-3" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                No Active Debugging Investigation
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                Select an investigation from the sidebar or click &ldquo;New Investigation&rdquo; to paste an error or stack trace.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreatingNew(true)}
                className="mt-4 text-xs font-semibold bg-[#7C5CFC] hover:bg-[#6846f9] text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Start Investigation
              </Button>
            </div>
          )}
        </div>

        {/* Right 1 Column: Investigation History Sidebar */}
        <div className="lg:col-span-1">
          <InvestigationHistorySidebar
            investigations={investigations}
            activeId={activeInvestigation?.id}
            onSelectInvestigation={(id) => {
              selectInvestigation(id);
            }}
            onDeleteInvestigation={handleDeleteInvestigation}
            onRenameInvestigation={handleRenameInvestigation}
            onNewInvestigation={() => {
              setIsCreatingNew(true);
              setAiWarning(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function DebugPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-xs text-[var(--text-secondary)]">
          Loading AI Debugging Workspace...
        </div>
      }
    >
      <DebugContent />
    </Suspense>
  );
}
