"use client";

import React, { useState } from "react";
import {
  History,
  Search,
  Filter,
  Plus,
  Trash2,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DbRefactoringProposal } from "@/types/refactoring";

interface RefactoringHistorySidebarProps {
  proposals: DbRefactoringProposal[];
  selectedId?: string;
  onSelectProposal: (proposal: DbRefactoringProposal) => void;
  onNewProposal: () => void;
  onDeleteProposal: (id: string) => Promise<void>;
}

export default function RefactoringHistorySidebar({
  proposals,
  selectedId,
  onSelectProposal,
  onNewProposal,
  onDeleteProposal,
}: RefactoringHistorySidebarProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = proposals.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchFile = p.targetFile.toLowerCase().includes(q);
      const matchSymbol = p.targetSymbol?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchFile && !matchSymbol) return false;
    }

    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied":
        return <Badge variant="mint">Applied</Badge>;
      case "accepted":
        return <Badge variant="cyan">Accepted</Badge>;
      case "rejected":
        return <Badge variant="coral">Rejected</Badge>;
      default:
        return <Badge variant="brand">Proposed</Badge>;
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex flex-col h-full shadow-sm overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[var(--border-color)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#29D3C2]" />
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              Refactoring History
            </h3>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onNewProposal}
            className="gap-1 text-xs px-2.5 py-1"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search proposals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#29D3C2]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
          {["all", "proposed", "accepted", "applied", "rejected"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-0.5 rounded capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? "bg-[#29D3C2]/15 text-[#29D3C2] font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Proposals List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
            No refactoring proposals found.
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                onClick={() => onSelectProposal(item)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                  isSelected
                    ? "bg-[#29D3C2]/10 border-[#29D3C2] shadow-sm"
                    : "bg-[var(--bg-card-hover)] border-[var(--border-color)] hover:border-[#29D3C2]/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-[var(--text-primary)] line-clamp-2">
                    {item.title}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this refactoring proposal?")) {
                        onDeleteProposal(item.id);
                      }
                    }}
                    className="text-[var(--text-secondary)] hover:text-red-400 p-1 rounded"
                    title="Delete proposal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(item.status)}
                  <Badge variant="cyan">{item.operation.replace(/_/g, " ")}</Badge>
                  {item.isStaleRevision && (
                    <Badge variant="coral">Stale</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                  <span className="truncate max-w-[160px]">{item.targetFile.split("/").pop()}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
