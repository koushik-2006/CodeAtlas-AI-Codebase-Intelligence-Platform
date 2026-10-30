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
  ArrowRight,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { CrossRepoSearchResultItem, CrossRepoEntityType, CrossRepoSearchResponse } from "@/types/multi-repo";

interface CrossRepoSearchPanelProps {
  searchResults: CrossRepoSearchResponse | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExecuteSearch: (q: string, category: CrossRepoEntityType, exact: boolean) => void;
  isSearching: boolean;
  selectedRepoCount: number;
}

export function CrossRepoSearchPanel({
  searchResults,
  searchQuery,
  onSearchChange,
  onExecuteSearch,
  isSearching,
  selectedRepoCount,
}: CrossRepoSearchPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<CrossRepoEntityType>("all");
  const [exactSymbol, setExactSymbol] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E95A8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search functions, endpoints, files, packages across repositories (e.g. validateEmail, /api/v1/auth)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-sm text-[#19143D] dark:text-[#F3F5FA] placeholder-[#8E95A8] focus:outline-none focus:ring-2 focus:ring-[#6C4DFF] dark:focus:ring-[#29D3C2]"
            />
          </div>

          <button
            onClick={() => onExecuteSearch(searchQuery, selectedCategory, exactSymbol)}
            disabled={isSearching || !searchQuery.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#6C4DFF] dark:bg-[#29D3C2] text-white dark:text-[#0D111A] font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>

        {/* Filter Pills & Exact Match Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EAE6FD] dark:border-[#1E2638]">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-[#6C4DFF] text-white dark:bg-[#29D3C2] dark:text-[#0D111A]"
                    : "bg-[#F7F5FE] dark:bg-[#141926] text-[#6E6A8A] dark:text-[#8E95A8] hover:bg-[#EAE6FD] dark:hover:bg-[#1E2638]"
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-[#6E6A8A] dark:text-[#8E95A8] cursor-pointer">
              <input
                type="checkbox"
                checked={exactSymbol}
                onChange={handleToggleExact}
                className="rounded border-[#EAE6FD] dark:border-[#242B3D] text-[#6C4DFF] focus:ring-[#6C4DFF]"
              />
              <span>Exact Symbol Match</span>
            </label>

            <span className="text-xs text-[#8E95A8]">
              Method: <span className="font-mono text-[#6C4DFF] dark:text-[#29D3C2]">AST & Exact Index</span>
            </span>
          </div>
        </div>
      </div>

      {/* Search Results Display */}
      {isSearching && (
        <div className="p-8 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-[#6C4DFF] dark:border-[#29D3C2] border-t-transparent rounded-full mb-3" />
          <p className="text-sm text-[#6E6A8A] dark:text-[#8E95A8]">
            Searching across {selectedRepoCount} authorized codebases...
          </p>
        </div>
      )}

      {!isSearching && searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#6E6A8A] dark:text-[#8E95A8] px-1">
            <span>
              Found <strong>{searchResults.total}</strong> results across{" "}
              {Object.keys(searchResults.groupedByRepo).length} repositories
            </span>
            {searchResults.staleNotice && (
              <span className="text-amber-500 font-medium">{searchResults.staleNotice}</span>
            )}
          </div>

          {searchResults.results.length === 0 ? (
            <div className="p-8 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
              <p className="text-sm font-medium text-[#19143D] dark:text-[#F3F5FA]">
                No matching results found for &quot;{searchQuery}&quot;
              </p>
              <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-1">
                Try searching for partial symbol names, files, or toggling off exact symbol match.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {searchResults.results.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] hover:border-[#6C4DFF] dark:hover:border-[#29D3C2] rounded-xl p-4 transition-all shadow-sm group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="brand" className="text-[10px] uppercase font-mono">
                          {item.repositoryName}
                        </Badge>
                        <span className="text-xs font-mono text-[#8E95A8]">
                          {item.revision}
                        </span>
                        <span className="text-xs text-[#8E95A8]">·</span>
                        <Badge variant="cyan" className="text-[10px]">
                          {item.category}
                        </Badge>
                        {item.matchType === "exact_symbol" && (
                          <Badge variant="mint" className="text-[10px]">
                            Exact Match
                          </Badge>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-[#19143D] dark:text-[#F3F5FA] group-hover:text-[#6C4DFF] dark:group-hover:text-[#29D3C2] transition-colors">
                        {item.title}
                      </h4>

                      <p className="text-xs font-mono text-[#6E6A8A] dark:text-[#8E95A8]">
                        {item.subtitle}
                      </p>

                      {item.snippet && (
                        <div className="mt-2 p-2.5 rounded-lg bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] font-mono text-xs text-[#19143D] dark:text-[#D1D5DB] overflow-x-auto">
                          {item.snippet}
                        </div>
                      )}
                    </div>

                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-[#F7F5FE] dark:bg-[#141926] text-[#6E6A8A] dark:text-[#8E95A8] hover:text-[#6C4DFF] dark:hover:text-[#29D3C2] transition-colors shrink-0"
                      title="Open source file"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
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
