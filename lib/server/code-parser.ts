import { DbCodeSymbol, DbCodeRelationship } from "@/types/database";

export interface ParsedCodeResult {
  symbols: DbCodeSymbol[];
  relationships: DbCodeRelationship[];
  lineCount: number;
}

/**
 * Deterministic source-code parser and AST symbol extractor for TypeScript, JavaScript, Python, and other web languages.
 * Extracts functions, classes, endpoints, services, tests, and call relationships.
 */
export function parseSourceCode(
  repositoryId: string,
  filePath: string,
  content: string
): ParsedCodeResult {
  const symbols: DbCodeSymbol[] = [];
  const relationships: DbCodeRelationship[] = [];
  const lines = content.split("\n");
  const lineCount = lines.length;

  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const isTsOrJs = ["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext);
  const isPython = ext === "py";
  const isTestFile =
    filePath.includes(".test.") ||
    filePath.includes(".spec.") ||
    filePath.startsWith("tests/") ||
    filePath.startsWith("test/");

  // 1. Symbol Extraction
  if (isTsOrJs) {
    parseTypeScriptSymbols(repositoryId, filePath, lines, isTestFile, symbols);
  } else if (isPython) {
    parsePythonSymbols(repositoryId, filePath, lines, isTestFile, symbols);
  } else {
    // Generic fallback for config or other files
    parseGenericSymbols(repositoryId, filePath, lines, symbols);
  }

  // 2. Intra-file / Call Relationship Extraction
  extractCallRelationships(repositoryId, content, symbols, relationships);

  return {
    symbols,
    relationships,
    lineCount,
  };
}

function parseTypeScriptSymbols(
  repositoryId: string,
  filePath: string,
  lines: string[],
  isTestFile: boolean,
  symbols: DbCodeSymbol[]
) {
  let inClass: { name: string; start: number } | null = null;
  const isEndpointRoute = filePath.includes("/api/") || filePath.includes("route.ts") || filePath.includes("route.js");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;

    // Detect Next.js / Express API Endpoints
    if (isEndpointRoute) {
      const endpointMatch = trimmed.match(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b/);
      if (endpointMatch) {
        const method = endpointMatch[1];
        const routePath = "/" + filePath.replace(/^(app\/api\/|pages\/api\/)/, "").replace(/\/route\.(ts|js)$/, "");
        symbols.push({
          id: `sym_${repositoryId}_${filePath.replace(/[^a-zA-Z0-9]/g, "_")}_${method}_${lineNum}`,
          repositoryId,
          filePath,
          name: `${method} ${routePath}`,
          type: "endpoint",
          startLine: lineNum,
          endLine: findBlockEnd(lines, i),
          scope: filePath,
        });
        continue;
      }
    }

    // Detect Tests
    if (isTestFile) {
      const testMatch = trimmed.match(/(?:it|test)\s*\(\s*["'`](.*?)["'`]/);
      if (testMatch) {
        symbols.push({
          id: `sym_${repositoryId}_${filePath.replace(/[^a-zA-Z0-9]/g, "_")}_test_${lineNum}`,
          repositoryId,
          filePath,
          name: testMatch[1].slice(0, 50),
          type: "test",
          startLine: lineNum,
          endLine: findBlockEnd(lines, i),
          scope: filePath,
        });
        continue;
      }
    }

    // Detect Classes & Interfaces
    const classMatch = trimmed.match(/(?:export\s+)?(?:default\s+)?class\s+([A-Za-z0-9_]+)/);
    if (classMatch) {
      const className = classMatch[1];
      const isService = className.endsWith("Service") || className.endsWith("Client") || className.endsWith("Manager") || className.endsWith("Repository");
      symbols.push({
        id: `sym_${repositoryId}_${filePath.replace(/[^a-zA-Z0-9]/g, "_")}_${className}_${lineNum}`,
        repositoryId,
        filePath,
        name: className,
        type: isService ? "service" : "class",
        startLine: lineNum,
        endLine: findBlockEnd(lines, i),
        scope: filePath,
      });
      inClass = { name: className, start: lineNum };
      continue;
    }

    // Detect Functions & React Components
    const funcMatch =
      trimmed.match(/(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\((.*?)\)/) ||
      trimmed.match(/(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\((.*?)\)\s*=>/);

    if (funcMatch) {
      const funcName = funcMatch[1];
      const params = funcMatch[2] ? funcMatch[2].split(",").map((p) => p.trim()) : [];
      const isService = funcName.endsWith("Service");

      symbols.push({
        id: `sym_${repositoryId}_${filePath.replace(/[^a-zA-Z0-9]/g, "_")}_${funcName}_${lineNum}`,
        repositoryId,
        filePath,
        name: funcName,
        type: isService ? "service" : "function",
        startLine: lineNum,
        endLine: findBlockEnd(lines, i),
        parameters: params,
        scope: inClass ? inClass.name : filePath,
      });
      continue;
    }

    // Detect Service Object exports
    const serviceObjMatch = trimmed.match(/export\s+const\s+([A-Za-z0-9_]+Service)\s*=/);
    if (serviceObjMatch) {
      symbols.push({
        id: `sym_${repositoryId}_${filePath.replace(/[^a-zA-Z0-9]/g, "_")}_${serviceObjMatch[1]}_${lineNum}`,
        repositoryId,
        filePath,
        name: serviceObjMatch[1],
        type: "service",
        startLine: lineNum,
        endLine: findBlockEnd(lines, i),
        scope: filePath,
      });
    }
  }
}

function parsePythonSymbols(
  repositoryId: string,
  filePath: string,
  lines: string[],
  isTestFile: boolean,
  symbols: DbCodeSymbol[]
) {
  let currentClass: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    if (trimmed.startsWith("#")) continue;

    // Detect Class
    const classMatch = trimmed.match(/^class\s+([A-Za-z0-9_]+)/);
    if (classMatch) {
      const className = classMatch[1];
      const isService = className.endsWith("Service") || className.endsWith("Client") || className.endsWith("Manager");
      symbols.push({
        id: `sym_${repositoryId}_${filePath.replace(/[^a-zA-Z0-9]/g, "_")}_${className}_${lineNum}`,
        repositoryId,
        filePath,
        name: className,
        type: isService ? "service" : "class",
        startLine: lineNum,
        endLine: findPythonBlockEnd(lines, i),
        scope: filePath,
      });
      currentClass = className;
      continue;
    }

    // Detect Python Function / Method
    const defMatch = trimmed.match(/^def\s+([A-Za-z0-9_]+)\s*\((.*?)\):/);
    if (defMatch) {
      const funcName = defMatch[1];
      const params = defMatch[2] ? defMatch[2].split(",").map((p) => p.trim()) : [];
      const isTest = isTestFile || funcName.startsWith("test_");

      symbols.push({
        id: `sym_${repositoryId}_${filePath.replace(/[^a-zA-Z0-9]/g, "_")}_${funcName}_${lineNum}`,
        repositoryId,
        filePath,
        name: funcName,
        type: isTest ? "test" : "function",
        startLine: lineNum,
        endLine: findPythonBlockEnd(lines, i),
        parameters: params,
        scope: currentClass || filePath,
      });
    }
  }
}

function parseGenericSymbols(
  repositoryId: string,
  filePath: string,
  lines: string[],
  symbols: DbCodeSymbol[]
) {
  // If JSON / config
  if (filePath.endsWith("package.json")) {
    symbols.push({
      id: `sym_${repositoryId}_package_json`,
      repositoryId,
      filePath,
      name: "package.json",
      type: "table",
      startLine: 1,
      endLine: lines.length,
      scope: filePath,
    });
  }
}

/**
 * Finds the end line of a curly-brace delimited code block.
 */
function findBlockEnd(lines: string[], startIdx: number): number {
  let openBraces = 0;
  let foundFirst = false;

  for (let i = startIdx; i < Math.min(lines.length, startIdx + 200); i++) {
    const line = lines[i];
    for (const char of line) {
      if (char === "{") {
        openBraces++;
        foundFirst = true;
      } else if (char === "}") {
        openBraces--;
        if (foundFirst && openBraces <= 0) {
          return i + 1;
        }
      }
    }
  }

  return Math.min(lines.length, startIdx + 25);
}

/**
 * Finds the end line of a Python indentation-based block.
 */
function findPythonBlockEnd(lines: string[], startIdx: number): number {
  const baseIndent = lines[startIdx].search(/\S/);
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const currentIndent = line.search(/\S/);
    if (currentIndent <= baseIndent) {
      return i;
    }
  }
  return lines.length;
}

/**
 * Scans content to connect symbols that invoke or test each other.
 */
function extractCallRelationships(
  repositoryId: string,
  content: string,
  symbols: DbCodeSymbol[],
  relationships: DbCodeRelationship[]
) {
  const funcSymbols = symbols.filter((s) => s.type === "function" || s.type === "test" || s.type === "endpoint");

  for (const caller of funcSymbols) {
    for (const target of symbols) {
      if (caller.id === target.id) continue;
      if (target.name.length < 3) continue;

      // Check if target symbol is called inside caller
      const callRegex = new RegExp(`\\b${target.name}\\s*\\(`, "g");
      if (callRegex.test(content)) {
        const relType = caller.type === "test" ? "tests" : "calls";
        relationships.push({
          id: `rel_${caller.id}_to_${target.id}`,
          repositoryId,
          fromSymbolId: caller.id,
          fromSymbolName: caller.name,
          toSymbolId: target.id,
          toSymbolName: target.name,
          type: relType,
        });
      }
    }
  }
}
