"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { SearchResultItem } from "@/types/search";
import { workspaceService } from "@/services/workspace-service";
import {
  Search,
  FolderGit2,
  FileCode,
  Code2,
  Network,
  GitPullRequest,
  Layers,
  ArrowRight,
  Clock,
  X,
  Command,
  CornerDownLeft,
  Sparkles,
  Loader2,
} from "lucide-react";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

export function GlobalSearchModal({ isOpen, onClose, defaultCategory }: GlobalSearchModalProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory || "all");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "handleSubmit",
    "loginUser",
    "auth.ts",
    "POST /auth",
    "PR #101",
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Load persistent recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("codeatlas_recent_searches");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecentSearches(parsed.slice(0, 6));
          }
        }
      } catch (e) {
        // Fallback to default recent searches
      }
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("codeatlas_recent_searches", JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("codeatlas_recent_searches");
      } catch (e) {}
    }
  };

  // Debounced search query
  const performSearch = useCallback(async (q: string, cat: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await workspaceService.searchCodebase(q, {
        category: cat !== "all" ? cat : undefined,
      });
      setResults(data.results || []);
      setSelectedIndex(0);
    } catch (err) {
      console.warn("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch(query, selectedCategory);
    }, 180);
    return () => clearTimeout(handler);
  }, [query, selectedCategory, performSearch]);

  const handleSelectResult = (item: SearchResultItem) => {
    saveRecentSearch(query || item.title);
    onClose();
    router.push(item.href);
  };

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex, results.length]);

  if (!isOpen) return null;

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "repository":
        return <FolderGit2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case "file":
        return <FileCode className="w-4 h-4 text-blue-500 shrink-0" />;
      case "symbol":
        return <Code2 className="w-4 h-4 text-[var(--primary)] shrink-0" />;
      case "api":
        return <Network className="w-4 h-4 text-amber-500 shrink-0" />;
      case "architecture":
        return <Layers className="w-4 h-4 text-violet-500 shrink-0" />;
      case "review":
        return <GitPullRequest className="w-4 h-4 text-rose-500 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-[var(--primary)] shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Palette Modal */}
      <div
        onKeyDown={handleKeyDown}
        className={`relative w-full max-w-2xl rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 ${
          isDark
            ? "bg-[#0D111B] border-[#242B39] shadow-[0_0_50px_-10px_rgba(41,211,194,0.15)]"
            : "bg-white border-[#E8E5F4] shadow-2xl"
        }`}
      >
        {/* Search Header Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-[var(--border-color)]">
          <Search className="w-5 h-5 text-[var(--text-secondary)] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search repositories, files, symbols, APIs, reviews..."
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)] mr-2 shrink-0" />}
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 px-2 py-1 rounded-lg border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-secondary)] hover:bg-[var(--border-color)]/20"
          >
            ESC
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[var(--border-color)] overflow-x-auto bg-[var(--bg-page)]/40 scrollbar-none text-xs">
          {[
            { id: "all", label: "All" },
            { id: "symbol", label: "Symbols" },
            { id: "file", label: "Files" },
            { id: "api", label: "APIs" },
            { id: "architecture", label: "Architecture" },
            { id: "review", label: "Reviews" },
            { id: "repository", label: "Repositories" },
          ].map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
                  active
                    ? isDark
                      ? "bg-[#29D3C2] text-[#070A12]"
                      : "bg-[#6C4DFF] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body / Results */}
        <div ref={listRef} className="overflow-y-auto flex-1 p-2 space-y-1">
          {query.trim().length === 0 ? (
            /* Recent Searches & Quick Suggestions */
            <div className="p-4 space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[10px] font-semibold text-[var(--text-secondary)] hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          setQuery(term);
                          performSearch(term, selectedCategory);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          isDark
                            ? "border-[#242B39] bg-[#111725] text-[#F3F5FA] hover:border-[#29D3C2]"
                            : "border-[#E8E5F4] bg-[#FAF9FF] text-[#19143D] hover:border-[#6C4DFF]"
                        }`}
                      >
                        <Search className="w-3 h-3 text-[var(--text-secondary)]" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Navigation Prompts */}
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] block pb-2">
                  Quick Codebase Entities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setQuery("auth");
                      performSearch("auth", selectedCategory);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                      isDark ? "border-[#242B39] hover:bg-[#111725]" : "border-[#E8E5F4] hover:bg-[#FAF9FF]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">src/services/auth.ts</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">Core login & token pipeline</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  </button>

                  <button
                    onClick={() => {
                      setQuery("handleSubmit");
                      performSearch("handleSubmit", selectedCategory);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                      isDark ? "border-[#242B39] hover:bg-[#111725]" : "border-[#E8E5F4] hover:bg-[#FAF9FF]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-[var(--primary)]" />
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">handleSubmit</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">LoginForm submission handler</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  </button>
                </div>
              </div>
            </div>
          ) : results.length > 0 ? (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-start justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? isDark
                        ? "bg-[#111725] border border-[#29D3C2]/50 shadow-sm"
                        : "bg-[#FAF9FF] border border-[#6C4DFF]/40 shadow-sm"
                      : "hover:bg-[var(--border-color)]/20 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">{getCategoryIcon(item.category)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                              isDark
                                ? "bg-[#29D3C2]/15 text-[#29D3C2]"
                                : "bg-[#6C4DFF]/10 text-[#6C4DFF]"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="hidden sm:inline-block text-[10px] font-mono text-[var(--text-secondary)] capitalize">
                      {item.category}
                    </span>
                    <CornerDownLeft
                      className={`w-3.5 h-3.5 transition-opacity ${
                        isSelected ? "opacity-100 text-[var(--primary)]" : "opacity-0"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 mx-auto text-[var(--text-secondary)]/40 mb-2" />
              <p className="text-sm font-bold text-[var(--text-primary)]">
                No matching results found
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                No files, symbols, or reviews matched &ldquo;{query}&rdquo;. Check spelling or try a different filter.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer with Keyboard Shortcuts */}
        <div className="px-4 py-2.5 border-t border-[var(--border-color)] bg-[var(--bg-page)]/50 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono">
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] text-[9px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] text-[9px]">
                ↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1 font-mono">
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] text-[9px]">
                ↵
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1 font-mono">
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] text-[9px]">
                ESC
              </kbd>
              Close
            </span>
          </div>

          <span className="font-mono text-[10px]">
            {results.length > 0 ? `${results.length} results` : "Grounded AST Index"}
          </span>
        </div>
      </div>
    </div>
  );
}
