"use client";

import React, { useState } from "react";
import {
  History,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  GitCompare,
  FolderGit2,
  ShieldAlert,
  ChevronRight,
  Clock,
} from "lucide-react";
import { SavedImpactAnalysis, ImpactSeverity } from "@/types/impact";
import { Button } from "@/components/ui/Button";

interface ImpactHistorySidebarProps {
  history: SavedImpactAnalysis[];
  activeAnalysisId?: string;
  onSelectAnalysis: (analysis: SavedImpactAnalysis) => void;
  onNewAnalysis: () => void;
  onDeleteAnalysis: (id: string) => void;
  onRenameAnalysis: (id: string, newTitle: string) => void;
  onCompareAnalyses: (analysisA: SavedImpactAnalysis, analysisB: SavedImpactAnalysis) => void;
  className?: string;
}

export function ImpactHistorySidebar({
  history,
  activeAnalysisId,
  onSelectAnalysis,
  onNewAnalysis,
  onDeleteAnalysis,
  onRenameAnalysis,
  onCompareAnalyses,
  className = "",
}: ImpactHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const filteredHistory = history.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.repositoryId.toLowerCase().includes(q) ||
      item.targetFile.toLowerCase().includes(q) ||
      (item.targetSymbol && item.targetSymbol.toLowerCase().includes(q))
    );
  });

  const getSeverityBadgeClass = (severity: ImpactSeverity) => {
    switch (severity) {
      case "Critical":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "High":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Medium":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      default:
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
  };

  const handleToggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((i) => i !== id));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[1], id]);
      } else {
        setSelectedForCompare([...selectedForCompare, id]);
      }
    }
  };

  const handleStartRename = (item: SavedImpactAnalysis, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameAnalysis(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleTriggerCompare = () => {
    if (selectedForCompare.length === 2) {
      const a = history.find((h) => h.id === selectedForCompare[0]);
      const b = history.find((h) => h.id === selectedForCompare[1]);
      if (a && b) {
        onCompareAnalyses(a, b);
      }
    }
  };

  return (
    <aside
      className={`w-full lg:w-80 shrink-0 flex flex-col bg-[var(--bg-card)] border-r border-[var(--border-color)] overflow-hidden ${className}`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[var(--border-color)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
            <History className="w-4 h-4 text-[#7C5CFC]" />
            <span>Analysis History</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-secondary)]">
              {history.length}
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onNewAnalysis}
            className="bg-[#7C5CFC] text-white hover:bg-[#6A4BE2] text-xs gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search saved analyses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[#7C5CFC]"
          />
        </div>

        {/* Compare Action Bar */}
        {selectedForCompare.length > 0 && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/30 text-xs">
            <span className="text-[11px] font-semibold text-[#7C5CFC]">
              {selectedForCompare.length}/2 selected
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedForCompare([])}
                className="text-[10px] h-6 px-2"
              >
                Clear
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedForCompare.length !== 2}
                onClick={handleTriggerCompare}
                className="bg-[#7C5CFC] text-white text-[10px] h-6 px-2.5 gap-1 disabled:opacity-40"
              >
                <GitCompare className="w-3 h-3" />
                <span>Compare</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-[var(--text-secondary)] opacity-50" />
            <p className="text-xs font-semibold text-[var(--text-primary)]">No analyses found</p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {searchQuery ? "Try a different search query" : "Run an analysis above to save it to your history"}
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isSelected = activeAnalysisId === item.id;
            const isCompareSelected = selectedForCompare.includes(item.id);
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => onSelectAnalysis(item)}
                className={`group p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#7C5CFC]/10 border-[#7C5CFC] shadow-xs"
                    : isCompareSelected
                    ? "bg-[var(--bg-card-hover)] border-[#7C5CFC]/50"
                    : "bg-[var(--bg-card)] border-[var(--border-color)] hover:bg-[var(--bg-card-hover)]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Compare checkbox */}
                  <div
                    onClick={(e) => handleToggleCompare(item.id, e)}
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isCompareSelected
                        ? "bg-[#7C5CFC] border-[#7C5CFC] text-white"
                        : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[#7C5CFC]"
                    }`}
                    title="Select to compare"
                  >
                    {isCompareSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full text-xs p-1 rounded border border-[#7C5CFC] bg-[var(--bg-card)] text-[var(--text-primary)]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(item.id, e)}
                          className="p-1 text-emerald-400 hover:bg-emerald-400/20 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelRename}
                          className="p-1 text-red-400 hover:bg-red-400/20 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <h4 className="font-bold text-[var(--text-primary)] truncate text-xs">
                        {item.title}
                      </h4>
                    )}

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px] text-[var(--text-secondary)] font-mono">
                      <span className="flex items-center gap-1">
                        <FolderGit2 className="w-3 h-3 text-[#7C5CFC]" />
                        {item.repositoryName || item.repositoryId}
                      </span>
                      <span>•</span>
                      <span>{item.targetFile.split("/").pop()}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[var(--border-color)]/50">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSeverityBadgeClass(
                          item.riskLevel
                        )}`}
                      >
                        {item.riskLevel} Risk ({item.riskScore}/100)
                      </span>

                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {item.createdAt.slice(0, 10)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(item, e)}
                        className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-card)]"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete analysis '${item.title}'?`)) {
                            onDeleteAnalysis(item.id);
                          }
                        }}
                        className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-500/10"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

