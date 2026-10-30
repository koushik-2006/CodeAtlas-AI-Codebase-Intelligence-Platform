import { db } from "./db";
import { impactEngine } from "./impact-engine";
import {
  ReviewChangedFile,
  ReviewAffectedComponent,
  ReviewRelatedTest,
} from "@/types/review";
import { DbCodeSymbol } from "@/types/database";

export interface ParsedDiffHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: {
    type: "add" | "delete" | "context";
    content: string;
    oldLine?: number;
    newLine?: number;
  }[];
}

export interface AnalyzedChangedFile {
  file: ReviewChangedFile;
  hunks: ParsedDiffHunk[];
  modifiedSymbols: DbCodeSymbol[];
  addedLinesCount: number;
  deletedLinesCount: number;
  surroundingContext: string;
}

export interface DiffAnalysisResult {
  repositoryId: string;
  files: AnalyzedChangedFile[];
  affectedComponents: ReviewAffectedComponent[];
  relatedTests: ReviewRelatedTest[];
  testGaps: { functionName: string; file: string; line: number }[];
  totalAdditions: number;
  totalDeletions: number;
}

/**
 * Server-side Diff Analysis Pipeline.
 * Parses git patch hunks, correlates modified line ranges to AST symbols,
 * discovers test gaps, and calculates architectural change blast-radius.
 */
export class DiffAnalyzer {
  /**
   * Parses and analyzes a set of pull request files against the repository index.
   */
  analyzeDiff(repositoryId: string, files: ReviewChangedFile[]): DiffAnalysisResult {
    const allSymbols = db.getCodeSymbols(repositoryId);
    const repoFiles = db.getRepositoryFiles(repositoryId);
    const relationships = db.getCodeRelationships(repositoryId);

    const analyzedFiles: AnalyzedChangedFile[] = [];
    let totalAdditions = 0;
    let totalDeletions = 0;

    const modifiedSymbolSet = new Map<string, DbCodeSymbol>();

    for (const file of files) {
      totalAdditions += file.additions || 0;
      totalDeletions += file.deletions || 0;

      const hunks = this.parsePatch(file.patch || "");
      const changedLineNumbers = new Set<number>();

      hunks.forEach((hunk) => {
        hunk.lines.forEach((l) => {
          if (l.type === "add" && l.newLine) {
            changedLineNumbers.add(l.newLine);
          }
        });
      });

      // Cross-reference changed lines with AST symbols in this file
      const fileSymbols = allSymbols.filter((s) => s.filePath === file.filename);
      const affectedInThisFile: DbCodeSymbol[] = [];

      fileSymbols.forEach((sym) => {
        // Check if any changed line falls within symbol's startLine to endLine
        let matches = false;
        for (const lineNum of Array.from(changedLineNumbers)) {
          if (lineNum >= sym.startLine && lineNum <= sym.endLine) {
            matches = true;
            break;
          }
        }

        // If patch added a new function declaration matching the symbol
        if (!matches && file.patch && file.patch.includes(sym.name)) {
          matches = true;
        }

        if (matches) {
          affectedInThisFile.push(sym);
          modifiedSymbolSet.set(sym.id, sym);
        }
      });

      // Retrieve surrounding code context
      const existingFile = repoFiles.find((f) => f.path === file.filename);
      const surroundingContext = existingFile ? existingFile.content.slice(0, 1500) : "";

      analyzedFiles.push({
        file,
        hunks,
        modifiedSymbols: affectedInThisFile,
        addedLinesCount: file.additions,
        deletedLinesCount: file.deletions,
        surroundingContext,
      });
    }

    // --- Phase 8 Impact Integration ---
    const affectedComponents: ReviewAffectedComponent[] = [];
    const relatedTestsMap = new Map<string, ReviewRelatedTest>();
    const testGaps: { functionName: string; file: string; line: number }[] = [];

    // Evaluate each modified symbol with the impact engine
    for (const sym of Array.from(modifiedSymbolSet.values())) {
      const impact = impactEngine.analyzeImpact({
        repositoryId,
        file: sym.filePath,
        symbol: sym.name,
      });

      // Add direct callers & downstream components
      impact.directlyDependent.forEach((dep) => {
        if (!affectedComponents.some((c) => c.name === dep.name && c.file === dep.file)) {
          affectedComponents.push({
            name: dep.name,
            type: dep.type,
            file: dep.file,
            line: dep.line,
            reason: dep.reason,
            relationship: dep.relationship,
          });
        }
      });

      impact.downstreamAffected.forEach((down) => {
        if (!affectedComponents.some((c) => c.name === down.name && c.file === down.file)) {
          affectedComponents.push({
            name: down.name,
            type: down.type,
            file: down.file,
            line: down.line,
            reason: down.reason,
            relationship: down.relationship,
          });
        }
      });

      // Check linked tests
      if (impact.testsToRerun.length > 0) {
        impact.testsToRerun.forEach((t) => {
          relatedTestsMap.set(`${t.file}:${t.name}`, {
            name: t.name,
            file: t.file,
            status: t.status,
            coverageStatus: "covered",
          });
        });
      } else {
        // Flag test gap for functions or services with no test coverage
        if (sym.type === "function" || sym.type === "service") {
          testGaps.push({
            functionName: sym.name,
            file: sym.filePath,
            line: sym.startLine,
          });
          relatedTestsMap.set(`${sym.filePath}:${sym.name}:gap`, {
            name: `Test for ${sym.name}()`,
            file: "tests",
            status: "missing-coverage",
            coverageStatus: "untested",
          });
        }
      }
    }

    return {
      repositoryId,
      files: analyzedFiles,
      affectedComponents,
      relatedTests: Array.from(relatedTestsMap.values()),
      testGaps,
      totalAdditions,
      totalDeletions,
    };
  }

  /**
   * Parses git patch text into structured line hunks.
   */
  parsePatch(patch: string): ParsedDiffHunk[] {
    if (!patch) return [];

    const hunks: ParsedDiffHunk[] = [];
    const rawLines = patch.split("\n");

    let currentHunk: ParsedDiffHunk | null = null;
    let oldLine = 0;
    let newLine = 0;

    for (const line of rawLines) {
      if (line.startsWith("@@")) {
        const match = line.match(/@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/);
        if (match) {
          const oldStart = parseInt(match[1], 10);
          const oldCount = match[2] ? parseInt(match[2], 10) : 1;
          const newStart = parseInt(match[3], 10);
          const newCount = match[4] ? parseInt(match[4], 10) : 1;

          oldLine = oldStart;
          newLine = newStart;

          currentHunk = {
            oldStart,
            oldCount,
            newStart,
            newCount,
            lines: [],
          };
          hunks.push(currentHunk);
          continue;
        }
      }

      if (!currentHunk) continue;

      if (line.startsWith("+")) {
        currentHunk.lines.push({
          type: "add",
          content: line.slice(1),
          newLine: newLine++,
        });
      } else if (line.startsWith("-")) {
        currentHunk.lines.push({
          type: "delete",
          content: line.slice(1),
          oldLine: oldLine++,
        });
      } else {
        currentHunk.lines.push({
          type: "context",
          content: line.startsWith(" ") ? line.slice(1) : line,
          oldLine: oldLine++,
          newLine: newLine++,
        });
      }
    }

    return hunks;
  }
}

export const diffAnalyzer = new DiffAnalyzer();
