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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const codeatlas_client_1 = require("./api/codeatlas-client");
const session_manager_1 = require("./auth/session-manager");
const review_diagnostics_1 = require("./diagnostics/review-diagnostics");
const quick_fix_provider_1 = require("./diagnostics/quick-fix-provider");
const sidebar_provider_1 = require("./webview/sidebar-provider");
const command_manager_1 = require("./commands/command-manager");
const logger_1 = require("./utils/logger");
const document_context_1 = require("./context/document-context");
let statusBarItem;
async function activate(context) {
    logger_1.logger.init();
    logger_1.logger.log("Activating CodeAtlas VS Code Extension v1.0.0...");
    // 1. Initialize API Client & Session Manager
    const apiClient = new codeatlas_client_1.CodeAtlasApiClient();
    const sessionManager = new session_manager_1.SessionManager(context.secrets, apiClient);
    // 2. Initialize Diagnostics & Quick Fixes
    const diagnosticsManager = new review_diagnostics_1.ReviewDiagnosticsManager();
    context.subscriptions.push(diagnosticsManager.getCollection());
    const quickFixProvider = new quick_fix_provider_1.CodeAtlasQuickFixProvider(diagnosticsManager);
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider([
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "typescriptreact" },
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "javascriptreact" },
        { scheme: "file", language: "python" },
        { scheme: "file", language: "json" },
    ], quickFixProvider, {
        providedCodeActionKinds: quick_fix_provider_1.CodeAtlasQuickFixProvider.providedCodeActionKinds,
    }));
    // 3. Register Webview Sidebar Provider
    const sidebarProvider = new sidebar_provider_1.CodeAtlasSidebarProvider(context.extensionUri, sessionManager, diagnosticsManager);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebar_provider_1.CodeAtlasSidebarProvider.viewType, sidebarProvider, {
        webviewOptions: {
            retainContextWhenHidden: true,
        },
    }));
    // 4. Register All CodeAtlas Commands
    (0, command_manager_1.registerCommands)(context, sessionManager, sidebarProvider);
    // 5. Setup Status Bar Indicator
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = "codeatlas.selectRepository";
    context.subscriptions.push(statusBarItem);
    updateStatusBar(sessionManager);
    // Update status bar when connection changes
    context.subscriptions.push(sessionManager.onDidChangeState(() => {
        updateStatusBar(sessionManager);
    }));
    // 6. Listen to active editor changes to provide context
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
        const editorCtx = (0, document_context_1.getActiveEditorContext)();
        if (editorCtx.hasActiveEditor && editorCtx.relativePath) {
            sidebarProvider.postMessage({
                type: "selectionChanged",
                code: editorCtx.selectedText || "",
                file: editorCtx.relativePath,
                line: editorCtx.startLine || 1,
                endLine: editorCtx.endLine || 1,
                language: editorCtx.languageId || "typescript",
            });
        }
    }));
    // 7. Initialize session
    await sessionManager.initialize();
    logger_1.logger.log("CodeAtlas VS Code Extension successfully activated.");
}
function updateStatusBar(sessionManager) {
    const state = sessionManager.getState();
    if (state.isConnected) {
        const repoLabel = state.selectedRepositoryId ? ` (${state.selectedRepositoryId})` : "";
        statusBarItem.text = `$(compass) CodeAtlas: Connected${repoLabel}`;
        statusBarItem.tooltip = `CodeAtlas is connected to ${state.serverUrl}\nActive Repository: ${state.selectedRepositoryId || "None selected"}\nClick to switch repository`;
        statusBarItem.backgroundColor = undefined;
    }
    else {
        statusBarItem.text = "$(plug) CodeAtlas: Disconnected";
        statusBarItem.tooltip = state.lastError
            ? `CodeAtlas disconnected: ${state.lastError}\nClick to connect`
            : "CodeAtlas is disconnected. Click to connect to your instance.";
        statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
    }
    statusBarItem.show();
}
function deactivate() {
    logger_1.logger.log("Deactivating CodeAtlas extension.");
    logger_1.logger.dispose();
}
//# sourceMappingURL=extension.js.map