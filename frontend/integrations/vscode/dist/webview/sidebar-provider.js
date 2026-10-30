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
exports.CodeAtlasSidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const sidebar_html_1 = require("./sidebar-html");
const document_context_1 = require("../context/document-context");
const source_navigator_1 = require("../navigation/source-navigator");
const logger_1 = require("../utils/logger");
class CodeAtlasSidebarProvider {
    static viewType = "codeatlas.sidebarView";
    view;
    extensionUri;
    sessionManager;
    diagnosticsManager;
    constructor(extensionUri, sessionManager, diagnosticsManager) {
        this.extensionUri = extensionUri;
        this.sessionManager = sessionManager;
        this.diagnosticsManager = diagnosticsManager;
        // Listen to session changes and notify webview
        this.sessionManager.onDidChangeState((state) => {
            this.postMessage({
                type: "setConnectionState",
                state,
            });
        });
    }
    resolveWebviewView(webviewView, context, token) {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri],
        };
        webviewView.webview.html = (0, sidebar_html_1.getSidebarHtml)(webviewView.webview, this.extensionUri);
        // Initial state push
        this.postMessage({
            type: "setConnectionState",
            state: this.sessionManager.getState(),
        });
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            await this.handleWebviewMessage(message);
        });
    }
    postMessage(message) {
        this.view?.webview.postMessage(message);
    }
    showResult(category, data) {
        this.postMessage({
            type: "showResult",
            category,
            data,
        });
    }
    async handleWebviewMessage(message) {
        try {
            switch (message.type) {
                case "connect": {
                    this.postMessage({ type: "setLoading", loading: true, message: "Connecting to CodeAtlas..." });
                    try {
                        await this.sessionManager.connect(message.serverUrl, message.token);
                        vscode.window.showInformationMessage("CodeAtlas: Successfully connected!");
                    }
                    catch (err) {
                        vscode.window.showErrorMessage(`CodeAtlas connection failed: ${err.message}`);
                    }
                    finally {
                        this.postMessage({ type: "setLoading", loading: false });
                    }
                    break;
                }
                case "disconnect": {
                    await this.sessionManager.disconnect();
                    vscode.window.showInformationMessage("CodeAtlas: Disconnected.");
                    break;
                }
                case "selectRepository": {
                    try {
                        await this.sessionManager.selectRepository(message.repositoryId);
                    }
                    catch (err) {
                        vscode.window.showErrorMessage(err.message);
                    }
                    break;
                }
                case "refreshState": {
                    this.postMessage({ type: "setLoading", loading: true, message: "Refreshing repository state..." });
                    try {
                        await this.sessionManager.refresh();
                    }
                    catch (err) {
                        vscode.window.showWarningMessage(`CodeAtlas refresh note: ${err.message}`);
                    }
                    finally {
                        this.postMessage({ type: "setLoading", loading: false });
                    }
                    break;
                }
                case "openFile": {
                    if (message.file) {
                        await (0, source_navigator_1.navigateToSource)(message.file, message.line || 1, message.endLine);
                    }
                    break;
                }
                case "openDashboard": {
                    const state = this.sessionManager.getState();
                    const dashboardUrl = `${state.serverUrl}/dashboard`;
                    await vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
                    break;
                }
                case "askQuestion": {
                    await this.executeAskQuestion(message.question, message.selectedCode);
                    break;
                }
                case "explainCode": {
                    await this.executeExplainCode(message.code);
                    break;
                }
                case "reviewCode": {
                    await this.executeReviewCode();
                    break;
                }
                case "analyzeImpact": {
                    await this.executeAnalyzeImpact();
                    break;
                }
                case "analyzeStackTrace": {
                    await this.executeAnalyzeStackTrace(message.stackTrace);
                    break;
                }
            }
        }
        catch (err) {
            logger_1.logger.error("Webview message dispatch error:", err);
            this.postMessage({ type: "setError", message: err.message || "Operation failed." });
        }
    }
    async executeAskQuestion(question, selectedCode) {
        const state = this.sessionManager.getState();
        const client = this.sessionManager.getClient();
        const editorCtx = (0, document_context_1.getActiveEditorContext)();
        this.postMessage({ type: "setLoading", loading: true, message: "Synthesizing codebase answer..." });
        try {
            const result = await client.askQuestion({
                repositoryId: state.selectedRepositoryId || "sample-project",
                question,
                selectedCode: selectedCode || editorCtx.selectedText,
                activeFile: editorCtx.relativePath,
                activeLine: editorCtx.activeLine,
            });
            this.showResult("qa", result);
        }
        catch (err) {
            vscode.window.showErrorMessage(`CodeAtlas Q&A error: ${err.message}`);
        }
        finally {
            this.postMessage({ type: "setLoading", loading: false });
        }
    }
    async executeExplainCode(codeOverride) {
        const state = this.sessionManager.getState();
        const client = this.sessionManager.getClient();
        const editorCtx = (0, document_context_1.getActiveEditorContext)();
        const code = codeOverride || editorCtx.selectedText;
        if (!code || !code.trim()) {
            vscode.window.showWarningMessage("CodeAtlas: Please select a code block or function in the active editor to explain.");
            return;
        }
        this.postMessage({ type: "setLoading", loading: true, message: "Analyzing code structure and symbols..." });
        try {
            const result = await client.explainCode({
                repositoryId: state.selectedRepositoryId || "sample-project",
                filePath: editorCtx.relativePath || "active-editor",
                code,
                language: editorCtx.languageId || "typescript",
                startLine: editorCtx.startLine,
                endLine: editorCtx.endLine,
            });
            this.showResult("explain", result);
        }
        catch (err) {
            vscode.window.showErrorMessage(`CodeAtlas Explain error: ${err.message}`);
        }
        finally {
            this.postMessage({ type: "setLoading", loading: false });
        }
    }
    async executeReviewCode() {
        const state = this.sessionManager.getState();
        const client = this.sessionManager.getClient();
        const editorCtx = (0, document_context_1.getActiveEditorContext)();
        let codeToReview = editorCtx.selectedText;
        if (!codeToReview && editorCtx.document) {
            codeToReview = editorCtx.document.getText();
        }
        if (!codeToReview || !codeToReview.trim()) {
            vscode.window.showWarningMessage("CodeAtlas: No active file or code selection to review.");
            return;
        }
        this.postMessage({ type: "setLoading", loading: true, message: "Running security and bug inspection..." });
        try {
            const result = await client.reviewCode({
                repositoryId: state.selectedRepositoryId || "sample-project",
                filePath: editorCtx.relativePath || "active-file.ts",
                code: codeToReview,
                language: editorCtx.languageId || "typescript",
            });
            // Update in-editor diagnostics if file is available
            if (editorCtx.relativePath) {
                this.diagnosticsManager.updateDiagnostics(editorCtx.relativePath, result.findings);
            }
            this.showResult("review", result);
            if (result.findings.length > 0) {
                vscode.window.showInformationMessage(`CodeAtlas: Review identified ${result.findings.length} findings in ${editorCtx.fileName}.`);
            }
            else {
                vscode.window.showInformationMessage("CodeAtlas: Review complete — 0 issues found.");
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`CodeAtlas Review error: ${err.message}`);
        }
        finally {
            this.postMessage({ type: "setLoading", loading: false });
        }
    }
    async executeAnalyzeImpact() {
        const state = this.sessionManager.getState();
        const client = this.sessionManager.getClient();
        const editorCtx = (0, document_context_1.getActiveEditorContext)();
        if (!editorCtx.relativePath) {
            vscode.window.showWarningMessage("CodeAtlas: Open a source file to analyze change impact.");
            return;
        }
        this.postMessage({ type: "setLoading", loading: true, message: "Evaluating downstream change impact..." });
        try {
            const result = await client.analyzeImpact({
                repositoryId: state.selectedRepositoryId || "sample-project",
                filePath: editorCtx.relativePath,
                symbolName: editorCtx.currentWord,
                proposedChange: editorCtx.isDirty ? "unsaved-buffer" : undefined,
            });
            this.showResult("impact", result);
            if (result.bufferWarning) {
                vscode.window.showWarningMessage(result.bufferWarning);
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`CodeAtlas Impact analysis error: ${err.message}`);
        }
        finally {
            this.postMessage({ type: "setLoading", loading: false });
        }
    }
    async executeAnalyzeStackTrace(traceOverride) {
        const state = this.sessionManager.getState();
        const client = this.sessionManager.getClient();
        const editorCtx = (0, document_context_1.getActiveEditorContext)();
        let stackTrace = traceOverride;
        if (!stackTrace && editorCtx.hasSelection && editorCtx.selectedText) {
            stackTrace = editorCtx.selectedText;
        }
        if (!stackTrace) {
            stackTrace = await vscode.window.showInputBox({
                prompt: "Paste runtime error stack trace",
                placeHolder: "Error: ... at function (file.ts:12:4)",
            });
        }
        if (!stackTrace || !stackTrace.trim()) {
            vscode.window.showWarningMessage("CodeAtlas: Stack trace input is required.");
            return;
        }
        this.postMessage({ type: "setLoading", loading: true, message: "Mapping trace frames to workspace..." });
        try {
            const result = await client.analyzeStackTrace({
                repositoryId: state.selectedRepositoryId || "sample-project",
                stackTrace,
            });
            this.showResult("debug", result);
        }
        catch (err) {
            vscode.window.showErrorMessage(`CodeAtlas Stack Trace error: ${err.message}`);
        }
        finally {
            this.postMessage({ type: "setLoading", loading: false });
        }
    }
}
exports.CodeAtlasSidebarProvider = CodeAtlasSidebarProvider;
//# sourceMappingURL=sidebar-provider.js.map