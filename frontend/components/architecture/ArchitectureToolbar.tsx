"use client";

import React, { useState } from "react";
import {
  FolderGit2,
  Layers,
  LayoutGrid,
  Search,
  Filter,
  Maximize2,
  RotateCcw,
  Download,
  Share2,
  Check,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  X,
  FileCode,
} from "lucide-react";
import { ArchitectureLevel, ArchitectureLayout, ArchitectureLayerName } from "@/types/architecture";
import { Button } from "@/components/ui/Button";

interface ArchitectureToolbarProps {
  repositories: Array<{ id: string; name: string }>;
  selectedRepo: string;
  onRepoChange: (repoId: string) => void;
  level: ArchitectureLevel;
  onLevelChange: (lvl: ArchitectureLevel) => void;
  layout: ArchitectureLayout;
  onLayoutChange: (l: ArchitectureLayout) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  languageFilter: string;
  onLanguageFilterChange: (lang: string) => void;
  layerFilter: string;
  onLayerFilterChange: (layer: string) => void;
  onlyCycles: boolean;
  onOnlyCyclesChange: (val: boolean) => void;
  onlyViolations: boolean;
  onOnlyViolationsChange: (val: boolean) => void;
  hideTests: boolean;
  onHideTestsChange: (val: boolean) => void;
  hideExternal: boolean;
  onHideExternalChange: (val: boolean) => void;
  sizeMode: "loc" | "fanIn";
  onSizeModeChange: (mode: "loc" | "fanIn") => void;
  onFitView: () => void;
  onResetView: () => void;
  onExport: (format: "png" | "svg" | "json" | "mermaid" | "share") => void;
}

export function ArchitectureToolbar({
  repositories,
  selectedRepo,
  onRepoChange,
  level,
  onLevelChange,
  layout,
  onLayoutChange,
  searchQuery,
  onSearchChange,
  languageFilter,
  onLanguageFilterChange,
  layerFilter,
  onLayerFilterChange,
  onlyCycles,
  onOnlyCyclesChange,
  onlyViolations,
  onOnlyViolationsChange,
  hideTests,
  onHideTestsChange,
  hideExternal,
  onHideExternalChange,
  sizeMode,
  onSizeModeChange,
  onFitView,
  onResetView,
  onExport,
}: ArchitectureToolbarProps) {
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShareClick = () => {
    onExport("share");
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
    setShowExportMenu(false);
  };

  const activeFiltersCount =
    (languageFilter !== "all" ? 1 : 0) +
    (layerFilter !== "all" ? 1 : 0) +
    (onlyCycles ? 1 : 0) +
    (onlyViolations ? 1 : 0) +
    (hideTests ? 1 : 0) +
    (hideExternal ? 1 : 0);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3.5 shadow-sm space-y-3">
      {/* Top Row: Repositories + Level + Layout + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Section: Repo & Level */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Repository Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
            <FolderGit2 className="w-4 h-4 text-[#7C5CFC]" />
            <select
              value={selectedRepo}
              onChange={(e) => onRepoChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="workspace_all">All repos in workspace</option>
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level Selector */}
          <div className="flex items-center rounded-xl bg-[var(--bg-card-hover)] p-1 border border-[var(--border-color)] text-xs font-semibold">
            {(["layers", "modules", "files", "symbols"] as ArchitectureLevel[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onLevelChange(lvl)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                  level === lvl
                    ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Center / Right Section: Search & Controls */}
        <div className="flex items-center gap-2 flex-wrap flex-1 justify-end min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xs min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Jump to node..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#7C5CFC]"
            />
          </div>

          {/* Layout Selector */}
          <select
            value={layout}
            onChange={(e) => onLayoutChange(e.target.value as ArchitectureLayout)}
            className="text-xs px-2.5 py-1.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold outline-none cursor-pointer"
            title="Graph Layout"
          >
            <option value="hierarchical">Top-Down</option>
            <option value="left-right">Left-Right</option>
            <option value="force">Force Directed</option>
            <option value="radial">Radial Concentric</option>
          </select>

          {/* Sizing Toggle: LOC vs Fan-in */}
          <div className="flex items-center rounded-xl bg-[var(--bg-card-hover)] p-0.5 border border-[var(--border-color)] text-[11px] font-mono">
            <button
              type="button"
              onClick={() => onSizeModeChange("loc")}
              className={`px-2 py-1 rounded-lg ${
                sizeMode === "loc" ? "bg-[#7C5CFC] text-white font-bold" : "text-[var(--text-secondary)]"
              }`}
              title="Size nodes by Lines of Code"
            >
              LOC
            </button>
            <button
              type="button"
              onClick={() => onSizeModeChange("fanIn")}
              className={`px-2 py-1 rounded-lg ${
                sizeMode === "fanIn" ? "bg-[#7C5CFC] text-white font-bold" : "text-[var(--text-secondary)]"
              }`}
              title="Size nodes by Inbound Dependencies (Fan-In)"
            >
              Fan-In
            </button>
          </div>

          {/* Filters Button */}
          <button
            type="button"
            onClick={() => setShowFiltersModal(!showFiltersModal)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
              activeFiltersCount > 0
                ? "bg-[#7C5CFC]/15 text-[#7C5CFC] border-[#7C5CFC]/40"
                : "bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#7C5CFC] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Canvas Actions: Fit & Reset */}
          <button
            type="button"
            onClick={onFitView}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl bg-[var(--bg-card-hover)]"
            title="Fit to view"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetView}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl bg-[var(--bg-card-hover)]"
            title="Reset view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#7C5CFC] hover:bg-[#6A4BE2] text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl p-1 z-30 text-xs animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    onExport("png");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] flex items-center justify-between"
                >
                  <span>Export as PNG</span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExport("svg");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] flex items-center justify-between"
                >
                  <span>Export as SVG</span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">SVG</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExport("json");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] flex items-center justify-between"
                >
                  <span>Export Graph JSON</span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExport("mermaid");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] flex items-center justify-between"
                >
                  <span>Export Mermaid Diagram</span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">MMD</span>
                </button>
                <div className="my-1 border-t border-[var(--border-color)]" />
                <button
                  type="button"
                  onClick={handleShareClick}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[#7C5CFC] font-semibold flex items-center justify-between"
                >
                  <span>{copiedShare ? "Link Copied!" : "Copy Share Link"}</span>
                  {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {showFiltersModal && (
        <div className="pt-3 border-t border-[var(--border-color)] grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs animate-in fade-in">
          <div>
            <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">Language</label>
            <select
              value={languageFilter}
              onChange={(e) => onLanguageFilterChange(e.target.value)}
              className="w-full text-xs p-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)]"
            >
              <option value="all">All Languages</option>
              <option value="typescript">TypeScript / JS</option>
              <option value="python">Python</option>
              <option value="go">Go</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">Layer</label>
            <select
              value={layerFilter}
              onChange={(e) => onLayerFilterChange(e.target.value)}
              className="w-full text-xs p-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)]"
            >
              <option value="all">All Layers</option>
              <option value="UI">UI Layer</option>
              <option value="API">API Layer</option>
              <option value="Services">Services Layer</option>
              <option value="Data">Data / DB Layer</option>
              <option value="Utils">Utils Layer</option>
              <option value="Tests">Tests Layer</option>
              <option value="External">External Dependencies</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="onlyCyclesCheck"
              checked={onlyCycles}
              onChange={(e) => onOnlyCyclesChange(e.target.checked)}
              className="rounded border-[var(--border-color)] text-[#7C5CFC]"
            />
            <label htmlFor="onlyCyclesCheck" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
              Only Cycles
            </label>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="onlyViolationsCheck"
              checked={onlyViolations}
              onChange={(e) => onOnlyViolationsChange(e.target.checked)}
              className="rounded border-[var(--border-color)] text-[#7C5CFC]"
            />
            <label htmlFor="onlyViolationsCheck" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
              Only Violations
            </label>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="hideTestsCheck"
              checked={hideTests}
              onChange={(e) => onHideTestsChange(e.target.checked)}
              className="rounded border-[var(--border-color)] text-[#7C5CFC]"
            />
            <label htmlFor="hideTestsCheck" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
              Hide Tests
            </label>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="hideExternalCheck"
              checked={hideExternal}
              onChange={(e) => onHideExternalChange(e.target.checked)}
              className="rounded border-[var(--border-color)] text-[#7C5CFC]"
            />
            <label htmlFor="hideExternalCheck" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
              Hide External Packages
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
