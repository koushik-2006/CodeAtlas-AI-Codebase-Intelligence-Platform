"use client";

import { useTheme } from "@/hooks/useTheme";
import { Search, Plus, Filter } from "lucide-react";

interface RepositoryFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  langFilter: string;
  onLangFilterChange: (lang: string) => void;
  visibilityFilter: string;
  onVisibilityFilterChange: (visibility: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  onAddClick: () => void;
}

export function RepositoryFilters({
  search,
  onSearchChange,
  langFilter,
  onLangFilterChange,
  visibilityFilter,
  onVisibilityFilterChange,
  statusFilter = "all",
  onStatusFilterChange,
  onAddClick,
}: RepositoryFiltersProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1">
        {/* Search Input */}
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search repositories..."
            aria-label="Filter repositories by name or description"
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm font-medium border outline-none transition-all ${
              isDark
                ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3] placeholder-[#8B949E] focus:border-[#29D3C2]"
                : "bg-white border-[#E5E5E0] text-[#1E2022] placeholder-[#5A5C5E] focus:border-[#6C4DFF]"
            }`}
          />
        </div>

        {/* Programming Language filter */}
        <select
          value={langFilter}
          onChange={(e) => onLangFilterChange(e.target.value)}
          aria-label="Filter by programming language"
          className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-medium border outline-none cursor-pointer ${
            isDark
              ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
              : "bg-white border-[#E5E5E0] text-[#1E2022]"
          }`}
        >
          <option value="all">All Languages</option>
          <option value="python">Python</option>
          <option value="typescript">TypeScript</option>
          <option value="go">Go</option>
        </select>

        {/* Visibility filter */}
        <select
          value={visibilityFilter}
          onChange={(e) => onVisibilityFilterChange(e.target.value)}
          aria-label="Filter by visibility"
          className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-medium border outline-none cursor-pointer ${
            isDark
              ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
              : "bg-white border-[#E5E5E0] text-[#1E2022]"
          }`}
        >
          <option value="all">All Visibility</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        {/* Indexing Status filter */}
        {onStatusFilterChange && (
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            aria-label="Filter by indexing status"
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-medium border outline-none cursor-pointer ${
              isDark
                ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
                : "bg-white border-[#E5E5E0] text-[#1E2022]"
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready (Indexed)</option>
            <option value="indexing">Indexing</option>
          </select>
        )}
      </div>

      {/* Add Repository Button */}
      <button
        type="button"
        onClick={onAddClick}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
          isDark
            ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8] shadow-[0_0_15px_-3px_rgba(41,211,194,0.3)]"
            : "bg-[#1E2022] text-white hover:bg-[#2e3135]"
        }`}
      >
        <Plus className="w-4 h-4" />
        Add Repository
      </button>
    </div>
  );
}
