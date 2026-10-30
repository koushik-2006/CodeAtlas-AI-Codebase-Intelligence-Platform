"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { ImpactAnalysisForm } from "@/components/change-impact/ImpactAnalysisForm";
import { ImpactResults } from "@/components/change-impact/ImpactResults";
import { impactService, PRESET_IMPACT_DATA } from "@/services/impact-service";
import { useRepositories } from "@/hooks/useRepositories";
import { ChangeImpactResult } from "@/types/impact";
import { FolderGit2, AlertTriangle, Link2 } from "lucide-react";
import Link from "next/link";

function ImpactContent() {
  const searchParams = useSearchParams();
  const { repositories } = useRepositories();

  // URL query params
  const repoFromUrl = searchParams?.get("repo") || "sample-project";
  const symbolFromUrl = searchParams?.get("symbol") || "";
  const fileFromUrl = searchParams?.get("file") || "";

  const [selectedRepo, setSelectedRepo] = useState<string>(repoFromUrl);
  const [targetSymbol, setTargetSymbol] = useState<string>("src/services/auth.ts:loginUser");
  const [availableSymbols, setAvailableSymbols] = useState<
    { file: string; symbol: string; label: string }[]
  >([]);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [options, setOptions] = useState({
    includeDownstream: true,
    includeTests: true,
    includeAPIs: true,
  });

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<ChangeImpactResult | null>(
    PRESET_IMPACT_DATA["src/services/auth.ts:loginUser"]
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize from search params if present
  useEffect(() => {
    if (fileFromUrl && symbolFromUrl) {
      const combined = `${fileFromUrl}:${symbolFromUrl}`;
      setTargetSymbol(combined);
      setSearchFilter(symbolFromUrl);
    }
  }, [fileFromUrl, symbolFromUrl]);

  // Load available symbols for selected repository
  useEffect(() => {
    if (selectedRepo && selectedRepo !== "none") {
      impactService.getAvailableSymbols(selectedRepo).then((symbols) => {
        setAvailableSymbols(symbols);
      });
    }
  }, [selectedRepo]);

  // Execute analysis on mount or change
  useEffect(() => {
    if (selectedRepo === "none") {
      setResult(null);
      setErrorMessage("Please select an indexed repository to run change impact analysis.");
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);

    const [file, sym] = targetSymbol.includes(":")
      ? targetSymbol.split(":")
      : ["src/services/auth.ts", targetSymbol];

    impactService
      .analyzeImpact({
        repositoryId: selectedRepo,
        file: file || "src/services/auth.ts",
        symbol: sym || "loginUser",
        options,
      })
      .then((res) => {
        setResult(res);
        setIsAnalyzing(false);
      })
      .catch((err) => {
        setErrorMessage("Failed to compute AST impact graph for this symbol.");
        setIsAnalyzing(false);
      });
  }, [selectedRepo, targetSymbol, options]);

  const handleRunAnalysis = () => {
    if (selectedRepo === "none") {
      setErrorMessage("Please select a repository to run impact analysis.");
      return;
    }

    setIsAnalyzing(true);
    const [file, sym] = targetSymbol.includes(":")
      ? targetSymbol.split(":")
      : ["src/services/auth.ts", targetSymbol];

    impactService
      .analyzeImpact({
        repositoryId: selectedRepo,
        file: file || "src/services/auth.ts",
        symbol: sym || "loginUser",
        options,
      })
      .then((res) => {
        setResult(res);
        setIsAnalyzing(false);
      });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Change Impact Analysis"
        sub="Identify potentially affected files, APIs, services, and tests before editing code."
      />

      <ImpactAnalysisForm
        selectedRepo={selectedRepo}
        onSelectedRepoChange={setSelectedRepo}
        targetSymbol={targetSymbol}
        onTargetSymbolChange={setTargetSymbol}
        searchFilter={searchFilter}
        onSearchFilterChange={setSearchFilter}
        options={options}
        onOptionsChange={setOptions}
        isAnalyzing={isAnalyzing}
        onRunAnalysis={handleRunAnalysis}
        repositories={repositories}
        availableSymbols={availableSymbols}
      />

      {/* No repository selected notice */}
      {selectedRepo === "none" && (
        <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center max-w-lg mx-auto">
          <FolderGit2 className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Repository Required for Impact Tracing
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
            Change impact analysis requires a parsed AST symbol graph. Please select &apos;sample-project&apos; or connect a repository.
          </p>
          <button
            type="button"
            onClick={() => setSelectedRepo("sample-project")}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-white hover:opacity-90"
          >
            Use sample-project
          </button>
        </div>
      )}

      {/* Error state */}
      {errorMessage && selectedRepo !== "none" && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-xs text-red-500 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Analysis Results Display */}
      {selectedRepo !== "none" && result && (
        <ImpactResults result={result} repositoryId={selectedRepo} />
      )}
    </div>
  );
}

export default function ImpactPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-mono text-[var(--text-secondary)]">
          Loading Change Impact Analysis...
        </div>
      }
    >
      <ImpactContent />
    </Suspense>
  );
}
