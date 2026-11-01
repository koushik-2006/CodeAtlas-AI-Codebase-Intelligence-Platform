"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  GitFork,
  Package,
  Repeat,
  AlertTriangle,
  Globe,
  GitBranch,
  Search,
} from "lucide-react";
import { MultiRepoHeader } from "@/components/multi-repo/MultiRepoHeader";
import { MultiRepoKPIRow, MultiRepoTab } from "@/components/multi-repo/MultiRepoKPIRow";
import { DependencyMapTab } from "@/components/multi-repo/DependencyMapTab";
import { SharedLibrariesTab } from "@/components/multi-repo/SharedLibrariesTab";
import { DuplicateCodeTab } from "@/components/multi-repo/DuplicateCodeTab";
import { APIContractsTab } from "@/components/multi-repo/APIContractsTab";
import { CrossRepoImpactTab } from "@/components/multi-repo/CrossRepoImpactTab";
import { UnifiedSearchTab } from "@/components/multi-repo/UnifiedSearchTab";
import {
  getStore,
  saveStore,
  updateRepositoryFile,
  addRefactoringProposal,
  logActivity,
  getCachedMultiRepoAnalysis,
  cacheMultiRepoAnalysis,
} from "@/lib/demo/store";
import {
  analyzeMultiRepo,
  calculateCrossRepoImpact,
  executeUnifiedSearch,
  MultiRepoAnalysisResult,
  SharedLibraryItem,
} from "@/lib/demo/multi-repo-analyzer";
import {
  MultiRepoSummary,
  DuplicateCandidate,
  CrossRepoImpactReport,
  CrossRepoSearchResponse,
  CrossRepoEntityType,
} from "@/types/multi-repo";

export default function MultiRepoPage() {
  const [activeTab, setActiveTab] = useState<MultiRepoTab>("dependencies");
  const [showConflictsOnly, setShowConflictsOnly] = useState<boolean>(false);

  // Store data
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("ws_team_demo");
  const [repositories, setRepositories] = useState<MultiRepoSummary[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState<MultiRepoAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(100);

  // Unified Search State
  const [searchQuery, setSearchQuery] = useState<string>("validateEmail");
  const [searchResults, setSearchResults] = useState<CrossRepoSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Initial Load of Workspaces and Repositories from Store
  const loadInitialData = useCallback(() => {
    const store = getStore();
    const wsList = store.workspaces || [];
    setWorkspaces(wsList);

    const activeWs = store.activeWorkspaceId || wsList[0]?.id || "ws_team_demo";
    setActiveWorkspaceId(activeWs);

    // Get linked repos for this workspace, or fallback to all repos
    const linkedLinks = store.workspaceRepositories?.[activeWs] || [];
    const linkedIds = linkedLinks.map((l: any) => l.repositoryId);
    const allRepos = (store.repositories || []).map((r: any) => ({
      ...r,
      isStale: Boolean(r.isStale),
      status: r.status || "ready",
      symbolCount: r.symbolCount || 24,
      fileCount: r.fileCount || 6,
      loc: r.loc || 2400,
    }));

    const availableRepos = linkedIds.length > 0
      ? allRepos.filter((r) => linkedIds.includes(r.id))
      : allRepos;

    setRepositories(availableRepos);

    // Select all available repositories by default
    const initialSelectedIds = availableRepos.map((r) => r.id);
    setSelectedRepoIds(initialSelectedIds);

    // Check cached analysis or run fresh
    const cached = getCachedMultiRepoAnalysis();
    if (cached && cached.selectedRepoIds && cached.selectedRepoIds.length === initialSelectedIds.length) {
      setAnalysisResult(cached);
    } else {
      const result = analyzeMultiRepo(initialSelectedIds, store);
      setAnalysisResult(result);
      cacheMultiRepoAnalysis(result);
    }

    // Run initial search
    const initialSearch = executeUnifiedSearch("validateEmail", "all", false, initialSelectedIds, store);
    setSearchResults(initialSearch);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Run Re-Analysis with animated progress
  const runAnalysis = useCallback(
    (targetRepoIds?: string[]) => {
      const ids = targetRepoIds || selectedRepoIds;
      setIsAnalyzing(true);
      setAnalysisProgress(15);

      const store = getStore();

      setTimeout(() => {
        setAnalysisProgress(55);
        setTimeout(() => {
          setAnalysisProgress(90);
          const result = analyzeMultiRepo(ids, store);
          setAnalysisResult(result);
          cacheMultiRepoAnalysis(result);
          setAnalysisProgress(100);
          setIsAnalyzing(false);

          logActivity({
            type: "multi_repo_analysis",
            title: `Multi-Repository Analysis refreshed`,
            description: `Analyzed ${ids.length} codebases: ${result.summary.crossRepoDependencies} dependencies, ${result.summary.versionConflictsCount} version conflicts.`,
            status: "success",
            href: "/multi-repo",
          });

          showToast(`Re-analysis complete across ${ids.length} repositories!`);
        }, 200);
      }, 150);
    },
    [selectedRepoIds]
  );

  // 3. Workspace Switch Handler
  const handleSelectWorkspace = (wsId: string) => {
    setActiveWorkspaceId(wsId);
    const store = getStore();
    store.activeWorkspaceId = wsId;
    saveStore(store);

    const linkedLinks = store.workspaceRepositories?.[wsId] || [];
    const linkedIds = linkedLinks.map((l: any) => l.repositoryId);
    const allRepos = (store.repositories || []).map((r: any) => ({
      ...r,
      isStale: Boolean(r.isStale),
      status: r.status || "ready",
      symbolCount: r.symbolCount || 24,
      fileCount: r.fileCount || 6,
      loc: r.loc || 2400,
    }));

    const availableRepos = linkedIds.length > 0
      ? allRepos.filter((r) => linkedIds.includes(r.id))
      : allRepos;

    setRepositories(availableRepos);
    const newSelectedIds = availableRepos.map((r) => r.id);
    setSelectedRepoIds(newSelectedIds);
    runAnalysis(newSelectedIds);
  };

  // 4. Toggle Repository selection in scope
  const handleToggleRepo = (repoId: string) => {
    const next = selectedRepoIds.includes(repoId)
      ? selectedRepoIds.filter((id) => id !== repoId)
      : [...selectedRepoIds, repoId];

    setSelectedRepoIds(next);
    runAnalysis(next);
  };

  const handleSelectAll = () => {
    const allIds = repositories.map((r) => r.id);
    setSelectedRepoIds(allIds);
    runAnalysis(allIds);
  };

  const handleClearAll = () => {
    setSelectedRepoIds([]);
    const emptyResult = analyzeMultiRepo([], getStore());
    setAnalysisResult(emptyResult);
  };

  // 5. Shared Libraries Alignment Handler
  const handleApplyAlignment = async (item: SharedLibraryItem, targetVersion: string) => {
    const store = getStore();

    item.filesToChange.forEach((change) => {
      const fileObj = store.repositoryFiles?.[change.repoId]?.[change.file];
      if (fileObj) {
        let updatedCode = fileObj.code;
        if (change.file.endsWith("package.json")) {
          try {
            const parsed = JSON.parse(updatedCode);
            if (parsed.dependencies?.[item.name]) {
              parsed.dependencies[item.name] = change.targetVersion;
            }
            if (parsed.devDependencies?.[item.name]) {
              parsed.devDependencies[item.name] = change.targetVersion;
            }
            updatedCode = JSON.stringify(parsed, null, 2);
          } catch (e) {
            updatedCode = updatedCode.replace(new RegExp(`"${item.name}":\\s*"[^"]+"`), `"${item.name}": "${change.targetVersion}"`);
          }
        } else if (change.file.endsWith("requirements.txt")) {
          updatedCode = updatedCode.replace(new RegExp(`${item.name}==[^\\n]+`), `${item.name}==${change.targetVersion}`);
        }

        updateRepositoryFile(change.repoId, change.file, updatedCode);
      }
    });

    showToast(`Aligned ${item.name} to ${targetVersion} across manifests!`, "success");
    // Re-run analysis immediately
    runAnalysis();
  };

  // 6. Duplicate Code Extract Handler
  const handleExtractProposal = (candidate: DuplicateCandidate) => {
    addRefactoringProposal({
      title: `Extract ${candidate.title} into shared-core-lib`,
      repositoryId: "shared-core-lib",
      filePath: "src/validators.ts",
      targetFile: "src/validators.ts",
      symbolName: candidate.instances[0]?.symbolName || "sharedUtility",
      description: `Consolidate ${candidate.similarityScore}% duplicate implementation from ${candidate.instances.map((i) => i.repositoryName).join(" & ")}.`,
      confidenceScore: candidate.similarityScore,
      expectedDebtReduction: 20,
      sourceCodeSnippet: candidate.instances[0]?.snippet,
    });

    showToast(`Created refactoring proposal to extract to shared-core-lib! Visible on Refactoring & Debt.`, "success");
  };

  // 7. Calculate Cross-Repo Impact Handler
  const handleCalculateImpact = async (
    sourceRepoId: string,
    file: string,
    symbol: string,
    isBreaking: boolean
  ): Promise<CrossRepoImpactReport> => {
    const store = getStore();
    return calculateCrossRepoImpact(sourceRepoId, file, symbol, isBreaking, selectedRepoIds, store);
  };

  // 8. Unified Search Handler
  const handleExecuteSearch = (q: string, category: CrossRepoEntityType, exact: boolean) => {
    setIsSearching(true);
    setSearchQuery(q);
    setTimeout(() => {
      const store = getStore();
      const res = executeUnifiedSearch(q, category, exact, selectedRepoIds, store);
      setSearchResults(res);
      setIsSearching(false);
    }, 100);
  };

  // Tab change with optional conflict filter preset
  const handleSelectTab = (tab: MultiRepoTab, options?: { showConflictsOnly?: boolean }) => {
    setActiveTab(tab);
    if (options?.showConflictsOnly !== undefined) {
      setShowConflictsOnly(options.showConflictsOnly);
    }
  };

  const tabs: Array<{
    id: MultiRepoTab;
    label: string;
    icon: React.ReactNode;
    badgeCount?: number;
    badgeVariant?: "coral" | "brand" | "cyan";
  }> = [
    {
      id: "dependencies",
      label: "Dependency Map",
      icon: <GitFork className="w-4 h-4" />,
      badgeCount: analysisResult?.graph?.edges?.length,
      badgeVariant: "brand",
    },
    {
      id: "shared-libraries",
      label: "Shared Libraries",
      icon: <Package className="w-4 h-4" />,
      badgeCount: analysisResult?.summary?.versionConflictsCount ? analysisResult.summary.versionConflictsCount : undefined,
      badgeVariant: "coral",
    },
    {
      id: "duplicates",
      label: "Duplicate Code",
      icon: <Repeat className="w-4 h-4" />,
      badgeCount: analysisResult?.duplicateCandidates?.length,
      badgeVariant: "cyan",
    },
    {
      id: "api-contracts",
      label: "API Contracts",
      icon: <Globe className="w-4 h-4" />,
      badgeCount: analysisResult?.endpoints?.length,
      badgeVariant: "brand",
    },
    {
      id: "impact",
      label: "Cross-Repo Impact",
      icon: <GitBranch className="w-4 h-4" />,
    },
    {
      id: "search",
      label: "Unified Search",
      icon: <Search className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FE] dark:bg-[#07090E] p-4 md:p-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-[#0D111A] border border-[#7C5CFC]/40 text-xs font-semibold text-[#19143D] dark:text-[#F3F5FA] shadow-xl animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Scope Selector */}
      <MultiRepoHeader
        repositories={repositories}
        selectedRepoIds={selectedRepoIds}
        onToggleRepo={handleToggleRepo}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        isAnalyzing={isAnalyzing}
        analysisProgress={analysisProgress}
        onReanalyze={() => runAnalysis()}
        lastAnalyzedTime={analysisResult ? new Date(analysisResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined}
      />

      {/* KPI Row (Clicking any KPI routes to its respective tab) */}
      <MultiRepoKPIRow
        summary={
          analysisResult?.summary || {
            reposAnalyzed: selectedRepoIds.length,
            crossRepoDependencies: 0,
            sharedLibrariesCount: 0,
            duplicateCodeBlocks: 0,
            versionConflictsCount: 0,
            crossServiceAPICalls: 0,
          }
        }
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Navigation Tabs Bar */}
      <div className="flex overflow-x-auto border-b border-[#EAE6FD] dark:border-[#1E2638] gap-2 pb-px no-scrollbar select-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? "border-[#7C5CFC] text-[#7C5CFC] dark:text-[#A78BFA]"
                : "border-transparent text-[#6E6A8A] dark:text-[#8E95A8] hover:text-[#19143D] dark:hover:text-[#F3F5FA]"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  tab.badgeVariant === "coral"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                    : tab.badgeVariant === "cyan"
                    ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300"
                    : "bg-[#7C5CFC]/15 text-[#7C5CFC] dark:text-[#A78BFA]"
                }`}
              >
                {tab.badgeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Tab Content Area */}
      <div className="pt-2">
        {activeTab === "dependencies" && (
          <DependencyMapTab
            graph={
              analysisResult?.graph || {
                nodes: [],
                edges: [],
                stats: { totalNodes: 0, totalEdges: 0, internalLibraries: 0, serviceIntegrations: 0, packageDependencies: 0 },
              }
            }
            isLoading={isAnalyzing}
          />
        )}

        {activeTab === "shared-libraries" && (
          <SharedLibrariesTab
            libraries={analysisResult?.sharedLibraries || []}
            isLoading={isAnalyzing}
            onApplyAlignment={handleApplyAlignment}
            initialShowConflictsOnly={showConflictsOnly}
          />
        )}

        {activeTab === "duplicates" && (
          <DuplicateCodeTab
            candidates={analysisResult?.duplicateCandidates || []}
            isLoading={isAnalyzing}
            onExtractProposal={handleExtractProposal}
          />
        )}

        {activeTab === "api-contracts" && (
          <APIContractsTab
            endpoints={analysisResult?.endpoints || []}
            isLoading={isAnalyzing}
          />
        )}

        {activeTab === "impact" && (
          <CrossRepoImpactTab
            repositories={repositories}
            onCalculateImpact={handleCalculateImpact}
            isLoading={false}
          />
        )}

        {activeTab === "search" && (
          <UnifiedSearchTab
            searchResults={searchResults}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onExecuteSearch={handleExecuteSearch}
            isSearching={isSearching}
            selectedRepoCount={selectedRepoIds.length}
          />
        )}
      </div>
    </div>
  );
}
