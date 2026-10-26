"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Search,
  GitFork,
  Sparkles,
  Repeat,
  Globe,
  GitBranch,
  PieChart,
} from "lucide-react";
import { MultiRepoHeader } from "@/components/multi-repo/MultiRepoHeader";
import { CrossRepoSearchPanel } from "@/components/multi-repo/CrossRepoSearchPanel";
import { CrossRepoDependencyVisualizer } from "@/components/multi-repo/CrossRepoDependencyVisualizer";
import { CrossRepoQAAssistant } from "@/components/multi-repo/CrossRepoQAAssistant";
import { DuplicateCodeInspector } from "@/components/multi-repo/DuplicateCodeInspector";
import { SharedAPICatalog } from "@/components/multi-repo/SharedAPICatalog";
import { CrossRepoImpactAnalyzer } from "@/components/multi-repo/CrossRepoImpactAnalyzer";
import { TechnologyInsightsView } from "@/components/multi-repo/TechnologyInsightsView";
import {
  MultiRepoSummary,
  CrossRepoSearchResponse,
  CrossRepoEntityType,
  CrossRepoDependencyGraph,
  CrossRepoAnswerResponse,
  DuplicateCandidate,
  SharedServiceEndpoint,
  CrossRepoImpactReport,
  TechnologyInsightsSummary,
} from "@/types/multi-repo";

export default function MultiRepoPage() {
  const [activeTab, setActiveTab] = useState<
    "search" | "dependencies" | "assistant" | "duplicates" | "services" | "impact" | "insights"
  >("search");

  const [repositories, setRepositories] = useState<MultiRepoSummary[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("validateEmail");
  const [searchResults, setSearchResults] = useState<CrossRepoSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Dependency Graph state
  const [dependencyGraph, setDependencyGraph] = useState<CrossRepoDependencyGraph | null>(null);
  const [isLoadingGraph, setIsLoadingGraph] = useState<boolean>(false);

  // Duplicates state
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [isLoadingDuplicates, setIsLoadingDuplicates] = useState<boolean>(false);

  // Services state
  const [endpoints, setEndpoints] = useState<SharedServiceEndpoint[]>([]);
  const [isLoadingEndpoints, setIsLoadingEndpoints] = useState<boolean>(false);

  // Insights state
  const [insights, setInsights] = useState<TechnologyInsightsSummary | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);

  // 1. Initial Load of Authorized Repositories
  const loadRepositories = async () => {
    setIsLoadingRepos(true);
    try {
      const res = await fetch("/api/multi-repo/repositories");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRepositories(json.data);
        // Default select all authorized repositories
        const allIds = json.data.map((r: MultiRepoSummary) => r.id);
        setSelectedRepoIds(allIds);

        // Run initial default search across selected repositories
        executeSearch("validateEmail", "all", false, allIds);
      }
    } catch (err) {
      console.error("Failed to load repositories:", err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  useEffect(() => {
    loadRepositories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Cross-Repo Search Execution
  const executeSearch = async (
    q: string,
    category: CrossRepoEntityType = "all",
    exact: boolean = false,
    overrideRepoIds?: string[]
  ) => {
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const targetIds = overrideRepoIds || selectedRepoIds;
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("category", category);
      if (exact) params.set("exact", "true");
      if (targetIds.length > 0) params.set("repos", targetIds.join(","));

      const res = await fetch(`/api/multi-repo/search?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSearchResults(json.data);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Load Dependency Graph
  const loadDependencyGraph = async () => {
    setIsLoadingGraph(true);
    try {
      const params = new URLSearchParams();
      if (selectedRepoIds.length > 0) params.set("repos", selectedRepoIds.join(","));

      const res = await fetch(`/api/multi-repo/dependencies?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDependencyGraph(json.data);
      }
    } catch (err) {
      console.error("Failed to load dependency graph:", err);
    } finally {
      setIsLoadingGraph(false);
    }
  };

  // 4. Load Duplicates
  const loadDuplicates = async () => {
    setIsLoadingDuplicates(true);
    try {
      const params = new URLSearchParams();
      if (selectedRepoIds.length > 0) params.set("repos", selectedRepoIds.join(","));

      const res = await fetch(`/api/multi-repo/duplicates?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDuplicates(json.data);
      }
    } catch (err) {
      console.error("Failed to load duplicates:", err);
    } finally {
      setIsLoadingDuplicates(false);
    }
  };

  // 5. Load Services
  const loadServices = async () => {
    setIsLoadingEndpoints(true);
    try {
      const params = new URLSearchParams();
      if (selectedRepoIds.length > 0) params.set("repos", selectedRepoIds.join(","));

      const res = await fetch(`/api/multi-repo/services?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setEndpoints(json.data);
      }
    } catch (err) {
      console.error("Failed to load services:", err);
    } finally {
      setIsLoadingEndpoints(false);
    }
  };

  // 6. Load Insights
  const loadInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const res = await fetch("/api/multi-repo/technology-insights");
      const json = await res.json();
      if (json.success) {
        setInsights(json.data);
      }
    } catch (err) {
      console.error("Failed to load technology insights:", err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Switch tabs & trigger fetches as needed
  useEffect(() => {
    if (activeTab === "dependencies" && !dependencyGraph) {
      loadDependencyGraph();
    } else if (activeTab === "duplicates" && duplicates.length === 0) {
      loadDuplicates();
    } else if (activeTab === "services" && endpoints.length === 0) {
      loadServices();
    } else if (activeTab === "insights" && !insights) {
      loadInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Handle repository selection toggle
  const handleToggleRepo = (repoId: string) => {
    setSelectedRepoIds((prev) => {
      const next = prev.includes(repoId) ? prev.filter((id) => id !== repoId) : [...prev, repoId];
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedRepoIds(repositories.map((r) => r.id));
  };

  const handleClearAll = () => {
    setSelectedRepoIds([]);
  };

  // Cross-Repo AI Query Handler
  const handleAskQuestion = async (q: string): Promise<CrossRepoAnswerResponse> => {
    const res = await fetch("/api/multi-repo/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: q,
        repositoryIds: selectedRepoIds,
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to answer question");
    return json.data;
  };

  // Cross-Repo Impact Evaluation Handler
  const handleAnalyzeImpact = async (
    sRepo: string,
    cName: string,
    cFile: string,
    breaking: boolean
  ): Promise<CrossRepoImpactReport> => {
    const res = await fetch("/api/multi-repo/impact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceRepoId: sRepo,
        changedComponent: {
          type: cName.startsWith("POST") || cName.startsWith("GET") ? "api_endpoint" : "symbol",
          name: cName,
          file: cFile,
          isBreaking: breaking,
        },
        targetRepoIds: selectedRepoIds,
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to analyze impact");
    return json.data;
  };

  const tabs: Array<{ id: typeof activeTab; label: string; icon: React.ReactNode }> = [
    { id: "search", label: "Cross-Repo Search", icon: <Search className="w-4 h-4" /> },
    { id: "dependencies", label: "Dependency Graph", icon: <GitFork className="w-4 h-4" /> },
    { id: "assistant", label: "Cross-Repo AI Q&A", icon: <Sparkles className="w-4 h-4" /> },
    { id: "duplicates", label: "Duplicates & Reuse", icon: <Repeat className="w-4 h-4" /> },
    { id: "services", label: "Shared APIs & Services", icon: <Globe className="w-4 h-4" /> },
    { id: "impact", label: "Change Impact Analysis", icon: <GitBranch className="w-4 h-4" /> },
    { id: "insights", label: "Technology Insights", icon: <PieChart className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FE] dark:bg-[#07090E] p-4 md:p-8 space-y-6">
      {/* Top Header & Scope Selector */}
      <MultiRepoHeader
        repositories={repositories}
        selectedRepoIds={selectedRepoIds}
        onToggleRepo={handleToggleRepo}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
        isLoading={isLoadingRepos}
        onRefresh={loadRepositories}
      />

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-[#EAE6FD] dark:border-[#1E2638] gap-2 pb-px no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-[#6C4DFF] dark:border-[#29D3C2] text-[#6C4DFF] dark:text-[#29D3C2]"
                : "border-transparent text-[#6E6A8A] dark:text-[#8E95A8] hover:text-[#19143D] dark:hover:text-[#F3F5FA]"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="pt-2">
        {activeTab === "search" && (
          <CrossRepoSearchPanel
            searchResults={searchResults}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onExecuteSearch={(q, cat, exact) => executeSearch(q, cat, exact)}
            isSearching={isSearching}
            selectedRepoCount={selectedRepoIds.length}
          />
        )}

        {activeTab === "dependencies" && (
          <CrossRepoDependencyVisualizer
            graph={dependencyGraph}
            isLoading={isLoadingGraph}
          />
        )}

        {activeTab === "assistant" && (
          <CrossRepoQAAssistant
            onAskQuestion={handleAskQuestion}
            selectedRepoCount={selectedRepoIds.length}
          />
        )}

        {activeTab === "duplicates" && (
          <DuplicateCodeInspector
            candidates={duplicates}
            isLoading={isLoadingDuplicates}
          />
        )}

        {activeTab === "services" && (
          <SharedAPICatalog
            endpoints={endpoints}
            isLoading={isLoadingEndpoints}
          />
        )}

        {activeTab === "impact" && (
          <CrossRepoImpactAnalyzer
            repositories={repositories}
            onAnalyzeImpact={handleAnalyzeImpact}
            isLoading={false}
          />
        )}

        {activeTab === "insights" && (
          <TechnologyInsightsView
            insights={insights}
            isLoading={isLoadingInsights}
          />
        )}
      </div>
    </div>
  );
}
