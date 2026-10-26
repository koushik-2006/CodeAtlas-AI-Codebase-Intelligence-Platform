import * as vscode from "vscode";
import * as path from "path";

export interface EditorContext {
  hasActiveEditor: boolean;
  document?: vscode.TextDocument;
  filePath?: string;
  relativePath?: string;
  fileName?: string;
  languageId?: string;
  hasSelection: boolean;
  selectedText?: string;
  startLine?: number;
  endLine?: number;
  activeLine?: number;
  currentWord?: string;
  isDirty?: boolean;
}

export function getActiveEditorContext(): EditorContext {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return {
      hasActiveEditor: false,
      hasSelection: false,
    };
  }

  const document = editor.document;
  const selection = editor.selection;
  const isSelectionEmpty = selection.isEmpty;

  let selectedText = "";
  let startLine = 1;
  let endLine = 1;

  if (!isSelectionEmpty) {
    selectedText = document.getText(selection);
    startLine = selection.start.line + 1;
    endLine = selection.end.line + 1;
  } else {
    // If no selection, default to the current line or entire document if small
    selectedText = document.lineAt(selection.active.line).text;
    startLine = selection.active.line + 1;
    endLine = selection.active.line + 1;
  }

  const fsPath = document.uri.fsPath;
  let relativePath = vscode.workspace.asRelativePath(document.uri, false);
  if (relativePath.includes(":") || relativePath.startsWith("/")) {
    relativePath = path.basename(fsPath);
  }
  relativePath = relativePath.replace(/\\/g, "/");

  // Determine current symbol/word at cursor
  const wordRange = document.getWordRangeAtPosition(selection.active);
  const currentWord = wordRange ? document.getText(wordRange) : undefined;

  return {
    hasActiveEditor: true,
    document,
    filePath: fsPath,
    relativePath,
    fileName: path.basename(fsPath),
    languageId: document.languageId,
    hasSelection: !isSelectionEmpty,
    selectedText: selectedText.trim(),
    startLine,
    endLine,
    activeLine: selection.active.line + 1,
    currentWord,
    isDirty: document.isDirty,
  };
}
