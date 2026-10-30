"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/hooks/useTheme";
import { useRepositories } from "@/hooks/useRepositories";
import { DiffViewer } from "@/components/review/DiffViewer";
import { FindingsList } from "@/components/review/FindingsList";
import { ReviewImpactSidebar } from "@/components/review/ReviewImpactSidebar";
import { PublishCommentModal } from "@/components/review/PublishCommentModal";
import { codeReviewService } from "@/services/code-review-service";
import {
  PullRequestDetail,
  ReviewSession,
  ReviewFinding,
  FindingStatus,
} from "@/types/review";
import {
  GitPullRequest,
  FolderGit2,
  GitBranch,
  ShieldAlert,
  FileCode,
  Sparkles,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
} from "lucide-react";

function CodeReviewContent() {
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { repositories } = useRepositories();

  const repoFromUrl = searchParams?.get("repo") || "sample-project";
  const prFromUrl = parseInt(searchParams?.get("pr") || "101", 10);

  const [selectedRepo, setSelectedRepo] = useState<string>(repoFromUrl);
  const [pullRequests, setPullRequests] = useState<any[]>([]);
  const [selectedPrNumber, setSelectedPrNumber] = useState<number>(prFromUrl);
  const [prDetail, setPrDetail] = useState<PullRequestDetail | null>(null);
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"findings" | "diff">("findings");
  const [isSecurityOnly, setIsSecurityOnly] = useState<boolean>(false);
  const [selectedFindingForComment, setSelectedFindingForComment] = useState<ReviewFinding | null>(null);

  // 1. Load Pull Requests for Repository
  useEffect(() => {
    let isMounted = true;
    codeReviewService.getPullRequests(selectedRepo).then((prs) => {
      if (!isMounted) return;
      setPullRequests(prs);
      if (prs.length > 0) {
        setSelectedPrNumber((prev) => (prs.some((p) => p.number === prev) ? prev : prs[0].number));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedRepo]);

  // 2. Load PR Detail and Run Review
  useEffect(() => {
    let isMounted = true;
    setIsAnalyzing(true);

    // Fetch PR details
    codeReviewService
      .getPullRequestDetail(selectedRepo, selectedPrNumber)
      .then((detail) => {
        if (!isMounted) return;
        setPrDetail(detail);

        // Run AI code review analysis
        return codeReviewService.runCodeReview(selectedRepo, selectedPrNumber, isSecurityOnly);
      })
      .then((session) => {
        if (!isMounted) return;
        setReviewSession(session || null);
        setIsAnalyzing(false);
      })
      .catch((err) => {
        console.error("Review loading error:", err);
        if (isMounted) setIsAnalyzing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRepo, selectedPrNumber, isSecurityOnly]);

  const handleReRunReview = async () => {
    setIsAnalyzing(true);
    const session = await codeReviewService.runCodeReview(
      selectedRepo,
      selectedPrNumber,
      isSecurityOnly
    );
    setReviewSession(session);
    setIsAnalyzing(false);
  };

  const handleUpdateFindingStatus = async (
    findingId: string,
    status: FindingStatus,
    reason?: string
  ) => {
    if (!reviewSession) return;

    // Optimistically update UI
    setReviewSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        findings: prev.findings.map((f) =>
          f.id === findingId ? { ...f, status, dismissReason: reason } : f
        ),
      };
    });

    await codeReviewService.updateFindingStatus(reviewSession.id, findingId, status, reason);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Code Review & Pull Request Intelligence"
        sub="Inspect pull request diffs in context, detect architectural regressions, discover test gaps, and verify code changes before merging."
      />

      {/* Control Strip: Repository & Pull Request Selectors */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
          isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
        }`}
      >
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          {/* Repo selector */}
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-[var(--text-secondary)]">Repository:</span>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                isDark
                  ? "bg-[#0A0F19] border-[#30363D] text-[#E6EDF3]"
                  : "bg-white border-[#E5E5E0] text-[#1E2022]"
              }`}
            >
              {repositories.length > 0 ? (
                repositories.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.status === "ready" ? "Indexed" : "Connected"})
                  </option>
                ))
              ) : (
                <option value="sample-project">sample-project (Indexed)</option>
              )}
            </select>
          </div>

          {/* PR selector */}
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-teal-500" />
            <span className="text-[var(--text-secondary)]">Pull Request:</span>
            <select
              value={selectedPrNumber}
              onChange={(e) => setSelectedPrNumber(parseInt(e.target.value, 10))}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                isDark
                  ? "bg-[#0A0F19] border-[#30363D] text-[#E6EDF3]"
                  : "bg-white border-[#E5E5E0] text-[#1E2022]"
              }`}
            >
              {pullRequests.map((pr) => (
                <option key={pr.number} value={pr.number}>
                  #{pr.number} — {pr.title.slice(0, 45)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PR Status Badges */}
        {prDetail && (
          <div className="flex items-center gap-3 font-mono text-xs text-[var(--text-secondary)]">
            <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-500 font-bold uppercase text-[10px]">
              {prDetail.state}
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <GitBranch className="w-3.5 h-3.5 text-[var(--primary)]" />
              <strong className="text-[var(--text-primary)]">{prDetail.headBranch}</strong> &rarr;{" "}
              {prDetail.baseBranch}
            </span>
            <span className="text-emerald-500 font-bold">+{prDetail.additions}</span>
            <span className="text-red-500 font-bold">-{prDetail.deletions}</span>
          </div>
        )}
      </div>

      {/* Main Review Workspace Grid */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* Left Column (8 cols): Tabs (Findings & Diffs) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("findings")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "findings"
                    ? isDark
                      ? "bg-[#29D3C2] text-[#070A12]"
                      : "bg-[#6C4DFF] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Review Findings ({reviewSession ? reviewSession.findings.length : 0})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("diff")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "diff"
                    ? isDark
                      ? "bg-[#29D3C2] text-[#070A12]"
                      : "bg-[#6C4DFF] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Changed Files & Diffs ({prDetail ? prDetail.files.length : 0})</span>
              </button>
            </div>

            {isAnalyzing && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--primary)] font-bold">
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                Analyzing diff with codebase index...
              </span>
            )}
          </div>

          {/* Active Tab View */}
          {activeTab === "findings" ? (
            reviewSession ? (
              <FindingsList
                findings={reviewSession.findings}
                repositoryId={selectedRepo}
                reviewSessionId={reviewSession.id}
                onUpdateStatus={handleUpdateFindingStatus}
                onPublishComment={(finding) => setSelectedFindingForComment(finding)}
              />
            ) : (
              <div className="p-8 text-center text-xs font-mono text-[var(--text-secondary)]">
                Loading review findings...
              </div>
            )
          ) : prDetail ? (
            <DiffViewer files={prDetail.files} />
          ) : (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-secondary)]">
              Loading changed files...
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Review Impact & Blast Radius Sidebar */}
        <div className="lg:col-span-4">
          {reviewSession ? (
            <ReviewImpactSidebar
              session={reviewSession}
              repositoryId={selectedRepo}
              isAnalyzing={isAnalyzing}
              onReRunReview={handleReRunReview}
              isSecurityReviewOnly={isSecurityOnly}
              onToggleSecurityReview={() => setIsSecurityOnly((prev) => !prev)}
            />
          ) : (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-secondary)]">
              Analyzing repository blast radius...
            </div>
          )}
        </div>
      </div>

      {/* Optional Publish Comment Modal */}
      {selectedFindingForComment && (
        <PublishCommentModal
          finding={selectedFindingForComment}
          repositoryId={selectedRepo}
          pullRequestNumber={selectedPrNumber}
          isOpen={Boolean(selectedFindingForComment)}
          onClose={() => setSelectedFindingForComment(null)}
          onSuccess={(url) => {
            if (url) {
              setReviewSession((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  findings: prev.findings.map((f) =>
                    f.id === selectedFindingForComment.id ? { ...f, publishedToGitHub: true } : f
                  ),
                };
              });
            }
          }}
        />
      )}
    </div>
  );
}

export default function CodeReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-mono text-[var(--text-secondary)]">
          Loading AI Code Review Workspace...
        </div>
      }
    >
      <CodeReviewContent />
    </Suspense>
  );
}
