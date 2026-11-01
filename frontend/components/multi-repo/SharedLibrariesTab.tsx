"use client";

import React, { useState, useMemo } from "react";
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowRight,
  Sparkles,
  FileCode,
  Check,
  X,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SharedLibraryItem } from "@/lib/demo/multi-repo-analyzer";

interface SharedLibrariesTabProps {
  libraries: SharedLibraryItem[];
  isLoading: boolean;
  onApplyAlignment: (item: SharedLibraryItem, targetVersion: string) => void;
  initialShowConflictsOnly?: boolean;
}

export function SharedLibrariesTab({
  libraries,
  isLoading,
  onApplyAlignment,
  initialShowConflictsOnly = false,
}: SharedLibrariesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showConflictsOnly, setShowConflictsOnly] = useState(initialShowConflictsOnly);
  const [alignmentModalItem, setAlignmentModalItem] = useState<SharedLibraryItem | null>(null);
  const [applyingPkg, setApplyingPkg] = useState<string | null>(null);

  // Sync initialShowConflictsOnly if changed from KPI click
  React.useEffect(() => {
    if (initialShowConflictsOnly) setShowConflictsOnly(true);
  }, [initialShowConflictsOnly]);

  const filteredLibraries = useMemo(() => {
    return libraries.filter((lib) => {
      const matchesSearch = lib.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesConflict = showConflictsOnly ? lib.hasConflict : true;
      return matchesSearch && matchesConflict;
    });
  }, [libraries, searchQuery, showConflictsOnly]);

  const totalConflicts = libraries.filter((l) => l.hasConflict).length;

  const handleConfirmAlignment = async (item: SharedLibraryItem) => {
    setApplyingPkg(item.name);
    try {
      await onApplyAlignment(item, item.suggestedVersion);
      setAlignmentModalItem(null);
    } finally {
      setApplyingPkg(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
        <div className="inline-block animate-spin w-8 h-8 border-3 border-[#7C5CFC] border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-semibold text-[#19143D] dark:text-[#F3F5FA]">
          Scanning package manifests across repositories...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E95A8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shared packages (e.g. react, axios, pydantic, @acme/shared-utils)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-xs sm:text-sm text-[#19143D] dark:text-[#F3F5FA] placeholder-[#8E95A8] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowConflictsOnly(!showConflictsOnly)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showConflictsOnly
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold"
                  : "bg-[#F7F5FE] dark:bg-[#141926] border-[#EAE6FD] dark:border-[#242B3D] text-[#6E6A8A] dark:text-[#8E95A8]"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Version Conflicts Only ({totalConflicts})</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-[#8E95A8] pt-2 border-t border-[#EAE6FD] dark:border-[#1E2638]">
          <span>
            Showing <strong>{filteredLibraries.length}</strong> of {libraries.length} shared packages
          </span>
          {totalConflicts > 0 && (
            <span className="text-amber-500 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {totalConflicts} package(s) have diverging version drift across codebases
            </span>
          )}
        </div>
      </div>

      {/* Shared Libraries Table */}
      <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl overflow-hidden shadow-sm">
        {filteredLibraries.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Package className="w-8 h-8 text-[#8E95A8] mx-auto opacity-50" />
            <h4 className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA]">
              No shared libraries match filter
            </h4>
            <p className="text-xs text-[#8E95A8]">
              Try clearing the search query or turning off the version conflicts filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5FE] dark:bg-[#141926] text-[#6E6A8A] dark:text-[#8E95A8] uppercase font-bold tracking-wider border-b border-[#EAE6FD] dark:border-[#1E2638]">
                <tr>
                  <th className="py-3.5 px-4">Package</th>
                  <th className="py-3.5 px-4">Ecosystem</th>
                  <th className="py-3.5 px-4">Usage</th>
                  <th className="py-3.5 px-4">Versions Per Repository</th>
                  <th className="py-3.5 px-4">Latest Seen</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6FD] dark:divide-[#1E2638]">
                {filteredLibraries.map((lib) => (
                  <tr
                    key={lib.id}
                    className="hover:bg-[#F9F8FF] dark:hover:bg-[#121622] transition-colors"
                  >
                    {/* Package Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#F4F0FF] dark:bg-[#1E1A38] text-[#7C5CFC]">
                          <Package className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-mono font-bold text-[#19143D] dark:text-[#F3F5FA]">
                          {lib.name}
                        </span>
                      </div>
                    </td>

                    {/* Ecosystem */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono uppercase text-[10px] px-2 py-0.5 rounded font-bold bg-[#EAE6FD] dark:bg-[#1E2638] text-[#19143D] dark:text-[#F3F5FA]">
                        {lib.ecosystem}
                      </span>
                    </td>

                    {/* Usage Count */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#19143D] dark:text-[#F3F5FA]">
                        {lib.usageCount} repos
                      </span>
                    </td>

                    {/* Versions Per Repository */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {lib.usages.map((u, uIdx) => (
                          <span
                            key={uIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D]"
                          >
                            <span className="text-[#8E95A8]">{u.repoName}:</span>
                            <span className="font-bold text-[#19143D] dark:text-[#F3F5FA]">
                              {u.version}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Latest Seen */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#7C5CFC]">
                      {lib.latestSeen}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4">
                      {lib.hasConflict ? (
                        <Badge variant="coral" className="text-[10px] flex items-center gap-1 w-max">
                          <AlertTriangle className="w-3 h-3" />
                          Version Drift
                        </Badge>
                      ) : (
                        <Badge variant="mint" className="text-[10px] flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" />
                          Aligned
                        </Badge>
                      )}
                    </td>

                    {/* Action: Suggest alignment */}
                    <td className="py-3.5 px-4 text-right">
                      {lib.hasConflict ? (
                        <button
                          onClick={() => setAlignmentModalItem(lib)}
                          className="px-3 py-1 rounded-xl bg-[#7C5CFC] hover:bg-[#6A4BE8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Suggest alignment</span>
                        </button>
                      ) : (
                        <span className="text-xs text-[#8E95A8] font-medium">Up to date</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suggest Alignment Modal */}
      {alignmentModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#EAE6FD] dark:border-[#1E2638]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#7C5CFC]/10 text-[#7C5CFC]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA]">
                    Dependency Version Alignment Proposal
                  </h3>
                </div>
                <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-1">
                  Recommends harmonizing {alignmentModalItem.name} across manifests to eliminate runtime conflicts.
                </p>
              </div>
              <button
                onClick={() => setAlignmentModalItem(null)}
                className="text-[#8E95A8] hover:text-[#19143D] dark:hover:text-[#F3F5FA] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Recommendation */}
            <div className="p-4 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8E95A8] uppercase font-bold text-[10px]">Target Aligned Version:</span>
                <span className="font-mono text-sm font-extrabold text-[#7C5CFC]">
                  {alignmentModalItem.suggestedVersion}
                </span>
              </div>
              <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8]">
                Standardizing on {alignmentModalItem.suggestedVersion} eliminates dual-package runtime hazards and matches modern peer dependencies.
              </p>
            </div>

            {/* Manifests to Update */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider">
                Manifest Files to Change ({alignmentModalItem.filesToChange.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {alignmentModalItem.filesToChange.map((fileChange, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#FAFAFE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] text-xs font-mono flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-[#19143D] dark:text-[#F3F5FA]">
                        {fileChange.repoName}/{fileChange.file}:{fileChange.line}
                      </div>
                      <div className="text-[11px] text-[#8E95A8] mt-0.5 flex items-center gap-1.5">
                        <span className="line-through text-red-500">{fileChange.currentVersion}</span>
                        <ArrowRight className="w-3 h-3 text-[#8E95A8]" />
                        <span className="text-emerald-500 font-bold">{fileChange.targetVersion}</span>
                      </div>
                    </div>
                    <FileCode className="w-4 h-4 text-[#8E95A8]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE6FD] dark:border-[#1E2638]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAlignmentModalItem(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleConfirmAlignment(alignmentModalItem)}
                disabled={applyingPkg === alignmentModalItem.name}
                className="flex items-center gap-1.5"
              >
                {applyingPkg === alignmentModalItem.name ? (
                  <>
                    <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Alignment to Manifests</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
