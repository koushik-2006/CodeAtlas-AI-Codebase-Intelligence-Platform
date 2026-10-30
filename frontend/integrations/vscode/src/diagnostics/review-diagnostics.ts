import * as vscode from "vscode";
import { ReviewFindingItem } from "../types";
import { resolveSafeWorkspaceUri } from "../utils/path-safety";

export class ReviewDiagnosticsManager {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private findingsByUri = new Map<string, ReviewFindingItem[]>();

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection("codeatlas");
  }

  public getCollection(): vscode.DiagnosticCollection {
    return this.diagnosticCollection;
  }

  public getFinding(uri: vscode.Uri, code: string | number | undefined): ReviewFindingItem | undefined {
    if (!code) return undefined;
    const list = this.findingsByUri.get(uri.toString());
    return list?.find((f) => f.id === String(code));
  }

  public updateDiagnostics(filePath: string, findings: ReviewFindingItem[]): void {
    const uri = resolveSafeWorkspaceUri(filePath);
    if (!uri) return;

    this.findingsByUri.set(uri.toString(), findings);

    const diagnostics: vscode.Diagnostic[] = findings.map((f) => {
      const lineNum = Math.max(0, f.line - 1);
      const endLineNum = f.lineRange && f.lineRange.includes("-")
        ? Math.max(lineNum, parseInt(f.lineRange.split("-")[1], 10) - 1)
        : lineNum;

      const range = new vscode.Range(
        new vscode.Position(lineNum, 0),
        new vscode.Position(endLineNum, 120)
      );

      let severity = vscode.DiagnosticSeverity.Information;
      if (f.severity === "critical") {
        severity = vscode.DiagnosticSeverity.Error;
      } else if (f.severity === "warning") {
        severity = vscode.DiagnosticSeverity.Warning;
      }

      const diag = new vscode.Diagnostic(
        range,
        `[CodeAtlas ${f.category.toUpperCase()}] ${f.title}: ${f.description}`,
        severity
      );
      diag.source = "CodeAtlas";
      diag.code = f.id;

      return diag;
    });

    this.diagnosticCollection.set(uri, diagnostics);
  }

  public clearAll(): void {
    this.diagnosticCollection.clear();
    this.findingsByUri.clear();
  }

  public dispose(): void {
    this.diagnosticCollection.dispose();
    this.findingsByUri.clear();
  }
}
