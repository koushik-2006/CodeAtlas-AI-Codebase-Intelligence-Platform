"use client";

import { useTheme } from "@/hooks/useTheme";
import { GitCompare, Info, Search, Filter, FolderGit2 } from "lucide-react";

interface ImpactAnalysisFormProps {
  selectedRepo: string;
  onSelectedRepoChange: (repo: string) => void;
  targetSymbol: string;
  onTargetSymbolChange: (symbol: string) => void;
  searchFilter: string;
  onSearchFilterChange: (query: string) => void;
  options: {
    includeDownstream: boolean;
    includeTests: boolean;
    includeAPIs: boolean;
  };
  onOptionsChange: (newOpts: {
    includeDownstream: boolean;
    includeTests: boolean;
    includeAPIs: boolean;
  }) => void;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  repositories?: { id: string; name: string; isIndexed?: boolean }[];
  availableSymbols?: { file: string; symbol: string; label: string }[];
}

export function ImpactAnalysisForm({
  selectedRepo,
  onSelectedRepoChange,
  targetSymbol,
  onTargetSymbolChange,
  searchFilter,
  onSearchFilterChange,
  options,
  onOptionsChange,
  isAnalyzing,
  onRunAnalysis,
  repositories = [],
  availableSymbols = [],
}: ImpactAnalysisFormProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const defaultSymbols = [
    {
      file: "src/services/auth.ts",
      symbol: "loginUser",
      label: "src/services/auth.ts → loginUser()",
    },
    {
      file: "src/components/LoginForm.tsx",
      symbol: "handleSubmit",
      label: "src/components/LoginForm.tsx → handleSubmit()",
    },
    {
      file: "src/utils/validation.ts",
      symbol: "validateEmail",
      label: "src/utils/validation.ts → validateEmail()",
    },
  ];

  const symbolList = availableSymbols.length > 0 ? availableSymbols : defaultSymbols;

  return (
    <div
      className={`app-card p-6 mb-6 shadow-sm rounded-2xl border transition-all ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
      }`}
    >
      <div className="space-y-4">
        {/* Top Controls: Repository & Target Symbol */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Repository Selector */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-[var(--primary)]" />
              Target Repository
            </label>
            <select
              value={selectedRepo}
              onChange={(e) => onSelectedRepoChange(e.target.value)}
              aria-label="Select target repository"
              className={`w-full py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold border outline-none cursor-pointer ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                  : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
              }`}
            >
              {repositories.length > 0 ? (
                repositories.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.status === "ready" || r.isIndexed ? "Indexed" : "Connected"})
                  </option>
                ))
              ) : (
                <>
                  <option value="sample-project">sample-project (Indexed)</option>
                  <option value="none">— No repository selected —</option>
                </>
              )}
            </select>
          </div>

          {/* Symbol Preset Selector */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
              Target Symbol or Function
            </label>
            <select
              value={targetSymbol}
              onChange={(e) => onTargetSymbolChange(e.target.value)}
              aria-label="Select symbol to analyze"
              className={`w-full py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold border outline-none cursor-pointer ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                  : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
              }`}
            >
              {symbolList.map((item) => {
                const val = `${item.file}:${item.symbol}`;
                return (
                  <option key={val} value={val}>
                    {item.label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search Filter for Custom Symbol */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              Filter / Custom Symbol
            </label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => {
                onSearchFilterChange(e.target.value);
                if (e.target.value.trim().length > 2) {
                  onTargetSymbolChange(e.target.value);
                }
              }}
              placeholder="e.g. loginUser or handleSubmit"
              className={`w-full py-2 px-3 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                  : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
              }`}
            />
          </div>
        </div>

        {/* Options Row & Submit Button */}
        <div className="pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
          {/* Analysis Scope Options */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
            <span className="font-bold text-[var(--text-primary)]">Scope:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeDownstream}
                onChange={(e) =>
                  onOptionsChange({ ...options, includeDownstream: e.target.checked })
                }
                className="rounded accent-[var(--primary)]"
              />
              <span>Downstream Services</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeTests}
                onChange={(e) =>
                  onOptionsChange({ ...options, includeTests: e.target.checked })
                }
                className="rounded accent-[var(--primary)]"
              />
              <span>Test Coverage</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeAPIs}
                onChange={(e) =>
                  onOptionsChange({ ...options, includeAPIs: e.target.checked })
                }
                className="rounded accent-[var(--primary)]"
              />
              <span>Related APIs</span>
            </label>
          </div>

          {/* Calculate Impact Button */}
          <button
            type="button"
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
              isDark
                ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                : "bg-[#6C4DFF] text-white hover:bg-[#5838e6]"
            } disabled:opacity-50`}
          >
            {isAnalyzing ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <GitCompare className="w-4 h-4" />
            )}
            <span>{isAnalyzing ? "Computing AST Dependency Graph..." : "Analyze Impact"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
