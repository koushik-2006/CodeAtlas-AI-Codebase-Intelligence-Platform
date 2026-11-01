"use client";

import React, { useState, useMemo } from "react";
import {
  GitBranch,
  ArrowRight,
  AlertTriangle,
  ShieldAlert,
  TestTube,
  FileCode,
  CheckCircle,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Layers,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CrossRepoImpactReport, MultiRepoSummary } from "@/types/multi-repo";
import { useRouter } from "next/navigation";

interface CrossRepoImpactTabProps {
  repositories: MultiRepoSummary[];
  onCalculateImpact: (
    sourceRepoId: string,
    file: string,
    symbol: string,
    isBreaking: boolean
  ) => Promise<CrossRepoImpactReport>;
  isLoading: boolean;
}

export function CrossRepoImpactTab({
  repositories,
  onCalculateImpact,
  isLoading,
}: CrossRepoImpactTabProps) {
  const router = useRouter();

  // Searchable pickers state
  const [selectedRepoId, setSelectedRepoId] = useState<string>("shared-core-lib");
  const [selectedFile, setSelectedFile] = useState<string>("src/validators.ts");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("validateEmail");
  const [isBreaking, setIsBreaking] = useState<boolean>(true);

  const [report, setReport] = useState<CrossRepoImpactReport | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Preset scenarios
  const presets = [
    {
      label: "shared-core-lib: Breaking validateEmail signature",
      repo: "shared-core-lib",
      file: "src/validators.ts",
      symbol: "validateEmail",
      breaking: true,
    },
    {
      label: "auth-service: Breaking response schema on POST /token",
      repo: "auth-service",
      file: "main.go",
      symbol: "POST /token",
      breaking: true,
    },
    {
      label: "shared-core-lib: Compatible validateUuid update",
      repo: "shared-core-lib",
      file: "src/validators.ts",
      symbol: "validateUuid",
      breaking: false,
    },
  ];

  const handleRunEvaluation = async (preset?: (typeof presets)[0]) => {
    const sRepo = preset ? preset.repo : selectedRepoId;
    const cFile = preset ? preset.file : selectedFile;
    const cSymbol = preset ? preset.symbol : selectedSymbol;
    const breaking = preset ? preset.breaking : isBreaking;

    if (preset) {
      setSelectedRepoId(preset.repo);
      setSelectedFile(preset.file);
      setSelectedSymbol(preset.symbol);
      setIsBreaking(preset.breaking);
    }

    setIsEvaluating(true);
    try {
      const res = await onCalculateImpact(sRepo, cFile, cSymbol, breaking);
      setReport(res);
    } catch (err) {
      console.error("Evaluation failed", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSendToChangeImpact = () => {
    const params = new URLSearchParams({
      repo: selectedRepoId,
      file: selectedFile,
      symbol: selectedSymbol,
      breaking: String(isBreaking),
    });
    router.push(`/change-impact?${params.toString()}`);
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "Critical":
      case "High":
        return <Badge variant="coral">High Risk</Badge>;
      case "Medium":
        return <Badge variant="sun">Medium Risk</Badge>;
      default:
        return <Badge variant="mint">Low Risk</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Setup Box */}
      <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA] flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[#7C5CFC]" />
            Cross-Repository Blast Radius & Change Impact Simulation
          </h3>
          <p className="text-xs sm:text-sm text-[#6E6A8A] dark:text-[#8E95A8] mt-1">
            Pick a repository, file, and exported symbol or API endpoint to analyze all downstream caller sites across microservices.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-[#8E95A8] uppercase tracking-wider block">
            Suggested Scenarios:
          </span>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleRunEvaluation(p)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-[#19143D] dark:text-[#F3F5FA] hover:border-[#7C5CFC] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#7C5CFC]" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pickers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* 1. Repository Picker */}
          <div>
            <label className="text-xs font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1.5">
              1. Source Repository
            </label>
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-xs font-semibold text-[#19143D] dark:text-[#F3F5FA] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
            >
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.language})
                </option>
              ))}
            </select>
          </div>

          {/* 2. File Picker */}
          <div>
            <label className="text-xs font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1.5">
              2. Source File Path
            </label>
            <input
              type="text"
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              placeholder="e.g. src/validators.ts"
              className="w-full px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-xs font-mono text-[#19143D] dark:text-[#F3F5FA] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
            />
          </div>

          {/* 3. Symbol Picker */}
          <div>
            <label className="text-xs font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1.5">
              3. Target Symbol / Route
            </label>
            <input
              type="text"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              placeholder="e.g. validateEmail or POST /token"
              className="w-full px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-xs font-mono text-[#19143D] dark:text-[#F3F5FA] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
            />
          </div>
        </div>

        {/* Breaking Change Toggle and Submit */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#EAE6FD] dark:border-[#1E2638]">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#19143D] dark:text-[#F3F5FA]">
            <input
              type="checkbox"
              checked={isBreaking}
              onChange={(e) => setIsBreaking(e.target.checked)}
              className="w-4 h-4 rounded text-[#7C5CFC] focus:ring-[#7C5CFC] border-[#EAE6FD] dark:border-[#242B3D]"
            />
            <span>Simulate Breaking Signature or Contract Modification</span>
          </label>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleRunEvaluation()}
            disabled={isEvaluating || !selectedSymbol.trim()}
            className="flex items-center gap-2 px-5 shadow-sm"
          >
            {isEvaluating ? (
              <>
                <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                <span>Traversing Dependants...</span>
              </>
            ) : (
              <>
                <GitBranch className="w-4 h-4" />
                <span>Evaluate Cross-Repo Blast Radius</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results Report Display */}
      {report && (
        <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-6">
          {/* Header Summary */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EAE6FD] dark:border-[#1E2638]">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <Badge variant="brand" className="text-xs uppercase">
                  {report.sourceRepository.name}
                </Badge>
                <span className="text-[#8E95A8]">·</span>
                <span className="font-bold text-[#19143D] dark:text-[#F3F5FA]">
                  {report.targetComponent}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#6E6A8A] dark:text-[#8E95A8] mt-1 font-medium">
                {report.summary}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {getRiskBadge(report.riskLevel)}
              <div className="text-right">
                <span className="text-[10px] text-[#8E95A8] uppercase tracking-wider block font-bold">
                  Blast Radius Score
                </span>
                <span className="text-2xl font-extrabold text-[#7C5CFC]">
                  {report.riskScore}/100
                </span>
              </div>

              {/* Send to Change Impact Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendToChangeImpact}
                className="flex items-center gap-1.5 shadow-sm ml-2"
                title="Open in full Change Impact Analysis"
              >
                <span>Send to Change Impact</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Highlighted Dependency Path Visualization */}
          <div className="p-4 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] space-y-2">
            <span className="text-[10px] font-bold text-[#8E95A8] uppercase tracking-wider block">
              Dependency Path Traversal:
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-[#7C5CFC] text-white font-bold">
                {report.sourceRepository.name} ({selectedSymbol})
              </span>
              <ArrowRight className="w-4 h-4 text-[#8E95A8]" />
              {report.affectedRepositories.map((ar, idx) => (
                <React.Fragment key={idx}>
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0D111A] border border-[#7C5CFC]/40 text-[#7C5CFC] font-bold">
                    {ar.repositoryName} ({ar.affectedFiles.length} calls)
                  </span>
                  {idx < report.affectedRepositories.length - 1 && (
                    <span className="text-[#8E95A8]">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Affected Downstream Repositories Tree */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider">
              Affected Downstream Repositories ({report.affectedRepositories.length})
            </h4>

            <div className="space-y-3">
              {report.affectedRepositories.map((repo, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#FAFAFE] dark:bg-[#141926] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA] font-mono">
                        {repo.repositoryName}
                      </span>
                      <Badge
                        variant={repo.severity === "breaking" ? "coral" : "mint"}
                        className="text-[10px] uppercase font-mono"
                      >
                        {repo.severity}
                      </Badge>
                      {repo.versionConstraint && (
                        <span className="text-xs font-mono text-[#8E95A8]">
                          Constraint: {repo.versionConstraint}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#8E95A8]">
                      {repo.affectedFiles.length} caller location(s)
                    </span>
                  </div>

                  <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8]">
                    {repo.details}
                  </p>

                  {/* Caller Code Files Tree */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-[#8E95A8] uppercase tracking-wider block">
                      Call Sites:
                    </span>
                    {repo.affectedFiles.map((af: any, fIdx: number) => (
                      <div
                        key={fIdx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] text-xs font-mono gap-1"
                      >
                        <span className="font-bold text-[#7C5CFC]">
                          {af.path}:{af.line}
                        </span>
                        <span className="text-[#8E95A8] text-[11px] truncate max-w-md">
                          {af.contextSnippet}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Regression Tests */}
                  {repo.recommendedTests?.length > 0 && (
                    <div className="pt-2 border-t border-[#EAE6FD] dark:border-[#1E2638] space-y-1.5">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <TestTube className="w-3.5 h-3.5" />
                        Recommended Regression Tests:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {repo.recommendedTests.map((t: any, tIdx: number) => (
                          <span
                            key={tIdx}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono"
                          >
                            {t.file}:{t.line} ({t.testName})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rollout Guidelines */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
            <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Verification & Semantic Versioning Rules:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
              {report.verificationGuidelines.map((g, idx) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
