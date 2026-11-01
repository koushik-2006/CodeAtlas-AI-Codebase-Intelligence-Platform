"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  FileCode,
  GitPullRequest,
  Sparkles,
  GitCompare,
  FolderGit2,
  SlidersHorizontal,
  Network,
  Check,
  Search,
  ArrowRight,
  Info,
  Loader2,
} from "lucide-react";
import { ChangeType } from "@/types/impact";
import { Button } from "@/components/ui/Button";
import { getStore } from "@/lib/demo/store";
import { parseDiffInput, mapNaturalLanguageChange } from "@/lib/demo/impact-engine";

interface ImpactInputTabsProps {
  selectedRepo: string;
  onSelectedRepoChange: (repoId: string) => void;
  selectedFile: string;
  onSelectedFileChange: (filePath: string) => void;
  selectedSymbol: string;
  onSelectedSymbolChange: (symbol: string) => void;
  changeType: ChangeType;
  onChangeTypeChange: (type: ChangeType) => void;
  depth: number;
  onDepthChange: (depth: number) => void;
  includeCrossRepo: boolean;
  onIncludeCrossRepoChange: (val: boolean) => void;
  isAnalyzing: boolean;
  analysisStep?: string;
  onRunAnalysis: () => void;
  repositories: Array<{ id: string; name: string }>;
  availableSymbols: Array<{ file: string; symbol: string; label: string }>;
}

export function ImpactInputTabs({
  selectedRepo,
  onSelectedRepoChange,
  selectedFile,
  onSelectedFileChange,
  selectedSymbol,
  onSelectedSymbolChange,
  changeType,
  onChangeTypeChange,
  depth,
  onDepthChange,
  includeCrossRepo,
  onIncludeCrossRepoChange,
  isAnalyzing,
  analysisStep,
  onRunAnalysis,
  repositories,
  availableSymbols,
}: ImpactInputTabsProps) {
  const [activeTab, setActiveTab] = useState<"pick" | "diff" | "pr" | "describe">("pick");

  // Tab 2: Diff state
  const [rawDiff, setRawDiff] = useState<string>("");
  const [diffParsedNotice, setDiffParsedNotice] = useState<string | null>(null);

  // Tab 3: PR state
  const [selectedPrId, setSelectedPrId] = useState<string>("");
  const store = getStore();
  const pullRequests = store.pullRequests || [];

  // Tab 4: Describe state
  const [describeText, setDescribeText] = useState<string>("");
  const [describeMatches, setDescribeMatches] = useState<
    Array<{ file: string; symbol: string; confidence: number; reason: string }>
  >([]);
  const [isMappingText, setIsMappingText] = useState(false);

  // Filter symbols for currently selected file
  const fileFilteredSymbols = availableSymbols.filter(
    (s) => s.file === selectedFile || s.file.endsWith(selectedFile)
  );

  const sampleDiff = `--- a/src/validation.ts
+++ b/src/validation.ts
@@ -1,6 +1,8 @@
 export function validateEmail(email: string): boolean {
-  if (!email) return false;
+  if (!email || typeof email !== "string") return false;
+  // Added strict TLD and non-whitespace validation
   return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim());
 }`;

  const handleLoadSampleDiff = () => {
    setRawDiff(sampleDiff);
    onSelectedRepoChange("shared-core-lib");
    const parsed = parseDiffInput(sampleDiff, "shared-core-lib");
    if (parsed.suggestedFile) {
      onSelectedFileChange(parsed.suggestedFile);
      onSelectedSymbolChange(parsed.suggestedSymbol || "validateEmail");
      setDiffParsedNotice(`Parsed changed file: '${parsed.suggestedFile}' -> '${parsed.suggestedSymbol || "validateEmail"}'`);
    }
  };

  const handleParseDiff = () => {
    if (!rawDiff.trim()) return;
    const parsed = parseDiffInput(rawDiff, selectedRepo);
    if (parsed.suggestedFile) {
      onSelectedFileChange(parsed.suggestedFile);
      onSelectedSymbolChange(parsed.suggestedSymbol || "");
      setDiffParsedNotice(`Successfully identified: '${parsed.suggestedFile}' (${parsed.suggestedSymbol || "all symbols"})`);
    }
  };

  const handleSelectPr = (prId: string) => {
    setSelectedPrId(prId);
    const pr = pullRequests.find((p: any) => p.id === prId);
    if (pr) {
      if (pr.repositoryId) onSelectedRepoChange(pr.repositoryId);
      const prFiles = pr.changedFiles || pr.files || [];
      if (prFiles.length > 0) {
        const f = typeof prFiles[0] === "string" ? prFiles[0] : prFiles[0].path || prFiles[0].file;
        onSelectedFileChange(f);
        if (f.includes("validation")) onSelectedSymbolChange("validateEmail");
        else if (f.includes("auth")) onSelectedSymbolChange("loginUser");
      }
    }
  };

  const handleMapDescribeText = () => {
    if (!describeText.trim()) return;
    setIsMappingText(true);
    setTimeout(() => {
      const res = mapNaturalLanguageChange(describeText, selectedRepo, store);
      setDescribeMatches(res.matches);
      setIsMappingText(false);
      if (res.matches.length > 0) {
        onSelectedFileChange(res.matches[0].file);
        onSelectedSymbolChange(res.matches[0].symbol);
      }
    }, 350);
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("pick")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "pick"
              ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Pick What Changes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("diff")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "diff"
              ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Paste a Diff</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pr")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "pr"
              ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>From a Pull Request</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("describe")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "describe"
              ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Describe Change</span>
        </button>
      </div>

      {/* Tab 1: Pick What Changes */}
      {activeTab === "pick" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {/* Repository Selector */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-[var(--text-secondary)] mb-1">
              Repository
            </label>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs">
              <FolderGit2 className="w-4 h-4 text-[#7C5CFC] shrink-0" />
              <select
                value={selectedRepo}
                onChange={(e) => {
                  onSelectedRepoChange(e.target.value);
                  if (e.target.value === "shared-core-lib") {
                    onSelectedFileChange("src/validation.ts");
                    onSelectedSymbolChange("validateEmail");
                  } else if (e.target.value === "sample-project") {
                    onSelectedFileChange("src/services/auth.ts");
                    onSelectedSymbolChange("loginUser");
                  }
                }}
                className="w-full bg-transparent font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              >
                {repositories.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-[var(--text-secondary)] mb-1">
              File to Modify
            </label>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs">
              <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
              <select
                value={selectedFile}
                onChange={(e) => onSelectedFileChange(e.target.value)}
                className="w-full bg-transparent font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              >
                {selectedRepo === "shared-core-lib" ? (
                  <>
                    <option value="src/validation.ts">src/validation.ts</option>
                    <option value="src/validators.ts">src/validators.ts</option>
                    <option value="src/client.ts">src/client.ts</option>
                    <option value="package.json">package.json</option>
                  </>
                ) : selectedRepo === "payment-service" ? (
                  <>
                    <option value="src/checkout.ts">src/checkout.ts</option>
                    <option value="src/gateway.ts">src/gateway.ts</option>
                  </>
                ) : (
                  <>
                    <option value="src/services/auth.ts">src/services/auth.ts</option>
                    <option value="src/components/LoginForm.tsx">src/components/LoginForm.tsx</option>
                    <option value="src/components/UserProfile.tsx">src/components/UserProfile.tsx</option>
                    <option value="src/api/auth-routes.ts">src/api/auth-routes.ts</option>
                    <option value="src/utils/validation.ts">src/utils/validation.ts</option>
                    <option value="src/models/user-model.ts">src/models/user-model.ts</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Target Symbol Picker */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-[var(--text-secondary)] mb-1">
              Optional Symbol
            </label>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs">
              <select
                value={selectedSymbol}
                onChange={(e) => onSelectedSymbolChange(e.target.value)}
                className="w-full bg-transparent font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value="">— Entire File —</option>
                {selectedFile.includes("validation") && (
                  <>
                    <option value="validateEmail">validateEmail()</option>
                    <option value="validatePassword">validatePassword()</option>
                  </>
                )}
                {selectedFile.includes("auth.ts") && (
                  <>
                    <option value="loginUser">loginUser()</option>
                    <option value="verifySession">verifySession()</option>
                  </>
                )}
                {selectedFile.includes("LoginForm") && (
                  <option value="handleSubmit">handleSubmit()</option>
                )}
                {selectedFile.includes("checkout") && (
                  <option value="handleCheckoutRoute">handleCheckoutRoute()</option>
                )}
                {fileFilteredSymbols.map((s, idx) => (
                  <option key={idx} value={s.symbol}>
                    {s.symbol}()
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Change Type */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-[var(--text-secondary)] mb-1">
              Change Type
            </label>
            <div className="p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs">
              <select
                value={changeType}
                onChange={(e) => onChangeTypeChange(e.target.value as ChangeType)}
                className="w-full bg-transparent font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value="modify_behavior">Modify behavior (Internal Logic)</option>
                <option value="change_signature">Change signature (Params / Return)</option>
                <option value="add_parameter">Add required parameter</option>
                <option value="rename">Rename identifier</option>
                <option value="delete">Delete symbol / deprecate</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Paste a Diff */}
      {activeTab === "diff" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">
              Paste a unified git diff snippet to automatically resolve changed lines and symbols:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadSampleDiff}
              className="text-xs text-[#7C5CFC]"
            >
              Load Sample Diff
            </Button>
          </div>

          <textarea
            value={rawDiff}
            onChange={(e) => setRawDiff(e.target.value)}
            placeholder="diff --git a/src/validation.ts b/src/validation.ts&#10;--- a/src/validation.ts&#10;+++ b/src/validation.ts&#10;@@ -1,5 +1,6 @@&#10; export function validateEmail(email: string) {&#10;+  if (!email) return false;"
            rows={5}
            className="w-full p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]"
          />

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleParseDiff}
              disabled={!rawDiff.trim()}
              className="text-xs"
            >
              Parse Diff Lines
            </Button>

            {diffParsedNotice && (
              <span className="text-xs text-emerald-400 font-semibold">{diffParsedNotice}</span>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: From a Pull Request */}
      {activeTab === "pr" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">
              Select an open or merged Pull Request from Code Review to evaluate its combined changes:
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pullRequests.map((pr: any) => {
              const isSelected = selectedPrId === pr.id;
              return (
                <div
                  key={pr.id}
                  onClick={() => handleSelectPr(pr.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#7C5CFC]/15 border-[#7C5CFC] shadow-xs"
                      : "bg-[var(--bg-card-hover)] border-[var(--border-color)] hover:border-[#7C5CFC]/50"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[var(--text-primary)]">
                    <span className="flex items-center gap-1.5">
                      <GitPullRequest className="w-3.5 h-3.5 text-[#7C5CFC]" />
                      PR #{pr.number || "101"}: {pr.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 font-mono">
                      {pr.status || "open"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--text-secondary)] font-mono">
                    <span>{pr.repositoryId || "sample-project"}</span>
                    <span>•</span>
                    <span>{pr.changedFiles?.length || 2} file(s) changed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Describe the Change */}
      {activeTab === "describe" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">
              Describe intended modifications in plain English. AI maps intent to likely files & symbols:
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={describeText}
              onChange={(e) => setDescribeText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleMapDescribeText()}
              placeholder="e.g., 'make email validation stricter for Enterprise domains in shared library' or 'refactor loginUser'"
              className="flex-1 p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleMapDescribeText}
              disabled={isMappingText || !describeText.trim()}
              className="text-xs gap-1.5"
            >
              {isMappingText ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              <span>Map Intent</span>
            </Button>
          </div>

          {describeMatches.length > 0 && (
            <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
              <span className="text-[11px] font-mono text-[var(--text-secondary)] uppercase font-semibold">
                Detected Target Candidates (Click to select):
              </span>
              <div className="flex flex-wrap gap-2">
                {describeMatches.map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectedFileChange(m.file);
                      onSelectedSymbolChange(m.symbol);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      selectedFile === m.file && selectedSymbol === m.symbol
                        ? "bg-[#7C5CFC] text-white border-[#7C5CFC]"
                        : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[#7C5CFC]"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {m.file} → {m.symbol}()
                    </span>
                    <span className="text-[10px] font-mono opacity-80">({m.confidence}% match)</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Common Bottom Controls: Depth, Cross-repo, and Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[var(--border-color)]">
        {/* Sliders and Toggles */}
        <div className="flex items-center gap-6 flex-wrap">
          {/* Depth Slider */}
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <span className="text-[var(--text-secondary)]">Analysis Depth:</span>
            <input
              type="range"
              min="1"
              max="5"
              value={depth}
              onChange={(e) => onDepthChange(parseInt(e.target.value, 10))}
              className="accent-[#7C5CFC] cursor-pointer w-24"
            />
            <span className="font-bold text-[#7C5CFC] px-2 py-0.5 rounded bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
              {depth} hop{depth > 1 ? "s" : ""}
            </span>
          </div>

          {/* Cross-Repo Toggle */}
          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeCrossRepo}
              onChange={(e) => onIncludeCrossRepoChange(e.target.checked)}
              className="accent-[#7C5CFC] w-4 h-4 rounded cursor-pointer"
            />
            <span>Include Cross-Repo Consumers</span>
          </label>
        </div>

        {/* Action Button & Step Indicator */}
        <div className="flex items-center gap-3">
          {isAnalyzing && analysisStep && (
            <div className="flex items-center gap-2 text-xs font-mono text-[#7C5CFC] animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{analysisStep}</span>
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={onRunAnalysis}
            disabled={isAnalyzing || !selectedFile}
            className="bg-[#7C5CFC] text-white hover:bg-[#6A4BE2] font-bold px-6 shadow-md gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Blast Radius...</span>
              </>
            ) : (
              <>
                <Network className="w-4 h-4" />
                <span>Analyze Impact</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

