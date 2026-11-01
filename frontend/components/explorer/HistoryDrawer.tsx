"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  History,
  X,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  ChevronRight,
  Clock,
  Search,
  AlertTriangle,
} from "lucide-react";
import {
  CodeAnalysisHistoryItem,
  getExplorerHistory,
  updateExplorerHistoryItem,
  deleteExplorerHistoryItem,
  clearExplorerHistory,
  logActivity,
} from "@/lib/demo/store";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHistoryItem: (item: CodeAnalysisHistoryItem) => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  onSelectHistoryItem,
}: HistoryDrawerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [historyItems, setHistoryItems] = useState<CodeAnalysisHistoryItem[]>(
    getExplorerHistory()
  );
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");

  const refreshList = () => {
    setHistoryItems([...getExplorerHistory()]);
  };

  const filteredItems = historyItems.filter(
    (h) =>
      h.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      h.inputPreview.toLowerCase().includes(searchFilter.toLowerCase()) ||
      h.mode.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleStartRename = (item: CodeAnalysisHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      updateExplorerHistoryItem(id, { title: editTitle.trim() });
      refreshList();
    }
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteExplorerHistoryItem(id);
    refreshList();
  };

  const handleClearAll = () => {
    if (confirm("Clear all explorer analysis history?")) {
      clearExplorerHistory();
      refreshList();
      logActivity({
        type: "session_cleared",
        title: "Cleared Visual Explorer Analysis History",
        description: "Emptied client-side cache and persistent history records.",
        status: "info",
        href: "/visual-explorer",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`relative z-10 w-full max-w-sm h-full shadow-2xl flex flex-col justify-between border-r ${
          isDark
            ? "bg-[#0A0E17] border-[#242B39] text-[#E6EDF3]"
            : "bg-white border-[#E8E5F4] text-[#1E2022]"
        }`}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Analysis History
              </h3>
              <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                {historyItems.length} cached records
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-page)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search filter input */}
        <div className="p-3 border-b border-[var(--border-color)]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search past analyses..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs font-mono outline-none ${
                isDark
                  ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
                  : "bg-[#FAF9FF] border-[#E8E5F4] text-[#1E2022]"
              }`}
            />
          </div>
        </div>

        {/* History Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)] space-y-2">
              <History className="w-8 h-8 mx-auto opacity-40" />
              <p>No matching history items found.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
                className={`group p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  isDark
                    ? "bg-[#0D1117] border-[#242B39] hover:border-[var(--primary)] hover:bg-[#111726]"
                    : "bg-[#FAF9FF] border-[#E8E5F4] hover:border-[var(--primary)] hover:bg-[#F3E8FF]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-xs px-2 py-0.5 rounded border border-[var(--primary)] outline-none bg-[var(--bg-page)] text-[var(--text-primary)]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveRename(item.id, e)}
                        className="text-emerald-500 hover:text-emerald-400"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-xs text-[var(--text-primary)] truncate max-w-[180px]">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(item, e)}
                          className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1 rounded text-rose-500 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-[11px] font-mono text-[var(--text-secondary)] truncate">
                  {item.inputPreview}
                </p>

                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)]">
                  <span className="capitalize px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)]">
                    {item.mode}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Clear All */}
        {historyItems.length > 0 && (
          <div className="p-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={handleClearAll}
              className="w-full py-2 px-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
