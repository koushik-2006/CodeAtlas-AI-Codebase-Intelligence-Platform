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
import { apiClient } from "@/services/api-client";

function DebugContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const urlId = searchParams?.get("id") || searchParams?.get("investigation");

  const [investigations, setInvestigations] = useState<DbDebugInvestigation[]>([]);
  const [activeInvestigation, setActiveInvestigation] = useState<DbDebugInvestigation | null>(null);
  const [activeFollowUps, setActiveFollowUps] = useState<DbDebugFollowUp[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "hypotheses" | "fixes" | "tests" | "qa">("overview");

  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Load investigations list
  const loadHistory = async () => {
    try {
      const res = await apiClient.get<any>("/api/debug/history");
      const data = res.data || {};
      if (res.success && data.investigations) {
        setInvestigations(data.investigations);
        return data.investigations;
      }
    } catch (e) {
      console.error("Failed to load debug history:", e);
    }
    return [];
  };

  // Load single investigation
  const selectInvestigation = async (id: string) => {
    try {
      const res = await apiClient.get<any>(`/api/debug/history/${id}`);
      const data = res.data || {};
      if (res.success && data.investigation) {
        setActiveInvestigation(data.investigation);
        setActiveFollowUps(data.followUps || []);
        setIsCreatingNew(false);
        setPageError(null);
      }
    } catch (e) {
      console.error("Failed to fetch investigation:", e);
    }
  };

  useEffect(() => {
    loadHistory().then((list: DbDebugInvestigation[]) => {
      if (urlId) {
        selectInvestigation(urlId);
      } else if (list.length > 0) {
        selectInvestigation(list[0].id);
      } else {
        setIsCreatingNew(true);
      }
    });
  }, [urlId]);

  // Handle start investigation
  const handleStartInvestigation = async (req: DebugInvestigateRequest) => {
    try {
      setIsInvestigating(true);
      setPageError(null);
      const res = await apiClient.post<any>("/api/debug/investigate", req);
      const data = res.data || {};
      if (!res.success || !data.success) {
        throw new Error(data.error || res.message || "Failed to start investigation");
      }

      setActiveInvestigation(data.investigation);
      setActiveFollowUps([]);
      setIsCreatingNew(false);
      setActiveTab("overview");
      await loadHistory();
    } catch (e: any) {
      setPageError(e.message || "Failed to run investigation");
    } finally {
      setIsInvestigating(false);
    }
  };

  // Toggle hypothesis investigated
  const handleUpdateHypothesis = async (hypothesisId: string, isInvestigated: boolean) => {
    if (!activeInvestigation) return;
    try {
      const res = await apiClient.patch<any>(`/api/debug/history/${activeInvestigation.id}`, {
        investigatedHypothesisId: hypothesisId,
        isInvestigated,
      });
      const data = res.data || {};
      if (res.success && data.investigation) {
        setActiveInvestigation(data.investigation);
        await loadHistory();
      }
    } catch (e) {
      console.error("Failed to update hypothesis:", e);
    }
  };

  // Confirm root cause
  const handleConfirmRootCause = async (hypothesisId: string, summary: string) => {
    if (!activeInvestigation) return;
    try {
      const res = await apiClient.patch<any>(`/api/debug/history/${activeInvestigation.id}`, {
        status: "root_cause_confirmed",
        confirmedRootCauseId: hypothesisId,
        confirmedRootCauseSummary: summary,
      });
      const data = res.data || {};
      if (res.success && data.investigation) {
        setActiveInvestigation(data.investigation);
        await loadHistory();
      }
    } catch (e) {
      console.error("Failed to confirm root cause:", e);
    }
  };

  // Apply patch safely
  const handleApplyPatch = async (fixId: string, confirmed: boolean) => {
    if (!activeInvestigation) {
      throw new Error("No active investigation");
    }
    const res = await apiClient.post<any>("/api/debug/apply-patch", {
      investigationId: activeInvestigation.id,
      fixId,
      confirmed,
    });
    const data = res.data || {};
    if (!res.success || !data.success) {
      throw new Error(data.error || res.message || "Failed to apply patch");
    }
    await selectInvestigation(activeInvestigation.id);
    await loadHistory();
    return data;
  };

  // Follow-up question
  const handleAskFollowUp = async (question: string) => {
    if (!activeInvestigation) {
      throw new Error("No active investigation");
    }
    const res = await apiClient.post<any>("/api/debug/follow-up", {
      investigationId: activeInvestigation.id,
      question,
    });
    const data = res.data || {};
    if (!res.success || !data.success) {
      throw new Error(data.error || res.message || "Failed to submit follow-up question");
    }
    return data.followUp;
  };

  // Delete investigation
  const handleDeleteInvestigation = async (id: string) => {
    try {
      const res = await apiClient.delete<any>(`/api/debug/history/${id}`);
      if (res.success) {
        const updatedList = await loadHistory();
        if (activeInvestigation?.id === id) {
          if (updatedList.length > 0) {
            selectInvestigation(updatedList[0].id);
          } else {
            setActiveInvestigation(null);
            setIsCreatingNew(true);
          }
        }
      }
    } catch (e) {
      console.error("Failed to delete investigation:", e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="AI Debugging & Root-Cause Intelligence"
        sub="Investigate runtime errors, trace verified call relationships, analyze plausible hypotheses, and review safe code repairs."
      >
        <div className="flex items-center gap-2">
          {activeInvestigation && (
            <Badge variant={activeInvestigation.mode === "repository_grounded" ? "mint" : "gray"}>
              {activeInvestigation.mode === "repository_grounded" ? (
                <span className="flex items-center gap-1">
                  <FolderGit2 className="w-3 h-3" />
                  {activeInvestigation.repositoryName || "Repository Grounded"}
                </span>
              ) : (
                "Standalone Mode"
              )}
            </Badge>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setIsCreatingNew(true);
              setPageError(null);
            }}
            className="text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Investigation
          </Button>
        </div>
      </PageHeader>

      {/* Global Error Banner */}
      {pageError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-red-500">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Investigation Error: </span>
            {pageError}
          </div>
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
          ) : activeInvestigation ? (
            <div className="space-y-6">
              {/* Active Session Summary Bar */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                      {activeInvestigation.errorType}
                    </span>
                    <h2 className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {activeInvestigation.title}
                    </h2>
                    {activeInvestigation.status === "root_cause_confirmed" && (
                      <Badge variant="mint">
                        <ShieldCheck className="w-3 h-3 mr-0.5" /> Confirmed
                      </Badge>
                    )}
                    {activeInvestigation.status === "resolved" && (
                      <Badge variant="cyan">
                        <CheckCircle2 className="w-3 h-3 mr-0.5" /> Resolved
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                    {activeInvestigation.errorMessage}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatingNew(true)}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    New
                  </Button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 shrink-0 border-b-2 ${
                    activeTab === "overview"
                      ? "border-[#8B7CFF] text-[#8B7CFF] bg-[#8B7CFF]/5"
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
                      ? "border-[#8B7CFF] text-[#8B7CFF] bg-[#8B7CFF]/5"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Hypotheses & Root Cause
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-primary)] font-mono">
                    {activeInvestigation.hypotheses.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("fixes")}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 shrink-0 border-b-2 ${
                    activeTab === "fixes"
                      ? "border-[#8B7CFF] text-[#8B7CFF] bg-[#8B7CFF]/5"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Fix Suggestions & Patch
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-primary)] font-mono">
                    {activeInvestigation.suggestedFixes.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("tests")}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 shrink-0 border-b-2 ${
                    activeTab === "tests"
                      ? "border-[#8B7CFF] text-[#8B7CFF] bg-[#8B7CFF]/5"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Test Recommendations
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-primary)] font-mono">
                    {activeInvestigation.testRecommendations.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("qa")}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 shrink-0 border-b-2 ${
                    activeTab === "qa"
                      ? "border-[#8B7CFF] text-[#8B7CFF] bg-[#8B7CFF]/5"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Investigation Q&A
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-primary)] font-mono">
                    {activeFollowUps.length}
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
                          {activeInvestigation.observedEvidence.missingContext.map((mc, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="font-bold">•</span>
                              <span>{mc}</span>
                            </li>
                          ))}
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
                />
              )}

              {/* Tab 3: Fix Suggestions */}
              {activeTab === "fixes" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-[#8B7CFF]" />
                        Targeted Repair Suggestions
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Grounded minimal code fixes with readable diffs and safe preview.
                      </p>
                    </div>
                  </div>

                  {activeInvestigation.suggestedFixes.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl">
                      No repair suggestions available. Verify source files in indexed repository.
                    </div>
                  ) : (
                    activeInvestigation.suggestedFixes.map((fix) => (
                      <FixSuggestionCard
                        key={fix.id}
                        fix={fix}
                        investigationId={activeInvestigation.id}
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
              <Bug className="w-8 h-8 text-[#8B7CFF] mx-auto mb-3" />
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
                className="mt-4 text-xs font-semibold"
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
