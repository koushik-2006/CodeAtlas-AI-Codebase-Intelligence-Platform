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
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TestRecommendation } from "@/types/debug";
import { addTestRecommendationToStore } from "@/lib/demo/store";

interface TestRecommendationsViewProps {
  recommendations: TestRecommendation[];
  repositoryId?: string;
  isStandalone: boolean;
}

export default function TestRecommendationsView({
  recommendations,
  repositoryId,
  isStandalone,
}: TestRecommendationsViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddToRepository = (test: TestRecommendation) => {
    try {
      setAddingId(test.id);
      addTestRecommendationToStore(repositoryId || "sample-project", test.testFile, test.testCode);
      setAddedIds((prev) => ({ ...prev, [test.id]: true }));
    } catch (e) {
      console.error("Failed to add test to repository:", e);
    } finally {
      setAddingId(null);
    }
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
            <FlaskConical className="w-4 h-4 text-[#7C5CFC]" />
            Test-Driven Regression Suites
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Framework-aligned test suites generated to reproduce and safeguard against this failure.
          </p>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
        <Info className="w-4 h-4 text-[#7C5CFC] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[var(--text-primary)]">Test Alignment: </span>
          Tests are generated based on discovered function signatures, language runtime conventions, and test framework standards (Jest, Pytest, JUnit, Go test).
        </div>
      </div>

      <div className="space-y-3.5">
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl">
            No test recommendations generated for this error.
          </div>
        ) : (
          recommendations.map((test) => {
            const isCopied = copiedId === test.id;
            const isAdded = !!addedIds[test.id];
            const isAdding = addingId === test.id;

            return (
              <div
                key={test.id}
                className={`bg-[var(--bg-card)] border rounded-xl p-4 shadow-sm transition-all ${
                  test.isExistingTest
                    ? "border-[var(--border-color)]"
                    : isAdded
                    ? "border-[#2FD6A0]/60 ring-1 ring-[#2FD6A0]/20"
                    : "border-[#7C5CFC]/30"
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

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(test.id, test.testCode)}
                      className="text-xs text-[var(--text-secondary)]"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1 text-[#2FD6A0]" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy Code
                        </>
                      )}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isAdded || isAdding}
                      onClick={() => handleAddToRepository(test)}
                      className={`text-xs font-semibold ${
                        isAdded
                          ? "bg-[#2FD6A0]/20 text-[#1BA97B] dark:text-[#2FD6A0] border border-[#2FD6A0]/30 cursor-default"
                          : "bg-[#7C5CFC] hover:bg-[#6846f9] text-white"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Saved to Repo
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add to Repository
                        </>
                      )}
                    </Button>
                  </div>
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
          })
        )}
      </div>
    </div>
  );
}
