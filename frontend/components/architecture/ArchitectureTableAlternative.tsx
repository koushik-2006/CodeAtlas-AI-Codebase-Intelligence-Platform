"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { ArchitectureNode, ArchitectureNodeType } from "@/types/architecture";
import { Search, Filter, ExternalLink, FileCode, CheckCircle2 } from "lucide-react";

interface ArchitectureTableAlternativeProps {
  nodes: ArchitectureNode[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  repositoryId?: string;
}

export function ArchitectureTableAlternative({
  nodes,
  selectedNodeId,
  onSelectNode,
  repositoryId = "sample-project",
}: ArchitectureTableAlternativeProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const nodeTypes = useMemo(() => {
    const types = new Set(nodes.map((n) => n.type));
    return Array.from(types);
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesSearch =
        !search ||
        n.label.toLowerCase().includes(search.toLowerCase()) ||
        n.file.toLowerCase().includes(search.toLowerCase()) ||
        (n.name && n.name.toLowerCase().includes(search.toLowerCase()));

      const matchesType = selectedType === "all" || n.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [nodes, search, selectedType]);

  const getTypeBadgeStyles = (type: string) => {
    switch (type) {
      case "API endpoint":
        return isDark
          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
          : "bg-[#FFF0BF] text-[#B38300] border border-[#FFC53D]/40";
      case "Service":
        return isDark
          ? "bg-[#29D3C2]/15 text-[#29D3C2] border border-[#29D3C2]/30"
          : "bg-[#D7F7EA] text-[#1BA97B] border border-[#2FD6A0]/30";
      case "Function":
        return isDark
          ? "bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30"
          : "bg-[#EAE5FF] text-[#6C4DFF] border border-[#6C4DFF]/20";
      case "Database model":
      case "Database":
        return isDark
          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
          : "bg-[#FFE0E3] text-[#D93A40] border border-[#FF5A5F]/30";
      case "Test suite":
      case "Test":
        return isDark
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          : "bg-emerald-50 text-emerald-700 border border-emerald-200";
      default:
        return "bg-[var(--border-color)]/50 text-[var(--text-secondary)]";
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-sm"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
            Accessible Architecture Catalog
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Screen-reader accessible table view of verified codebase nodes, callers, and callees.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search symbols or files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium border outline-none ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                  : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
              }`}
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filter by architecture node type"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border outline-none ${
              isDark
                ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
            }`}
          >
            <option value="all">All Types ({nodes.length})</option>
            {nodeTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Accessible Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse" aria-label="Architecture Nodes and Dependencies">
          <caption className="sr-only">List of architecture entities, types, and connections in repository</caption>
          <thead>
            <tr className="border-b border-[var(--border-color)] text-[11px] font-mono uppercase text-[var(--text-secondary)]">
              <th scope="col" className="py-2.5 px-3 font-bold">Symbol / Node</th>
              <th scope="col" className="py-2.5 px-3 font-bold">Category</th>
              <th scope="col" className="py-2.5 px-3 font-bold">File Location</th>
              <th scope="col" className="py-2.5 px-3 font-bold text-center">Callers</th>
              <th scope="col" className="py-2.5 px-3 font-bold text-center">Callees</th>
              <th scope="col" className="py-2.5 px-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {filteredNodes.length > 0 ? (
              filteredNodes.map((n) => {
                const isSelected = n.id === selectedNodeId;
                const callersCount = n.callers?.length || 0;
                const calleesCount = n.callees?.length || 0;

                return (
                  <tr
                    key={n.id}
                    className={`transition-colors ${
                      isSelected
                        ? isDark
                          ? "bg-[#111725] text-[#29D3C2]"
                          : "bg-[#EAE5FF]/50 text-[#6C4DFF]"
                        : isDark
                        ? "hover:bg-[#111725]/50"
                        : "hover:bg-[#FAF9FF]"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold font-mono">
                      <button
                        type="button"
                        onClick={() => onSelectNode(n.id)}
                        className="hover:underline text-left font-bold"
                        title={`Select ${n.name || n.label} in inspector`}
                      >
                        {n.name || n.label}
                      </button>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${getTypeBadgeStyles(n.type)}`}>
                        {n.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--text-secondary)]">
                      <Link
                        href={`/repositories/${repositoryId}?file=${encodeURIComponent(n.file)}&line=${n.line || 1}`}
                        className="hover:underline inline-flex items-center gap-1 hover:text-[var(--primary)]"
                        title={`Open ${n.file} in Repository Explorer`}
                      >
                        <FileCode className="w-3 h-3 shrink-0" />
                        <span>{n.file}</span>
                        {n.line && <span>:{n.line}</span>}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-center">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-[var(--border-color)]/40 font-bold">
                        {callersCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-center">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-[var(--border-color)]/40 font-bold">
                        {calleesCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectNode(n.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          isSelected
                            ? isDark
                              ? "bg-[#29D3C2] text-[#070A12] border-[#29D3C2]"
                              : "bg-[#6C4DFF] text-white border-[#6C4DFF]"
                            : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {isSelected ? "Inspected" : "Inspect"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[var(--text-secondary)]">
                  No architecture nodes matched your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
