"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/hooks/useTheme";
import {
  Wrench,
  Flame,
  GitFork,
  Repeat,
  ShieldCheck,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Tag,
  AlertTriangle,
  FolderGit2,
  FileCode,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { apiClient } from "@/services/api-client";
import TechnicalDebtOverviewComponent from "@/components/refactoring/TechnicalDebtOverview";
import QualityFindingsList from "@/components/refactoring/QualityFindingsList";
import RefactoringProposalCard from "@/components/refactoring/RefactoringProposalCard";
import RefactoringHistorySidebar from "@/components/refactoring/RefactoringHistorySidebar";
import RenameSymbolModal from "@/components/refactoring/RenameSymbolModal";
import NewProposalModal from "@/components/refactoring/NewProposalModal";
import {
  TechnicalDebtOverview,
  DbRefactoringProposal,
  CodeQualityFinding,
  ProposeRefactoringRequest,
  RefactoringOperationType,
} from "@/types/refactoring";

function RefactoringStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const urlProposalId = searchParams?.get("id") || searchParams?.get("proposal");
  const repoId = searchParams?.get("repo") || "sample-project";

  const [repositoryId, setRepositoryId] = useState(repoId);
  const [debtOverview, setDebtOverview] = useState<TechnicalDebtOverview | null>(null);
  const [proposals, setProposals] = useState<DbRefactoringProposal[]>([]);
  const [activeProposal, setActiveProposal] = useState<DbRefactoringProposal | null>(null);
  const [activeTab, setActiveTab] = useState<"debt" | "findings" | "proposal" | "history">("debt");

  const [isScanning, setIsScanning] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isNewProposalModalOpen, setIsNewProposalModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<{
    filePath: string;
    symbolName?: string;
    lineRange?: { start: number; end: number };
    operation?: RefactoringOperationType;
  }>({
    filePath: "src/services/auth.ts",
    symbolName: "loginUser",
  });
  const [pageError, setPageError] = useState<string | null>(null);

  // Load quality & debt data
  const loadQualityData = async (targetRepoId = repositoryId) => {
    try {
      setIsScanning(true);
      const res = await apiClient.get<any>(`/refactoring/quality`, {
        params: { repositoryId: targetRepoId },
      });
      const data = res.data || {};
      if (res.success && data.debtOverview) {
        setDebtOverview(data.debtOverview);
      }
    } catch (err: any) {
      console.warn("Failed to load quality data:", err);
      setPageError(err?.message || "Failed to load technical debt overview.");
    } finally {
      setIsScanning(false);
    }
  };

  // Load history of proposals
  const loadProposals = async (targetRepoId = repositoryId) => {
    try {
      const res = await apiClient.get<any>(`/refactoring/history`, {
        params: { repositoryId: targetRepoId },
      });
      const data = res.data || {};
      if (res.success && data.proposals) {
        setProposals(data.proposals);
        if (data.proposals.length > 0 && !activeProposal) {
          // Select first proposal or URL matching
          const target = urlProposalId
            ? data.proposals.find((p: DbRefactoringProposal) => p.id === urlProposalId) || data.proposals[0]
            : data.proposals[0];
          setActiveProposal(target);
        }
      }
    } catch (err) {
      console.warn("Failed to load refactoring proposals:", err);
    }
  };

  useEffect(() => {
    loadQualityData(repositoryId);
    loadProposals(repositoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositoryId]);

  // Handle proposing refactoring from finding
  const handleProposeFromFinding = (finding: CodeQualityFinding) => {
    setModalInitialData({
      filePath: finding.filePath,
      symbolName: finding.symbolName,
      lineRange: finding.lineRange,
      operation: finding.suggestedRefactoringOp || "extract_function",
    });
    setIsNewProposalModalOpen(true);
  };

  // Handle submitting new proposal
  const handleCreateProposal = async (req: ProposeRefactoringRequest) => {
    const res = await apiClient.post<any>("/refactoring/propose", req);
    const data = res.data || {};
    if (!res.success || !data.success) {
      throw new Error(data.error || res.message || "Failed to generate proposal.");
    }

    setActiveProposal(data.proposal);
    setActiveTab("proposal");
    await loadProposals(repositoryId);
  };

  // Apply proposal patch
  const handleApplyPatch = async (proposalId: string, confirmed: boolean) => {
    const res = await apiClient.post<any>("/refactoring/apply", { proposalId, confirmed });
    const data = res.data || {};
    if (!res.success || !data.success) {
      throw new Error(data.error || res.message || "Failed to apply refactoring patch.");
    }

    // Refresh proposals and active proposal
    setActiveProposal(data.proposal);
    await loadProposals(repositoryId);
    await loadQualityData(repositoryId);

    return {
      success: true,
      message: data.message || "Refactoring patch applied safely.",
    };
  };

  // Update proposal status
  const handleUpdateStatus = async (proposalId: string, status: "proposed" | "accepted" | "rejected") => {
    try {
      const res = await apiClient.patch<any>(`/refactoring/history/${proposalId}`, { status });
      const data = res.data || {};
      if (res.success && data.proposal) {
        setActiveProposal(data.proposal);
        await loadProposals(repositoryId);
      }
    } catch (e) {
      console.warn("Failed to update status:", e);
    }
  };

  // Validate proposal
  const handleValidateProposal = async (proposalId: string) => {
    try {
      const res = await apiClient.post<any>("/refactoring/validate", { proposalId });
      const data = res.data || {};
      if (res.success && data.validationStatus) {
        if (activeProposal && activeProposal.id === proposalId) {
          setActiveProposal({
            ...activeProposal,
            validationStatus: data.validationStatus,
            validationResults: data.validationResults,
          });
        }
        await loadProposals(repositoryId);
      }
    } catch (e) {
      console.warn("Failed to validate proposal:", e);
    }
  };

  // Delete proposal
  const handleDeleteProposal = async (proposalId: string) => {
    try {
      const res = await apiClient.delete<any>(`/refactoring/history/${proposalId}`);
      if (res.success) {
        if (activeProposal?.id === proposalId) {
          setActiveProposal(null);
        }
        await loadProposals(repositoryId);
      }
    } catch (e) {
      console.warn("Failed to delete proposal:", e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Refactoring & Technical Debt Studio"
        sub="Detect maintainability debt, synthesize evidence-backed refactoring proposals, preview unified diffs, and validate changes safely."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRenameModalOpen(true)}
            className="gap-1.5"
          >
            <Tag className="w-3.5 h-3.5" />
            Rename Symbol
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setModalInitialData({
                filePath: "src/services/auth.ts",
                symbolName: "loginUser",
              });
              setIsNewProposalModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Proposal
          </Button>
        </div>
      </PageHeader>

      {pageError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{pageError}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("debt")}
          className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 -mb-[2px] ${
            activeTab === "debt"
              ? "border-[#29D3C2] text-[#29D3C2]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Technical Debt Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("findings")}
          className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 -mb-[2px] ${
            activeTab === "findings"
              ? "border-[#29D3C2] text-[#29D3C2]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Quality Findings ({debtOverview?.findings.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("proposal")}
          className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 -mb-[2px] ${
            activeTab === "proposal"
              ? "border-[#29D3C2] text-[#29D3C2]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Active Proposal {activeProposal ? `(${activeProposal.title.slice(0, 24)}...)` : ""}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 -mb-[2px] ${
            activeTab === "history"
              ? "border-[#29D3C2] text-[#29D3C2]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          History ({proposals.length})
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === "debt" && debtOverview && (
        <TechnicalDebtOverviewComponent
          overview={debtOverview}
          isScanning={isScanning}
          onRefreshScan={() => loadQualityData(repositoryId)}
          onSelectHotspot={(filePath, symbolName, lineRange) => {
            setModalInitialData({
              filePath,
              symbolName,
              lineRange,
              operation: "simplify_conditionals",
            });
            setIsNewProposalModalOpen(true);
          }}
        />
      )}

      {activeTab === "findings" && debtOverview && (
        <QualityFindingsList
          findings={debtOverview.findings}
          onProposeRefactoring={handleProposeFromFinding}
        />
      )}

      {activeTab === "proposal" && (
        <div className="space-y-4">
          {activeProposal ? (
            <RefactoringProposalCard
              proposal={activeProposal}
              onApplyPatch={handleApplyPatch}
              onUpdateStatus={handleUpdateStatus}
              onValidateProposal={handleValidateProposal}
            />
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-12 text-center space-y-3">
              <Wrench className="w-10 h-10 text-[var(--text-secondary)] mx-auto" />
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                No Active Proposal Selected
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                Generate a new proposal from code quality findings or pick one from the history tab.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewProposalModalOpen(true)}
                className="gap-2 mx-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Refactoring Proposal
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 h-[650px]">
            <RefactoringHistorySidebar
              proposals={proposals}
              selectedId={activeProposal?.id}
              onSelectProposal={(p) => {
                setActiveProposal(p);
                setActiveTab("proposal");
              }}
              onNewProposal={() => setIsNewProposalModalOpen(true)}
              onDeleteProposal={handleDeleteProposal}
            />
          </div>

          <div className="md:col-span-2">
            {activeProposal ? (
              <RefactoringProposalCard
                proposal={activeProposal}
                onApplyPatch={handleApplyPatch}
                onUpdateStatus={handleUpdateStatus}
                onValidateProposal={handleValidateProposal}
              />
            ) : (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-12 text-center text-xs text-[var(--text-secondary)]">
                Select a proposal from the history list to preview diffs and validation checks.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rename Symbol Modal */}
      <RenameSymbolModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        repositoryId={repositoryId}
        defaultFilePath={modalInitialData.filePath}
        defaultSymbolName={modalInitialData.symbolName}
      />

      {/* New Proposal Modal */}
      <NewProposalModal
        isOpen={isNewProposalModalOpen}
        onClose={() => setIsNewProposalModalOpen(false)}
        repositoryId={repositoryId}
        initialFilePath={modalInitialData.filePath}
        initialSymbolName={modalInitialData.symbolName}
        initialLineRange={modalInitialData.lineRange}
        initialOperation={modalInitialData.operation}
        onSubmit={handleCreateProposal}
      />
    </div>
  );
}

export default function RefactoringStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-mono text-[var(--text-secondary)]">
          Loading Refactoring Studio...
        </div>
      }
    >
      <RefactoringStudioContent />
    </Suspense>
  );
}
