"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { ImpactHistorySidebar } from "@/components/change-impact/ImpactHistorySidebar";
import { ImpactInputTabs } from "@/components/change-impact/ImpactInputTabs";
import { BlastRadiusRadialMap } from "@/components/change-impact/BlastRadiusRadialMap";
import { AffectedNodeSidePanel } from "@/components/change-impact/AffectedNodeSidePanel";
import { ImpactSummaryBar } from "@/components/change-impact/ImpactSummaryBar";
import { ImpactGroupedLists } from "@/components/change-impact/ImpactGroupedLists";
import { ImpactAIRiskReport } from "@/components/change-impact/ImpactAIRiskReport";
import { ImpactComparisonModal } from "@/components/change-impact/ImpactComparisonModal";
import {
  ChangeImpactResult,
  ChangeType,
  RadialGraphNode,
  SavedImpactAnalysis,
} from "@/types/impact";
import {
  getStore,
  saveImpactAnalysis,
  getImpactAnalyses,
  deleteImpactAnalysis,
  renameImpactAnalysis,
  logActivity,
  saveStore,
} from "@/lib/demo/store";
import { analyzeChangeImpact } from "@/lib/demo/impact-engine";
import { impactService } from "@/services/impact-service";
import { Check, AlertTriangle, Info, Network, GitPullRequest } from "lucide-react";

function ChangeImpactContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read URL params
  const repoFromUrl = searchParams.get("repo") || searchParams.get("repoId") || "shared-core-lib";
  const fileFromUrl = searchParams.get("file") || "";
  const symbolFromUrl = searchParams.get("symbol") || "";
  const depthFromUrl = parseInt(searchParams.get("depth") || "3", 10);
  const typeFromUrl = (searchParams.get("type") || "modify_behavior") as ChangeType;

  // Active inputs
  const [selectedRepo, setSelectedRepo] = useState<string>(repoFromUrl);
  const [selectedFile, setSelectedFile] = useState<string>(fileFromUrl || "src/validation.ts");
  const [selectedSymbol, setSelectedSymbol] = useState<string>(symbolFromUrl || "validateEmail");
  const [changeType, setChangeType] = useState<ChangeType>(typeFromUrl);
  const [depth, setDepth] = useState<number>(isNaN(depthFromUrl) ? 3 : depthFromUrl);
  const [includeCrossRepo, setIncludeCrossRepo] = useState<boolean>(true);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [currentResult, setCurrentResult] = useState<ChangeImpactResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<RadialGraphNode | null>(null);

  // History State
  const [history, setHistory] = useState<SavedImpactAnalysis[]>([]);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | undefined>(undefined);

  // Compare Modal State
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareItemA, setCompareItemA] = useState<SavedImpactAnalysis | null>(null);
  const [compareItemB, setCompareItemB] = useState<SavedImpactAnalysis | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Repositories from store
  const store = getStore();
  const repositories = (store.repositories || []).map((r: any) => ({
    id: r.id,
    name: r.name || r.id,
  }));

  // Available symbols
  const [availableSymbols, setAvailableSymbols] = useState<
    Array<{ file: string; symbol: string; label: string }>
  >([]);

  // Load history from store
  const refreshHistory = () => {
    const list = getImpactAnalyses();
    setHistory(list);
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  // Load symbols for repository
  useEffect(() => {
    if (selectedRepo) {
      impactService.getAvailableSymbols(selectedRepo).then(setAvailableSymbols);
    }
  }, [selectedRepo]);

  // Handle URL deep link auto-run
  useEffect(() => {
    if (fileFromUrl || symbolFromUrl) {
      setSelectedRepo(repoFromUrl);
      setSelectedFile(fileFromUrl || "src/validation.ts");
      setSelectedSymbol(symbolFromUrl);
      setDepth(depthFromUrl || 3);
      setChangeType(typeFromUrl);

      // Auto-run analysis for deep link
      runAnalysis(repoFromUrl, fileFromUrl || "src/validation.ts", symbolFromUrl, changeType, depthFromUrl || 3, includeCrossRepo);
    } else {
      // Default to the first saved analysis or initial seed
      const saved = getImpactAnalyses();
      if (saved.length > 0) {
        setCurrentResult(saved[0].result);
        setActiveAnalysisId(saved[0].id);
        setSelectedRepo(saved[0].repositoryId);
        setSelectedFile(saved[0].targetFile);
        setSelectedSymbol(saved[0].targetSymbol);
      } else {
        runAnalysis("shared-core-lib", "src/validation.ts", "validateEmail", "modify_behavior", 3, true);
      }
    }
  }, [repoFromUrl, fileFromUrl, symbolFromUrl]);

  const runAnalysis = (
    repo: string,
    file: string,
    symbol: string,
    ctype: ChangeType,
    maxDepth: number,
    crossRepo: boolean
  ) => {
    setIsAnalyzing(true);
    setAnalysisStep("Parsing AST symbols...");

    setTimeout(() => {
      setAnalysisStep("Tracing reverse-dependency call graph...");

      setTimeout(() => {
        setAnalysisStep("Evaluating cross-repository consumers...");

        setTimeout(() => {
          setAnalysisStep("Calculating blast radius score...");

          const result = analyzeChangeImpact({
            repositoryId: repo,
            file,
            symbol,
            changeType: ctype,
            depth: maxDepth,
            includeCrossRepo: crossRepo,
          });

          setCurrentResult(result);
          setIsAnalyzing(false);
          setAnalysisStep("");

          // Select center node by default
          if (result.radialGraph?.nodes?.[0]) {
            setSelectedNode(result.radialGraph.nodes[0]);
          }

          // Persist to store history
          const title = `${repo}: ${symbol ? `${symbol}()` : file.split("/").pop()} ${ctype.replace("_", " ")}`;
          const newAnalysisRecord: SavedImpactAnalysis = {
            id: `impact_${Date.now()}`,
            title,
            repositoryId: repo,
            repositoryName: result.repositoryName || repo,
            targetFile: file,
            targetSymbol: symbol,
            changeType: ctype,
            depth: maxDepth,
            includeCrossRepo: crossRepo,
            riskScore: result.riskScore,
            riskLevel: result.riskLevel,
            summaryCounts: result.summaryCounts!,
            createdAt: new Date().toISOString(),
            result,
          };

          saveImpactAnalysis(newAnalysisRecord);
          setActiveAnalysisId(newAnalysisRecord.id);
          refreshHistory();

          showToast(`Analysis complete: ${result.riskLevel} risk (${result.riskScore}/100)`);
        }, 150);
      }, 150);
    }, 150);
  };

  const handleRunCurrentAnalysis = () => {
    runAnalysis(selectedRepo, selectedFile, selectedSymbol, changeType, depth, includeCrossRepo);
  };

  const handleSelectHistoryItem = (item: SavedImpactAnalysis) => {
    setActiveAnalysisId(item.id);
    setSelectedRepo(item.repositoryId);
    setSelectedFile(item.targetFile);
    setSelectedSymbol(item.targetSymbol);
    setChangeType(item.changeType);
    setDepth(item.depth);
    setIncludeCrossRepo(item.includeCrossRepo);
    setCurrentResult(item.result);
    if (item.result.radialGraph?.nodes?.[0]) {
      setSelectedNode(item.result.radialGraph.nodes[0]);
    }
    showToast(`Loaded analysis '${item.title}'`);
  };

  const handleNewAnalysis = () => {
    setActiveAnalysisId(undefined);
    setSelectedRepo("shared-core-lib");
    setSelectedFile("src/validation.ts");
    setSelectedSymbol("validateEmail");
    setChangeType("modify_behavior");
    setDepth(3);
    setIncludeCrossRepo(true);
    setCurrentResult(null);
    setSelectedNode(null);
    showToast("Ready for new impact analysis. Configure your changes above.");
  };

  const handleDeleteHistory = (id: string) => {
    deleteImpactAnalysis(id);
    refreshHistory();
    if (activeAnalysisId === id) {
      setActiveAnalysisId(undefined);
    }
    showToast("Analysis removed from history");
  };

  const handleRenameHistory = (id: string, newTitle: string) => {
    renameImpactAnalysis(id, newTitle);
    refreshHistory();
    showToast("Analysis renamed successfully");
  };

  const handleCompareAnalyses = (itemA: SavedImpactAnalysis, itemB: SavedImpactAnalysis) => {
    setCompareItemA(itemA);
    setCompareItemB(itemB);
    setCompareModalOpen(true);
  };

  const handleCreatePrChecklist = () => {
    if (!currentResult) return;

    // Add checklist comment to PR #101 in store
    const store = getStore();
    const prs = store.pullRequests || [];
    const targetPr = prs.find((p: any) => p.number === 101) || prs[0];

    const checklistComment = {
      id: `comment_checklist_${Date.now()}`,
      author: {
        name: "CodeAtlas Impact Bot",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      },
      createdAt: new Date().toISOString(),
      body: `### 🛡️ Pre-Merge Change Impact Checklist (${currentResult.riskLevel} Risk • ${currentResult.riskScore}/100)\n\n` +
        `Target modification: \`${currentResult.file}:${currentResult.symbol}\`\n\n` +
        `**Verification Tasks:**\n` +
        currentResult.testsToRerun.map((t) => `- [ ] Run and verify suite: \`${t.file}\``).join("\n") + "\n" +
        (currentResult.coverageGaps || []).map((g) => `- [ ] Author unit tests for gap: \`${g.file}\``).join("\n") + "\n" +
        `- [ ] Confirm backward compatibility for ${currentResult.affectedEndpoints.length} affected public API endpoints\n` +
        `- [ ] Verify no breaking changes for cross-repo consumers in \`${currentResult.summaryCounts?.reposCount || 1}\` repository(s)\n`,
    };

    if (targetPr) {
      if (!targetPr.comments) targetPr.comments = [];
      targetPr.comments.push(checklistComment);
      saveStore(store);
    }

    logActivity({
      type: "pr_checklist_created",
      title: "Created Change Impact Checklist",
      description: `Appended safety verification checklist to PR #${targetPr?.number || 101} based on ${currentResult.riskLevel} risk impact assessment.`,
      href: "/code-review",
      status: "success",
    });

    showToast(`PR Checklist Created! Added risk review checklist to PR #${targetPr?.number || 101} in Code Review.`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Change Impact Analysis"
        sub="Blast radius intelligence: compute affected files, API endpoints, downstream services, and missing test coverage before editing code."
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#19143D] text-white border border-[#7C5CFC] shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left History Sidebar */}
        <ImpactHistorySidebar
          history={history}
          activeAnalysisId={activeAnalysisId}
          onSelectAnalysis={handleSelectHistoryItem}
          onNewAnalysis={handleNewAnalysis}
          onDeleteAnalysis={handleDeleteHistory}
          onRenameAnalysis={handleRenameHistory}
          onCompareAnalyses={handleCompareAnalyses}
          className="rounded-2xl"
        />

        {/* Right Main Content */}
        <div className="flex-1 w-full space-y-6 min-w-0">
          {/* Input Configuration Tabs */}
          <ImpactInputTabs
            selectedRepo={selectedRepo}
            onSelectedRepoChange={setSelectedRepo}
            selectedFile={selectedFile}
            onSelectedFileChange={setSelectedFile}
            selectedSymbol={selectedSymbol}
            onSelectedSymbolChange={setSelectedSymbol}
            changeType={changeType}
            onChangeTypeChange={setChangeType}
            depth={depth}
            onDepthChange={setDepth}
            includeCrossRepo={includeCrossRepo}
            onIncludeCrossRepoChange={setIncludeCrossRepo}
            isAnalyzing={isAnalyzing}
            analysisStep={analysisStep}
            onRunAnalysis={handleRunCurrentAnalysis}
            repositories={repositories}
            availableSymbols={availableSymbols}
          />

          {/* Results Display */}
          {currentResult ? (
            <div className="space-y-6">
              {/* Summary Bar */}
              <ImpactSummaryBar
                result={currentResult}
                onCreatePrChecklist={handleCreatePrChecklist}
              />

              {/* Middle Section: Radial Visualization + Side Node Inspector */}
              <div className="flex flex-col xl:flex-row gap-4 items-stretch">
                <div className="flex-1 min-w-0">
                  {currentResult.radialGraph && (
                    <BlastRadiusRadialMap
                      radialData={currentResult.radialGraph}
                      selectedNodeId={selectedNode?.id}
                      onSelectNode={(n) => setSelectedNode(n)}
                    />
                  )}
                </div>

                {selectedNode && (
                  <AffectedNodeSidePanel
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    className="rounded-2xl"
                  />
                )}
              </div>

              {/* Bottom Section: Grouped Lists & AI Risk Report */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Grouped Lists (Direct, Indirect, APIs, Tests, Gaps) */}
                <ImpactGroupedLists
                  affectedItems={currentResult.affectedItems || []}
                  endpoints={currentResult.affectedEndpoints}
                  tests={currentResult.testsToRerun}
                  gaps={currentResult.coverageGaps || []}
                  onSelectNode={(nodeId) => {
                    const matched = currentResult.radialGraph?.nodes.find((n) => n.id === nodeId);
                    if (matched) setSelectedNode(matched);
                  }}
                />

                {/* AI Risk Report */}
                <ImpactAIRiskReport
                  result={currentResult}
                  onUpdateReport={(updated) => {
                    setCurrentResult((prev) => (prev ? { ...prev, aiRiskReport: updated } : prev));
                  }}
                />
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-3">
              <Network className="w-12 h-12 mx-auto text-[#7C5CFC] opacity-60" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                No Impact Analysis Loaded
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                Configure your repository and changes in the tabs above and click &quot;Analyze Impact&quot; to compute the blast radius.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      <ImpactComparisonModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        analysisA={compareItemA}
        analysisB={compareItemB}
      />
    </div>
  );
}

export default function ChangeImpactPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-mono text-[var(--text-secondary)]">
          Loading Change Impact Intelligence...
        </div>
      }
    >
      <ChangeImpactContent />
    </Suspense>
  );
}
