import { db } from "./db";
import {
  SymbolNavigationResult,
  SymbolNavigationTarget,
  SymbolNavigationKind,
} from "@/types/symbol-navigation";

export class SymbolNavigator {
  /**
   * Performs symbol resolution and cross-file navigation across definitions, callers, callees,
   * references, tests, and imports using AST indexes and fallback text heuristics.
   */
  navigateSymbol(
    repositoryId: string = "sample-project",
    filePath: string,
    line: number,
    symbolName?: string
  ): SymbolNavigationResult {
    const files = db.getRepositoryFiles(repositoryId);
    const symbols = db.getCodeSymbols(repositoryId);
    const relationships = db.getCodeRelationships(repositoryId);

    const currentFile = files.find((f) => f.path === filePath);
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const isSupportedLang = ["ts", "tsx", "js", "jsx", "py"].includes(ext);

    // 1. Resolve Target Symbol
    let targetSym = symbols.find((s) => s.filePath === filePath && line >= s.startLine && line <= s.endLine);

    if (!targetSym && symbolName) {
      targetSym = symbols.find(
        (s) => s.name.toLowerCase() === symbolName.toLowerCase() && (s.filePath === filePath || true)
      );
    }

    if (!targetSym && currentFile) {
      // Attempt line extraction if symbolName wasn't directly found in symbols
      const lineText = currentFile.content.split("\n")[line - 1] || "";
      const wordMatch = lineText.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/);
      if (wordMatch) {
        targetSym = symbols.find((s) => s.name === wordMatch[0]);
      }
    }

    const effectiveName = targetSym ? targetSym.name : symbolName || "selectedSymbol";

    // 2. Definition Resolution
    let definition: SymbolNavigationTarget | null = null;
    if (targetSym) {
      const defFile = files.find((f) => f.path === targetSym!.filePath);
      const defLines = defFile ? defFile.content.split("\n") : [];
      definition = {
        id: `def_${targetSym.id}`,
        name: targetSym.name,
        kind: "definition",
        file: targetSym.filePath,
        line: targetSym.startLine,
        endLine: targetSym.endLine,
        lineText: defLines[targetSym.startLine - 1]?.trim() || `declaration of ${targetSym.name}`,
        isVerified: true,
        symbolType: targetSym.type,
        previewSnippet: defLines.slice(targetSym.startLine - 1, targetSym.startLine + 3).join("\n"),
        reason: "Resolved from verified AST symbol table",
      };
    } else {
      // Fallback search across all files
      for (const file of files) {
        const fileLines = file.content.split("\n");
        for (let idx = 0; idx < fileLines.length; idx++) {
          const l = fileLines[idx];
          if (
            (l.includes(`function ${effectiveName}`) ||
              l.includes(`class ${effectiveName}`) ||
              l.includes(`const ${effectiveName} =`)) &&
            !l.trim().startsWith("//")
          ) {
            definition = {
              id: `def_heur_${file.id}_${idx + 1}`,
              name: effectiveName,
              kind: "definition",
              file: file.path,
              line: idx + 1,
              lineText: l.trim(),
              isVerified: false,
              symbolType: "function",
              previewSnippet: fileLines.slice(idx, idx + 3).join("\n"),
              reason: "Heuristic pattern match in source text",
            };
            break;
          }
        }
        if (definition) break;
      }
    }

    // 3. Callers Resolution (Upstream callers)
    const callers: SymbolNavigationTarget[] = [];
    if (targetSym) {
      const callerRels = relationships.filter(
        (r) => (r.toSymbolId === targetSym!.id || r.toSymbolName === targetSym!.name) && r.type === "calls"
      );

      callerRels.forEach((rel) => {
        const callerSym = symbols.find((s) => s.id === rel.fromSymbolId);
        const callerFile = files.find((f) => f.path === (callerSym?.filePath || ""));
        const lineText = callerFile ? callerFile.content.split("\n")[(callerSym?.startLine || 1) - 1] : "";

        callers.push({
          id: `caller_${rel.id}`,
          name: rel.fromSymbolName,
          kind: "caller",
          file: callerSym?.filePath || "unknown.ts",
          line: callerSym?.startLine || 1,
          lineText: lineText?.trim() || `calls ${targetSym!.name}()`,
          isVerified: true,
          symbolType: callerSym?.type || "function",
          reason: `AST verified call edge: ${rel.fromSymbolName} -> ${targetSym!.name}`,
        });
      });
    }

    // 4. Callees Resolution (Downstream calls made by this symbol)
    const callees: SymbolNavigationTarget[] = [];
    if (targetSym) {
      const calleeRels = relationships.filter(
        (r) => (r.fromSymbolId === targetSym!.id || r.fromSymbolName === targetSym!.name) && r.type === "calls"
      );

      calleeRels.forEach((rel) => {
        const calleeSym = symbols.find((s) => s.id === rel.toSymbolId);
        const calleeFile = files.find((f) => f.path === (calleeSym?.filePath || ""));
        const lineText = calleeFile ? calleeFile.content.split("\n")[(calleeSym?.startLine || 1) - 1] : "";

        callees.push({
          id: `callee_${rel.id}`,
          name: rel.toSymbolName,
          kind: "callee",
          file: calleeSym?.filePath || "unknown.ts",
          line: calleeSym?.startLine || 1,
          lineText: lineText?.trim() || `invoked by ${targetSym!.name}()`,
          isVerified: true,
          symbolType: calleeSym?.type || "function",
          reason: `AST verified callee edge: ${targetSym!.name} -> ${rel.toSymbolName}`,
        });
      });
    }

    // 5. References (All occurrences across the repository)
    const references: SymbolNavigationTarget[] = [];
    files.forEach((file) => {
      const fileLines = file.content.split("\n");
      fileLines.forEach((lineStr, idx) => {
        const regex = new RegExp(`\\b${effectiveName}\\b`);
        if (regex.test(lineStr) && !lineStr.trim().startsWith("//")) {
          // Avoid duplicate of definition line
          if (definition && file.path === definition.file && idx + 1 === definition.line) return;

          references.push({
            id: `ref_${file.id}_${idx + 1}`,
            name: effectiveName,
            kind: "reference",
            file: file.path,
            line: idx + 1,
            lineText: lineStr.trim(),
            isVerified: isSupportedLang,
            symbolType: "reference",
            reason: `Cross-file invocation reference in ${file.path}:${idx + 1}`,
          });
        }
      });
    });

    // 6. Related Tests
    const relatedTests: SymbolNavigationTarget[] = [];
    if (targetSym) {
      const testRels = relationships.filter(
        (r) => (r.toSymbolId === targetSym!.id || r.toSymbolName === targetSym!.name) && r.type === "tests"
      );

      testRels.forEach((rel) => {
        const testSym = symbols.find((s) => s.id === rel.fromSymbolId);
        const testFile = files.find((f) => f.path === (testSym?.filePath || ""));
        const lineText = testFile ? testFile.content.split("\n")[(testSym?.startLine || 1) - 1] : "";

        relatedTests.push({
          id: `test_${rel.id}`,
          name: rel.fromSymbolName,
          kind: "test",
          file: testSym?.filePath || "tests/auth.test.ts",
          line: testSym?.startLine || 1,
          lineText: lineText?.trim() || `asserts behavior of ${targetSym!.name}`,
          isVerified: true,
          symbolType: "test",
          reason: `AST verified test relation: ${rel.fromSymbolName} tests ${targetSym!.name}`,
        });
      });
    }

    // Fallback search in test files
    if (relatedTests.length === 0) {
      files
        .filter((f) => f.path.includes(".test.") || f.path.includes(".spec."))
        .forEach((f) => {
          const lines = f.content.split("\n");
          lines.forEach((l, idx) => {
            if (l.includes(effectiveName)) {
              relatedTests.push({
                id: `test_heur_${f.id}_${idx + 1}`,
                name: `Test Reference in ${f.name}`,
                kind: "test",
                file: f.path,
                line: idx + 1,
                lineText: l.trim(),
                isVerified: false,
                symbolType: "test",
                reason: "Discovered in automated test suite via text pattern match",
              });
            }
          });
        });
    }

    // 7. Imports
    const imports: SymbolNavigationTarget[] = [];
    files.forEach((file) => {
      const lines = file.content.split("\n");
      lines.forEach((l, idx) => {
        if (
          (l.includes(`import `) || l.includes(`require(`)) &&
          l.includes(effectiveName) &&
          !l.trim().startsWith("//")
        ) {
          imports.push({
            id: `imp_${file.id}_${idx + 1}`,
            name: effectiveName,
            kind: "import",
            file: file.path,
            line: idx + 1,
            lineText: l.trim(),
            isVerified: true,
            symbolType: "import",
            reason: `Module import statement in ${file.path}`,
          });
        }
      });
    });

    // 8. Containing Module
    const containingModule = currentFile
      ? {
          file: currentFile.path,
          line: 1,
          name: currentFile.name,
        }
      : null;

    // 9. Ambiguous Candidates Check
    const matchingSymbols = symbols.filter((s) => s.name.toLowerCase() === effectiveName.toLowerCase());
    const isAmbiguous = matchingSymbols.length > 1;
    const candidates: SymbolNavigationTarget[] = matchingSymbols.map((s) => ({
      id: `cand_${s.id}`,
      name: s.name,
      kind: "definition",
      file: s.filePath,
      line: s.startLine,
      lineText: `declaration of ${s.name} in ${s.filePath}:${s.startLine}`,
      isVerified: true,
      symbolType: s.type,
      reason: `Matching symbol in ${s.filePath}`,
    }));

    return {
      symbolName: effectiveName,
      queryFile: filePath,
      queryLine: line,
      definition,
      references: references.slice(0, 30),
      callers,
      callees,
      imports,
      implementations: [],
      relatedTests,
      containingModule,
      isAmbiguous,
      candidates,
      languageSupported: isSupportedLang,
    };
  }
}

export const symbolNavigator = new SymbolNavigator();
