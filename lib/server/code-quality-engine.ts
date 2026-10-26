import { db } from "./db";
import {
  CodeQualityFinding,
  ComplexityHotspot,
  ModuleCouplingMetric,
  CircularDependencyFinding,
  DuplicateCodeCandidate,
  TechnicalDebtOverview,
  QualityFindingCategory,
  QualityFindingSeverity,
} from "@/types/refactoring";
import { DbCodeSymbol, DbCodeRelationship, DbRepositoryFile } from "@/types/database";

export class CodeQualityEngine {
  /**
   * Analyzes an indexed repository for maintainability issues, complexity hotspots,
   * module coupling, circular dependencies, and duplicate code blocks.
   */
  analyzeRepository(
    repositoryId: string = "sample-project",
    revision?: string
  ): TechnicalDebtOverview {
    const repo = db.getRepository(repositoryId);
    if (!repo) {
      throw new Error(`Repository '${repositoryId}' not found.`);
    }

    const files = db.getRepositoryFiles(repositoryId);
    const symbols = db.getCodeSymbols(repositoryId);
    const relationships = db.getCodeRelationships(repositoryId);

    const findings: CodeQualityFinding[] = [];
    const hotspots: ComplexityHotspot[] = [];

    // 1. Analyze functions for complexity and length
    for (const sym of symbols) {
      if (sym.type === "function" || sym.type === "class") {
        const file = files.find((f) => f.path === sym.filePath);
        if (!file) continue;

        const fileLines = file.content.split(/\r?\n/);
        const symLines = fileLines.slice(sym.startLine - 1, sym.endLine);
        const lineCount = symLines.length;

        // Cyclomatic complexity approximation: count branch points
        const branchMatches = symLines
          .join(" ")
          .match(/\b(if|else\s+if|for|while|case|catch|\?\s*[^:]+:|&&|\|\|)\b/g);
        const cyclomatic = 1 + (branchMatches ? branchMatches.length : 0);

        // Maximum nesting depth
        let maxIndent = 0;
        for (const line of symLines) {
          if (!line.trim()) continue;
          const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
          const depth = Math.floor(leadingSpaces / 2);
          if (depth > maxIndent) maxIndent = depth;
        }

        // Flag excessive length or complexity
        if (lineCount > 25 || cyclomatic >= 5) {
          const isCrit = lineCount > 40 || cyclomatic >= 8;
          findings.push({
            id: `cq_comp_${sym.id}`,
            title: `High Cyclomatic Complexity in ${sym.name} (${cyclomatic})`,
            category: "excessive_complexity",
            categoryLabel: "Excessive Complexity",
            severity: isCrit ? "critical" : "warning",
            filePath: sym.filePath,
            symbolName: sym.name,
            lineRange: { start: sym.startLine, end: sym.endLine },
            detectionMethod: "ast_metric",
            isVerifiedMetric: true,
            metricValue: cyclomatic,
            threshold: 5,
            supportingEvidence: [
              `Function '${sym.name}' spans ${lineCount} lines (${sym.startLine}-${sym.endLine}).`,
              `Contains ${cyclomatic - 1} conditional or loop branch points.`,
              `Maximum indentation nesting depth reached ${maxIndent} levels.`,
            ],
            impactRationale:
              "High cyclomatic complexity makes code exponentially harder to reason about, test exhaustively, and safely modify without regressions.",
            suggestedAction:
              "Extract independent validation branches into helper functions or replace nested branching with guard clauses.",
            suggestedRefactoringOp: "extract_function",
          });

          hotspots.push({
            filePath: sym.filePath,
            symbolName: sym.name,
            lineRange: { start: sym.startLine, end: sym.endLine },
            complexityScore: cyclomatic,
            lineCount,
            nestingDepth: maxIndent,
            rationale: `${cyclomatic} branch points spanning ${lineCount} lines`,
          });
        }

        // Flag deep nesting
        if (maxIndent >= 4) {
          findings.push({
            id: `cq_nest_${sym.id}`,
            title: `Deeply Nested Logic in ${sym.name} (${maxIndent} Levels)`,
            category: "deep_nesting",
            categoryLabel: "Deep Nesting",
            severity: "warning",
            filePath: sym.filePath,
            symbolName: sym.name,
            lineRange: { start: sym.startLine, end: sym.endLine },
            detectionMethod: "ast_metric",
            isVerifiedMetric: true,
            metricValue: `${maxIndent} levels`,
            threshold: "3 levels",
            supportingEvidence: [
              `Nesting depth reaches ${maxIndent} indentation levels inside ${sym.filePath}:${sym.startLine}.`,
              "Nested conditionals and callbacks obscure error return paths.",
            ],
            impactRationale:
              "Deep arrow anti-patterns (pyramid of doom) significantly reduce readability and increase the risk of missed edge cases.",
            suggestedAction:
              "Flatten nested logic by using early returns (guard clauses) or extracting inner blocks.",
            suggestedRefactoringOp: "simplify_conditionals",
          });
        }
      }
    }

    // 2. Scan for Separation of Concerns issues
    for (const file of files) {
      if (file.path.includes("service") || file.path.includes("services")) {
        // Services should not directly access DOM/browser storage or window.location
        if (file.content.includes("localStorage.") || file.content.includes("sessionStorage.")) {
          const lines = file.content.split(/\r?\n/);
          const lineIdx = lines.findIndex(
            (l) => l.includes("localStorage.") || l.includes("sessionStorage.")
          );
          findings.push({
            id: `cq_resp_storage_${file.id}`,
            title: `Coupling of Business Logic to Browser Storage in ${file.name}`,
            category: "unclear_responsibilities",
            categoryLabel: "Unclear Separation of Responsibilities",
            severity: "warning",
            filePath: file.path,
            symbolName: "loginUser",
            lineRange: { start: lineIdx + 1, end: lineIdx + 1 },
            detectionMethod: "static_pattern",
            isVerifiedMetric: false,
            supportingEvidence: [
              `Service module '${file.path}' directly mutates browser 'localStorage' on line ${lineIdx + 1}.`,
              "Makes backend authentication service untestable in Node.js/SSR environments without mocking window/localStorage.",
            ],
            impactRationale:
              "Services should remain pure and environment-agnostic, returning session data to callers rather than managing client-side browser storage directly.",
            suggestedAction:
              "Return session tokens to caller components and delegate storage persistence to a dedicated client storage adapter.",
            suggestedRefactoringOp: "separate_responsibilities",
          });
        }
      }
    }

    // 3. Scan for Repeated String Constants & Endpoints
    const stringLiterals: Record<string, { count: number; occurrences: { file: string; line: number }[] }> = {};
    for (const file of files) {
      const lines = file.content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        const matches = line.match(/"([^"\\]{6,})"/g) || line.match(/'([^'\\]{6,})'/g);
        if (matches) {
          for (const m of matches) {
            const val = m.slice(1, -1);
            if (
              val.includes("/") ||
              val.includes("token") ||
              val.includes("session") ||
              val.includes("@") ||
              val.startsWith("http")
            ) {
              if (!stringLiterals[val]) {
                stringLiterals[val] = { count: 0, occurrences: [] };
              }
              stringLiterals[val].count++;
              stringLiterals[val].occurrences.push({ file: file.path, line: idx + 1 });
            }
          }
        }
      });
    }

    for (const [literal, data] of Object.entries(stringLiterals)) {
      if (data.count >= 2 && data.occurrences.length >= 2) {
        findings.push({
          id: `cq_const_${Buffer.from(literal).toString("hex").slice(0, 10)}`,
          title: `Hardcoded Repeated Literal: "${literal}" (${data.count}x)`,
          category: "repeated_constants",
          categoryLabel: "Repeated Constants",
          severity: "info",
          filePath: data.occurrences[0].file,
          lineRange: { start: data.occurrences[0].line, end: data.occurrences[0].line },
          detectionMethod: "static_pattern",
          isVerifiedMetric: true,
          metricValue: `${data.count} occurrences`,
          threshold: "1 occurrence",
          supportingEvidence: data.occurrences.map(
            (occ) => `Referenced in ${occ.file}:${occ.line}`
          ),
          impactRationale:
            "Scattered magic strings or configuration paths introduce fragility when endpoints, storage keys, or defaults change.",
          suggestedAction:
            "Extract repeated literals into a centralized constants or configuration file.",
          suggestedRefactoringOp: "reduce_duplication",
        });
      }
    }

    // 4. Scan for Duplicate Code Blocks (Duplicate Candidates)
    const duplicateCandidates: DuplicateCodeCandidate[] = [];
    const normalizedChunks: { file: string; startLine: number; endLine: number; text: string }[] = [];

    for (const file of files) {
      const lines = file.content.split(/\r?\n/);
      for (let i = 0; i < lines.length - 2; i++) {
        const chunk = lines.slice(i, i + 3).map((l) => l.trim()).join("\n");
        if (chunk.length > 40 && !chunk.startsWith("//") && !chunk.startsWith("/*")) {
          normalizedChunks.push({
            file: file.path,
            startLine: i + 1,
            endLine: i + 3,
            text: chunk,
          });
        }
      }
    }

    for (let i = 0; i < normalizedChunks.length; i++) {
      for (let j = i + 1; j < normalizedChunks.length; j++) {
        const a = normalizedChunks[i];
        const b = normalizedChunks[j];
        if (a.file !== b.file && a.text === b.text) {
          const candidateId = `dup_${i}_${j}`;
          if (!duplicateCandidates.some((d) => d.fileA === a.file && d.fileB === b.file)) {
            duplicateCandidates.push({
              id: candidateId,
              fileA: a.file,
              fileB: b.file,
              lineRangeA: { start: a.startLine, end: a.endLine },
              lineRangeB: { start: b.startLine, end: b.endLine },
              lineCount: 3,
              duplicateSnippet: a.text,
              similarityPercentage: 100,
              suggestedConsolidation: `Extract shared logic into a common utility function in src/utils/`,
            });

            findings.push({
              id: `cq_dup_${candidateId}`,
              title: `Identical Code Block Duplicated in ${a.file.split("/").pop()} and ${b.file.split("/").pop()}`,
              category: "code_duplication",
              categoryLabel: "Code Duplication",
              severity: "warning",
              filePath: a.file,
              lineRange: { start: a.startLine, end: a.endLine },
              detectionMethod: "static_pattern",
              isVerifiedMetric: true,
              metricValue: "100% Match",
              threshold: "85%",
              supportingEvidence: [
                `Exact 3-line block match between ${a.file}:${a.startLine}-${a.endLine} and ${b.file}:${b.startLine}-${b.endLine}.`,
                `Snippet preview:\n${a.text.slice(0, 100)}...`,
              ],
              impactRationale:
                "Duplicated logic forces developers to maintain bugfixes in multiple places, frequently causing regressions when one site is updated but another is forgotten.",
              suggestedAction:
                "Consolidate logic into a shared helper function in src/utils/ and import it in both locations.",
              suggestedRefactoringOp: "reduce_duplication",
            });
          }
        }
      }
    }

    // 5. Module Coupling Metrics (Fan-out / Fan-in)
    const couplingMetrics: ModuleCouplingMetric[] = [];
    const moduleMap: Record<string, { fanOut: Set<string>; fanIn: Set<string> }> = {};

    for (const file of files) {
      moduleMap[file.path] = { fanOut: new Set(), fanIn: new Set() };
    }

    for (const rel of relationships) {
      const fromSym = symbols.find((s) => s.id === rel.fromSymbolId);
      const toSym = symbols.find((s) => s.id === rel.toSymbolId);
      if (fromSym && toSym && fromSym.filePath !== toSym.filePath) {
        if (!moduleMap[fromSym.filePath]) moduleMap[fromSym.filePath] = { fanOut: new Set(), fanIn: new Set() };
        if (!moduleMap[toSym.filePath]) moduleMap[toSym.filePath] = { fanOut: new Set(), fanIn: new Set() };
        moduleMap[fromSym.filePath].fanOut.add(toSym.filePath);
        moduleMap[toSym.filePath].fanIn.add(fromSym.filePath);
      }
    }

    for (const [modPath, edges] of Object.entries(moduleMap)) {
      const fo = edges.fanOut.size;
      const fi = edges.fanIn.size;
      const ratio = fo / (fo + fi + 1);
      const isHighCoupling = fo >= 3;

      couplingMetrics.push({
        modulePath: modPath,
        fanOut: fo,
        fanIn: fi,
        couplingRatio: parseFloat(ratio.toFixed(2)),
        isHighCoupling,
        dependentModules: Array.from(edges.fanOut),
      });

      if (isHighCoupling) {
        findings.push({
          id: `cq_coup_${modPath.replace(/[^a-zA-Z0-9]/g, "_")}`,
          title: `Excessive Fan-Out Coupling in ${modPath.split("/").pop()} (${fo} Outgoing Dependencies)`,
          category: "excessive_coupling",
          categoryLabel: "Excessive Coupling",
          severity: "warning",
          filePath: modPath,
          detectionMethod: "fan_out_analysis",
          isVerifiedMetric: true,
          metricValue: fo,
          threshold: 3,
          supportingEvidence: [
            `Module depends directly on ${fo} external modules: ${Array.from(edges.fanOut).join(", ")}.`,
            `Coupling ratio: ${(ratio * 100).toFixed(0)}%.`,
          ],
          impactRationale:
            "Modules with high fan-out are sensitive to changes in any dependent service, complicating isolated unit testing and refactoring.",
          suggestedAction:
            "Introduce an intermediary facade or dependency injection interface to decouple caller from concrete services.",
          suggestedRefactoringOp: "separate_responsibilities",
        });
      }
    }

    // 6. Circular Dependency Detection
    const circularDependencies = this.detectCircularDependencies(relationships, symbols);
    for (const circ of circularDependencies) {
      findings.push({
        id: `cq_circ_${circ.id}`,
        title: `Circular Dependency Detected: ${circ.description}`,
        category: "circular_dependency",
        categoryLabel: "Circular Dependency",
        severity: circ.severity,
        filePath: circ.cycle[0],
        detectionMethod: "dependency_cycle_analysis",
        isVerifiedMetric: true,
        metricValue: `${circ.edgeCount} Edges in Loop`,
        threshold: "0 Loops",
        supportingEvidence: [
          `Cycle path: ${circ.cycle.join(" -> ")}.`,
          "Direct mutually dependent call or import loop detected in architecture graph.",
        ],
        impactRationale:
          "Circular dependencies prevent clean module trees, complicate bundler tree-shaking, and can trigger runtime `undefined` imported symbol issues during initialization.",
        suggestedAction: circ.suggestedDecoupling,
        suggestedRefactoringOp: "separate_responsibilities",
      });
    }

    // 7. Check for Missing Error Handling
    for (const file of files) {
      const lines = file.content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (line.includes("fetch(") && !file.content.includes("try") && !file.content.includes(".catch(")) {
          findings.push({
            id: `cq_err_${file.id}_${idx}`,
            title: `Unhandled Network Request in ${file.name} (Line ${idx + 1})`,
            category: "missing_error_handling",
            categoryLabel: "Missing Error Handling",
            severity: "critical",
            filePath: file.path,
            lineRange: { start: idx + 1, end: idx + 1 },
            detectionMethod: "static_pattern",
            isVerifiedMetric: false,
            supportingEvidence: [
              `Network fetch invocation at line ${idx + 1} has no enclosing try/catch or .catch() handler.`,
            ],
            impactRationale:
              "Network failures, DNS drops, or 5xx gateway errors will throw uncaught rejected promises and crash the caller.",
            suggestedAction:
              "Wrap network request in a typed try/catch block with explicit error propagation.",
            suggestedRefactoringOp: "improve_error_handling",
          });
        }
      });
    }

    // Count findings by severity
    const critCount = findings.filter((f) => f.severity === "critical").length;
    const warnCount = findings.filter((f) => f.severity === "warning").length;
    const infoCount = findings.filter((f) => f.severity === "info").length;

    // Technical Debt Score Formula:
    // compositeScore = 100 - (critical * 12 + warning * 5 + info * 1.5 + circular_cycles * 10)
    // Clipped to [0, 100]
    const rawPenalty =
      critCount * 12 +
      warnCount * 5 +
      infoCount * 1.5 +
      circularDependencies.length * 10;
    const compositeScore = Math.max(0, Math.min(100, Math.round(100 - rawPenalty)));

    let debtRating: "A" | "B" | "C" | "D" | "F" = "A";
    if (compositeScore >= 90) debtRating = "A";
    else if (compositeScore >= 80) debtRating = "B";
    else if (compositeScore >= 70) debtRating = "C";
    else if (compositeScore >= 60) debtRating = "D";
    else debtRating = "F";

    const scoreFormula =
      "compositeScore = Math.max(0, Math.min(100, Math.round(100 - (critical * 12 + warning * 5 + info * 1.5 + circular_cycles * 10))))";

    let isStale = false;
    if (revision && repo.lastAnalyzed && revision !== repo.lastAnalyzed) {
      isStale = true;
    }

    return {
      repositoryId,
      repositoryName: `${repo.owner}/${repo.name}`,
      revision: revision || repo.lastAnalyzed || repo.defaultBranch,
      compositeScore,
      debtRating,
      scoreFormula,
      findingsCount: {
        critical: critCount,
        warning: warnCount,
        info: infoCount,
        total: findings.length,
      },
      hotspots: hotspots.sort((a, b) => b.complexityScore - a.complexityScore),
      couplingMetrics: couplingMetrics.sort((a, b) => b.fanOut - a.fanOut),
      circularDependencies,
      duplicateCandidates,
      findings,
      isStale,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Cycle detection algorithm using Depth-First Search on repository symbol relationships.
   */
  private detectCircularDependencies(
    relationships: DbCodeRelationship[],
    symbols: DbCodeSymbol[]
  ): CircularDependencyFinding[] {
    const adj: Record<string, Set<string>> = {};

    for (const rel of relationships) {
      const fromSym = symbols.find((s) => s.id === rel.fromSymbolId);
      const toSym = symbols.find((s) => s.id === rel.toSymbolId);
      if (fromSym && toSym && fromSym.filePath !== toSym.filePath) {
        if (!adj[fromSym.filePath]) adj[fromSym.filePath] = new Set();
        adj[fromSym.filePath].add(toSym.filePath);
      }
    }

    const visited: Record<string, boolean> = {};
    const recStack: Record<string, boolean> = {};
    const cycles: CircularDependencyFinding[] = [];

    const dfs = (node: string, path: string[]) => {
      visited[node] = true;
      recStack[node] = true;
      path.push(node);

      const neighbors = adj[node] ? Array.from(adj[node]) : [];
      for (const neighbor of neighbors) {
        if (!visited[neighbor]) {
          dfs(neighbor, [...path]);
        } else if (recStack[neighbor]) {
          // Found cycle
          const cyclePath = [...path, neighbor];
          const cycleKey = cyclePath.slice().sort().join("|");
          if (!cycles.some((c) => c.cycle.slice().sort().join("|") === cycleKey)) {
            cycles.push({
              id: `circ_${cycles.length + 1}`,
              cycle: cyclePath,
              description: cyclePath.map((p) => p.split("/").pop()).join(" ⇄ "),
              edgeCount: cyclePath.length - 1,
              severity: "critical",
              suggestedDecoupling: `Decouple ${node} and ${neighbor} by extracting shared contracts or event emitters into a third module.`,
            });
          }
        }
      }

      recStack[node] = false;
    };

    for (const node of Object.keys(adj)) {
      if (!visited[node]) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  analyzeRepositoryDebt(
    repositoryId: string = "sample-project",
    revision?: string
  ): TechnicalDebtOverview {
    return this.analyzeRepository(repositoryId, revision);
  }
}

export const codeQualityEngine = new CodeQualityEngine();
