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
exports.navigateToSource = navigateToSource;
const vscode = __importStar(require("vscode"));
const path_safety_1 = require("../utils/path-safety");
const logger_1 = require("../utils/logger");
async function navigateToSource(filePath, startLine = 1, endLine) {
    try {
        const uri = (0, path_safety_1.resolveSafeWorkspaceUri)(filePath);
        if (!uri) {
            vscode.window.showWarningMessage(`CodeAtlas: Could not resolve file path safely within active workspace: ${filePath}`);
            return false;
        }
        // Attempt to open text document
        let document;
        try {
            document = await vscode.workspace.openTextDocument(uri);
        }
        catch {
            vscode.window.showWarningMessage(`CodeAtlas: File '${filePath}' does not exist in local workspace.`);
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
        const range = new vscode.Range(new vscode.Position(boundedStart, 0), new vscode.Position(boundedEnd, document.lineAt(boundedEnd).text.length));
        editor.selection = new vscode.Selection(range.start, range.end);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        logger_1.logger.log(`Navigated to ${filePath}:${startLine}`);
        return true;
    }
    catch (err) {
        logger_1.logger.error(`Navigation failed for ${filePath}:${startLine}`, err);
        vscode.window.showErrorMessage(`CodeAtlas navigation error: ${err.message}`);
        return false;
    }
}
//# sourceMappingURL=source-navigator.js.map