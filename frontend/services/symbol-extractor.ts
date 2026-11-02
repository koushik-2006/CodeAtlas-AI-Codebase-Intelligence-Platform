/**
 * Multi-Language Code Symbol & Dependency Extractor
 * 
 * Deterministically extracts symbols, endpoints, and file dependencies
 * across TypeScript, JavaScript, Python, Java, Go, C#, PHP, and Ruby.
 */

export interface ExtractedSymbol {
  name: string;
  kind: "function" | "class" | "method" | "interface" | "type" | "variable" | "endpoint" | "model";
  file: string;
  line: number;
  endLine?: number;
  signature?: string;
  docstring?: string;
  isExported?: boolean;
}

export interface ExtractedEndpoint {
  method: string;
  path: string;
  file: string;
  line: number;
  handlerName?: string;
}

export interface FileDependency {
  fromFile: string;
  toFileOrModule: string;
  importedSymbols: string[];
}

export interface CodebaseAnalysisResult {
  symbols: ExtractedSymbol[];
  endpoints: ExtractedEndpoint[];
  dependencies: FileDependency[];
  totalLines: number;
  totalSymbols: number;
}

export class SymbolExtractor {
  detectLanguage(filePath: string): string {
    const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
    switch (ext) {
      case ".ts":
      case ".tsx":
        return "typescript";
      case ".js":
      case ".jsx":
      case ".mjs":
      case ".cjs":
        return "javascript";
      case ".py":
        return "python";
      case ".java":
        return "java";
      case ".go":
        return "go";
      case ".cs":
        return "csharp";
      case ".php":
        return "php";
      case ".rb":
        return "ruby";
      case ".json":
        return "json";
      case ".md":
        return "markdown";
      case ".html":
        return "html";
      case ".css":
      case ".scss":
        return "css";
      case ".sql":
        return "sql";
      case ".yaml":
      case ".yml":
        return "yaml";
      default:
        return "text";
    }
  }

  extractFromFile(filePath: string, content: string): {
    symbols: ExtractedSymbol[];
    endpoints: ExtractedEndpoint[];
    dependencies: FileDependency[];
    lineCount: number;
  } {
    const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
    const lines = content.split("\n");
    const lineCount = lines.length;

    const symbols: ExtractedSymbol[] = [];
    const endpoints: ExtractedEndpoint[] = [];
    const dependencies: FileDependency[] = [];

    if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext)) {
      this.extractTsJs(filePath, lines, symbols, endpoints, dependencies);
    } else if (ext === ".py") {
      this.extractPython(filePath, lines, symbols, endpoints, dependencies);
    } else if (ext === ".java") {
      this.extractJava(filePath, lines, symbols, endpoints, dependencies);
    } else if (ext === ".go") {
      this.extractGo(filePath, lines, symbols, endpoints, dependencies);
    } else if (ext === ".cs") {
      this.extractCSharp(filePath, lines, symbols, endpoints, dependencies);
    } else if (ext === ".php") {
      this.extractPhp(filePath, lines, symbols, endpoints, dependencies);
    } else if (ext === ".rb") {
      this.extractRuby(filePath, lines, symbols, endpoints, dependencies);
    } else {
      // Generic fallback
      this.extractGeneric(filePath, lines, symbols);
    }

    return { symbols, endpoints, dependencies, lineCount };
  }

  private extractTsJs(
    file: string,
    lines: string[],
    symbols: ExtractedSymbol[],
    endpoints: ExtractedEndpoint[],
    dependencies: FileDependency[]
  ) {
    const isAppRouterRoute = file.endsWith("route.ts") || file.endsWith("route.js");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // 1. Imports
      const importMatch = line.match(/^import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const importedSymbols = importMatch[1]
          ? importMatch[1].split(",").map((s) => s.trim().split(" as ")[0])
          : importMatch[2]
          ? [importMatch[2]]
          : importMatch[3]
          ? [importMatch[3]]
          : [];
        dependencies.push({
          fromFile: file,
          toFileOrModule: importMatch[4],
          importedSymbols,
        });
      }

      // 2. Next.js App Router HTTP handlers: export async function GET / POST / PUT / DELETE
      if (isAppRouterRoute) {
        const routeMatch = line.match(/^export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|HEAD)\b/);
        if (routeMatch) {
          endpoints.push({
            method: routeMatch[1],
            path: this.inferRoutePath(file),
            file,
            line: lineNum,
            handlerName: routeMatch[1],
          });
        }
      }

      // 3. Express / Fastify / Node route calls: (app|router).(get|post|put|delete)('/path', ...)
      const expressMatch = line.match(/\b(app|router)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/i);
      if (expressMatch) {
        endpoints.push({
          method: expressMatch[2].toUpperCase(),
          path: expressMatch[3],
          file,
          line: lineNum,
        });
      }

      // 4. Function declarations
      const funcMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)/);
      if (funcMatch) {
        symbols.push({
          name: funcMatch[1],
          kind: /^[A-Z]/.test(funcMatch[1]) ? "class" : "function",
          file,
          line: lineNum,
          signature: `function ${funcMatch[1]}(${funcMatch[2]})`,
          isExported: line.startsWith("export"),
        });
        continue;
      }

      // 5. Arrow functions / functional components
      const arrowMatch = line.match(/^(?:export\s+)?(?:const|let)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*[^=]+)?\s*=>/);
      if (arrowMatch) {
        symbols.push({
          name: arrowMatch[1],
          kind: /^[A-Z]/.test(arrowMatch[1]) ? "class" : "function",
          file,
          line: lineNum,
          signature: `const ${arrowMatch[1]} = (${arrowMatch[2]}) =>`,
          isExported: line.startsWith("export"),
        });
        continue;
      }

      // 6. Classes
      const classMatch = line.match(/^(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_$]+)(?:\s+extends\s+([A-Za-z0-9_$.]+))?/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: "class",
          file,
          line: lineNum,
          signature: `class ${classMatch[1]}${classMatch[2] ? ` extends ${classMatch[2]}` : ""}`,
          isExported: line.startsWith("export"),
        });
        continue;
      }

      // 7. Interfaces & Types
      const ifaceMatch = line.match(/^(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/);
      if (ifaceMatch) {
        symbols.push({
          name: ifaceMatch[1],
          kind: "interface",
          file,
          line: lineNum,
          signature: `interface ${ifaceMatch[1]}`,
          isExported: line.startsWith("export"),
        });
        continue;
      }

      const typeMatch = line.match(/^(?:export\s+)?type\s+([A-Za-z0-9_$]+)\s*=/);
      if (typeMatch) {
        symbols.push({
          name: typeMatch[1],
          kind: "type",
          file,
          line: lineNum,
          signature: `type ${typeMatch[1]}`,
          isExported: line.startsWith("export"),
        });
        continue;
      }
    }
  }

  private extractPython(
    file: string,
    lines: string[],
    symbols: ExtractedSymbol[],
    endpoints: ExtractedEndpoint[],
    dependencies: FileDependency[]
  ) {
    let prevDecorator = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // Track decorators for FastAPI / Flask
      if (line.startsWith("@")) {
        prevDecorator = line;
        const routeMatch = line.match(/@(app|router|api_router)\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/i);
        if (routeMatch) {
          endpoints.push({
            method: routeMatch[2].toUpperCase(),
            path: routeMatch[3],
            file,
            line: lineNum,
          });
        }
        continue;
      }

      // Imports
      const importMatch = line.match(/^(?:from\s+([a-zA-Z0-9_.]+)\s+)?import\s+([a-zA-Z0-9_., ]+)/);
      if (importMatch) {
        dependencies.push({
          fromFile: file,
          toFileOrModule: importMatch[1] || importMatch[2],
          importedSymbols: importMatch[2].split(",").map((s) => s.trim()),
        });
      }

      // Classes
      const classMatch = line.match(/^class\s+([A-Za-z0-9_]+)(?:\(([^)]*)\))?:/);
      if (classMatch) {
        const isModel = classMatch[2]?.includes("Base") || classMatch[2]?.includes("Model");
        symbols.push({
          name: classMatch[1],
          kind: isModel ? "model" : "class",
          file,
          line: lineNum,
          signature: `class ${classMatch[1]}(${classMatch[2] || ""})`,
        });
        prevDecorator = "";
        continue;
      }

      // Functions & Methods
      const defMatch = line.match(/^(?:async\s+)?def\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/);
      if (defMatch) {
        const name = defMatch[1];
        symbols.push({
          name,
          kind: name.startsWith("__") && name.endsWith("__") ? "method" : "function",
          file,
          line: lineNum,
          signature: `def ${name}(${defMatch[2]})`,
        });
        prevDecorator = "";
        continue;
      }

      prevDecorator = "";
    }
  }

  private extractJava(
    file: string,
    lines: string[],
    symbols: ExtractedSymbol[],
    endpoints: ExtractedEndpoint[],
    dependencies: FileDependency[]
  ) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // Spring route annotations: @GetMapping("/api/...")
      const springMatch = line.match(/@(GetMapping|PostMapping|PutMapping|DeleteMapping|RequestMapping)\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/i);
      if (springMatch) {
        const method = springMatch[1].replace("Mapping", "").toUpperCase() || "GET";
        endpoints.push({
          method: method === "REQUEST" ? "ANY" : method,
          path: springMatch[2],
          file,
          line: lineNum,
        });
      }

      // Classes & Interfaces
      const classMatch = line.match(/\b(public|protected|private)?\s*(abstract|final)?\s*(class|interface|enum)\s+([A-Za-z0-9_]+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[4],
          kind: classMatch[3] === "interface" ? "interface" : "class",
          file,
          line: lineNum,
          signature: `${classMatch[3]} ${classMatch[4]}`,
          isExported: classMatch[1] === "public",
        });
        continue;
      }

      // Methods
      const methodMatch = line.match(/\b(public|protected|private)\s+([\w<>[\], ]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:throws\s+[\w, ]+)?\s*\{/);
      if (methodMatch && !["if", "for", "while", "switch"].includes(methodMatch[3])) {
        symbols.push({
          name: methodMatch[3],
          kind: "method",
          file,
          line: lineNum,
          signature: `${methodMatch[2]} ${methodMatch[3]}(${methodMatch[4]})`,
          isExported: methodMatch[1] === "public",
        });
      }
    }
  }

  private extractGo(
    file: string,
    lines: string[],
    symbols: ExtractedSymbol[],
    endpoints: ExtractedEndpoint[],
    dependencies: FileDependency[]
  ) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // Gin / net/http route handlers: r.GET("/path", handler)
      const goRoute = line.match(/\b(?:r|router|api|v1)\.(GET|POST|PUT|DELETE)\s*\(\s*["']([^"']+)["']/i);
      if (goRoute) {
        endpoints.push({
          method: goRoute[1].toUpperCase(),
          path: goRoute[2],
          file,
          line: lineNum,
        });
      }

      // Function or method
      const funcMatch = line.match(/^func\s+(?:\(([^)]+)\)\s+)?([A-Za-z0-9_]+)\s*\(([^)]*)\)/);
      if (funcMatch) {
        const isExported = /^[A-Z]/.test(funcMatch[2]);
        symbols.push({
          name: funcMatch[2],
          kind: funcMatch[1] ? "method" : "function",
          file,
          line: lineNum,
          signature: `func ${funcMatch[1] ? `(${funcMatch[1]}) ` : ""}${funcMatch[2]}(${funcMatch[3]})`,
          isExported,
        });
        continue;
      }

      // Type struct / interface
      const typeMatch = line.match(/^type\s+([A-Za-z0-9_]+)\s+(struct|interface)/);
      if (typeMatch) {
        symbols.push({
          name: typeMatch[1],
          kind: typeMatch[2] === "interface" ? "interface" : "class",
          file,
          line: lineNum,
          signature: `type ${typeMatch[1]} ${typeMatch[2]}`,
          isExported: /^[A-Z]/.test(typeMatch[1]),
        });
      }
    }
  }

  private extractCSharp(
    file: string,
    lines: string[],
    symbols: ExtractedSymbol[],
    endpoints: ExtractedEndpoint[],
    dependencies: FileDependency[]
  ) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;
      const classMatch = line.match(/\b(public|internal|private)?\s*(?:static\s+|abstract\s+)?(class|interface|record)\s+([A-Za-z0-9_]+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[3],
          kind: classMatch[2] === "interface" ? "interface" : "class",
          file,
          line: lineNum,
          signature: `${classMatch[2]} ${classMatch[3]}`,
        });
      }
    }
  }

  private extractPhp(
    file: string,
    lines: string[],
    symbols: ExtractedSymbol[],
    endpoints: ExtractedEndpoint[],
    dependencies: FileDependency[]
  ) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;
      const classMatch = line.match(/\b(?:final\s+|abstract\s+)?class\s+([A-Za-z0-9_]+)/);
      if (classMatch) {
        symbols.push({ name: classMatch[1], kind: "class", file, line: lineNum });
        continue;
      }
      const funcMatch = line.match(/\bfunction\s+([A-Za-z0-9_]+)\s*\(/);
      if (funcMatch) {
        symbols.push({ name: funcMatch[1], kind: "function", file, line: lineNum });
      }
    }
  }

  private extractRuby(
    file: string,
    lines: string[],
    symbols: ExtractedSymbol[],
    endpoints: ExtractedEndpoint[],
    dependencies: FileDependency[]
  ) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;
      const classMatch = line.match(/^class\s+([A-Za-z0-9_:]+)/);
      if (classMatch) {
        symbols.push({ name: classMatch[1], kind: "class", file, line: lineNum });
        continue;
      }
      const defMatch = line.match(/^def\s+([A-Za-z0-9_!?]+)/);
      if (defMatch) {
        symbols.push({ name: defMatch[1], kind: "function", file, line: lineNum });
      }
    }
  }

  private extractGeneric(file: string, lines: string[], symbols: ExtractedSymbol[]) {
    // Basic identifiers for other files
    for (let i = 0; i < Math.min(lines.length, 100); i++) {
      const line = lines[i].trim();
      if (line.startsWith("# ") || line.startsWith("## ")) {
        symbols.push({
          name: line.replace(/^#+\s*/, ""),
          kind: "variable",
          file,
          line: i + 1,
        });
      }
    }
  }

  private inferRoutePath(filePath: string): string {
    // Convert app/api/auth/[id]/route.ts -> /api/auth/:id
    const norm = filePath.replace(/\\/g, "/");
    const match = norm.match(/(?:app|pages)(\/.*?)(?:\/route|\/index)?\.[a-z]+$/);
    if (match) {
      return match[1].replace(/\[([^\]]+)\]/g, ":$1") || "/";
    }
    return `/${filePath}`;
  }
}

export const symbolExtractor = new SymbolExtractor();
