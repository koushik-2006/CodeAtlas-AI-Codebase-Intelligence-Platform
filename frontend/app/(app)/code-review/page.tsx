"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/hooks/useTheme";
import { useRepositories } from "@/hooks/useRepositories";
import { DiffViewer } from "@/components/review/DiffViewer";
import { FindingsList } from "@/components/review/FindingsList";
import { ReviewImpactSidebar } from "@/components/review/ReviewImpactSidebar";
import { PublishCommentModal } from "@/components/review/PublishCommentModal";
import { FindingDiscussionPanel } from "@/components/review/FindingDiscussionPanel";
import { NewReviewModal } from "@/components/review/NewReviewModal";
import { codeReviewService } from "@/services/code-review-service";
import {
  PullRequestDetail,
  ReviewSession,
  ReviewFinding,
  FindingStatus,
  PRReviewStatus,
} from "@/types/review";
import {
  getStore,
  getPullRequestById,
  mergePullRequest,
  closePullRequest,
  reopenPullRequest,
  addInlineComment,
  replyToInlineComment,
  toggleChecklistItem,
  toggleViewedFile,
  applyFindingSuggestion,
  updateFindingDecision,
  updatePullRequest,
  logActivity,
} from "@/lib/demo/store";
import {
  GitPullRequest,
  FolderGit2,
  GitBranch,
  FileCode,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Search,
  Plus,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  MessageSquare,
  Clock,
  CheckSquare,
  Square,
  Check,
  Flame,
  Globe,
  Bot,
  User,
  GitMerge,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

function CodeReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { repositories } = useRepositories();

  const repoFromUrl = searchParams?.get("repo") || "all";
  const prFromUrl = searchParams?.get("pr") || "101";

  // State
  const [selectedRepo, setSelectedRepo] = useState<string>(repoFromUrl);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [tabFilter, setTabFilter] = useState<string>("open");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [pullRequests, setPullRequests] = useState<PullRequestDetail[]>([]);
  const [selectedPrId, setSelectedPrId] = useState<string>(prFromUrl);
  const [currentPr, setCurrentPr] = useState<PullRequestDetail | null>(null);

  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"overview" | "diff" | "findings" | "impact">("overview");
  const [isSecurityOnly, setIsSecurityOnly] = useState<boolean>(false);

  // Modals & Panels
  const [activeDiscussionFinding, setActiveDiscussionFinding] = useState<ReviewFinding | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isNewReviewModalOpen, setIsNewReviewModalOpen] = useState(false);
  const [diffHighlightLocation, setDiffHighlightLocation] = useState<{ file: string; line: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Refresh Pull Requests list from store
  const refreshPRList = () => {
    codeReviewService.getPullRequests(selectedRepo, sourceFilter, tabFilter).then((prs) => {
      setPullRequests(prs);
      // If current selected PR is not in the list, or none selected, pick the first
      if (prs.length > 0) {
        const found = prs.find((p) => p.id === selectedPrId || String(p.number) === selectedPrId);
        if (!found && !selectedPrId) {
          setSelectedPrId(prs[0].id);
        }
      }
    });
  };

  useEffect(() => {
    refreshPRList();
  }, [selectedRepo, sourceFilter, tabFilter]);

  // 2. Load PR Detail and Session when selectedPrId changes
  useEffect(() => {
    if (!selectedPrId) return;

    let isMounted = true;
    codeReviewService.getPullRequestDetail(selectedRepo, selectedPrId).then((pr) => {
      if (!isMounted || !pr) return;
      setCurrentPr(pr);

      // Check existing review session or run review
      setIsAnalyzing(true);
      codeReviewService
        .runCodeReview(pr.repositoryId || "sample-project", pr.number, isSecurityOnly)
        .then((session) => {
          if (!isMounted) return;
          setReviewSession(session);
          setIsAnalyzing(false);
        })
        .catch((err) => {
          console.error("Error analyzing PR:", err);
          if (isMounted) setIsAnalyzing(false);
        });
    });

    return () => {
      isMounted = false;
    };
  }, [selectedPrId, isSecurityOnly]);

  // Handle URL change when switching PR
  const handleSelectPr = (pr: PullRequestDetail) => {
    setSelectedPrId(pr.id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("pr", String(pr.number));
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Filtered PR list
  const filteredPrs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return pullRequests;
    return pullRequests.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        String(p.number).includes(q) ||
        p.author.name.toLowerCase().includes(q) ||
        p.headBranch.toLowerCase().includes(q)
    );
  }, [pullRequests, searchQuery]);

  // Action Handlers
  const handleApprove = () => {
    if (!currentPr) return;
    updatePullRequest(currentPr.id, { reviewStatus: "approved" });
    logActivity({
      type: "review_approved",
      title: `Approved Pull Request #${currentPr.number}`,
      description: `Approved changes for "${currentPr.title}".`,
      href: `/code-review?pr=${currentPr.id}`,
      status: "success",
    });
    showToast(`Pull Request #${currentPr.number} approved.`);
    refreshPRList();
    if (currentPr) setCurrentPr({ ...currentPr, reviewStatus: "approved" });
  };

  const handleRequestChanges = () => {
    if (!currentPr) return;
    setIsPublishModalOpen(true);
  };

  const handleMerge = () => {
    if (!currentPr) return;
    if (currentPr.isRealGitHubPr) {
      alert("Only repository administrators can merge directly on GitHub via branch protection rules.");
      return;
    }

    const res = mergePullRequest(currentPr.id);
    if (res.success) {
      showToast(res.message);
      refreshPRList();
      if (currentPr) setCurrentPr({ ...currentPr, state: "merged", reviewStatus: "approved" });
    }
  };

  const handleToggleClose = () => {
    if (!currentPr) return;
    if (currentPr.state === "open") {
      closePullRequest(currentPr.id);
      showToast(`Pull Request #${currentPr.number} closed.`);
      if (currentPr) setCurrentPr({ ...currentPr, state: "closed" });
    } else {
      reopenPullRequest(currentPr.id);
      showToast(`Pull Request #${currentPr.number} reopened.`);
      if (currentPr) setCurrentPr({ ...currentPr, state: "open" });
    }
    refreshPRList();
  };

  const handleChecklistToggle = (checklistId: string) => {
    if (!currentPr) return;
    toggleChecklistItem(currentPr.id, checklistId);
    const updatedPr = getPullRequestById(currentPr.id);
    if (updatedPr) {
      setCurrentPr({ ...updatedPr, checklist: [...(updatedPr.checklist || [])] });
    }
  };

  const handleViewedFileToggle = (filename: string) => {
    if (!currentPr) return;
    toggleViewedFile(currentPr.id, filename);
    const updatedPr = getPullRequestById(currentPr.id);
    if (updatedPr) {
      setCurrentPr({ ...updatedPr, viewedFiles: { ...(updatedPr.viewedFiles || {}) } });
    }
  };

  const handleApplySuggestion = (findingId: string, suggestionDiff?: string) => {
    if (!currentPr) return;
    const res = applyFindingSuggestion(currentPr.id, findingId, suggestionDiff);
    if (res.success) {
      showToast("Fix suggestion applied to PR diff.");
      // Update finding status in local state
      setReviewSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          findings: prev.findings.map((f) =>
            f.id === findingId ? { ...f, status: "accepted", accepted: true } : f
          ),
        };
      });
      refreshPRList();
    }
  };

  const handleUpdateFindingStatus = (findingId: string, status: FindingStatus, reason?: string) => {
    if (!currentPr) return;
    updateFindingDecision(currentPr.id, findingId, status, reason);
    setReviewSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        findings: prev.findings.map((f) =>
          f.id === findingId ? { ...f, status, dismissReason: reason, accepted: status === "accepted" } : f
        ),
      };
    });
    showToast(`Finding marked as ${status}.`);
  };

  const handleJumpToDiff = (file: string, line: number) => {
    setDiffHighlightLocation({ file, line });
    setActiveDetailTab("diff");
  };

  const handleAddInlineComment = (file: string, line: number, text: string) => {
    if (!currentPr) return;
    const newComment = addInlineComment(currentPr.id, { file, line, text });
    if (newComment) {
      showToast("Inline comment added.");
      setCurrentPr((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          inlineComments: [...(prev.inlineComments || []), newComment],
        };
      });
    }
  };

  const handleReplyInlineComment = (commentId: string, text: string) => {
    if (!currentPr) return;
    replyToInlineComment(currentPr.id, commentId, { text });
    showToast("Reply posted in thread.");
    // Re-fetch PR detail
    codeReviewService.getPullRequestDetail(selectedRepo, currentPr.id).then((pr) => {
      if (pr) setCurrentPr(pr);
    });
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#7C5CFC] text-white font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="AI Code Review & Pull Request Intelligence"
        sub="Inspect pull request diffs in context, detect architectural regressions, discover test gaps, and verify code changes before merging."
      />

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Pull Requests List Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-3">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
                <GitPullRequest className="w-4 h-4 text-[#7C5CFC]" />
                <span>Pull Requests</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                  {filteredPrs.length}
                </span>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewReviewModalOpen(true)}
                className="bg-[#7C5CFC] text-white hover:bg-[#6A4BE2] text-xs h-7 px-2.5 gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Review</span>
              </Button>
            </div>

            {/* Filter Tabs: Open / Needs Review / Approved / Merged / Closed */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px] font-semibold border-b border-[var(--border-color)]">
              {[
                { id: "open", label: "Open" },
                { id: "needs_review", label: "Needs Review" },
                { id: "approved", label: "Approved" },
                { id: "merged", label: "Merged" },
                { id: "closed", label: "Closed" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTabFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors ${
                    tabFilter === tab.id
                      ? "bg-[#7C5CFC]/15 text-[#7C5CFC] font-bold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PRs (#number, title, branch)..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]"
              />
            </div>

            {/* Source & Repo Filter row */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-secondary)] uppercase mb-0.5">
                  Source
                </label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full p-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold outline-none cursor-pointer"
                >
                  <option value="all">All Sources</option>
                  <option value="demo">Demo Seeded</option>
                  <option value="agent">Agent Workspace</option>
                  <option value="debugger">AI Debugger</option>
                  <option value="refactoring">Refactoring</option>
                  <option value="github">GitHub PRs</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[var(--text-secondary)] uppercase mb-0.5">
                  Repository
                </label>
                <select
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="w-full p-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold outline-none cursor-pointer truncate"
                >
                  <option value="all">All Repositories</option>
                  {repositories.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PR Items List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredPrs.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--text-secondary)] space-y-1">
                  <GitPullRequest className="w-7 h-7 mx-auto opacity-40 text-[#7C5CFC]" />
                  <p className="font-semibold">No pull requests found</p>
                  <p className="text-[11px]">Create a new review or change filters above.</p>
                </div>
              ) : (
                filteredPrs.map((pr) => {
                  const isSelected = currentPr?.id === pr.id || String(currentPr?.number) === String(pr.number);
                  const isMerged = pr.state === "merged";
                  const isClosed = pr.state === "closed";

                  return (
                    <div
                      key={pr.id}
                      onClick={() => handleSelectPr(pr)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? "bg-[#7C5CFC]/10 border-[#7C5CFC] shadow-sm"
                          : "bg-[var(--bg-card-hover)]/40 border-[var(--border-color)] hover:border-[#7C5CFC]/50 hover:bg-[var(--bg-card-hover)]"
                      }`}
                    >
                      {/* Top Row: #number + status + risk badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-[var(--text-primary)]">
                          <span className="text-[#7C5CFC]">#{pr.number}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                              isMerged
                                ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                                : isClosed
                                ? "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30"
                                : pr.reviewStatus === "approved"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : pr.reviewStatus === "changes_requested"
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {isMerged
                              ? "Merged"
                              : isClosed
                              ? "Closed"
                              : pr.reviewStatus?.replace("_", " ") || "Open"}
                          </span>
                        </div>

                        {pr.riskLevel && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                              pr.riskLevel === "Critical" || pr.riskLevel === "High"
                                ? "bg-rose-500/15 text-rose-400"
                                : pr.riskLevel === "Medium"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-emerald-500/15 text-emerald-400"
                            }`}
                          >
                            {pr.riskLevel} Risk
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-xs text-[var(--text-primary)] leading-snug line-clamp-2">
                        {pr.title}
                      </h4>

                      {/* Branch & Metrics Row */}
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-mono">
                        <span className="truncate max-w-[170px]">
                          {pr.headBranch} &rarr; {pr.baseBranch}
                        </span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-emerald-400">+{pr.additions}</span>
                          <span className="text-rose-400">-{pr.deletions}</span>
                        </div>
                      </div>

                      {/* Author & Source */}
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border-color)]/40">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={pr.author.avatar}
                            alt={pr.author.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="truncate max-w-[100px]">{pr.author.name}</span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded bg-[var(--bg-card)] border border-[var(--border-color)] font-mono">
                          {pr.source || "Demo"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PR Detail & Review Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {currentPr ? (
            <>
              {/* PR Header Card */}
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-4">
                {/* Title & Badges */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-mono font-black text-[#7C5CFC]">
                        #{currentPr.number}
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                        {currentPr.title}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          currentPr.state === "merged"
                            ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                            : currentPr.state === "closed"
                            ? "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {currentPr.state.toUpperCase()}
                      </span>
                    </div>

                    {/* Metadata & branches */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={currentPr.author.avatar}
                          alt={currentPr.author.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <strong className="text-[var(--text-primary)]">{currentPr.author.name}</strong>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <GitBranch className="w-3.5 h-3.5 text-[#7C5CFC]" />
                        <strong className="text-[var(--text-primary)]">{currentPr.headBranch}</strong>
                        <span>into</span>
                        <strong className="text-[var(--text-primary)]">{currentPr.baseBranch}</strong>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-emerald-400 font-bold">+{currentPr.additions}</span>
                        <span className="text-rose-400 font-bold">-{currentPr.deletions}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top-Right GitHub / Source Link */}
                  <a
                    href={currentPr.githubUrl || `https://github.com/codeatlas-demo/${currentPr.repositoryId || "sample-project"}/pull/${currentPr.number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--border-color)] bg-[var(--bg-card-hover)] text-[var(--text-primary)] hover:border-[#7C5CFC] transition-colors"
                  >
                    <span>Open on GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Action Buttons Strip: Approve / Request Changes / Comment / Merge / Close */}
                <div className="pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Approve */}
                    <Button
                      variant="primary"
                      size="sm"
                      data-testid="approve-pr-btn"
                      onClick={handleApprove}
                      disabled={currentPr.state !== "open"}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </Button>

                    {/* Request changes */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestChanges}
                      disabled={currentPr.state !== "open"}
                      className="text-xs h-8 px-3 gap-1.5 text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Request Changes</span>
                    </Button>

                    {/* Comment */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPublishModalOpen(true)}
                      className="text-xs h-8 px-3 gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#7C5CFC]" />
                      <span>Comment</span>
                    </Button>

                    {/* Merge button */}
                    <Button
                      variant="primary"
                      size="sm"
                      data-testid="merge-pr-btn"
                      onClick={handleMerge}
                      disabled={currentPr.state === "merged" || currentPr.isRealGitHubPr}
                      title={
                        currentPr.isRealGitHubPr
                          ? "Only repository administrators can merge directly on GitHub via branch protection rules."
                          : "Apply patch into repository files and mark as Merged"
                      }
                      className={`text-xs h-8 px-3.5 gap-1.5 font-bold ${
                        currentPr.state === "merged"
                          ? "bg-purple-600/40 text-purple-300 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                      }`}
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>{currentPr.state === "merged" ? "Merged" : "Merge Pull Request"}</span>
                    </Button>
                  </div>

                  {/* Close / Reopen */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleClose}
                    className="text-xs h-8 px-3"
                  >
                    {currentPr.state === "open" ? "Close PR" : "Reopen PR"}
                  </Button>
                </div>
              </div>

              {/* Detail Tabs Header: Overview / Files Changed / Findings / Impact */}
              <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveDetailTab("overview")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors ${
                    activeDetailTab === "overview"
                      ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDetailTab("diff")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors ${
                    activeDetailTab === "diff"
                      ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Files Changed ({currentPr.files?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDetailTab("findings")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors ${
                    activeDetailTab === "findings"
                      ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Findings ({reviewSession?.findings?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDetailTab("impact")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors ${
                    activeDetailTab === "impact"
                      ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Blast Radius & Impact</span>
                </button>

                {isAnalyzing && (
                  <span className="ml-auto text-xs font-mono text-[#7C5CFC] flex items-center gap-1.5">
                    <RotateCcw className="w-3 h-3 animate-spin" />
                    <span>Analyzing codebase...</span>
                  </span>
                )}
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeDetailTab === "overview" && (
                <div className="space-y-4">
                  {/* AI Summary Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#7C5CFC]/15 to-transparent border border-[#7C5CFC]/30 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
                      <Sparkles className="w-4 h-4 text-[#7C5CFC]" />
                      <span>CodeAtlas AI Summary</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                      <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
                        <strong className="text-[var(--text-primary)] block font-bold">What Changes</strong>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                          {currentPr.aiSummary?.what || currentPr.title}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
                        <strong className="text-[var(--text-primary)] block font-bold">Why / Motivation</strong>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                          {currentPr.aiSummary?.why || currentPr.body}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
                        <strong className="text-[var(--text-primary)] block font-bold">Risk Assessment</strong>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                          {currentPr.aiSummary?.risk || "Evaluated by local static AST checks and AI review."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PR Description Body */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-2">
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">Description</h3>
                    <div className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-sans">
                      {currentPr.body}
                    </div>
                  </div>

                  {/* Interactive Checklist */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-[#7C5CFC]" />
                        <span>Pre-Merge Quality Checklist</span>
                      </h3>
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                        {currentPr.checklist?.filter((c) => c.checked).length || 0}/
                        {currentPr.checklist?.length || 4} complete
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(currentPr.checklist || [
                        { id: "chk_tests", label: "Tests added and passing", checked: true },
                        { id: "chk_docs", label: "Documentation updated", checked: false },
                        { id: "chk_secrets", label: "No secrets or API keys exposed", checked: true },
                        { id: "chk_impact", label: "Impact analysis checked", checked: false },
                      ]).map((item) => (
                        <div
                          key={item.id}
                          data-checklist-id={item.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs hover:border-[#7C5CFC]/50 transition-colors select-none"
                        >
                          <input
                            id={`chk-input-${item.id}`}
                            type="checkbox"
                            checked={!!item.checked}
                            onChange={() => handleChecklistToggle(item.id)}
                            className="accent-[#7C5CFC] rounded cursor-pointer w-4 h-4"
                          />
                          <label
                            htmlFor={`chk-input-${item.id}`}
                            className={`font-semibold cursor-pointer select-none ${item.checked ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}
                          >
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PR Event Timeline */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-3">
                    <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#7C5CFC]" />
                      <span>Timeline of Events</span>
                    </h3>

                    <div className="space-y-3 pl-2 border-l-2 border-[var(--border-color)]">
                      {(currentPr.timeline || [
                        {
                          id: "tl_1",
                          title: `Opened pull request #${currentPr.number}`,
                          actor: currentPr.author,
                          timestamp: currentPr.createdAt,
                          description: `From ${currentPr.headBranch} into ${currentPr.baseBranch}.`,
                        },
                      ]).map((event, idx) => (
                        <div key={idx} className="relative pl-5 text-xs space-y-1">
                          <div className="absolute -left-[17px] top-0.5 w-3 h-3 rounded-full bg-[#7C5CFC] ring-4 ring-[var(--bg-card)]" />
                          <div className="flex items-center justify-between">
                            <strong className="text-[var(--text-primary)] font-bold">
                              {event.title}
                            </strong>
                            <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              {event.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FILES CHANGED (DIFF VIEWER) */}
              {activeDetailTab === "diff" && (
                <DiffViewer
                  files={currentPr.files || []}
                  findings={reviewSession?.findings || []}
                  inlineComments={currentPr.inlineComments || []}
                  viewedFiles={currentPr.viewedFiles || {}}
                  onToggleViewedFile={handleViewedFileToggle}
                  onAddInlineComment={handleAddInlineComment}
                  onReplyInlineComment={handleReplyInlineComment}
                  highlightLocation={diffHighlightLocation}
                />
              )}

              {/* TAB 3: FINDINGS */}
              {activeDetailTab === "findings" && (
                <FindingsList
                  findings={reviewSession?.findings || []}
                  repositoryId={currentPr.repositoryId || "sample-project"}
                  pullRequestId={currentPr.id}
                  onUpdateStatus={handleUpdateFindingStatus}
                  onApplySuggestion={handleApplySuggestion}
                  onJumpToDiff={handleJumpToDiff}
                  onOpenDiscussion={(finding) => setActiveDiscussionFinding(finding)}
                />
              )}

              {/* TAB 4: IMPACT */}
              {activeDetailTab === "impact" && reviewSession && (
                <ReviewImpactSidebar
                  session={reviewSession}
                  repositoryId={currentPr.repositoryId || "sample-project"}
                  primaryFile={currentPr.files?.[0]?.filename || "src/services/auth.ts"}
                  isAnalyzing={isAnalyzing}
                  onReRunReview={() => {
                    setIsAnalyzing(true);
                    codeReviewService
                      .runCodeReview(currentPr.repositoryId || "sample-project", currentPr.number, isSecurityOnly)
                      .then((s) => {
                        setReviewSession(s);
                        setIsAnalyzing(false);
                      });
                  }}
                  isSecurityReviewOnly={isSecurityOnly}
                  onToggleSecurityReview={() => setIsSecurityOnly(!isSecurityOnly)}
                />
              )}
            </>
          ) : (
            <div className="p-16 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <GitPullRequest className="w-12 h-12 text-[#7C5CFC] mx-auto opacity-50" />
              <h3 className="font-bold text-base text-[var(--text-primary)]">No Pull Request Selected</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Select a pull request from the list or click "New Review" above.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Discussion Drawer */}
      {activeDiscussionFinding && currentPr && (
        <FindingDiscussionPanel
          finding={activeDiscussionFinding}
          pullRequestId={currentPr.id}
          pullRequestNumber={currentPr.number}
          isOpen={true}
          onClose={() => setActiveDiscussionFinding(null)}
        />
      )}

      {/* Publish Review Modal */}
      {currentPr && (
        <PublishCommentModal
          pr={currentPr}
          findings={reviewSession?.findings || []}
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onSuccess={(status) => {
            showToast(`Review published with decision: ${status.toUpperCase()}`);
            if (currentPr) setCurrentPr({ ...currentPr, reviewStatus: status });
            refreshPRList();
          }}
        />
      )}

      {/* New Review Modal */}
      <NewReviewModal
        isOpen={isNewReviewModalOpen}
        onClose={() => setIsNewReviewModalOpen(false)}
        onCreated={(newPrId) => {
          showToast("New Pull Request created for review.");
          setSelectedPrId(newPrId);
          refreshPRList();
        }}
        repositories={repositories}
        defaultRepoId={selectedRepo !== "all" ? selectedRepo : "sample-project"}
      />
    </div>
  );
}

export default function CodeReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-mono text-[var(--text-secondary)] space-y-2">
          <RotateCcw className="w-5 h-5 animate-spin mx-auto text-[#7C5CFC]" />
          <p>Loading CodeAtlas Code Review workspace...</p>
        </div>
      }
    >
      <CodeReviewContent />
    </Suspense>
  );
}
