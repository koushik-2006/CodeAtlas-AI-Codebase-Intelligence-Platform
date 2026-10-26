import { NextRequest, NextResponse } from "next/server";
import { codeExplainer } from "@/lib/server/code-explainer";
import { db } from "@/lib/server/db";
import { aiProvider } from "@/lib/server/ai-provider";
import { sanitizeCodePayload } from "@/lib/server/security";
import { VsCodeExplainRequest, VsCodeExplainResponse } from "@/types/vscode-integration";
import { CitationReference } from "@/types/assistant";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body: VsCodeExplainRequest = await request.json();
    const {
      repositoryId = "sample-project",
      filePath = "active-editor",
      code,
      language = "typescript",
      startLine = 1,
      endLine,
    } = body;

    const sanitized = sanitizeCodePayload(code || "");
    if (!sanitized.valid || !sanitized.code) {
      return NextResponse.json(
        { success: false, message: sanitized.error || "A valid code snippet is required." },
        { status: 400 }
      );
    }

    // 1. Generate line-by-line breakdown and complexity via codeExplainer
    const explanation = await codeExplainer.explainSnippet(sanitized.code, language);

    // 2. Resolve related symbols and dependencies from AST database if repo is available
    const repoSymbols = db.getCodeSymbols(repositoryId);
    const repoFiles = db.getRepositoryFiles(repositoryId);

    const relatedSymbols: Array<{ name: string; kind: string; file?: string; line?: number }> = [];
    const sourceCitations: CitationReference[] = [];

    // Extract dependencies from code (e.g. import statements)
    const dependencies: string[] = [];
    const importRegex = /(?:import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"])|(?:require\(['"]([^'"]+)['"]\))/g;
    let match;
    while ((match = importRegex.exec(sanitized.code)) !== null) {
      const dep = match[1] || match[2];
      if (dep && !dependencies.includes(dep)) {
        dependencies.push(dep);
      }
    }

    // Extract potential function calls in the snippet and match against repository symbols
    for (const sym of repoSymbols) {
      if (sanitized.code.includes(sym.name) && sym.filePath !== filePath) {
        if (!relatedSymbols.some((r) => r.name === sym.name)) {
          relatedSymbols.push({
            name: sym.name,
            kind: sym.type,
            file: sym.filePath,
            line: sym.startLine,
          });

          // Add citation reference
          sourceCitations.push({
            file: sym.filePath,
            startLine: sym.startLine,
            endLine: sym.endLine,
            lineRange: `${sym.startLine}-${sym.endLine}`,
            symbol: `${sym.type} ${sym.name}`,
            reason: `Referenced symbol in ${sym.filePath}`,
          });
        }
      }
    }

    // If source file exists in repo, add primary citation
    const currentFileRecord = repoFiles.find((f) => f.path === filePath);
    if (currentFileRecord) {
      sourceCitations.unshift({
        file: filePath,
        startLine: startLine,
        endLine: endLine || startLine + sanitized.code.split("\n").length - 1,
        lineRange: `${startLine}-${endLine || startLine + sanitized.code.split("\n").length - 1}`,
        symbol: sanitized.code.split("\n")[0] || "",
        reason: "Selected snippet location in active editor",
      });
    }

    // Detect parameter and return type signatures
    const paramMatch = sanitized.code.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?)\s*\(([^)]*)\)(?:\s*:\s*([^{=>]+))?/);
    const parameters = paramMatch && paramMatch[1] ? paramMatch[1].split(",").map((p) => p.trim()).filter(Boolean) : [];
    const returnType = paramMatch && paramMatch[2] ? paramMatch[2].trim() : "inferred (void/any)";

    // Detect edge cases
    const edgeCases: string[] = [];
    if (sanitized.code.includes("null") || sanitized.code.includes("undefined")) {
      edgeCases.push("Handles nullish or undefined value evaluation");
    }
    if (sanitized.code.includes("try") || sanitized.code.includes("catch")) {
      edgeCases.push("Catches and recovers from runtime exceptions");
    }
    if (sanitized.code.includes("length") || sanitized.code.includes("0")) {
      edgeCases.push("Boundary condition check for empty collections or zero-length inputs");
    }
    if (edgeCases.length === 0) {
      edgeCases.push("Standard synchronous/asynchronous execution path without explicit guard checks");
    }

    const aiStatus = aiProvider.getStatus();

    const responseData: VsCodeExplainResponse = {
      success: true,
      summary: explanation.summary,
      purpose: explanation.purpose,
      howItWorks: explanation.lineByLine,
      inputsAndOutputs: {
        parameters,
        returnType,
      },
      dependencies,
      edgeCases,
      potentialIssues: explanation.potentialIssues.length > 0 ? explanation.potentialIssues : [
        "Ensure all inputs are validated before passing to downstream network callers.",
      ],
      complexity: explanation.complexity,
      relatedSymbols: relatedSymbols.slice(0, 10),
      sourceCitations: sourceCitations.slice(0, 8),
      isConfigured: aiStatus.isConfigured,
      provider: aiStatus.provider,
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("VS Code explain route error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to explain selected code" },
      { status: 500 }
    );
  }
}
