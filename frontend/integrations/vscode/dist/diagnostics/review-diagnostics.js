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
exports.ReviewDiagnosticsManager = void 0;
const vscode = __importStar(require("vscode"));
const path_safety_1 = require("../utils/path-safety");
class ReviewDiagnosticsManager {
    diagnosticCollection;
    findingsByUri = new Map();
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection("codeatlas");
    }
    getCollection() {
        return this.diagnosticCollection;
    }
    getFinding(uri, code) {
        if (!code)
            return undefined;
        const list = this.findingsByUri.get(uri.toString());
        return list?.find((f) => f.id === String(code));
    }
    updateDiagnostics(filePath, findings) {
        const uri = (0, path_safety_1.resolveSafeWorkspaceUri)(filePath);
        if (!uri)
            return;
        this.findingsByUri.set(uri.toString(), findings);
        const diagnostics = findings.map((f) => {
            const lineNum = Math.max(0, f.line - 1);
            const endLineNum = f.lineRange && f.lineRange.includes("-")
                ? Math.max(lineNum, parseInt(f.lineRange.split("-")[1], 10) - 1)
                : lineNum;
            const range = new vscode.Range(new vscode.Position(lineNum, 0), new vscode.Position(endLineNum, 120));
            let severity = vscode.DiagnosticSeverity.Information;
            if (f.severity === "critical") {
                severity = vscode.DiagnosticSeverity.Error;
            }
            else if (f.severity === "warning") {
                severity = vscode.DiagnosticSeverity.Warning;
            }
            const diag = new vscode.Diagnostic(range, `[CodeAtlas ${f.category.toUpperCase()}] ${f.title}: ${f.description}`, severity);
            diag.source = "CodeAtlas";
            diag.code = f.id;
            return diag;
        });
        this.diagnosticCollection.set(uri, diagnostics);
    }
    clearAll() {
        this.diagnosticCollection.clear();
        this.findingsByUri.clear();
    }
    dispose() {
        this.diagnosticCollection.dispose();
        this.findingsByUri.clear();
    }
}
exports.ReviewDiagnosticsManager = ReviewDiagnosticsManager;
//# sourceMappingURL=review-diagnostics.js.map