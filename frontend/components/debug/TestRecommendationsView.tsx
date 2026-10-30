"use client";

import React, { useState } from "react";
import {
  FlaskConical,
  Copy,
  Check,
  CheckCircle2,
  FileCheck2,
  Info,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TestRecommendation } from "@/types/debug";

interface TestRecommendationsViewProps {
  recommendations: TestRecommendation[];
  isStandalone: boolean;
}

export default function TestRecommendationsView({
  recommendations,
  isStandalone,
}: TestRecommendationsViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: TestRecommendation["status"], isExisting: boolean) => {
    if (isExisting) {
      return (
        <Badge variant="brand">
          <FileCheck2 className="w-3 h-3 mr-1" />
          Discovered in Repository
        </Badge>
      );
    }
    switch (status) {
      case "suggested":
        return (
          <Badge variant="cyan">
            <Sparkles className="w-3 h-3 mr-1" />
            Suggested Regression Test
          </Badge>
        );
      case "executed_passed":
        return <Badge variant="mint">Executed: Passed</Badge>;
      case "executed_failed":
        return <Badge variant="coral">Executed: Failed</Badge>;
      default:
        return <Badge variant="gray">Not Executed</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-[#8B7CFF]" />
            Test-Driven Debugging & Regression Suites
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Discovered tests and framework-aligned regression test recommendations.
          </p>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
        <Info className="w-4 h-4 text-[#8B7CFF] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[var(--text-primary)]">Test Integrity Notice: </span>
          Suggested tests are generated based on discovered function signatures and frameworks.
          CodeAtlas does not execute arbitrary code on the server or claim tests passed without execution logs.
        </div>
      </div>

      <div className="space-y-3.5">
        {recommendations.map((test) => {
          const isCopied = copiedId === test.id;

          return (
            <div
              key={test.id}
              className={`bg-[var(--bg-card)] border rounded-xl p-4 shadow-sm transition-all ${
                test.isExistingTest
                  ? "border-[var(--border-color)]"
                  : "border-[#29D3C2]/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-[var(--border-color)]">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-xs text-[var(--text-primary)]">
                      {test.title}
                    </h4>
                    {getStatusBadge(test.status, test.isExistingTest)}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                      framework: {test.framework}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
                    File: {test.testFile} • Target: {test.targetSymbol}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyCode(test.id, test.testCode)}
                  className="text-xs text-[var(--text-secondary)] self-start sm:self-auto"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-[#2FD6A0]" />
                      Copied Test
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-2.5">
                <p className="text-xs text-[var(--text-primary)] mb-2">
                  {test.rationale}
                </p>

                {/* Test Code Snippet */}
                <div className="border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--bg-primary)]">
                  <pre className="p-3 text-[11px] font-mono leading-relaxed overflow-x-auto text-[var(--text-primary)]">
                    {test.testCode}
                  </pre>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
