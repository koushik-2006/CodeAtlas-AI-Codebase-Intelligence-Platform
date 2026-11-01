"use client";

import React, { useState } from "react";
import {
  Search,
  Code2,
  FileCode,
  Globe,
  FileText,
  TestTube,
  Layers,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CrossRepoSearchResponse, CrossRepoEntityType } from "@/types/multi-repo";
import Link from "next/link";

interface UnifiedSearchTabProps {
  searchResults: CrossRepoSearchResponse | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExecuteSearch: (q: string, category: CrossRepoEntityType, exact: boolean) => void;
  isSearching: boolean;
  selectedRepoCount: number;
}

export function UnifiedSearchTab({
  searchResults,
  searchQuery,
  onSearchChange,
  onExecuteSearch,
  isSearching,
  selectedRepoCount,
}: UnifiedSearchTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<CrossRepoEntityType>("all");
  const [exactSymbol, setExactSymbol] = useState<boolean>(false);

  const categories: Array<{ id: CrossRepoEntityType; label: string; icon: React.ReactNode }> = [
    { id: "all", label: "All", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "symbol", label: "Symbols", icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: "file", label: "Files", icon: <FileCode className="w-3.5 h-3.5" /> },
    { id: "api", label: "APIs", icon: <Globe className="w-3.5 h-3.5" /> },
    { id: "manifest", label: "Manifests", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "test", label: "Tests", icon: <TestTube className="w-3.5 h-3.5" /> },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onExecuteSearch(searchQuery, selectedCategory, exactSymbol);
    }
  };

  const handleCategoryClick = (cat: CrossRepoEntityType) => {
    setSelectedCategory(cat);
    onExecuteSearch(searchQuery, cat, exactSymbol);
  };

  const handleToggleExact = () => {
    const next = !exactSymbol;
    setExactSymbol(next);
    onExecuteSearch(searchQuery, selectedCategory, next);
  };

  // Helper to highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 dark:bg-amber-900/60 text-inherit rounded-xs px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Input Box */}
      <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E95A8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search code across all selected repositories (e.g. validateEmail, /token, axios, processCheckout)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-sm text-[#19143D] dark:text-[#F3F5FA] placeholder-[#8E95A8] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
            />
          </div>

          <button
            onClick={() => onExecuteSearch(searchQuery, selectedCategory, exactSymbol)}
            disabled={isSearching || !searchQuery.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#7C5CFC] hover:bg-[#6A4BE8] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>

        {/* Categories & Exact Match Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EAE6FD] dark:border-[#1E2638]">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#7C5CFC] text-white shadow-xs"
                    : "bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] text-[#6E6A8A] dark:text-[#8E95A8] hover:border-[#7C5CFC]/40"
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#6E6A8A] dark:text-[#8E95A8] cursor-pointer">
              <input
                type="checkbox"
                checked={exactSymbol}
                onChange={handleToggleExact}
                className="rounded border-[#EAE6FD] dark:border-[#242B3D] text-[#7C5CFC] focus:ring-[#7C5CFC]"
              />
              <span>Exact Word Match</span>
            </label>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isSearching && (
        <div className="p-12 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
          <div className="inline-block animate-spin w-8 h-8 border-3 border-[#7C5CFC] border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-semibold text-[#19143D] dark:text-[#F3F5FA]">
            Searching across {selectedRepoCount} authorized codebases...
          </p>
        </div>
      )}

      {/* Search Results Display */}
      {!isSearching && searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#6E6A8A] dark:text-[#8E95A8] px-1">
            <span>
              Found <strong>{searchResults.total}</strong> results across{" "}
              {Object.keys(searchResults.groupedByRepo || {}).length} repositories
            </span>
          </div>

          {searchResults.results.length === 0 ? (
            <div className="p-12 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl space-y-2">
              <Search className="w-8 h-8 text-[#8E95A8] mx-auto opacity-50" />
              <p className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA]">
                No matching results found for &quot;{searchQuery}&quot;
              </p>
              <p className="text-xs text-[#8E95A8]">
                Try searching for partial symbol names, common package names, or files.
              </p>
            </div>
          ) : (
            /* Results Grouped by Repository */
            <div className="space-y-6">
              {Object.entries(searchResults.groupedByRepo || {}).map(([repoId, group]) => (
                <div
                  key={repoId}
                  className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-5 shadow-sm space-y-3"
                >
                  {/* Repo Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAE6FD] dark:border-[#1E2638]">
                    <div className="flex items-center gap-2">
                      <Badge variant="brand" className="text-xs uppercase font-mono">
                        {group.repoName}
                      </Badge>
                      <span className="text-xs text-[#8E95A8]">
                        {group.count} match{group.count > 1 ? "es" : ""}
                      </span>
                    </div>

                    <Link
                      href={`/repositories/${repoId}`}
                      className="text-xs font-semibold text-[#7C5CFC] hover:underline flex items-center gap-1"
                    >
                      <span>Explore Repo</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Matches List */}
                  <div className="space-y-2.5">
                    {group.results.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="block p-3.5 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#FAFAFE] dark:bg-[#141926] hover:border-[#7C5CFC]/50 hover:bg-[#F4F0FF]/30 dark:hover:bg-[#1E1A38]/30 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-[#7C5CFC]">
                                {item.filePath}:{item.line}
                              </span>
                              <Badge variant="cyan" className="text-[10px]">
                                {item.category}
                              </Badge>
                              {item.matchType === "exact_symbol" && (
                                <Badge variant="mint" className="text-[10px]">
                                  Exact
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs font-semibold text-[#19143D] dark:text-[#F3F5FA] group-hover:text-[#7C5CFC] transition-colors">
                              {item.title}
                            </p>

                            {item.snippet && (
                              <div className="mt-2 p-2.5 rounded-lg bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] font-mono text-xs text-[#19143D] dark:text-[#D1D5DB] overflow-x-auto whitespace-pre">
                                {highlightMatch(item.snippet, searchQuery)}
                              </div>
                            )}
                          </div>

                          <span className="text-[#8E95A8] group-hover:text-[#7C5CFC] p-1 shrink-0 transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
