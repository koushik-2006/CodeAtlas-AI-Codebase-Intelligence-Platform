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
  Tag,
  Scan,
  GitPullRequest,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DbRefactoringProposal, RefactoringHistoryItem } from "@/types/refactoring";

interface RefactoringHistorySidebarProps {
  proposals: DbRefactoringProposal[];
  historyItems?: RefactoringHistoryItem[];
  selectedId?: string;
  onSelectProposal: (proposal: DbRefactoringProposal) => void;
  onNewProposal: () => void;
  onDeleteProposal: (id: string) => Promise<void> | void;
  onDeleteHistoryItem?: (id: string) => void;
}

export default function RefactoringHistorySidebar({
  proposals,
  historyItems = [],
  selectedId,
  onSelectProposal,
  onNewProposal,
  onDeleteProposal,
  onDeleteHistoryItem,
}: RefactoringHistorySidebarProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "proposal" | "rename" | "scan">("all");

  // Merge history items with proposals
  const combinedItems: Array<{
    id: string;
    type: "proposal" | "rename" | "scan";
    title: string;
    description: string;
    repositoryId: string;
    timestamp: string;
    status: string;
    authorName: string;
    proposalRef?: DbRefactoringProposal;
  }> = [];

  // Add proposals
  proposals.forEach((p) => {
    combinedItems.push({
      id: p.id,
      type: "proposal",
      title: p.title,
      description: `${p.operation} on ${p.targetFile}`,
      repositoryId: p.repositoryId,
      timestamp: p.createdAt,
      status: p.status,
      authorName: "Alex Chen",
      proposalRef: p,
    });
  });

  // Add other history items (renames, scans) if not duplicate
  historyItems.forEach((h) => {
    if (h.type !== "proposal" || !combinedItems.some((c) => c.id === h.proposalId || c.id === h.id)) {
      combinedItems.push({
        id: h.id,
        type: h.type,
        title: h.title,
        description: h.description,
        repositoryId: h.repositoryId,
        timestamp: h.timestamp,
        status: h.status || "completed",
        authorName: h.author?.name || "CodeAtlas",
        proposalRef: h.proposalId ? proposals.find((p) => p.id === h.proposalId) : undefined,
      });
    }
  });

  // Sort by timestamp desc
  combinedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter
  const filtered = combinedItems.filter((item) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchRepo = item.repositoryId.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchRepo) return false;
    }

    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    return true;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "rename":
        return <Badge variant="sun">Rename</Badge>;
      case "scan":
        return <Badge variant="cyan">Scan</Badge>;
      default:
        return <Badge variant="brand">Proposal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied":
        return <Badge variant="mint">Applied</Badge>;
      case "accepted":
        return <Badge variant="cyan">Approved</Badge>;
      case "rejected":
        return <Badge variant="coral">Rejected</Badge>;
      default:
        return <Badge variant="brand">Proposed</Badge>;
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex flex-col h-full shadow-sm overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[var(--border-color)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#7C5CFC]" />
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              Refactoring History
            </h3>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onNewProposal}
            className="gap-1 text-xs px-2.5 py-1 bg-[#7C5CFC] hover:bg-[#6A4BE2] text-white"
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
            placeholder="Search scans, proposals, renames..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#7C5CFC]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
          {(["all", "proposal", "rename", "scan"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-2 py-0.5 rounded-lg capitalize whitespace-nowrap transition-colors ${
                typeFilter === t
                  ? "bg-[#7C5CFC]/15 text-[#7C5CFC] font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t === "all" ? "All Activity" : `${t}s`}
            </button>
          ))}
        </div>
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
            No history records match your search.
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.proposalRef) {
                    onSelectProposal(item.proposalRef);
                  }
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                  isSelected
                    ? "bg-[#7C5CFC]/10 border-[#7C5CFC] shadow-sm"
                    : "bg-[var(--bg-card-hover)] border-[var(--border-color)] hover:border-[#7C5CFC]/40"
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
                      if (confirm(`Delete '${item.title}'?`)) {
                        if (item.type === "proposal") {
                          onDeleteProposal(item.id);
                        } else if (onDeleteHistoryItem) {
                          onDeleteHistoryItem(item.id);
                        }
                      }
                    }}
                    className="text-[var(--text-secondary)] hover:text-red-400 p-1 rounded"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {getTypeBadge(item.type)}
                  {getStatusBadge(item.status)}
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                  {item.description}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] pt-1 border-t border-[var(--border-color)]/50">
                  <span>{item.authorName} · {item.repositoryId}</span>
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
