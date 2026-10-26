import * as vscode from "vscode";
import { ReviewDiagnosticsManager } from "./review-diagnostics";

export class CodeAtlasQuickFixProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  private diagnosticsManager: ReviewDiagnosticsManager;

  constructor(diagnosticsManager: ReviewDiagnosticsManager) {
    this.diagnosticsManager = diagnosticsManager;
  }

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source !== "CodeAtlas") continue;

      const codeVal = typeof diagnostic.code === "object" && diagnostic.code !== null ? diagnostic.code.value : diagnostic.code;
      const finding = this.diagnosticsManager.getFinding(document.uri, codeVal);
      if (!finding) continue;

      // Quick Action 1: View Remediation Advice
      const viewAction = new vscode.CodeAction(
        `CodeAtlas: Review advice for "${finding.title}"`,
        vscode.CodeActionKind.QuickFix
      );
      viewAction.diagnostics = [diagnostic];
      viewAction.command = {
        command: "codeatlas.showRemediationModal",
        title: "Show Remediation",
        arguments: [finding],
      };
      actions.push(viewAction);

      // Quick Action 2: Insert Suggested Remediation Comment
      if (finding.suggestedRemediation) {
        const fixAction = new vscode.CodeAction(
          `CodeAtlas: Insert recommended fix comment`,
          vscode.CodeActionKind.QuickFix
        );
        fixAction.diagnostics = [diagnostic];

        const edit = new vscode.WorkspaceEdit();
        const lineNum = Math.max(0, finding.line - 1);
        const insertPosition = new vscode.Position(lineNum, 0);
        const commentText = `// [CodeAtlas Remediation]: ${finding.suggestedRemediation}\n`;
        edit.insert(document.uri, insertPosition, commentText);

        fixAction.edit = edit;
        actions.push(fixAction);
      }
    }

    return actions;
  }
}
