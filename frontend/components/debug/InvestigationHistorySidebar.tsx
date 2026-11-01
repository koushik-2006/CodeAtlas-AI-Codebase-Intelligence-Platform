"use client";

import React, { useState } from "react";
import {
  History,
  Search,
  Trash2,
  AlertTriangle,
  FolderGit2,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Bug,
  Edit2,
  Check,
  X,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DbDebugInvestigation, InvestigationStatus } from "@/types/debug";

interface InvestigationHistorySidebarProps {
  investigations: DbDebugInvestigation[];
  activeId?: string;
  onSelectInvestigation: (id: string) => void;
  onDeleteInvestigation: (id: string) => Promise<void>;
  onRenameInvestigation?: (id: string, newTitle: string) => void;
  onNewInvestigation?: () => void;
}

export default function InvestigationHistorySidebar({
  investigations,
  activeId,
  onSelectInvestigation,
  onDeleteInvestigation,
  onRenameInvestigation,
  onNewInvestigation,
}: InvestigationHistorySidebarProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const filtered = investigations.filter((inv) => {
    if (statusFilter === "open") {
      if (inv.status === "resolved") return false;
    } else if (statusFilter === "resolved") {
      if (inv.status !== "resolved") return false;
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      inv.title.toLowerCase().includes(q) ||
      inv.errorMessage.toLowerCase().includes(q) ||
      inv.errorType.toLowerCase().includes(q) ||
      (inv.repositoryName && inv.repositoryName.toLowerCase().includes(q))
    );
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this investigation session?")) {
      try {
        setDeletingId(id);
        await onDeleteInvestigation(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleStartRename = (e: React.MouseEvent, inv: DbDebugInvestigation) => {
    e.stopPropagation();
    setEditingId(inv.id);
    setEditingTitle(inv.title);
  };

  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editingTitle.trim() && onRenameInvestigation) {
      onRenameInvestigation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const getStatusPill = (status: InvestigationStatus) => {
    switch (status) {
      case "resolved":
        return <span className="text-[10px] text-[#2FD6A0] font-bold">Resolved</span>;
      case "root_cause_confirmed":
        return <span className="text-[10px] text-amber-500 font-bold">Confirmed</span>;
      case "fix_suggested":
        return <span className="text-[10px] text-[#29D3C2] font-bold">Fix Ready</span>;
      default:
        return <span className="text-[10px] text-[#7C5CFC] font-bold">Open</span>;
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#7C5CFC]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Investigation History
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {onNewInvestigation && (
            <button
              type="button"
              onClick={onNewInvestigation}
              className="p-1 rounded hover:bg-[#7C5CFC]/10 text-[#7C5CFC] transition-colors"
              title="Start New Investigation"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[11px] font-mono text-[var(--text-secondary)]">
            {filtered.length}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter investigations..."
          className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg pl-8 pr-2.5 py-1.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 pb-1 text-[11px]">
        {[
          { id: "all", label: "All" },
          { id: "open", label: "Open" },
          { id: "resolved", label: "Resolved" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors shrink-0 ${
              statusFilter === tab.id
                ? "bg-[#7C5CFC] text-white"
                : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-xs text-[var(--text-secondary)]">
            No investigations match criteria.
          </div>
        ) : (
          filtered.map((inv) => {
            const isActive = inv.id === activeId;
            const isDeleting = deletingId === inv.id;
            const isEditing = editingId === inv.id;

            return (
              <div
                key={inv.id}
                onClick={() => onSelectInvestigation(inv.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all relative group ${
                  isActive
                    ? "bg-[#7C5CFC]/10 border-[#7C5CFC] shadow-sm"
                    : "bg-[var(--bg-primary)]/50 border-[var(--border-color)] hover:border-[#7C5CFC]/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[var(--text-primary)] truncate block">
                        {inv.errorType}
                      </span>
                      {getStatusPill(inv.status)}
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="text-xs bg-[var(--bg-card)] border border-[#7C5CFC] rounded px-1.5 py-0.5 text-[var(--text-primary)] w-full"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(e, inv.id)}
                          className="p-1 text-[#2FD6A0] hover:bg-[#2FD6A0]/10 rounded"
                          title="Save"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelRename}
                          className="p-1 text-neutral-400 hover:bg-neutral-500/10 rounded"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                        {inv.title}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--text-secondary)] font-mono">
                      {inv.repositoryName ? (
                        <span className="flex items-center gap-1 truncate max-w-[120px]">
                          <FolderGit2 className="w-3 h-3 text-[#7C5CFC] shrink-0" />
                          {inv.repositoryName.split("/")[1] || inv.repositoryName}
                        </span>
                      ) : (
                        <span className="text-neutral-400">standalone</span>
                      )}

                      <span>•</span>
                      <span>
                        {new Date(inv.updatedAt || inv.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {onRenameInvestigation && !isEditing && (
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(e, inv)}
                        className="p-1 rounded hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[#7C5CFC]"
                        title="Rename title"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={(e) => handleDelete(e, inv.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                      title="Delete investigation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
