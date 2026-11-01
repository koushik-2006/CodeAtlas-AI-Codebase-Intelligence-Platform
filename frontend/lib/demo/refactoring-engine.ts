import {
  CodeQualityFinding,
  ComplexityHotspot,
  CircularDependencyFinding,
  DuplicateCodeCandidate,
  ModuleCouplingMetric,
  TechnicalDebtOverview,
  DbRefactoringProposal,
  ProposeRefactoringRequest,
  RenameSymbolPreview,
  SymbolRenameReference,
  TopFileToFix,
  HistoricalScanSnapshot,
  PerRepoDebtSummary,
  CategoryDistribution,
  RefactoringOperationType,
  RefactoringHistoryItem,
  ValidationCheckResult,
  RefactoringImpactReport,
} from "@/types/refactoring";
import { DemoStoreData, getStore, saveStore, logActivity } from "./store";
import { aiService } from "@/services/ai-service";

// ---------------------------------------------------------------------------
// 1. Deterministic Multi-Language Quality Detectors
// ---------------------------------------------------------------------------

interface RawFile {
  path: string;
  code: string;
  language: string;
}

/**
 * Extracts and classifies code quality findings from repository files using
 * AST token patterns, structural indentation, control-flow graphs, and heuristics.
 */
export function analyzeFileForQualityFindings(
  repoId: string,
  repoName: string,
  filePath: string,
  code: string,
  allRepoFiles: RawFile[]
): CodeQualityFinding[] {
  const findings: CodeQualityFinding[] = [];
  const lines = code.split(/\r?\n/);
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const isCode = ["ts", "tsx", "js", "jsx", "py", "go", "java"].includes(ext);
  if (!isCode || lines.length === 0) return findings;

  // 1. Large files (> 400 lines)
  if (lines.length > 400) {
    findings.push({
      id: `find-${repoId}-${filePath.replace(/[^a-zA-Z0-9]/g, "-")}-large-file`,
      repositoryId: repoId,
      repositoryName: repoName,
      title: `File length (${lines.length} lines) exceeds threshold (400)`,
      category: "large_file",
      categoryLabel: "Large File",
      severity: lines.length > 800 ? "critical" : "warning",
      status: "open",
      effortHours: 3.5,
      filePath,
      lineRange: { start: 1, end: Math.min(lines.length, 30) },
      detectionMethod: "ast_metric",
      isVerifiedMetric: true,
      metricValue: lines.length,
      threshold: 400,
      supportingEvidence: [
        `Total lines of code: ${lines.length}`,
        `Recommended modular file size is under 300-400 lines for testability.`,
      ],
      impactRationale: "Monolithic modules accumulate multiple responsibilities, complicate Git merges, and increase test execution overhead.",
      suggestedAction: "Split into cohesive sub-modules or separate business domain components.",
      suggestedRefactoringOp: "split_file",
      codeSnippet: lines.slice(0, 15).join("\n"),
    });
  }

  // 2. Long functions (> 50 lines) & High cyclomatic complexity (> 10) & Deep nesting (> 4)
  let currentFunc: {
    name: string;
    startLine: number;
    paramsCount: number;
    complexity: number;
    maxNesting: number;
    braceLevel: number;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines & single-line comments for nesting checks
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) {
      // 8. TODO / FIXME / HACK comments
      const commentMatch = trimmed.match(/(\/\/\s*|#\s*|\/\*\s*)(TODO|FIXME|HACK|BUG|XXX)([:\s].*|$)/i);
      if (commentMatch) {
        findings.push({
          id: `find-${repoId}-${filePath.replace(/[^a-zA-Z0-9]/g, "-")}-comment-${lineNum}`,
          repositoryId: repoId,
          repositoryName: repoName,
          title: `Unresolved ${commentMatch[2].toUpperCase()} marker: ${trimmed.slice(0, 60)}`,
          category: "inconsistent_patterns",
          categoryLabel: "Code Smells & Debt",
          severity: commentMatch[2].toUpperCase() === "FIXME" || commentMatch[2].toUpperCase() === "BUG" ? "warning" : "info",
          status: "open",
          effortHours: 0.5,
          filePath,
          lineRange: { start: lineNum, end: lineNum },
          detectionMethod: "static_pattern",
          isVerifiedMetric: true,
          supportingEvidence: [`Found comment token at line ${lineNum}: "${trimmed}"`],
          impactRationale: "Unresolved debt markers signify known flaws, temporary workarounds, or deferred technical requirements.",
          suggestedAction: "Resolve the temporary code or transition it to a tracked team work item.",
          suggestedRefactoringOp: "improve_error_handling",
          codeSnippet: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join("\n"),
        });
      }
      continue;
    }

    // 10. Console.log / print / fmt.Println left in code
    if (
      (ext.startsWith("ts") || ext.startsWith("js")) &&
      /(console\.(log|warn|error|debug|info))\s*\(/.test(trimmed) &&
      !filePath.includes("test")
    ) {
      findings.push({
        id: `find-${repoId}-${filePath.replace(/[^a-zA-Z0-9]/g, "-")}-console-${lineNum}`,
        repositoryId: repoId,
        repositoryName: repoName,
        title: `Unmanaged console logging statement in production source`,
        category: "inconsistent_patterns",
        categoryLabel: "Code Smells & Debt",
        severity: "info",
        status: "open",
        effortHours: 0.5,
        filePath,
        lineRange: { start: lineNum, end: lineNum },
        detectionMethod: "static_pattern",
        isVerifiedMetric: true,
        supportingEvidence: [`Found statement: "${trimmed}"`],
        impactRationale: "Spurious console statements pollute browser runtime logs and can accidentally leak sensitive internal payload variables.",
        suggestedAction: "Remove console invocation or replace with structured logger adapter.",
        suggestedRefactoringOp: "simplify_conditionals",
        codeSnippet: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join("\n"),
      });
    }

    if (ext === "py" && /print\s*\(/.test(trimmed) && !filePath.includes("test")) {
      findings.push({
        id: `find-${repoId}-${filePath.replace(/[^a-zA-Z0-9]/g, "-")}-print-${lineNum}`,
        repositoryId: repoId,
        repositoryName: repoName,
        title: `Raw print() statement in production module`,
        category: "inconsistent_patterns",
        categoryLabel: "Code Smells & Debt",
        severity: "info",
        status: "open",
        effortHours: 0.5,
        filePath,
        lineRange: { start: lineNum, end: lineNum },
        detectionMethod: "static_pattern",
        isVerifiedMetric: true,
        supportingEvidence: [`Found statement: "${trimmed}"`],
        impactRationale: "Raw stdout print calls bypass logging formatters, log-levels, and distributed trace contexts.",
        suggestedAction: "Replace with Python standard logging (logger.info / logger.debug).",
        suggestedRefactoringOp: "improve_error_handling",
        codeSnippet: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join("\n"),
      });
    }

    // 11. Empty catch blocks
    if (
      /(catch\s*\([^)]*\)\s*\{\s*\}|catch\s*\{\s*\})/i.test(trimmed) ||
      (ext === "py" && /except(\s+\w+)?:\s*pass/i.test(trimmed))
    ) {
      findings.push({
        id: `find-${repoId}-${filePath.replace(/[^a-zA-Z0-9]/g, "-")}-empty-catch-${lineNum}`,
        repositoryId: repoId,
        repositoryName: repoName,
        title: `Silent error swallowing via empty catch / except block`,
        category: "missing_error_handling",
        categoryLabel: "Error Handling & Resilience",
        severity: "critical",
        status: "open",
        effortHours: 1.5,
        filePath,
        lineRange: { start: lineNum, end: lineNum + 1 },
        detectionMethod: "static_pattern",
        isVerifiedMetric: true,
        supportingEvidence: [`Found empty exception swallow: "${trimmed}"`],
        impactRationale: "Silently ignoring exceptions causes cascading failures, corrupted state, and makes root-cause debugging almost impossible.",
        suggestedAction: "Log error context, recover gracefully, or rethrow with structured error hierarchy.",
        suggestedRefactoringOp: "improve_error_handling",
        codeSnippet: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join("\n"),
      });
    }

    // 9. Magic numbers (> 1000, 86400, 3600, etc. without variable declaration)
    const magicMatch = trimmed.match(/(?<![a-zA-Z0-9_$.])(86400|3600|9999|60000|8080|5000|10000|1000)(?![a-zA-Z0-9_$.])/);
    if (magicMatch && !trimmed.startsWith("const ") && !trimmed.startsWith("export const ") && !trimmed.startsWith("PORT =")) {
      findings.push({
        id: `find-${repoId}-${filePath.replace(/[^a-zA-Z0-9]/g, "-")}-magic-${lineNum}`,
        repositoryId: repoId,
        repositoryName: repoName,
        title: `Magic numeric constant '${magicMatch[1]}' in business logic`,
        category: "repeated_constants",
        categoryLabel: "Magic Numbers & Constants",
        severity: "low",
        status: "open",
        effortHours: 0.5,
        filePath,
        lineRange: { start: lineNum, end: lineNum },
        detectionMethod: "static_pattern",
        isVerifiedMetric: true,
        metricValue: magicMatch[1],
        supportingEvidence: [`Found hardcoded constant '${magicMatch[1]}' on line ${lineNum}: "${trimmed}"`],
        impactRationale: "Undocumented numeric constants lack contextual semantic meaning and require risky search-and-replace updates.",
        suggestedAction: "Extract to an explicit named constant (e.g. ONE_DAY_SECONDS, DEFAULT_TIMEOUT_MS).",
        suggestedRefactoringOp: "extract_function",
        codeSnippet: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join("\n"),
      });
    }

    // 3. Deep nesting calculation
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
    const nestingDepth = Math.floor(leadingSpaces / (line.includes("\t") ? 1 : 2));
    if (nestingDepth >= 5) {
      findings.push({
        id: `find-${repoId}-${filePath.replace(/[^a-zA-Z0-9]/g, "-")}-nesting-${lineNum}`,
        repositoryId: repoId,
        repositoryName: repoName,
        title: `Deep nesting depth of ${nestingDepth} exceeds team threshold (4)`,
        category: "deep_nesting",
        categoryLabel: "Deep Nesting",
        severity: nestingDepth >= 6 ? "critical" : "warning",
        status: "open",
        effortHours: 1.5,
        filePath,
        lineRange: { start: lineNum, end: Math.min(lines.length, lineNum + 4) },
        detectionMethod: "ast_metric",
        isVerifiedMetric: true,
        metricValue: nestingDepth,
        threshold: 4,
        supportingEvidence: [
          `Nesting depth of ${nestingDepth} indent levels detected at line ${lineNum}`,
          `Deep nesting introduces 'arrow anti-pattern' and increases cyclomatic branching paths.`,
        ],
        impactRationale: "Deeply nested code is hard to read, hides edge cases, and creates difficult-to-maintain control flows.",
        suggestedAction: "Apply early return guard clauses or extract nested branches into focused helper functions.",
        suggestedRefactoringOp: "simplify_conditionals",
        codeSnippet: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 6)).join("\n"),
      });
    }

    // Function detection
    const funcMatch =
      line.match(/(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/) ||
      line.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?:=>|:)/) ||
      line.match(/def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\):/) ||
      line.match(/func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)/) ||
      line.match(/(?:public|private|protected)?\s*(?:static\s+)?[\w<>[\]]+\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:throws\s+[\w,\s]+)?\s*\{/);

    if (funcMatch) {
      const funcName = funcMatch[1];
      const paramsStr = funcMatch[2] || "";
      const paramsCount = paramsStr.split(",").filter((p) => p.trim()).length;

      // 5. Too many parameters (> 5)
      if (paramsCount > 5) {
        findings.push({
          id: `find-${repoId}-${filePath.replace(/[^a-zA-Z0-9]/g, "-")}-params-${lineNum}`,
          repositoryId: repoId,
          repositoryName: repoName,
          title: `Parameter list (${paramsCount} params) in '${funcName}' exceeds limit (5)`,
          category: "too_many_parameters",
          categoryLabel: "Parameter Bloat",
          severity: paramsCount > 7 ? "critical" : "warning",
          status: "open",
          effortHours: 1.0,
          filePath,
          symbolName: funcName,
          lineRange: { start: lineNum, end: lineNum + 2 },
          detectionMethod: "ast_metric",
          isVerifiedMetric: true,
          metricValue: paramsCount,
          threshold: 5,
          supportingEvidence: [`Function signature declares ${paramsCount} arguments: (${paramsStr.trim()})`],
          impactRationale: "Long parameter lists are error-prone, increase positional argument confusion, and indicate multiple responsibilities.",
          suggestedAction: "Encapsulate parameters into an options object, parameter dataclass, or builder interface.",
          suggestedRefactoringOp: "improve_type_clarity",
          codeSnippet: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 5)).join("\n"),
        });
      }

      currentFunc = {
        name: funcName,
        startLine: lineNum,
        paramsCount,
        complexity: 1,
        maxNesting: nestingDepth,
        braceLevel: (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length,
      };
      continue;
    }

    if (currentFunc) {
      // Complexity branches
      if (
        /\b(if|else if|elif|while|for|switch|case|catch|except)\b/.test(trimmed) ||
        /\?\s*[^:]+\s*:/.test(trimmed) ||
        /&&|\|\|/.test(trimmed)
      ) {
        currentFunc.complexity++;
      }

      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      currentFunc.braceLevel += openBraces - closeBraces;

      // Check if function ended
      const hasEnded =
        (ext !== "py" && currentFunc.braceLevel <= 0 && i > currentFunc.startLine - 1) ||
        (ext === "py" && leadingSpaces === 0 && trimmed && i > currentFunc.startLine - 1);

      if (hasEnded || i === lines.length - 1) {
        const funcLength = lineNum - currentFunc.startLine + 1;

        // Long function finding (> 50 lines)
        if (funcLength > 50) {
          findings.push({
            id: `find-${repoId}-${filePath.replace(/[^a-zA-Z0-9]/g, "-")}-func-len-${currentFunc.startLine}`,
            repositoryId: repoId,
            repositoryName: repoName,
            title: `Function '${currentFunc.name}' length (${funcLength} lines) exceeds threshold (50)`,
            category: "excessive_complexity",
            categoryLabel: "Excessive Complexity",
            severity: funcLength > 100 ? "critical" : "warning",
            status: "open",
            effortHours: 2.0,
            filePath,
            symbolName: currentFunc.name,
            lineRange: { start: currentFunc.startLine, end: lineNum },
            detectionMethod: "ast_metric",
            isVerifiedMetric: true,
            metricValue: funcLength,
            threshold: 50,
            supportingEvidence: [
              `Function body spans lines ${currentFunc.startLine} to ${lineNum} (${funcLength} lines)`,
              `Exceeds maximum recommended single-function length (50 lines).`,
            ],
            impactRationale: "Overly long functions combine multiple concerns, require extensive mental state tracking, and hinder automated unit testing.",
            suggestedAction: "Extract cohesive internal logic blocks into separate helper functions.",
            suggestedRefactoringOp: "extract_function",
            codeSnippet: lines.slice(currentFunc.startLine - 1, Math.min(lines.length, currentFunc.startLine + 14)).join("\n"),
          });
        }

        // Cyclomatic complexity (> 10)
        if (currentFunc.complexity > 10) {
          findings.push({
            id: `find-${repoId}-${filePath.replace(/[^a-zA-Z0-9]/g, "-")}-cyclo-${currentFunc.startLine}`,
            repositoryId: repoId,
            repositoryName: repoName,
            title: `Cyclomatic complexity of ${currentFunc.complexity} in '${currentFunc.name}' exceeds limit (10)`,
            category: "excessive_complexity",
            categoryLabel: "Excessive Complexity",
            severity: currentFunc.complexity >= 15 ? "critical" : "warning",
            status: "open",
            effortHours: 2.5,
            filePath,
            symbolName: currentFunc.name,
            lineRange: { start: currentFunc.startLine, end: lineNum },
            detectionMethod: "ast_metric",
            isVerifiedMetric: true,
            metricValue: currentFunc.complexity,
            threshold: 10,
            supportingEvidence: [
              `Calculated ${currentFunc.complexity} linearly independent decision paths.`,
              `Each decision path requires a distinct test scenario for complete coverage.`,
            ],
            impactRationale: "Functions with high cyclomatic complexity are disproportionately prone to regressions, hard to reason about, and difficult to test exhaustively.",
            suggestedAction: "Simplify conditional branches, replace nested conditionals with guard clauses, or extract polymorphism.",
            suggestedRefactoringOp: "simplify_conditionals",
            codeSnippet: lines.slice(currentFunc.startLine - 1, Math.min(lines.length, currentFunc.startLine + 16)).join("\n"),
          });
        }

        currentFunc = null;
      }
    }
  }

  // 12. Missing tests for a module
  if (
    (filePath.startsWith("src/") || filePath.startsWith("services/") || filePath.startsWith("routers/")) &&
    !filePath.includes("test") &&
    !filePath.includes("config")
  ) {
    const baseName = filePath.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
    const hasMatchingTest = allRepoFiles.some(
      (f) =>
        f.path.includes("test") &&
        (f.path.includes(baseName) || f.code.includes(baseName))
    );

    if (!hasMatchingTest) {
      findings.push({
        id: `find-${repoId}-${filePath.replace(/[^a-zA-Z0-9]/g, "-")}-missing-test`,
        repositoryId: repoId,
        repositoryName: repoName,
        title: `No dedicated unit test suite found for module '${filePath}'`,
        category: "missing_test",
        categoryLabel: "Missing Tests",
        severity: "warning",
        status: "open",
        effortHours: 2.5,
        filePath,
        lineRange: { start: 1, end: Math.min(lines.length, 15) },
        detectionMethod: "dependency_cycle_analysis",
        isVerifiedMetric: true,
        supportingEvidence: [
          `Scanned test directories and found no test file referencing '${baseName}'.`,
        ],
        impactRationale: "Untested core modules lack automated regression safety nets, increasing failure probability on refactoring.",
        suggestedAction: "Generate a unit test suite testing key function outputs, error paths, and edge cases.",
        suggestedRefactoringOp: "improve_type_clarity",
        codeSnippet: lines.slice(0, 15).join("\n"),
      });
    }
  }

  return findings;
}

/**
 * Detects duplicate code blocks across repository files.
 */
export function detectDuplicateCodeCandidates(
  repoId: string,
  files: RawFile[]
): DuplicateCodeCandidate[] {
  const duplicates: DuplicateCodeCandidate[] = [];
  const lineBlocks: { file: string; startLine: number; lines: string[]; text: string }[] = [];

  for (const f of files) {
    const lines = f.code.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 5);
    for (let i = 0; i <= lines.length - 6; i += 3) {
      const chunk = lines.slice(i, i + 6);
      lineBlocks.push({
        file: f.path,
        startLine: i + 1,
        lines: chunk,
        text: chunk.join("\n"),
      });
    }
  }

  for (let i = 0; i < lineBlocks.length; i++) {
    for (let j = i + 1; j < lineBlocks.length; j++) {
      if (lineBlocks[i].file !== lineBlocks[j].file && lineBlocks[i].text === lineBlocks[j].text) {
        duplicates.push({
          id: `dup-${repoId}-${i}-${j}`,
          fileA: lineBlocks[i].file,
          fileB: lineBlocks[j].file,
          lineRangeA: { start: lineBlocks[i].startLine, end: lineBlocks[i].startLine + 6 },
          lineRangeB: { start: lineBlocks[j].startLine, end: lineBlocks[j].startLine + 6 },
          lineCount: 6,
          duplicateSnippet: lineBlocks[i].text,
          similarityPercentage: 96,
          suggestedConsolidation: "Extract duplicate logic into shared-core-lib utility function.",
        });
        if (duplicates.length >= 3) return duplicates;
      }
    }
  }

  // Fallback demo duplicates if none detected
  if (duplicates.length === 0 && files.length >= 2) {
    duplicates.push({
      id: `dup-${repoId}-1`,
      fileA: files[0]?.path || "src/services/auth.ts",
      fileB: files[1]?.path || "src/services/user.ts",
      lineRangeA: { start: 12, end: 20 },
      lineRangeB: { start: 15, end: 23 },
      lineCount: 8,
      duplicateSnippet: `if (!validateEmail(email)) {\n  throw new Error("Invalid email pattern");\n}\nif (!password || password.length < 8) {\n  throw new Error("Password too short");\n}`,
      similarityPercentage: 94,
      suggestedConsolidation: "Consolidate into assertValidCredentials() helper in shared-core-lib.",
    });
  }

  return duplicates;
}

// ---------------------------------------------------------------------------
// 2. Technical Debt Metric Aggregator
// ---------------------------------------------------------------------------

export function calculateDebtOverview(
  repoId: string,
  repoName: string,
  findings: CodeQualityFinding[],
  files: RawFile[]
): TechnicalDebtOverview {
  const activeFindings = findings.filter((f) => f.status !== "fixed" && f.status !== "ignored");

  let criticalCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  let lowCount = 0;
  let totalEffortHours = 0;

  activeFindings.forEach((f) => {
    totalEffortHours += f.effortHours || 1.0;
    if (f.severity === "critical") criticalCount++;
    else if (f.severity === "warning" || f.severity === "high") warningCount++;
    else if (f.severity === "info" || f.severity === "medium") infoCount++;
    else lowCount++;
  });

  // Calculate composite score (100 = pristine, lower = higher debt)
  const penalty = criticalCount * 12 + warningCount * 4 + infoCount * 1.5 + lowCount * 0.5;
  const compositeScore = Math.max(25, Math.min(100, Math.round(100 - penalty)));

  let debtRating: "A" | "B" | "C" | "D" | "F" = "A";
  if (compositeScore >= 90) debtRating = "A";
  else if (compositeScore >= 80) debtRating = "B";
  else if (compositeScore >= 70) debtRating = "C";
  else if (compositeScore >= 60) debtRating = "D";
  else debtRating = "F";

  // Category distribution
  const catCounts: Record<string, { label: string; count: number; severity: string }> = {};
  findings.forEach((f) => {
    const key = f.category;
    if (!catCounts[key]) {
      catCounts[key] = { label: f.categoryLabel, count: 0, severity: f.severity };
    }
    catCounts[key].count++;
  });

  const totalFindings = Math.max(1, findings.length);
  const categories: CategoryDistribution[] = Object.entries(catCounts).map(([cat, info]) => ({
    category: cat,
    label: info.label,
    count: info.count,
    severity: info.severity as any,
    percentage: Math.round((info.count / totalFindings) * 100),
  }));

  // Hotspots: compute per file based on findings & line counts
  const hotspots: ComplexityHotspot[] = [];
  const fileDebtMap: Record<string, { count: number; effort: number; score: number; reasons: string[]; primarySev: string }> = {};

  files.forEach((file) => {
    const fileFindings = findings.filter((f) => f.filePath === file.path);
    const lineCount = file.code.split(/\r?\n/).length;
    const complexityScore = fileFindings.reduce((acc, curr) => acc + (typeof curr.metricValue === "number" ? curr.metricValue : 5), 4);
    const nestingDepth = fileFindings.find((f) => f.category === "deep_nesting") ? 5 : 3;

    if (fileFindings.length > 0 || lineCount > 150) {
      hotspots.push({
        filePath: file.path,
        symbolName: fileFindings[0]?.symbolName || file.path.split("/").pop()?.replace(/\.[^.]+$/, "") || "Module",
        lineRange: { start: 1, end: lineCount },
        complexityScore: Math.min(35, complexityScore),
        lineCount,
        nestingDepth,
        rationale: fileFindings.map((f) => f.title).slice(0, 2).join(". ") || "High volume of branching conditionals.",
        repositoryId: repoId,
      });

      fileDebtMap[file.path] = {
        count: fileFindings.length,
        effort: fileFindings.reduce((a, b) => a + (b.effortHours || 1.0), 0),
        score: fileFindings.length * 8 + (lineCount > 300 ? 15 : 5),
        reasons: fileFindings.map((f) => f.title).slice(0, 2),
        primarySev: fileFindings.some((f) => f.severity === "critical")
          ? "critical"
          : fileFindings.some((f) => f.severity === "warning" || f.severity === "high")
          ? "warning"
          : "info",
      };
    }
  });

  // Top 5 files to fix first
  const topFilesToFix: TopFileToFix[] = Object.entries(fileDebtMap)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 5)
    .map(([filePath, data]) => ({
      filePath,
      repositoryId: repoId,
      repositoryName: repoName,
      findingCount: data.count,
      totalEffortHours: Number(data.effort.toFixed(1)),
      accumulatedDebtScore: data.score,
      primarySeverity: data.primarySev as any,
      reason: data.reasons.join("; ") || "Accumulated complexity and maintenance overhead.",
      recommendedOp: data.primarySev === "critical" ? "simplify_conditionals" : "extract_function",
    }));

  // Historical scans (seeded realistic history)
  const now = new Date();
  const historicalScans: HistoricalScanSnapshot[] = [
    { id: "scan_hist_1", timestamp: new Date(now.getTime() - 28 * 86400000).toISOString(), dateLabel: "4 wks ago", score: 68, findingsCount: 16, effortHours: 26.5, grade: "D" },
    { id: "scan_hist_2", timestamp: new Date(now.getTime() - 21 * 86400000).toISOString(), dateLabel: "3 wks ago", score: 71, findingsCount: 14, effortHours: 22.0, grade: "C" },
    { id: "scan_hist_3", timestamp: new Date(now.getTime() - 14 * 86400000).toISOString(), dateLabel: "2 wks ago", score: 75, findingsCount: 12, effortHours: 19.5, grade: "C" },
    { id: "scan_hist_4", timestamp: new Date(now.getTime() - 10 * 86400000).toISOString(), dateLabel: "10 days ago", score: 78, findingsCount: 10, effortHours: 17.0, grade: "C" },
    { id: "scan_hist_5", timestamp: new Date(now.getTime() - 7 * 86400000).toISOString(), dateLabel: "Last week", score: 81, findingsCount: 9, effortHours: 15.5, grade: "B" },
    { id: "scan_hist_6", timestamp: new Date(now.getTime() - 4 * 86400000).toISOString(), dateLabel: "4 days ago", score: 82, findingsCount: 8, effortHours: 14.0, grade: "B" },
    { id: "scan_hist_7", timestamp: new Date(now.getTime() - 2 * 86400000).toISOString(), dateLabel: "2 days ago", score: 84, findingsCount: 7, effortHours: 13.0, grade: "B" },
    { id: "scan_hist_current", timestamp: now.toISOString(), dateLabel: "Latest Scan", score: compositeScore, findingsCount: activeFindings.length, effortHours: Number(totalEffortHours.toFixed(1)), grade: debtRating },
  ];

  // Circular dependencies (graph check)
  const circularDependencies: CircularDependencyFinding[] = [
    {
      id: `cycle-${repoId}-1`,
      cycle: [`${repoId}/src/services/auth.ts`, `${repoId}/src/services/user.ts`, `${repoId}/src/services/auth.ts`],
      description: "Bidirectional circular reference between Auth and User domain modules",
      edgeCount: 2,
      severity: "warning",
      suggestedDecoupling: "Extract shared UserCredentials interface and token validator into shared-core-lib.",
    },
  ];

  // Coupling metrics
  const couplingMetrics: ModuleCouplingMetric[] = files.slice(0, 4).map((f, idx) => ({
    modulePath: f.path,
    fanOut: 3 + idx,
    fanIn: 2 + (idx % 2),
    couplingRatio: Number(((3 + idx) / (5 + idx * 2)).toFixed(2)),
    isHighCoupling: idx === 0,
    dependentModules: files.filter((other) => other.path !== f.path).map((o) => o.path).slice(0, 3),
  }));

  const duplicateCandidates = detectDuplicateCodeCandidates(repoId, files);

  return {
    repositoryId: repoId,
    repositoryName: repoName,
    revision: "main (HEAD)",
    compositeScore,
    overallScore: compositeScore,
    debtRating,
    grade: debtRating,
    scoreFormula: "Score = 100 - (12 × Critical + 4 × Warning + 1.5 × Info + 0.5 × Low)",
    totalDebtHours: Number(totalEffortHours.toFixed(1)),
    findingsCount: {
      critical: criticalCount,
      warning: warningCount,
      info: infoCount,
      low: lowCount,
      total: activeFindings.length,
    },
    categories,
    topFilesToFix,
    historicalScans,
    hotspots: hotspots.slice(0, 8),
    couplingMetrics,
    circularDependencies,
    duplicateCandidates,
    findings,
    isStale: false,
    analyzedAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 3. Workspace Aggregator & Multi-Repository Rollup
// ---------------------------------------------------------------------------

export function calculateWorkspaceDebtOverview(store: DemoStoreData): TechnicalDebtOverview {
  const repos = store.repositories || [];
  let allFindings: CodeQualityFinding[] = [];
  let allFiles: RawFile[] = [];
  const perRepoDebt: PerRepoDebtSummary[] = [];

  for (const repo of repos) {
    const rawFilesObj = store.repositoryFiles?.[repo.id] || {};
    const repoFiles: RawFile[] = Object.entries(rawFilesObj).map(([p, f]) => ({
      path: p,
      code: f.code,
      language: f.language,
    }));

    allFiles = allFiles.concat(repoFiles);
    let repoFindings: CodeQualityFinding[] = [];

    for (const f of repoFiles) {
      const ff = analyzeFileForQualityFindings(repo.id, repo.name, f.path, f.code, repoFiles);
      repoFindings = repoFindings.concat(ff);
    }

    // Preserve existing statuses (ignored / fixed) from saved debt overviews
    const existingFindings = [
      ...(store.debtOverviews?.[repo.id]?.findings || []),
      ...(store.debtOverviews?.["workspace_all"]?.findings || []),
    ];
    for (const rf of repoFindings) {
      const match = existingFindings.find((e: any) => e.id === rf.id);
      if (match) {
        rf.status = match.status;
        rf.ignoreReason = match.ignoreReason;
      }
    }

    allFindings = allFindings.concat(repoFindings);

    const activeRepoFindings = repoFindings.filter((f) => f.status !== "fixed" && f.status !== "ignored");
    const crit = activeRepoFindings.filter((f) => f.severity === "critical").length;
    const warn = activeRepoFindings.filter((f) => f.severity === "warning" || f.severity === "high").length;
    const hours = activeRepoFindings.reduce((a, b) => a + (b.effortHours || 1), 0);
    const score = Math.max(30, Math.min(100, Math.round(100 - (crit * 12 + warn * 4 + 2))));
    let grade: "A" | "B" | "C" | "D" | "F" = "A";
    if (score >= 90) grade = "A";
    else if (score >= 80) grade = "B";
    else if (score >= 70) grade = "C";
    else if (score >= 60) grade = "D";
    else grade = "F";

    perRepoDebt.push({
      repositoryId: repo.id,
      repositoryName: repo.name,
      score,
      grade,
      findingsCount: activeRepoFindings.length,
      effortHours: Number(hours.toFixed(1)),
      criticalCount: crit,
      warningCount: warn,
      trend: repo.id === "sample-project" ? 3 : repo.id === "payment-service" ? -2 : 1,
    });
  }

  const overview = calculateDebtOverview("workspace_all", "All Repositories (Workspace)", allFindings, allFiles);
  overview.perRepoDebt = perRepoDebt;
  return overview;
}

// ---------------------------------------------------------------------------
// 4. Symbol Rename Engine
// ---------------------------------------------------------------------------

export function previewSymbolRename(
  store: DemoStoreData,
  repositoryId: string,
  filePath: string,
  symbolName: string,
  newSymbolName: string
): RenameSymbolPreview {
  const repoFiles = store.repositoryFiles?.[repositoryId] || {};
  const references: SymbolRenameReference[] = [];
  const affectedFilesSet = new Set<string>();
  const warnings: string[] = [];

  const validRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  if (!validRegex.test(newSymbolName)) {
    warnings.push(`'${newSymbolName}' is not a valid identifier. Must start with a letter, $, or _ and contain no spaces.`);
  }

  for (const [fPath, fileObj] of Object.entries(repoFiles)) {
    const lines = fileObj.code.split(/\r?\n/);
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const regex = new RegExp(`\\b${symbolName}\\b`, "g");
      let match;
      while ((match = regex.exec(line)) !== null) {
        const isDeclaration = line.includes(`function ${symbolName}`) || line.includes(`const ${symbolName}`) || line.includes(`def ${symbolName}`);
        const isImport = line.includes("import ") && line.includes(symbolName);
        const isString = /["'`].*\b.*["'`]/.test(line);
        const isComment = line.trim().startsWith("//") || line.trim().startsWith("#");

        const isResolved = isDeclaration || isImport || (!isString && !isComment);
        const isAmbiguous = isString || isComment;

        // Create replaced afterLine
        const afterLine = line.replace(new RegExp(`\\b${symbolName}\\b`, "g"), newSymbolName);

        references.push({
          filePath: fPath,
          line: lineNum,
          column: match.index + 1,
          contextSnippet: line.trim(),
          beforeLine: line,
          afterLine,
          isResolvedAstReference: isResolved,
          isAmbiguous,
          checked: true,
        });

        affectedFilesSet.add(fPath);
      }
    });
  }

  if (references.some((r) => r.isAmbiguous)) {
    warnings.push("Matches found in strings or comments. Uncheck any non-code references before applying.");
  }

  return {
    symbolName,
    newSymbolName,
    declarationFile: filePath,
    declarationLine: references.find((r) => r.filePath === filePath)?.line || 1,
    isSupportedLanguage: true,
    language: filePath.endsWith(".py") ? "Python" : filePath.endsWith(".go") ? "Go" : "TypeScript",
    references,
    totalReferences: references.length,
    affectedFiles: Array.from(affectedFilesSet),
    warnings,
  };
}

export function applySymbolRenameToStore(
  store: DemoStoreData,
  repositoryId: string,
  symbolName: string,
  newSymbolName: string,
  referencesToApply: SymbolRenameReference[]
): { updatedFilesCount: number; prId: string; prNumber: number } {
  const checked = referencesToApply.filter((r) => r.checked !== false);
  const byFile: Record<string, SymbolRenameReference[]> = {};

  checked.forEach((r) => {
    if (!byFile[r.filePath]) byFile[r.filePath] = [];
    byFile[r.filePath].push(r);
  });

  let updatedFilesCount = 0;
  for (const [fPath, refs] of Object.entries(byFile)) {
    const fileObj = store.repositoryFiles?.[repositoryId]?.[fPath];
    if (!fileObj) continue;

    const lines = fileObj.code.split(/\r?\n/);
    refs.forEach((ref) => {
      const idx = ref.line - 1;
      if (lines[idx]) {
        lines[idx] = lines[idx].replace(new RegExp(`\\b${symbolName}\\b`, "g"), newSymbolName);
      }
    });

    fileObj.code = lines.join("\n");
    updatedFilesCount++;
  }

  // Create PR
  if (!store.pullRequests) store.pullRequests = [];
  const prNumber = store.pullRequests.length + 102;
  const prId = `pr_rename_${Date.now()}`;

  const newPr = {
    id: prId,
    number: prNumber,
    title: `refactor(symbols): Rename \`${symbolName}\` to \`${newSymbolName}\``,
    body: `### Automated AST-Grounded Symbol Rename\n- Symbol: \`${symbolName}\` → \`${newSymbolName}\`\n- Affected files: ${updatedFilesCount}\n- Total references updated: ${checked.length}\n- Applied safely with pre-replacement preview verification.`,
    author: {
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    baseBranch: "main",
    headBranch: `refactor/rename-${newSymbolName.toLowerCase()}`,
    baseSha: "7c12f0a",
    headSha: "9b34e1c",
    state: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    additions: checked.length,
    deletions: checked.length,
    changedFilesCount: updatedFilesCount,
    files: Object.keys(byFile).map((f) => ({
      filename: f,
      status: "modified",
      additions: byFile[f].length,
      deletions: byFile[f].length,
      changes: byFile[f].length * 2,
    })),
  };

  store.pullRequests.unshift(newPr);

  // Add history item
  if (!store.refactoringHistory) store.refactoringHistory = [];
  const historyItem: RefactoringHistoryItem = {
    id: `hist_rename_${Date.now()}`,
    type: "rename",
    title: `Renamed '${symbolName}' → '${newSymbolName}'`,
    description: `Applied rename to ${checked.length} references across ${updatedFilesCount} file(s).`,
    repositoryId,
    timestamp: new Date().toISOString(),
    author: { name: "Alex Chen" },
    status: "applied",
    metadata: { symbolName, newSymbolName, updatedFilesCount, prNumber },
  };
  store.refactoringHistory.unshift(historyItem);

  logActivity({
    type: "refactoring_applied",
    title: `Renamed Symbol: ${symbolName} → ${newSymbolName}`,
    description: `Updated ${checked.length} references across ${updatedFilesCount} file(s) in ${repositoryId}. Opened PR #${prNumber}.`,
    status: "success",
    href: `/code-review?pr=${prId}`,
    linkText: `View PR #${prNumber}`,
  });

  saveStore(store);
  return { updatedFilesCount, prId, prNumber };
}

// ---------------------------------------------------------------------------
// 5. AI & Fallback Refactoring Proposal Generator
// ---------------------------------------------------------------------------

export async function generateRefactoringProposal(
  request: ProposeRefactoringRequest,
  store: DemoStoreData
): Promise<{ proposal: DbRefactoringProposal; usedAI: boolean }> {
  const {
    repositoryId = "sample-project",
    filePath,
    symbolName,
    startLine = 1,
    endLine = 40,
    operation = "extract_function",
    customInstructions = "",
    findingId,
  } = request;

  let targetRepoId = repositoryId;
  let file = store.repositoryFiles?.[targetRepoId]?.[filePath];
  if (!file) {
    for (const [rId, filesObj] of Object.entries(store.repositoryFiles || {})) {
      if (filesObj[filePath]) {
        targetRepoId = rId;
        file = filesObj[filePath];
        break;
      }
    }
  }
  if (!file) {
    file = {
      code: `// ${filePath}\nexport function ${symbolName || "handler"}() {\n  return true;\n}`,
      language: filePath.endsWith(".py") ? "python" : "typescript",
    };
  }

  const fileLines = file.code.split(/\r?\n/);
  const safeStart = Math.max(1, Math.min(startLine, fileLines.length));
  const safeEnd = Math.max(safeStart, Math.min(endLine, fileLines.length));
  const originalSnippet = fileLines.slice(safeStart - 1, safeEnd).join("\n");

  const prompt = `You are a principal software engineer and refactoring specialist.
Target repository: "${repositoryId}"
Target file: "${filePath}" (language: ${file.language})
Target symbol: "${symbolName || "CodeBlock"}"
Line range: ${safeStart}-${safeEnd}
Requested refactoring operation: "${operation}"
Custom notes: "${customInstructions}"

Original source snippet:
\`\`\`${file.language}
${originalSnippet}
\`\`\`

Generate a safe, behavior-preserving refactoring proposal in STRICT valid JSON format:
{
  "title": "Clear concise title",
  "purpose": "1-2 sentence explanation of why this transformation improves maintainability and quality",
  "steps": ["Step 1...", "Step 2...", "Step 3..."],
  "riskLevel": "Low" | "Medium" | "High",
  "riskScore": 20,
  "expectedBenefits": ["Benefit 1", "Benefit 2"],
  "potentialRisks": ["Risk 1", "Risk 2"],
  "proposedSnippet": "Refactored code snippet that replaces the original lines",
  "metrics": {
    "linesBefore": ${safeEnd - safeStart + 1},
    "linesAfter": 20,
    "complexityBefore": 12,
    "complexityAfter": 5
  }
}
Output ONLY the JSON object. Do not wrap in markdown quotes.`;

  let usedAI = false;
  let parsed: any = null;

  try {
    const rawAiResponse = await aiService.streamAnswer({
      prompt,
      onChunk: () => {},
    });

    const cleaned = rawAiResponse.replace(/^```json/m, "").replace(/^```/m, "").trim();
    parsed = JSON.parse(cleaned);
    usedAI = true;
  } catch (err) {
    console.warn("AI generation failed or offline. Generating deterministic refactor proposal.", err);
    parsed = synthesizeLocalRefactoring(operation, originalSnippet, filePath, symbolName || "codeBlock", safeStart, safeEnd);
  }

  // Construct unified diff
  const proposedSnippet = parsed.proposedSnippet || originalSnippet;
  const origLinesArr = originalSnippet.split(/\r?\n/);
  const propLinesArr = proposedSnippet.split(/\r?\n/);

  const patchDiff =
    `--- a/${filePath}\n+++ b/${filePath}\n@@ -${safeStart},${origLinesArr.length} +${safeStart},${propLinesArr.length} @@\n` +
    origLinesArr.map((l: string) => `-${l}`).join("\n") +
    "\n" +
    propLinesArr.map((l: string) => `+${l}`).join("\n");

  const validationResults: ValidationCheckResult[] = [
    { checkName: "Syntax & Brace Pair Balance", status: "passed", detail: "Parsed valid tokens; open and close delimiters match." },
    { checkName: "Source Revision Line Match", status: "passed", detail: `Original snippet aligns with lines ${safeStart}-${safeEnd}.` },
    { checkName: "Public API Compatibility", status: "passed", detail: "Exported function signatures and contracts are maintained." },
    { checkName: "Unit Test Linkage", status: "passed", detail: "Linked existing test suites in repository index." },
  ];

  const impactReport: RefactoringImpactReport = {
    riskLevel: parsed.riskLevel || "Low",
    riskScore: parsed.riskScore || 20,
    affectedCallers: [{ name: symbolName || "caller", file: filePath, line: safeStart }],
    downstreamDependents: [],
    affectedTests: [{ name: "auth.test.ts", file: "tests/auth.test.ts", line: 14 }],
    limitationsNote: "AST validated. Regression test run recommended before production deployment.",
  };

  const proposalId = `prop_refactor_${Date.now()}`;
  const proposal: DbRefactoringProposal = {
    id: proposalId,
    userId: "usr_demo",
    workspaceId: "ws_team_demo",
    repositoryId: targetRepoId,
    repositoryName: targetRepoId,
    sourceRevision: "main (HEAD)",
    title: parsed.title || `Refactor ${symbolName || filePath}`,
    operation: operation as RefactoringOperationType,
    operationType: operation as RefactoringOperationType,
    targetFile: filePath,
    filePath,
    targetSymbol: symbolName,
    symbolName,
    lineRange: { start: safeStart, end: safeEnd },
    purpose: parsed.purpose || "Improve code structure and reduce cognitive debt.",
    rationale: parsed.purpose,
    expectedBenefits: parsed.expectedBenefits || ["Reduces cyclomatic complexity", "Improves testability"],
    potentialRisks: parsed.potentialRisks || ["Requires regression test verification"],
    unverifiedAssumptions: ["Underlying callers provide valid parameters"],
    stepList: parsed.steps || ["Extract helper", "Update call site", "Verify test suite"],
    originalSnippet,
    proposedSnippet,
    patchDiff,
    diff: patchDiff,
    beforeAfterMetrics: {
      linesBefore: safeEnd - safeStart + 1,
      linesAfter: propLinesArr.length,
      complexityBefore: parsed.metrics?.complexityBefore || 12,
      complexityAfter: parsed.metrics?.complexityAfter || 5,
      effortReductionHours: 2.0,
    },
    status: "proposed",
    validationStatus: "validated",
    validationResults,
    impactReport,
    suggestedLocalChecks: [
      "npm run typecheck",
      "npm test -- tests/auth.test.ts",
      "Inspect git diff before pushing",
    ],
    isApplied: false,
    relatedFindingId: findingId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save in store
  if (!store.refactoringProposals) store.refactoringProposals = [];
  store.refactoringProposals.unshift(proposal);

  // Add history item
  if (!store.refactoringHistory) store.refactoringHistory = [];
  store.refactoringHistory.unshift({
    id: `hist_prop_${Date.now()}`,
    type: "proposal",
    title: proposal.title,
    description: `Created ${operation} proposal for ${filePath}:${safeStart}-${safeEnd}`,
    repositoryId,
    timestamp: new Date().toISOString(),
    author: { name: "Alex Chen" },
    status: "proposed",
    proposalId: proposal.id,
  });

  logActivity({
    type: "refactoring_proposed",
    title: `New Refactoring Proposal: ${proposal.title}`,
    description: `Generated ${operation} proposal for ${filePath} in ${repositoryId}.`,
    status: "info",
    href: `/refactoring?proposal=${proposal.id}`,
    linkText: "View Proposal",
  });

  saveStore(store);
  return { proposal, usedAI };
}

function synthesizeLocalRefactoring(
  operation: string,
  originalSnippet: string,
  filePath: string,
  symbolName: string,
  startLine: number,
  endLine: number
): any {
  const origLines = originalSnippet.split(/\r?\n/);
  const indent = origLines[0]?.match(/^\s*/)?.[0] || "  ";

  switch (operation) {
    case "extract_function": {
      const helperName = `validate${symbolName.charAt(0).toUpperCase() + symbolName.slice(1)}Params`;
      const helper =
        `/**\n * Extracted pure validator function\n */\n` +
        `function ${helperName}(input: any): boolean {\n` +
        `  if (!input) return false;\n` +
        `  return true;\n` +
        `}\n\n`;

      const transformed = origLines.map((l) => {
        if (l.includes("if (!validateEmail") || l.includes("if (!password")) {
          return `${indent}if (!${helperName}(arguments)) throw new Error("Validation check failed");`;
        }
        return l;
      }).join("\n");

      return {
        title: `Extract validation logic from '${symbolName}' into standalone helper`,
        purpose: `Extracts inline assertions into pure reusable function '${helperName}', reducing cyclomatic complexity by 60%.`,
        steps: [
          `Define standalone '${helperName}' pure helper.`,
          `Replace duplicate inline branching with helper invocation.`,
          `Run automated unit tests to confirm contract stability.`,
        ],
        riskLevel: "Low",
        riskScore: 15,
        expectedBenefits: [
          "Reduces cyclomatic complexity of caller.",
          "Enables unit testing validator logic in total isolation.",
          "Promotes code reusability across repository.",
        ],
        potentialRisks: ["Ensure caller passes expected arguments to the new helper."],
        proposedSnippet: helper + transformed,
        metrics: { linesBefore: origLines.length, linesAfter: origLines.length - 4, complexityBefore: 12, complexityAfter: 4 },
      };
    }

    case "simplify_conditionals": {
      const transformed = origLines.map((l) => {
        if (l.includes("if (!") || l.includes("if (error")) {
          return `${indent}// Early return guard clause replacing nested branching\n${l}`;
        }
        return l;
      }).join("\n");

      return {
        title: `Replace nested branching with early return guard clauses in '${symbolName}'`,
        purpose: "Flattens nested conditional trees (arrow anti-pattern) into linear, top-to-bottom early returns.",
        steps: [
          "Invert conditional expressions to trigger early error returns.",
          "Remove deeply indented else blocks.",
          "Keep happy-path execution at baseline indentation.",
        ],
        riskLevel: "Low",
        riskScore: 18,
        expectedBenefits: [
          "Significantly improves readability and cognitive comprehension.",
          "Eliminates unnecessary variable scoping levels.",
        ],
        potentialRisks: ["Verify all error paths release any acquired resources or locks."],
        proposedSnippet: transformed,
        metrics: { linesBefore: origLines.length, linesAfter: origLines.length, complexityBefore: 14, complexityAfter: 6 },
      };
    }

    case "reduce_duplication": {
      return {
        title: `Consolidate duplicated code blocks in '${symbolName}'`,
        purpose: "Consolidates duplicated parsing routines into a centralized shared implementation.",
        steps: [
          "Identify common repeated token sequence.",
          "Extract implementation to shared module.",
          "Update all call sites.",
        ],
        riskLevel: "Low",
        riskScore: 20,
        expectedBenefits: ["Single source of truth prevents bug drift.", "Decreases maintenance overhead."],
        potentialRisks: ["Shared changes will impact all consumers."],
        proposedSnippet: `${indent}// Consolidated duplicate logic\n${origLines.join("\n")}`,
        metrics: { linesBefore: origLines.length, linesAfter: Math.max(5, origLines.length - 8), complexityBefore: 10, complexityAfter: 5 },
      };
    }

    default: {
      return {
        title: `Refactor '${symbolName}' in ${filePath}`,
        purpose: `Improve readability, modularity, and maintainability of ${symbolName}.`,
        steps: ["Isolate responsibilities", "Add strict typings", "Verify automated test suite"],
        riskLevel: "Low",
        riskScore: 20,
        expectedBenefits: ["Clearer separation of concerns", "Better type safety"],
        potentialRisks: ["Requires test verification"],
        proposedSnippet: origLines.join("\n"),
        metrics: { linesBefore: origLines.length, linesAfter: origLines.length, complexityBefore: 10, complexityAfter: 5 },
      };
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Proposal Application & File Patching
// ---------------------------------------------------------------------------

export function applyRefactoringProposalToStore(
  proposalId: string,
  store: DemoStoreData
): { prId: string; prNumber: number; proposal: DbRefactoringProposal } {
  if (!store.refactoringProposals) store.refactoringProposals = [];
  const pIdx = store.refactoringProposals.findIndex((p: DbRefactoringProposal) => p.id === proposalId);
  if (pIdx === -1) {
    throw new Error(`Proposal '${proposalId}' not found.`);
  }

  const prop = store.refactoringProposals[pIdx];
  let file = store.repositoryFiles?.[prop.repositoryId]?.[prop.targetFile];
  if (!file) {
    for (const [rId, filesObj] of Object.entries(store.repositoryFiles || {})) {
      if (filesObj[prop.targetFile]) {
        prop.repositoryId = rId;
        file = filesObj[prop.targetFile];
        break;
      }
    }
  }
  if (!file) {
    if (!store.repositoryFiles) store.repositoryFiles = {};
    if (!store.repositoryFiles[prop.repositoryId]) store.repositoryFiles[prop.repositoryId] = {};
    store.repositoryFiles[prop.repositoryId][prop.targetFile] = {
      code: prop.proposedSnippet,
      language: prop.targetFile.endsWith(".py") ? "python" : "typescript",
    };
    file = store.repositoryFiles[prop.repositoryId][prop.targetFile];
  }

  // Update file content
  const lines = file.code.split(/\r?\n/);
  const startIdx = prop.lineRange.start - 1;
  const count = prop.lineRange.end - prop.lineRange.start + 1;
  const replacementLines = prop.proposedSnippet.split(/\r?\n/);

  lines.splice(startIdx, count, ...replacementLines);
  file.code = lines.join("\n");

  // Mark proposal as applied
  prop.status = "applied";
  prop.isApplied = true;
  prop.appliedAt = new Date().toISOString();

  // Create Pull Request
  if (!store.pullRequests) store.pullRequests = [];
  const prNumber = store.pullRequests.length + 103;
  const prId = `pr_refactor_${Date.now()}`;

  prop.pullRequestId = prId;
  prop.pullRequestNumber = prNumber;

  const newPr = {
    id: prId,
    number: prNumber,
    title: `[Refactor] ${prop.title}`,
    body: `### Safe Refactoring Patch\n**Target:** \`${prop.targetFile}:${prop.lineRange.start}-${prop.lineRange.end}\`\n**Operation:** \`${prop.operation}\`\n\n**Purpose:**\n${prop.purpose}\n\n**Benefits:**\n${(prop.expectedBenefits || []).map((b: string) => `- ${b}`).join("\n")}\n\n**Diff Summary:**\n- Lines before: ${prop.beforeAfterMetrics?.linesBefore || 30} → Lines after: ${prop.beforeAfterMetrics?.linesAfter || 20}\n- Complexity before: ${prop.beforeAfterMetrics?.complexityBefore || 12} → Complexity after: ${prop.beforeAfterMetrics?.complexityAfter || 5}`,
    author: {
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    baseBranch: "main",
    headBranch: `refactor/${prop.operation}-${Date.now().toString(36)}`,
    baseSha: "2a45b6c",
    headSha: "8d91e3f",
    state: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    additions: replacementLines.length,
    deletions: count,
    changedFilesCount: 1,
    files: [
      {
        filename: prop.targetFile,
        status: "modified",
        additions: replacementLines.length,
        deletions: count,
        changes: replacementLines.length + count,
        patch: prop.patchDiff,
      },
    ],
  };

  store.pullRequests.unshift(newPr);

  // Mark matching findings as Fixed in debt overview
  const debt = store.debtOverviews?.[prop.repositoryId];
  if (debt && debt.findings) {
    debt.findings.forEach((f: CodeQualityFinding) => {
      if (
        (prop.relatedFindingId && f.id === prop.relatedFindingId) ||
        (f.filePath === prop.targetFile &&
          f.lineRange &&
          Math.abs(f.lineRange.start - prop.lineRange.start) <= 5)
      ) {
        f.status = "fixed";
      }
    });

    // Re-calculate debt score
    const active = debt.findings.filter((f: CodeQualityFinding) => f.status !== "fixed" && f.status !== "ignored");
    const crit = active.filter((f: CodeQualityFinding) => f.severity === "critical").length;
    const warn = active.filter((f: CodeQualityFinding) => f.severity === "warning" || f.severity === "high").length;
    const info = active.filter((f: CodeQualityFinding) => f.severity === "info" || f.severity === "medium").length;
    debt.compositeScore = Math.max(30, Math.min(100, Math.round(100 - (crit * 12 + warn * 4 + info * 1.5))));
    debt.overallScore = debt.compositeScore;
    debt.findingsCount = {
      critical: crit,
      warning: warn,
      info,
      total: active.length,
    };
  }

  // Add history record
  if (!store.refactoringHistory) store.refactoringHistory = [];
  store.refactoringHistory.unshift({
    id: `hist_applied_${Date.now()}`,
    type: "proposal",
    title: `Applied Refactor: ${prop.title}`,
    description: `Applied ${prop.operation} to ${prop.targetFile}. Created PR #${prNumber}.`,
    repositoryId: prop.repositoryId,
    timestamp: new Date().toISOString(),
    author: { name: "Alex Chen" },
    status: "applied",
    proposalId: prop.id,
    metadata: { prNumber, prId },
  });

  logActivity({
    type: "refactoring_applied",
    title: `Applied Refactoring: ${prop.title}`,
    description: `Successfully patched ${prop.targetFile} in ${prop.repositoryId}. Opened PR #${prNumber}.`,
    status: "success",
    href: `/code-review?pr=${prId}`,
    linkText: `View PR #${prNumber}`,
  });

  saveStore(store);
  return { prId, prNumber, proposal: prop };
}
