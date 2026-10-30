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
exports.CodeAtlasQuickFixProvider = void 0;
const vscode = __importStar(require("vscode"));
class CodeAtlasQuickFixProvider {
    static providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
    diagnosticsManager;
    constructor(diagnosticsManager) {
        this.diagnosticsManager = diagnosticsManager;
    }
    provideCodeActions(document, range, context, token) {
        const actions = [];
        for (const diagnostic of context.diagnostics) {
            if (diagnostic.source !== "CodeAtlas")
                continue;
            const codeVal = typeof diagnostic.code === "object" && diagnostic.code !== null ? diagnostic.code.value : diagnostic.code;
            const finding = this.diagnosticsManager.getFinding(document.uri, codeVal);
            if (!finding)
                continue;
            // Quick Action 1: View Remediation Advice
            const viewAction = new vscode.CodeAction(`CodeAtlas: Review advice for "${finding.title}"`, vscode.CodeActionKind.QuickFix);
            viewAction.diagnostics = [diagnostic];
            viewAction.command = {
                command: "codeatlas.showRemediationModal",
                title: "Show Remediation",
                arguments: [finding],
            };
            actions.push(viewAction);
            // Quick Action 2: Insert Suggested Remediation Comment
            if (finding.suggestedRemediation) {
                const fixAction = new vscode.CodeAction(`CodeAtlas: Insert recommended fix comment`, vscode.CodeActionKind.QuickFix);
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
exports.CodeAtlasQuickFixProvider = CodeAtlasQuickFixProvider;
//# sourceMappingURL=quick-fix-provider.js.map