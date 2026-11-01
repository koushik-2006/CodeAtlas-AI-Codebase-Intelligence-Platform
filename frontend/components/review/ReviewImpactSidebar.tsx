"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ReviewSession } from "@/types/review";
import {
  Layers,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Globe,
  FolderGit2,
  TestTube2,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReviewImpactSidebarProps {
  session: ReviewSession;
  repositoryId: string;
  primaryFile?: string;
  isAnalyzing: boolean;
  onReRunReview: () => void;
  isSecurityReviewOnly: boolean;
  onToggleSecurityReview: () => void;
  className?: string;
}

export function ReviewImpactSidebar({
  session,
  repositoryId,
  primaryFile = "src/services/auth.ts",
  isAnalyzing,
  onReRunReview,
  isSecurityReviewOnly,
  onToggleSecurityReview,
  className = "",
}: ReviewImpactSidebarProps) {
  const [copiedTestCmd, setCopiedTestCmd] = useState<string | null>(null);

  const riskScore = session.riskScore || 78;
  const riskLevel = session.riskLevel || (riskScore > 70 ? "High" : riskScore > 30 ? "Medium" : "Low");

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    if (score >= 40) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  };

  const testCommand = "npm test tests/auth.test.ts";

  const handleCopyTestCommand = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(testCommand);
      setCopiedTestCmd(testCommand);
      setTimeout(() => setCopiedTestCmd(null), 2000);
    }
  };

  const sampleEndpoints = [
    { method: "POST", path: "/api/v1/auth/session", repo: "sample-project" },
    { method: "POST", path: "/api/v1/checkout", repo: "payment-service" },
  ];

  const affectedRepos = [
    { name: "sample-project", count: 3 },
    { name: "payment-service", count: 2 },
    { name: "shared-core-lib", count: 1 },
  ];

  const coverageGaps = [
    { file: "src/components/UserProfile.tsx", reason: "Invokes session state without fallback" },
  ];

  return (
    <aside className={`space-y-4 ${className}`}>
      {/* 1. Impact Risk Score Card */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#7C5CFC]" />
            <span>Blast Radius & Risk</span>
          </span>
          <span className="text-[10px] font-mono text-[var(--text-secondary)]">
            PR #{session.pullRequestNumber}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono font-black border ${getScoreColor(
              riskScore
            )}`}
          >
            <span className="text-xl leading-none">{riskScore}</span>
            <span className="text-[8px] uppercase tracking-wider opacity-80 mt-0.5">Score</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(riskScore)}`}
              >
                {riskLevel} Risk
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Changes ripple across 3 repositories & 2 public APIs.
            </p>
          </div>
        </div>

        <Link
          href={`/change-impact?repo=${repositoryId}&file=${encodeURIComponent(
            primaryFile
          )}&symbol=validateEmail`}
          className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-[#7C5CFC]/15 text-[#7C5CFC] border border-[#7C5CFC]/30 hover:bg-[#7C5CFC]/25 transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Open Full Impact Analysis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. Affected Public Endpoints */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
          <span className="font-mono text-xs font-bold uppercase text-[var(--text-primary)] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Public API Endpoints (2)</span>
          </span>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          {sampleEndpoints.map((ep, idx) => (
            <div
              key={idx}
              className="p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] flex items-center justify-between"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#7C5CFC]/15 text-[#7C5CFC]">
                  {ep.method}
                </span>
                <span className="text-[var(--text-primary)] truncate font-semibold">
                  {ep.path}
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] shrink-0">
                {ep.repo}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Affected Repositories */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-2">
        <span className="font-mono text-xs font-bold uppercase text-[var(--text-primary)] flex items-center gap-1.5 mb-1">
          <FolderGit2 className="w-3.5 h-3.5 text-[#7C5CFC]" />
          <span>Cross-Repo Dependencies ({affectedRepos.length})</span>
        </span>

        <div className="space-y-1.5 text-xs">
          {affectedRepos.map((repo, idx) => (
            <div
              key={idx}
              className="p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] flex items-center justify-between font-mono"
            >
              <span className="text-[var(--text-primary)] font-bold">{repo.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                {repo.count} affected file(s)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Automated Tests to Rerun */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-2">
        <span className="font-mono text-xs font-bold uppercase text-[var(--text-primary)] flex items-center gap-1.5 mb-1">
          <TestTube2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tests to Rerun</span>
        </span>

        <div className="p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[var(--text-primary)]">
            <span>tests/auth.test.ts</span>
            <span className="text-emerald-400 text-[10px]">PASSING</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/30 font-mono text-[11px] text-[var(--text-secondary)]">
            <span className="truncate">{testCommand}</span>
            <button
              type="button"
              onClick={handleCopyTestCommand}
              className="p-1 hover:text-[var(--text-primary)] text-[var(--text-secondary)]"
              title="Copy test command"
            >
              {copiedTestCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Coverage Gaps & Untested Paths */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-2">
        <span className="font-mono text-xs font-bold uppercase text-[var(--text-primary)] flex items-center gap-1.5 mb-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Untested Paths (Coverage Gaps)</span>
        </span>

        {coverageGaps.map((gap, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1"
          >
            <strong className="block font-mono font-bold text-amber-400 truncate">
              {gap.file}
            </strong>
            <p className="text-[11px] text-[var(--text-secondary)]">{gap.reason}</p>
          </div>
        ))}
      </div>

      {/* 6. AI Review Controls */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-3">
        <span className="font-mono text-xs font-bold uppercase text-[var(--text-primary)] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#7C5CFC]" />
          <span>AI Review Controls</span>
        </span>

        <label className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] cursor-pointer text-xs">
          <span className="font-bold text-[var(--text-primary)]">Security Focus Mode</span>
          <input
            type="checkbox"
            checked={isSecurityReviewOnly}
            onChange={onToggleSecurityReview}
            className="rounded accent-[#7C5CFC] cursor-pointer"
          />
        </label>

        <Button
          variant="primary"
          size="sm"
          onClick={onReRunReview}
          disabled={isAnalyzing}
          className="w-full bg-[#7C5CFC] text-white hover:bg-[#6A4BE2] text-xs h-9 gap-1.5"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
          <span>{isAnalyzing ? "Analyzing Pull Request..." : "Re-Run AI Review"}</span>
        </Button>
      </div>
    </aside>
  );
}
