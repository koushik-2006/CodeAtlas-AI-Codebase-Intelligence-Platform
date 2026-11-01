"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import {
  Building2,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Layers,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  X,
  Filter,
} from "lucide-react";
import {
  CodeCityData,
  CodeCityBuilding,
  buildCodeCityData,
} from "@/lib/demo/explorer-engine";
import { getStore } from "@/lib/demo/store";

interface CodeCityViewProps {
  onLoadFileToCodeLens?: (code: string, language: string) => void;
}

export function CodeCityView({ onLoadFileToCodeLens }: CodeCityViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const store = getStore();
  const repositories = store.repositories || [];
  const [selectedRepoId, setSelectedRepoId] = useState<string>(
    repositories[0]?.id || "sample-project"
  );

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  // Interaction: hovered building for tooltip & selected building for side panel
  const [hoveredBuilding, setHoveredBuilding] = useState<CodeCityBuilding | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<CodeCityBuilding | null>(null);

  // Build city data
  const cityData: CodeCityData = useMemo(() => {
    return buildCodeCityData(selectedRepoId, store);
  }, [selectedRepoId, store]);

  // Unique languages
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    cityData.buildings.forEach((b) => set.add(b.language));
    return Array.from(set);
  }, [cityData]);

  // Filtered buildings
  const filteredBuildings = useMemo(() => {
    return cityData.buildings.filter((b) => {
      const matchSearch =
        !searchQuery.trim() ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.path.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLang = languageFilter === "all" || b.language === languageFilter;
      return matchSearch && matchLang;
    });
  }, [cityData, searchQuery, languageFilter]);

  const handleResetView = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
    setSearchQuery("");
    setLanguageFilter("all");
    setSelectedBuilding(null);
  };

  const getHealthColor = (health: "healthy" | "moderate" | "complex") => {
    switch (health) {
      case "healthy":
        return {
          fill: "#10B981",
          top: "#34D399",
          left: "#059669",
          right: "#047857",
        };
      case "moderate":
        return {
          fill: "#F59E0B",
          top: "#FBBF24",
          left: "#D97706",
          right: "#B45309",
        };
      case "complex":
        return {
          fill: "#EF4444",
          top: "#F87171",
          left: "#DC2626",
          right: "#B91C1C",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* City Map Header Bar */}
      <div
        className={`rounded-3xl border p-5 shadow-sm flex flex-wrap items-center justify-between gap-4 ${
          isDark ? "bg-[#0D1117] border-[#30363D]" : "bg-white border-[#E8E5F4]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-[var(--text-primary)]">
                Repository Code City (2.5D Isometric)
              </h3>
              <span className="font-mono text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {cityData.healthScore}% Healthy
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Buildings represent source files. Height = LOC. Colors = Architectural Health & Complexity.
            </p>
          </div>
        </div>

        {/* Repository Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-[var(--text-secondary)]">Repository:</span>
          <select
            value={selectedRepoId}
            onChange={(e) => {
              setSelectedRepoId(e.target.value);
              setSelectedBuilding(null);
            }}
            className={`py-1.5 px-3 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${
              isDark
                ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
                : "bg-[#FAF9FF] border-[#E8E5F4] text-[#1E2022]"
            }`}
          >
            {repositories.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.language || "Multi-repo"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Controls Bar: Search, Language Filter, Zoom/Pan & Legend */}
      <div
        className={`rounded-2xl border p-3 flex flex-wrap items-center justify-between gap-3 text-xs ${
          isDark ? "bg-[#0A0E17] border-[#242B39]" : "bg-[#FAF9FF] border-[#E8E5F4]"
        }`}
      >
        {/* Left: Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search file name..."
              className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs font-mono outline-none ${
                isDark
                  ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
                  : "bg-white border-[#E8E5F4] text-[#1E2022]"
              }`}
            />
          </div>

          {/* Language Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className={`py-1 px-2.5 rounded-xl border text-xs font-semibold outline-none ${
                isDark
                  ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
                  : "bg-white border-[#E8E5F4] text-[#1E2022]"
              }`}
            >
              <option value="all">All Languages</option>
              {availableLanguages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Color Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500" />
            <span className="text-[var(--text-secondary)]">Healthy (&lt;80 LOC)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-500" />
            <span className="text-[var(--text-secondary)]">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-rose-500" />
            <span className="text-[var(--text-secondary)]">Complex / Tech Debt</span>
          </div>
        </div>

        {/* Right: Zoom & Reset */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
            className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-page)]"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] px-1 text-[var(--text-secondary)]">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
            className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-page)]"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-page)] text-[var(--text-secondary)]"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area + Detail Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center 2.5D Isometric SVG Canvas */}
        <div
          className={`lg:col-span-${selectedBuilding ? "8" : "12"} rounded-3xl border overflow-hidden relative min-h-[480px] flex items-center justify-center p-6 ${
            isDark ? "bg-[#06080F] border-[#1C2230]" : "bg-[#F3F4F8] border-[#E8E5F4]"
          }`}
        >
          {/* Isometric SVG Grid View */}
          <div
            className="transition-transform duration-200 cursor-grab active:cursor-grabbing"
            style={{
              transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
              transformOrigin: "center center",
            }}
          >
            <svg
              width="740"
              height="440"
              viewBox="0 0 740 440"
              className="overflow-visible select-none"
            >
              <defs>
                <radialGradient id="cityGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#7C5CFC" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background Ambient Glow */}
              <circle cx="370" cy="220" r="300" fill="url(#cityGlow)" />

              {/* Ground Isometric Grid Planes */}
              <g transform="translate(370, 160) scale(1, 0.58) rotate(45)">
                {/* District ground plane */}
                <rect
                  x="-200"
                  y="-200"
                  width="400"
                  height="400"
                  rx="24"
                  fill={isDark ? "#0A0F1D" : "#E2E5F0"}
                  stroke={isDark ? "#20283C" : "#D1D5E5"}
                  strokeWidth="2"
                />

                {/* Buildings rendered on isometric rotated coordinate space */}
                {filteredBuildings.map((b) => {
                  const colors = getHealthColor(b.health);
                  const isHovered = hoveredBuilding?.id === b.id;
                  const isSelected = selectedBuilding?.id === b.id;

                  // Isometric building box in rotated coordinates
                  const bx = (b.gridX - 160);
                  const by = (b.gridY - 160);
                  const bw = b.width;
                  const bd = b.depth;
                  const bh = b.height;

                  return (
                    <g
                      key={b.id}
                      className="cursor-pointer transition-transform duration-150"
                      onMouseEnter={() => setHoveredBuilding(b)}
                      onMouseLeave={() => setHoveredBuilding(null)}
                      onClick={() => setSelectedBuilding(b)}
                    >
                      {/* Base ground footprint shadow */}
                      <rect
                        x={bx}
                        y={by}
                        width={bw}
                        height={bd}
                        rx="4"
                        fill="rgba(0,0,0,0.3)"
                      />

                      {/* Isometric extruded columns */}
                      {/* Left Wall */}
                      <path
                        d={`M ${bx} ${by} L ${bx} ${by - bh} L ${bx + bw} ${by - bh} L ${bx + bw} ${by} Z`}
                        fill={colors.left}
                        opacity={isHovered || isSelected ? 1 : 0.85}
                      />

                      {/* Right Wall */}
                      <path
                        d={`M ${bx + bw} ${by} L ${bx + bw} ${by - bh} L ${bx + bw} ${by + bd - bh} L ${bx + bw} ${by + bd} Z`}
                        fill={colors.right}
                        opacity={isHovered || isSelected ? 1 : 0.85}
                      />

                      {/* Roof / Top Face */}
                      <rect
                        x={bx}
                        y={by - bh}
                        width={bw}
                        height={bd}
                        rx="3"
                        fill={colors.top}
                        stroke={isSelected ? "#FFFFFF" : isHovered ? "#29D3C2" : "rgba(255,255,255,0.4)"}
                        strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                      />

                      {/* Highlight outline if matched */}
                      {(isHovered || isSelected) && (
                        <circle
                          cx={bx + bw / 2}
                          cy={by - bh + bd / 2}
                          r="6"
                          fill="#FFFFFF"
                          className="animate-ping"
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Interactive Hover Tooltip */}
          {hoveredBuilding && (
            <div className="absolute top-4 left-4 z-20 p-3 rounded-2xl bg-black/80 backdrop-blur-md text-white border border-white/20 text-xs space-y-1 pointer-events-none shadow-xl">
              <div className="flex items-center gap-1.5 font-bold">
                <FileCode className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>{hoveredBuilding.name}</span>
              </div>
              <p className="text-[11px] text-white/70 font-mono truncate max-w-xs">
                {hoveredBuilding.path}
              </p>
              <div className="flex items-center gap-3 text-[10px] font-mono pt-1 text-white/90">
                <span>{hoveredBuilding.loc} LOC</span>
                <span>·</span>
                <span>{hoveredBuilding.symbolsCount} symbols</span>
                <span>·</span>
                <span className="capitalize">{hoveredBuilding.health}</span>
              </div>
            </div>
          )}

          {/* District Counter Badge */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-black/50 text-white/80 border border-white/10 backdrop-blur-xs">
              Showing {filteredBuildings.length} of {cityData.totalFiles} buildings in {cityData.districts.length} districts
            </span>
          </div>
        </div>

        {/* Right: Selected Building Detail Side Panel */}
        {selectedBuilding && (
          <div
            className={`lg:col-span-4 rounded-3xl border p-6 flex flex-col justify-between space-y-5 shadow-lg ${
              isDark ? "bg-[#0D1117] border-[#30363D]" : "bg-white border-[#E8E5F4]"
            }`}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                      {selectedBuilding.name}
                    </h4>
                    <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                      {selectedBuilding.language}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBuilding(null)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Path & District */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">
                  File Path:
                </span>
                <p className="text-xs font-mono p-2 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] text-[var(--text-primary)] break-all">
                  {selectedBuilding.path}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase block">
                    Lines of Code
                  </span>
                  <span className="text-base font-extrabold text-[var(--text-primary)]">
                    {selectedBuilding.loc}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase block">
                    AST Symbols
                  </span>
                  <span className="text-base font-extrabold text-[var(--text-primary)]">
                    {selectedBuilding.symbolsCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase block">
                    Cyclomatic
                  </span>
                  <span className="text-base font-extrabold text-[var(--text-primary)]">
                    {selectedBuilding.cyclomatic}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase block">
                    Open Issues
                  </span>
                  <span className="text-base font-extrabold text-rose-500">
                    {selectedBuilding.issuesCount}
                  </span>
                </div>
              </div>

              {/* Architectural Status Notice */}
              <div
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  selectedBuilding.health === "healthy"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    : selectedBuilding.health === "moderate"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {selectedBuilding.health === "healthy" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span className="capitalize">
                    Status: {selectedBuilding.health}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  {selectedBuilding.health === "healthy"
                    ? "Low cyclomatic complexity and clean boundary modularity."
                    : selectedBuilding.health === "moderate"
                    ? "Moderate complexity. Recommend automated unit test coverage."
                    : "High cognitive complexity and critical business logic. Priority refactoring target."}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-[var(--border-color)]">
              {/* Explain in CodeLens */}
              <button
                type="button"
                onClick={() => {
                  const filesMap = store.repositoryFiles?.[selectedRepoId] || {};
                  const fileContent = filesMap[selectedBuilding.path]?.code || `// ${selectedBuilding.path}\nexport function ${selectedBuilding.name.replace(/\.[^/.]+$/, "")}() {\n  return true;\n}`;
                  onLoadFileToCodeLens?.(fileContent, selectedBuilding.language.toLowerCase());
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--primary)] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explain in CodeLens (Tab 1)</span>
              </button>

              {/* Open File in Repository */}
              <Link
                href={`/repositories/${selectedRepoId}?file=${encodeURIComponent(
                  selectedBuilding.path
                )}`}
                className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--primary)] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Open File in Repo Explorer</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
