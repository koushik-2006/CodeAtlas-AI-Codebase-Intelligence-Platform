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
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DbDebugInvestigation, InvestigationStatus } from "@/types/debug";

interface InvestigationHistorySidebarProps {
  investigations: DbDebugInvestigation[];
  activeId?: string;
  onSelectInvestigation: (id: string) => void;
  onDeleteInvestigation: (id: string) => Promise<void>;
}

export default function InvestigationHistorySidebar({
  investigations,
  activeId,
  onSelectInvestigation,
  onDeleteInvestigation,
}: InvestigationHistorySidebarProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = investigations.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
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

  const getStatusPill = (status: InvestigationStatus) => {
    switch (status) {
      case "resolved":
        return <span className="text-[10px] text-[#2FD6A0] font-bold">Resolved</span>;
      case "root_cause_confirmed":
        return <span className="text-[10px] text-amber-500 font-bold">Cause Confirmed</span>;
      case "fix_suggested":
        return <span className="text-[10px] text-[#29D3C2] font-bold">Fix Suggested</span>;
      default:
        return <span className="text-[10px] text-[#8B7CFF] font-bold">Investigating</span>;
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#8B7CFF]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Investigation Sessions
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[var(--text-secondary)]">
          {filtered.length} total
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter investigations..."
          className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg pl-8 pr-2.5 py-1.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#8B7CFF]"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
        {["all", "investigating", "root_cause_confirmed", "resolved"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 ${
              statusFilter === st
                ? "bg-[#8B7CFF] text-white"
                : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {st === "all"
              ? "All"
              : st === "root_cause_confirmed"
              ? "Confirmed"
              : st.charAt(0).toUpperCase() + st.slice(1)}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-xs text-[var(--text-secondary)]">
            No investigation sessions match your filters.
          </div>
        ) : (
          filtered.map((inv) => {
            const isActive = inv.id === activeId;
            const isDeleting = deletingId === inv.id;

            return (
              <div
                key={inv.id}
                onClick={() => onSelectInvestigation(inv.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all relative group ${
                  isActive
                    ? "bg-[#8B7CFF]/10 border-[#8B7CFF] shadow-sm"
                    : "bg-[var(--bg-primary)]/50 border-[var(--border-color)] hover:border-[#8B7CFF]/40"
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

                    <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                      {inv.errorMessage}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--text-secondary)] font-mono">
                      {inv.repositoryName ? (
                        <span className="flex items-center gap-1 truncate max-w-[120px]">
                          <FolderGit2 className="w-3 h-3 text-[#8B7CFF] shrink-0" />
                          {inv.repositoryName.split("/")[1] || inv.repositoryName}
                        </span>
                      ) : (
                        <span className="text-[var(--text-secondary)]">Standalone</span>
                      )}

                      {inv.isRevisionStale && (
                        <span className="text-amber-500 font-bold flex items-center gap-0.5" title="Codebase revision changed since analysis">
                          <AlertTriangle className="w-2.5 h-2.5" /> Stale
                        </span>
                      )}

                      <span className="ml-auto text-[10px]">
                        {new Date(inv.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={(e) => handleDelete(e, inv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-secondary)] hover:text-red-500 transition-opacity"
                    title="Delete investigation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
