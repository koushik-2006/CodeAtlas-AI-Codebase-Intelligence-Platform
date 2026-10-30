"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  GitBranch,
  ArrowRight,
  ShieldAlert,
  TestTube,
  FileCode,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CrossRepoImpactReport, MultiRepoSummary } from "@/types/multi-repo";

interface CrossRepoImpactAnalyzerProps {
  repositories: MultiRepoSummary[];
  onAnalyzeImpact: (
    sourceRepoId: string,
    componentName: string,
    componentFile: string,
    isBreaking: boolean
  ) => Promise<CrossRepoImpactReport>;
  isLoading: boolean;
}

export function CrossRepoImpactAnalyzer({
  repositories,
  onAnalyzeImpact,
  isLoading,
}: CrossRepoImpactAnalyzerProps) {
  const [sourceRepoId, setSourceRepoId] = useState<string>("shared-core-lib");
  const [componentName, setComponentName] = useState<string>("validateEmail");
  const [componentFile, setComponentFile] = useState<string>("src/validation.ts");
  const [isBreaking, setIsBreaking] = useState<boolean>(true);
  const [report, setReport] = useState<CrossRepoImpactReport | null>(null);

  const presets = [
    {
      sourceRepoId: "shared-core-lib",
      componentName: "validateEmail",
      componentFile: "src/validation.ts",
      isBreaking: true,
      label: "shared-core-lib: Breaking signature change to validateEmail",
    },
    {
      sourceRepoId: "shared-core-lib",
      componentName: "formatCurrency",
      componentFile: "src/formatters.ts",
      isBreaking: false,
      label: "shared-core-lib: Compatible update to formatCurrency",
    },
    {
      sourceRepoId: "auth-service",
      componentName: "POST /api/v1/auth/session",
      componentFile: "src/server.ts",
      isBreaking: true,
      label: "auth-service: Breaking response schema change on /api/v1/auth/session",
    },
  ];

  const handleRunAnalysis = async (preset?: (typeof presets)[0]) => {
    const sRepo = preset ? preset.sourceRepoId : sourceRepoId;
    const cName = preset ? preset.componentName : componentName;
    const cFile = preset ? preset.componentFile : componentFile;
    const breaking = preset ? preset.isBreaking : isBreaking;

    if (preset) {
      setSourceRepoId(preset.sourceRepoId);
      setComponentName(preset.componentName);
      setComponentFile(preset.componentFile);
      setIsBreaking(preset.isBreaking);
    }

    try {
      const res = await onAnalyzeImpact(sRepo, cName, cFile, breaking);
      setReport(res);
    } catch (err) {
      console.error("Impact analysis failed:", err);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "Critical":
        return <Badge variant="coral">Critical Risk</Badge>;
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
      {/* Simulation Configuration Card */}
      <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA] flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#6C4DFF] dark:text-[#29D3C2]" />
            Cross-Repository Change Impact Engine
          </h3>
          <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-0.5">
            Evaluate downstream ripple effects across authorized repositories when modifying a shared package, symbol signature, or API contract.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-[#8E95A8] uppercase tracking-wider">
            Quick Simulation Scenarios:
          </span>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleRunAnalysis(p)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] hover:border-[#6C4DFF] text-[#19143D] dark:text-[#F3F5FA] font-medium transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-[#EAE6FD] dark:border-[#1E2638]">
          <div>
            <label className="block text-xs font-medium text-[#6E6A8A] dark:text-[#8E95A8] mb-1">
              Source Repository
            </label>
            <select
              value={sourceRepoId}
              onChange={(e) => setSourceRepoId(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-xs font-medium text-[#19143D] dark:text-[#F3F5FA] focus:outline-none"
            >
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6E6A8A] dark:text-[#8E95A8] mb-1">
              Target Component / Symbol
            </label>
            <input
              type="text"
              value={componentName}
              onChange={(e) => setComponentName(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-xs font-mono text-[#19143D] dark:text-[#F3F5FA] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6E6A8A] dark:text-[#8E95A8] mb-1">
              File Path
            </label>
            <input
              type="text"
              value={componentFile}
              onChange={(e) => setComponentFile(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-xs font-mono text-[#19143D] dark:text-[#F3F5FA] focus:outline-none"
            />
          </div>

          <div className="flex flex-col justify-end">
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#6E6A8A] dark:text-[#8E95A8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="rounded border-[#EAE6FD] dark:border-[#242B3D] text-[#6C4DFF]"
                />
                <span>Breaking Change</span>
              </label>

              <button
                onClick={() => handleRunAnalysis()}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-[#6C4DFF] dark:bg-[#29D3C2] text-white dark:text-[#0D111A] text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                {isLoading ? "Analyzing..." : "Evaluate Impact"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Evaluation Results */}
      {isLoading && (
        <div className="p-12 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-[#6C4DFF] dark:border-[#29D3C2] border-t-transparent rounded-full mb-3" />
          <p className="text-sm text-[#6E6A8A] dark:text-[#8E95A8]">
            Traversing inter-repository call sites and version constraint matrices...
          </p>
        </div>
      )}

      {!isLoading && report && (
        <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EAE6FD] dark:border-[#1E2638]">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="brand" className="text-xs uppercase font-mono">
                  {report.sourceRepository.name}
                </Badge>
                <span className="text-xs font-mono text-[#8E95A8]">
                  {report.sourceRepository.revision}
                </span>
                <span className="text-xs text-[#8E95A8]">·</span>
                <span className="text-sm font-bold font-mono text-[#19143D] dark:text-[#F3F5FA]">
                  {report.targetComponent}
                </span>
              </div>
              <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-1">
                {report.summary}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {getRiskBadge(report.riskLevel)}
              <div className="text-right">
                <span className="text-xs text-[#8E95A8] uppercase tracking-wider block">Risk Score</span>
                <span className="text-xl font-extrabold text-[#6C4DFF] dark:text-[#29D3C2]">
                  {report.riskScore}/100
                </span>
              </div>
            </div>
          </div>

          {/* Affected Downstream Repositories */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider">
              Affected Downstream Repositories ({report.affectedRepositories.length})
            </h4>

            {report.affectedRepositories.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#FAFAFE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#1E2638] text-xs text-[#8E95A8]">
                No downstream dependencies or consumer references were affected by this change.
              </div>
            ) : (
              <div className="space-y-4">
                {report.affectedRepositories.map((repo, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="brand" className="text-xs uppercase font-mono">
                          {repo.repositoryName}
                        </Badge>
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
                        {repo.affectedFiles.length} file reference(s)
                      </span>
                    </div>

                    <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8]">
                      {repo.details}
                    </p>

                    {/* Affected Files & Lines */}
                    {repo.affectedFiles.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-[#8E95A8] uppercase tracking-wider block">
                          Caller References:
                        </span>
                        {repo.affectedFiles.map((af, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] text-xs font-mono"
                          >
                            <span className="text-[#19143D] dark:text-[#F3F5FA]">
                              {af.path}:{af.line}
                            </span>
                            <span className="text-[#8E95A8] text-[11px]">{af.contextSnippet}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommended Tests */}
                    {repo.recommendedTests.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[#EAE6FD] dark:border-[#1E2638]">
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <TestTube className="w-3.5 h-3.5" />
                          Recommended Regression Tests:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {repo.recommendedTests.map((t, tIdx) => (
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
            )}
          </div>

          {/* Verification Guidelines */}
          <div className="space-y-2 pt-2 border-t border-[#EAE6FD] dark:border-[#1E2638]">
            <h5 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider">
              Verification & Rollout Guidelines
            </h5>
            <ul className="list-disc list-inside space-y-1 text-xs text-[#6E6A8A] dark:text-[#8E95A8]">
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
