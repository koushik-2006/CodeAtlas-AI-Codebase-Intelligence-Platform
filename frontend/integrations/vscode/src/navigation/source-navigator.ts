import * as vscode from "vscode";
import { resolveSafeWorkspaceUri } from "../utils/path-safety";
import { logger } from "../utils/logger";

export async function navigateToSource(
  filePath: string,
  startLine: number = 1,
  endLine?: number
): Promise<boolean> {
  try {
    const uri = resolveSafeWorkspaceUri(filePath);
    if (!uri) {
      vscode.window.showWarningMessage(
        `CodeAtlas: Could not resolve file path safely within active workspace: ${filePath}`
      );
      return false;
    }

    // Attempt to open text document
    let document: vscode.TextDocument;
    try {
      document = await vscode.workspace.openTextDocument(uri);
    } catch {
      vscode.window.showWarningMessage(
        `CodeAtlas: File '${filePath}' does not exist in local workspace.`
      );
      return false;
    }

    const editor = await vscode.window.showTextDocument(document, {
      preview: true,
      preserveFocus: false,
    });

    // Bound line within document length
    const totalLines = document.lineCount;
    const boundedStart = Math.max(0, Math.min(startLine - 1, totalLines - 1));
    const boundedEnd = endLine ? Math.max(0, Math.min(endLine - 1, totalLines - 1)) : boundedStart;

    const range = new vscode.Range(
      new vscode.Position(boundedStart, 0),
      new vscode.Position(boundedEnd, document.lineAt(boundedEnd).text.length)
    );

    editor.selection = new vscode.Selection(range.start, range.end);
    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);

    logger.log(`Navigated to ${filePath}:${startLine}`);
    return true;
  } catch (err: any) {
    logger.error(`Navigation failed for ${filePath}:${startLine}`, err);
    vscode.window.showErrorMessage(`CodeAtlas navigation error: ${err.message}`);
    return false;
  }
}
