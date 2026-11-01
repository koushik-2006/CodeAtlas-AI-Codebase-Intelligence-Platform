"use client";

import React, { useState } from "react";
import {
  Repeat,
  Sparkles,
  CheckCircle2,
  FileCode,
  ArrowRight,
  ExternalLink,
  Split,
  Maximize2,
  Check,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DuplicateCandidate } from "@/types/multi-repo";
import Link from "next/link";

interface DuplicateCodeTabProps {
  candidates: DuplicateCandidate[];
  isLoading: boolean;
  onExtractProposal: (candidate: DuplicateCandidate) => void;
}

export function DuplicateCodeTab({
  candidates,
  isLoading,
  onExtractProposal,
}: DuplicateCodeTabProps) {
  const [selectedId, setSelectedId] = useState<string>(candidates[0]?.id || "");
  const [extractedProposalIds, setExtractedProposalIds] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"side-by-side" | "unified">("side-by-side");

  const activeCandidate = candidates.find((c) => c.id === selectedId) || candidates[0];

  const handleExtract = (cand: DuplicateCandidate) => {
    onExtractProposal(cand);
    setExtractedProposalIds((prev) => ({ ...prev, [cand.id]: true }));
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
        <div className="inline-block animate-spin w-8 h-8 border-3 border-[#7C5CFC] border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-semibold text-[#19143D] dark:text-[#F3F5FA]">
          Hashing sliding windows across normalized AST tokens...
        </p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="p-12 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl space-y-3">
        <Repeat className="w-10 h-10 text-[#8E95A8] mx-auto opacity-50" />
        <h4 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA]">
          No duplicate code blocks detected
        </h4>
        <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] max-w-md mx-auto">
          The selected repositories maintain high modularity with minimal cross-project copy-paste duplication.
        </p>
      </div>
    );
  }

  const instA = activeCandidate.instances[0];
  const instB = activeCandidate.instances[1] || activeCandidate.instances[0];
  const isExtracted = Boolean(extractedProposalIds[activeCandidate.id]);

  return (
    <div className="space-y-6">
      {/* Overview Header Banner */}
      <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA] flex items-center gap-2">
              <Repeat className="w-5 h-5 text-[#7C5CFC]" />
              Duplicate Code Block Detection & Shared Library Extraction
            </h3>
            <Badge variant="brand" className="text-xs">
              AST Token Sliding Windows
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#6E6A8A] dark:text-[#8E95A8] mt-1">
            Detects functionally equivalent routines across microservices and prepares refactoring proposals to consolidate them into shared-core-lib.
          </p>
        </div>

        <Badge variant="cyan" className="text-xs font-mono self-start sm:self-auto py-1 px-3">
          {candidates.length} Candidate Groups Found
        </Badge>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Candidates List */}
        <div className="space-y-3">
          {candidates.map((cand) => {
            const isSelected = cand.id === activeCandidate.id;
            const extracted = Boolean(extractedProposalIds[cand.id]);

            return (
              <div
                key={cand.id}
                onClick={() => setSelectedId(cand.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#7C5CFC] bg-[#F4F0FF]/60 dark:bg-[#1E1A38]/50 shadow-sm"
                    : "border-[#EAE6FD] dark:border-[#1E2638] bg-[#FFFFFF] dark:bg-[#0D111A] hover:border-[#7C5CFC]/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA] line-clamp-1">
                    {cand.title}
                  </h4>
                  <Badge
                    variant={cand.similarityScore >= 95 ? "coral" : "cyan"}
                    className="text-xs font-mono shrink-0"
                  >
                    {cand.similarityScore}% Match
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="brand" className="text-[10px]">
                    {cand.categoryLabel}
                  </Badge>
                  <span className="text-[11px] text-[#8E95A8]">
                    {cand.instances.length} repositories
                  </span>
                  {extracted && (
                    <Badge variant="mint" className="text-[10px] ml-auto">
                      Proposal Created
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-2 line-clamp-2">
                  {cand.matchingEvidence}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Diff Viewer & Extraction Proposal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-6">
            {/* Header with Title and Action Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EAE6FD] dark:border-[#1E2638]">
              <div>
                <h4 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA]">
                  {activeCandidate.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="cyan" className="text-xs">
                    {activeCandidate.detectionMethodLabel}
                  </Badge>
                  <span className="text-xs text-[#8E95A8]">·</span>
                  <span className="text-xs font-bold text-[#7C5CFC]">
                    {activeCandidate.similarityScore}% Normalized Token Match
                  </span>
                </div>
              </div>

              {/* Extract to shared-core-lib Button */}
              <div className="flex items-center gap-2">
                <Button
                  variant={isExtracted ? "outline" : "primary"}
                  size="sm"
                  onClick={() => handleExtract(activeCandidate)}
                  disabled={isExtracted}
                  className="flex items-center gap-1.5 shadow-sm"
                >
                  {isExtracted ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Proposal Added to Store</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Extract to shared-core-lib</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Success Banner if proposal created */}
            {isExtracted && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Refactoring proposal created in store and logged to Activity!
                  </span>
                </div>
                <Link
                  href="/refactoring"
                  className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>View on Refactoring & Debt</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Side-by-Side Diff Viewer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider">
                  Cross-Repository Code Comparison
                </h5>
                <div className="flex items-center rounded-xl bg-[#F7F5FE] dark:bg-[#141926] p-1 border border-[#EAE6FD] dark:border-[#242B3D] text-[11px] font-semibold">
                  <button
                    onClick={() => setViewMode("side-by-side")}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors ${
                      viewMode === "side-by-side" ? "bg-white dark:bg-[#0D111A] text-[#7C5CFC]" : "text-[#8E95A8]"
                    }`}
                  >
                    Side-by-side
                  </button>
                  <button
                    onClick={() => setViewMode("unified")}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors ${
                      viewMode === "unified" ? "bg-white dark:bg-[#0D111A] text-[#7C5CFC]" : "text-[#8E95A8]"
                    }`}
                  >
                    Unified
                  </button>
                </div>
              </div>

              {viewMode === "side-by-side" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column (Instance A) */}
                  <div className="rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#FAFAFE] dark:bg-[#141926] overflow-hidden">
                    <div className="px-3 py-2 bg-[#F4F0FF] dark:bg-[#1E1A38] border-b border-[#EAE6FD] dark:border-[#242B3D] flex items-center justify-between text-xs">
                      <span className="font-bold text-[#7C5CFC]">{instA.repositoryName}</span>
                      <span className="font-mono text-[11px] text-[#8E95A8]">
                        {instA.filePath}:{instA.lineRange.start}-{instA.lineRange.end}
                      </span>
                    </div>
                    <pre className="p-3 text-xs font-mono text-[#19143D] dark:text-[#E2E8F0] overflow-x-auto whitespace-pre leading-relaxed">
                      {instA.snippet.split("\n").map((line, idx) => (
                        <div key={idx} className="flex">
                          <span className="text-[#8E95A8] select-none w-8 shrink-0 text-right pr-2">
                            {instA.lineRange.start + idx}
                          </span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </pre>
                  </div>

                  {/* Right Column (Instance B) */}
                  <div className="rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#FAFAFE] dark:bg-[#141926] overflow-hidden">
                    <div className="px-3 py-2 bg-[#F4F0FF] dark:bg-[#1E1A38] border-b border-[#EAE6FD] dark:border-[#242B3D] flex items-center justify-between text-xs">
                      <span className="font-bold text-[#7C5CFC]">{instB.repositoryName}</span>
                      <span className="font-mono text-[11px] text-[#8E95A8]">
                        {instB.filePath}:{instB.lineRange.start}-{instB.lineRange.end}
                      </span>
                    </div>
                    <pre className="p-3 text-xs font-mono text-[#19143D] dark:text-[#E2E8F0] overflow-x-auto whitespace-pre leading-relaxed">
                      {instB.snippet.split("\n").map((line, idx) => (
                        <div key={idx} className="flex">
                          <span className="text-[#8E95A8] select-none w-8 shrink-0 text-right pr-2">
                            {instB.lineRange.start + idx}
                          </span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </pre>
                  </div>
                </div>
              ) : (
                /* Unified Diff View */
                <div className="rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#FAFAFE] dark:bg-[#141926] p-3 text-xs font-mono overflow-x-auto">
                  <div className="text-[11px] text-[#8E95A8] pb-2 border-b border-[#EAE6FD] dark:border-[#242B3D]">
                    --- a/{instA.repositoryName}/{instA.filePath}
                    <br />
                    +++ b/{instB.repositoryName}/{instB.filePath}
                  </div>
                  <pre className="pt-2 whitespace-pre leading-relaxed">
                    {instA.snippet.split("\n").map((line, idx) => (
                      <div key={idx} className="text-slate-800 dark:text-slate-200">
                        {line}
                      </div>
                    ))}
                  </pre>
                </div>
              )}
            </div>

            {/* Key Differences List */}
            {activeCandidate.keyDifferences.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#EAE6FD] dark:border-[#1E2638]">
                <h5 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider">
                  Important Differences & Syntactic Variance
                </h5>
                <ul className="list-disc list-inside space-y-1 text-xs text-[#6E6A8A] dark:text-[#8E95A8]">
                  {activeCandidate.keyDifferences.map((diff, idx) => (
                    <li key={idx}>{diff}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Consolidation Recommendation */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1.5">
              <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Recommended Architectural Action:</span>
              </div>
              <p className="text-[#6E6A8A] dark:text-[#A7ADC0] pl-5">
                {activeCandidate.reuseRecommendation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
