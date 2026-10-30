"use client";

import React, { useState } from "react";
import {
  Copy,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  CheckCircle2,
  FileCode,
  Repeat,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DuplicateCandidate } from "@/types/multi-repo";

interface DuplicateCodeInspectorProps {
  candidates: DuplicateCandidate[];
  isLoading: boolean;
}

export function DuplicateCodeInspector({ candidates, isLoading }: DuplicateCodeInspectorProps) {
  const [selectedId, setSelectedId] = useState<string>(candidates[0]?.id || "");

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-[#6C4DFF] dark:border-[#29D3C2] border-t-transparent rounded-full mb-3" />
        <p className="text-sm text-[#6E6A8A] dark:text-[#8E95A8]">
          Scanning AST symbol shapes and normalized tokens across authorized repositories...
        </p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="p-8 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
        <p className="text-sm font-medium text-[#19143D] dark:text-[#F3F5FA]">
          No duplicate implementations detected
        </p>
        <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-1">
          Repositories maintain high cohesion with minimal cross-project duplication.
        </p>
      </div>
    );
  }

  const activeCandidate = candidates.find((c) => c.id === selectedId) || candidates[0];

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA] flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[#6C4DFF] dark:text-[#29D3C2]" />
              Duplicate Implementation Discovery & Code Reuse
            </h3>
            <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-0.5">
              Identifies repeated utilities, validation patterns, and client wrappers across authorized codebases to facilitate consolidation into shared libraries.
            </p>
          </div>

          <Badge variant="brand" className="text-xs font-mono self-start sm:self-auto">
            {candidates.length} Candidates Identified
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Candidate List */}
        <div className="space-y-3">
          {candidates.map((cand) => {
            const isSelected = cand.id === activeCandidate.id;
            return (
              <div
                key={cand.id}
                onClick={() => setSelectedId(cand.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#6C4DFF] dark:border-[#29D3C2] bg-[#F4F0FF]/50 dark:bg-[#1E1A38]/40 shadow-sm"
                    : "border-[#EAE6FD] dark:border-[#1E2638] bg-[#FAFAFE] dark:bg-[#141926] hover:border-[#6C4DFF]/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA]">
                    {cand.title}
                  </span>
                  <Badge variant={cand.similarityScore >= 95 ? "coral" : "cyan"} className="text-xs">
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
                </div>

                <div className="mt-2 text-xs text-[#6E6A8A] dark:text-[#8E95A8] line-clamp-2">
                  {cand.matchingEvidence}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Candidate Comparison & Reuse Opportunity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EAE6FD] dark:border-[#1E2638]">
              <div>
                <h4 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA]">
                  {activeCandidate.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="cyan" className="text-xs">
                    Method: {activeCandidate.detectionMethodLabel}
                  </Badge>
                  {activeCandidate.isExactMatch && (
                    <Badge variant="mint" className="text-xs">
                      Exact Normalized AST Match
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#8E95A8] uppercase tracking-wider block">Similarity</span>
                <span className="text-xl font-extrabold text-[#6C4DFF] dark:text-[#29D3C2]">
                  {activeCandidate.similarityScore}%
                </span>
              </div>
            </div>

            {/* Side-by-side or stacked code snippets across repositories */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider">
                Cross-Repository Implementations
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeCandidate.instances.map((inst, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="brand" className="text-[10px] uppercase font-mono">
                          {inst.repositoryName}
                        </Badge>
                        <span className="text-[10px] font-mono text-[#8E95A8]">
                          {inst.revision}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-2 font-mono text-xs text-[#19143D] dark:text-[#F3F5FA]">
                        <FileCode className="w-3.5 h-3.5 text-[#6C4DFF] dark:text-[#29D3C2]" />
                        <span>
                          {inst.filePath}:{inst.lineRange.start}-{inst.lineRange.end}
                        </span>
                      </div>

                      <div className="mt-2.5 p-3 rounded-lg bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] font-mono text-xs text-[#19143D] dark:text-[#D1D5DB] overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{inst.snippet}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Differences */}
            {activeCandidate.keyDifferences.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider">
                  Important Differences
                </h5>
                <ul className="list-disc list-inside space-y-1 text-xs text-[#6E6A8A] dark:text-[#8E95A8]">
                  {activeCandidate.keyDifferences.map((diff, idx) => (
                    <li key={idx}>{diff}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reuse Recommendation */}
            <div className="p-4 rounded-xl bg-[#2FD6A0]/10 border border-[#2FD6A0]/20 text-xs text-[#19143D] dark:text-[#F3F5FA] space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Opportunities for Safe Consolidation & Reuse:
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
