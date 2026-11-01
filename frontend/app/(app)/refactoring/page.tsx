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
  Download,
  Printer,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
  RefactoringHistoryItem,
} from "@/types/refactoring";
import {
  getStore,
  saveStore,
  logActivity,
  getTechnicalDebtOverview,
  saveTechnicalDebtOverview,
  getRefactoringProposals,
  deleteRefactoringProposal,
  updateRefactoringProposalStatus,
  ignoreQualityFinding,
  restoreQualityFinding,
  getRefactoringHistory,
  deleteRefactoringHistoryItem,
} from "@/lib/demo/store";
import {
  calculateDebtOverview,
  calculateWorkspaceDebtOverview,
  analyzeFileForQualityFindings,
  generateRefactoringProposal,
  applyRefactoringProposalToStore,
} from "@/lib/demo/refactoring-engine";

function RefactoringStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const urlProposalId = searchParams?.get("id") || searchParams?.get("proposal");
  const urlRepoId = searchParams?.get("repo") || "workspace_all";
  const urlTab = searchParams?.get("tab");
  const urlFile = searchParams?.get("file");

  const [selectedScope, setSelectedScope] = useState<string>(urlRepoId);
  const [debtOverview, setDebtOverview] = useState<TechnicalDebtOverview | null>(null);
  const [proposals, setProposals] = useState<DbRefactoringProposal[]>([]);
  const [historyItems, setHistoryItems] = useState<RefactoringHistoryItem[]>([]);
  const [activeProposal, setActiveProposal] = useState<DbRefactoringProposal | null>(null);
  const [activeTab, setActiveTab] = useState<"debt" | "findings" | "proposal" | "history">(
    urlTab === "findings" ? "findings" : urlProposalId ? "proposal" : "debt"
  );
  const [initialFileFilter, setInitialFileFilter] = useState<string | undefined>(urlFile || undefined);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressText, setScanProgressText] = useState<string>("");
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Available repositories in store
  const store = getStore();
  const availableRepos = (store.repositories || []).map((r: any) => ({
    id: r.id,
    name: r.name,
  }));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Re-compute or load debt data
  const loadDebtData = (scope = selectedScope, forceRescan = false) => {
    const currentStore = getStore();
    let overview: TechnicalDebtOverview;

    if (scope === "workspace_all") {
      overview = calculateWorkspaceDebtOverview(currentStore);
    } else {
      const repo = currentStore.repositories?.find((r: any) => r.id === scope);
      const repoName = repo ? repo.name : scope;
      const rawFilesObj = currentStore.repositoryFiles?.[scope] || {};
      const repoFiles = Object.entries(rawFilesObj).map(([p, f]) => ({
        path: p,
        code: f.code,
        language: f.language,
      }));

      let repoFindings: CodeQualityFinding[] = [];
      for (const f of repoFiles) {
        const ff = analyzeFileForQualityFindings(scope, repoName, f.path, f.code, repoFiles);
        repoFindings = repoFindings.concat(ff);
      }

      // Preserve existing statuses (ignored / fixed)
      const existingFindings = currentStore.debtOverviews?.[scope]?.findings || [];
      for (const rf of repoFindings) {
        const match = existingFindings.find((e: any) => e.id === rf.id);
        if (match) {
          rf.status = match.status;
          rf.ignoreReason = match.ignoreReason;
        }
      }

      overview = calculateDebtOverview(scope, repoName, repoFindings, repoFiles);
    }

    // Persist in store
    saveTechnicalDebtOverview(scope, overview);
    setDebtOverview(overview);

    // Load proposals and history
    const allProposals = getRefactoringProposals(scope);
    setProposals(allProposals);

    const allHistory = getRefactoringHistory(scope);
    setHistoryItems(allHistory);

    if (allProposals.length > 0 && !activeProposal) {
      const target = urlProposalId
        ? allProposals.find((p: DbRefactoringProposal) => p.id === urlProposalId) || allProposals[0]
        : allProposals[0];
      setActiveProposal(target);
    }
  };

  useEffect(() => {
    loadDebtData(selectedScope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScope]);

  // Handle Rescan with progress
  const handleRescan = async () => {
    setIsScanning(true);
    setScanProgressText("Reading indexed AST structures...");
    await new Promise((r) => setTimeout(r, 200));

    setScanProgressText("Analyzing cyclomatic decision branching...");
    await new Promise((r) => setTimeout(r, 250));

    setScanProgressText("Checking module coupling & dead code...");
    await new Promise((r) => setTimeout(r, 200));

    loadDebtData(selectedScope, true);

    setIsScanning(false);
    setScanProgressText("");
    showToast("Codebase scan complete. Maintainability metrics refreshed.");
  };

  // Handle proposing refactoring from a finding
  const handleProposeFromFinding = (finding: CodeQualityFinding) => {
    setModalInitialData({
      filePath: finding.filePath,
      symbolName: finding.symbolName,
      lineRange: finding.lineRange,
      operation: finding.suggestedRefactoringOp || "extract_function",
    });
    setIsNewProposalModalOpen(true);
  };

  // Handle proposing refactor from file in top files / hotspots
  const handleProposeFromFile = (filePath: string, repoId: string, symbolName?: string) => {
    setModalInitialData({
      filePath,
      symbolName,
      operation: "extract_function",
    });
    setIsNewProposalModalOpen(true);
  };

  // Handle submitting new proposal
  const handleCreateProposal = async (req: ProposeRefactoringRequest) => {
    const currentStore = getStore();
    const { proposal, usedAI } = await generateRefactoringProposal(req, currentStore);

    setActiveProposal(proposal);
    setActiveTab("proposal");
    loadDebtData(selectedScope);

    showToast(
      usedAI
        ? "AI Refactoring Proposal synthesized successfully."
        : "Refactoring Proposal created using deterministic AST engine."
    );
  };

  // Handle applying proposal patch
  const handleApplyPatch = async (proposalId: string, confirmed: boolean) => {
    if (!confirmed) {
      throw new Error("Confirmation is required to apply changes.");
    }
    const currentStore = getStore();
    const { prNumber, proposal } = applyRefactoringProposalToStore(proposalId, currentStore);

    setActiveProposal(proposal);
    loadDebtData(selectedScope);
    showToast(`Refactor applied safely! Pull Request #${prNumber} opened in /code-review.`);

    return {
      success: true,
      message: `Refactoring patch applied. Opened PR #${prNumber}.`,
    };
  };

  // Status update
  const handleUpdateStatus = (proposalId: string, status: "proposed" | "accepted" | "rejected") => {
    updateRefactoringProposalStatus(proposalId, status);
    loadDebtData(selectedScope);
    showToast(`Proposal status updated to ${status}.`);
  };

  // Delete proposal
  const handleDeleteProposal = (proposalId: string) => {
    deleteRefactoringProposal(proposalId);
    if (activeProposal?.id === proposalId) {
      setActiveProposal(null);
    }
    loadDebtData(selectedScope);
    showToast("Proposal removed.");
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string) => {
    deleteRefactoringHistoryItem(id);
    loadDebtData(selectedScope);
    showToast("History entry removed.");
  };

  // Ignore finding
  const handleIgnoreFinding = (findingId: string, reason: string) => {
    ignoreQualityFinding(findingId, reason, selectedScope);
    loadDebtData(selectedScope);
    showToast("Finding marked as ignored.");
  };

  // Restore finding
  const handleRestoreFinding = (findingId: string) => {
    restoreQualityFinding(findingId, selectedScope);
    loadDebtData(selectedScope);
    showToast("Finding restored to Open.");
  };

  // Bulk ignore
  const handleBulkIgnore = (findingIds: string[], reason: string) => {
    findingIds.forEach((id) => ignoreQualityFinding(id, reason, selectedScope));
    loadDebtData(selectedScope);
    showToast(`${findingIds.length} findings marked as ignored.`);
  };

  // Regenerate with feedback
  const handleRegenerateWithFeedback = async (proposalId: string, feedback: string) => {
    if (!activeProposal) return;
    const req: ProposeRefactoringRequest = {
      repositoryId: activeProposal.repositoryId,
      filePath: activeProposal.targetFile,
      symbolName: activeProposal.targetSymbol,
      startLine: activeProposal.lineRange.start,
      endLine: activeProposal.lineRange.end,
      operation: activeProposal.operation,
      customInstructions: `${activeProposal.purpose}. Revision feedback: ${feedback}`,
    };
    await handleCreateProposal(req);
  };

  // Export report as Markdown
  const handleExportMarkdown = () => {
    if (!debtOverview) return;
    const dateStr = new Date().toISOString().split("T")[0];
    const md = `# CodeAtlas Technical Debt & Refactoring Report
**Scope:** ${debtOverview.repositoryName} (${selectedScope})
**Date:** ${new Date().toLocaleDateString()}
**Composite Score:** ${debtOverview.compositeScore}/100 (Grade ${debtOverview.debtRating})
**Total Remediation Effort:** ${debtOverview.totalDebtHours} hours
**Findings:** ${debtOverview.findingsCount.critical} Critical, ${debtOverview.findingsCount.warning} High/Warning, ${debtOverview.findingsCount.info} Info

---

## Executive Summary
${debtOverview.scoreFormula}

### Findings by Category
${(debtOverview.categories || [])
  .map((c) => `- **${c.label}**: ${c.count} finding(s) (${c.percentage}%)`)
  .join("\n")}

---

## Top Priority Files
${(debtOverview.topFilesToFix || [])
  .map(
    (tf, i) =>
      `${i + 1}. **\`${tf.filePath}\`** (${tf.findingCount} issues, ${tf.totalEffortHours}h effort)\n   - *Reason:* ${tf.reason}`
  )
  .join("\n")}

---

## Open Quality Findings
${debtOverview.findings
  .filter((f) => f.status !== "fixed")
  .slice(0, 15)
  .map(
    (f) =>
      `### [${f.severity.toUpperCase()}] ${f.title}\n- **Location:** \`${f.filePath}:${f.lineRange?.start}-${f.lineRange?.end}\`\n- **Effort:** ${f.effortHours}h\n- **Rationale:** ${f.impactRationale}\n- **Remediation:** ${f.suggestedAction}\n`
  )
  .join("\n")}

---
*Generated automatically by CodeAtlas Architectural Intelligence Studio.*
`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CodeAtlas_Debt_Report_${selectedScope}_${dateStr}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded Markdown report.");
  };

  // Print / Save as PDF
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[var(--bg-card)] border border-[#7C5CFC]/40 shadow-xl text-xs flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#2FD6A0]" />
          <span className="font-semibold text-[var(--text-primary)]">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Refactoring & Technical Debt Studio"
        sub="Detect maintainability debt, synthesize evidence-backed refactoring proposals, preview unified diffs, and validate changes safely."
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope Selector */}
          <select
            value={selectedScope}
            onChange={(e) => {
              setSelectedScope(e.target.value);
              router.push(`/refactoring?repo=${encodeURIComponent(e.target.value)}`);
            }}
            className="text-xs px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[#7C5CFC]"
          >
            <option value="workspace_all">All Repositories (Workspace)</option>
            {availableRepos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.id})
              </option>
            ))}
          </select>

          {/* Export Report */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportMarkdown}
            className="gap-1.5 text-xs border-[var(--border-color)] hover:border-[#7C5CFC]"
          >
            <Download className="w-3.5 h-3.5 text-[#7C5CFC]" />
            Export Markdown
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPdf}
            className="gap-1.5 text-xs border-[var(--border-color)] hover:border-[#7C5CFC]"
          >
            <Printer className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            Print / PDF
          </Button>

          {/* Rename Symbol */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRenameModalOpen(true)}
            className="gap-1.5 text-xs border-[var(--border-color)] hover:border-[#7C5CFC]"
          >
            <Tag className="w-3.5 h-3.5 text-[#7C5CFC]" />
            Rename Symbol
          </Button>

          {/* New Proposal */}
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
            className="gap-1.5 text-xs bg-[#7C5CFC] hover:bg-[#6A4BE2] text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            New Proposal
          </Button>
        </div>
      </PageHeader>

      {/* Scanning Banner */}
      {isScanning && (
        <div className="p-4 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/30 flex items-center justify-between gap-3 text-xs text-[#7C5CFC] animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 animate-spin text-[#7C5CFC]" />
            <span className="font-semibold">{scanProgressText || "Scanning codebase..."}</span>
          </div>
          <span className="font-mono text-[11px] text-[var(--text-secondary)]">Analyzing AST metrics</span>
        </div>
      )}

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
              ? "border-[#7C5CFC] text-[#7C5CFC]"
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
              ? "border-[#7C5CFC] text-[#7C5CFC]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Quality Findings ({debtOverview?.findings?.filter((f) => f.status !== "fixed").length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("proposal")}
          className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 -mb-[2px] ${
            activeTab === "proposal"
              ? "border-[#7C5CFC] text-[#7C5CFC]"
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
              ? "border-[#7C5CFC] text-[#7C5CFC]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          History ({proposals.length + historyItems.length})
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === "debt" && debtOverview && (
        <TechnicalDebtOverviewComponent
          overview={debtOverview}
          isScanning={isScanning}
          onRefreshScan={handleRescan}
          onSelectRepo={(repoId) => {
            setSelectedScope(repoId);
            router.push(`/refactoring?repo=${encodeURIComponent(repoId)}`);
          }}
          onSelectFile={(filePath) => {
            setInitialFileFilter(filePath);
            setActiveTab("findings");
          }}
          onProposeFromFile={(filePath, repoId, symbolName) => {
            setModalInitialData({
              filePath,
              symbolName,
              operation: "extract_function",
            });
            setIsNewProposalModalOpen(true);
          }}
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
          initialFilterFile={initialFileFilter}
          onProposeRefactoring={handleProposeFromFinding}
          onIgnoreFinding={handleIgnoreFinding}
          onRestoreFinding={handleRestoreFinding}
          onBulkIgnore={handleBulkIgnore}
          onOpenFile={(filePath) => {
            const targetRepo = selectedScope === "workspace_all" ? "sample-project" : selectedScope;
            router.push(`/repositories/${targetRepo}?file=${encodeURIComponent(filePath)}`);
          }}
        />
      )}

      {activeTab === "proposal" && (
        <div className="space-y-4">
          {activeProposal ? (
            <RefactoringProposalCard
              proposal={activeProposal}
              onApplyPatch={handleApplyPatch}
              onUpdateStatus={handleUpdateStatus}
              onRegenerateWithFeedback={handleRegenerateWithFeedback}
            />
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-12 text-center space-y-3">
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
                className="gap-2 mx-auto bg-[#7C5CFC] hover:bg-[#6A4BE2] text-white"
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
              historyItems={historyItems}
              selectedId={activeProposal?.id}
              onSelectProposal={(p) => {
                setActiveProposal(p);
                setActiveTab("proposal");
              }}
              onNewProposal={() => setIsNewProposalModalOpen(true)}
              onDeleteProposal={handleDeleteProposal}
              onDeleteHistoryItem={handleDeleteHistoryItem}
            />
          </div>

          <div className="md:col-span-2">
            {activeProposal ? (
              <RefactoringProposalCard
                proposal={activeProposal}
                onApplyPatch={handleApplyPatch}
                onUpdateStatus={handleUpdateStatus}
                onRegenerateWithFeedback={handleRegenerateWithFeedback}
              />
            ) : (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-12 text-center text-xs text-[var(--text-secondary)]">
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
        repositoryId={selectedScope === "workspace_all" ? "sample-project" : selectedScope}
        defaultFilePath={modalInitialData.filePath}
        defaultSymbolName={modalInitialData.symbolName}
        onRenameSuccess={() => loadDebtData(selectedScope)}
      />

      {/* New Proposal Modal */}
      <NewProposalModal
        isOpen={isNewProposalModalOpen}
        onClose={() => setIsNewProposalModalOpen(false)}
        repositoryId={selectedScope === "workspace_all" ? "sample-project" : selectedScope}
        availableRepos={availableRepos}
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
