"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveEditorContext = getActiveEditorContext;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
function getActiveEditorContext() {
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
    }
    else {
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
//# sourceMappingURL=document-context.js.map