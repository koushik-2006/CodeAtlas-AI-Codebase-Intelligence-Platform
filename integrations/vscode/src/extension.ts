import * as vscode from "vscode";
import { CodeAtlasApiClient } from "./api/codeatlas-client";
import { SessionManager } from "./auth/session-manager";
import { ReviewDiagnosticsManager } from "./diagnostics/review-diagnostics";
import { CodeAtlasQuickFixProvider } from "./diagnostics/quick-fix-provider";
import { CodeAtlasSidebarProvider } from "./webview/sidebar-provider";
import { registerCommands } from "./commands/command-manager";
import { logger } from "./utils/logger";
import { getActiveEditorContext } from "./context/document-context";

let statusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  logger.init();
  logger.log("Activating CodeAtlas VS Code Extension v1.0.0...");

  // 1. Initialize API Client & Session Manager
  const apiClient = new CodeAtlasApiClient();
  const sessionManager = new SessionManager(context.secrets, apiClient);

  // 2. Initialize Diagnostics & Quick Fixes
  const diagnosticsManager = new ReviewDiagnosticsManager();
  context.subscriptions.push(diagnosticsManager.getCollection());

  const quickFixProvider = new CodeAtlasQuickFixProvider(diagnosticsManager);
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "typescriptreact" },
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "javascriptreact" },
        { scheme: "file", language: "python" },
        { scheme: "file", language: "json" },
      ],
      quickFixProvider,
      {
        providedCodeActionKinds: CodeAtlasQuickFixProvider.providedCodeActionKinds,
      }
    )
  );

  // 3. Register Webview Sidebar Provider
  const sidebarProvider = new CodeAtlasSidebarProvider(
    context.extensionUri,
    sessionManager,
    diagnosticsManager
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CodeAtlasSidebarProvider.viewType,
      sidebarProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    )
  );

  // 4. Register All CodeAtlas Commands
  registerCommands(context, sessionManager, sidebarProvider);

  // 5. Setup Status Bar Indicator
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = "codeatlas.selectRepository";
  context.subscriptions.push(statusBarItem);
  updateStatusBar(sessionManager);

  // Update status bar when connection changes
  context.subscriptions.push(
    sessionManager.onDidChangeState(() => {
      updateStatusBar(sessionManager);
    })
  );

  // 6. Listen to active editor changes to provide context
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      const editorCtx = getActiveEditorContext();
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
    })
  );

  // 7. Initialize session
  await sessionManager.initialize();

  logger.log("CodeAtlas VS Code Extension successfully activated.");
}

function updateStatusBar(sessionManager: SessionManager): void {
  const state = sessionManager.getState();
  if (state.isConnected) {
    const repoLabel = state.selectedRepositoryId ? ` (${state.selectedRepositoryId})` : "";
    statusBarItem.text = `$(compass) CodeAtlas: Connected${repoLabel}`;
    statusBarItem.tooltip = `CodeAtlas is connected to ${state.serverUrl}\nActive Repository: ${state.selectedRepositoryId || "None selected"}\nClick to switch repository`;
    statusBarItem.backgroundColor = undefined;
  } else {
    statusBarItem.text = "$(plug) CodeAtlas: Disconnected";
    statusBarItem.tooltip = state.lastError
      ? `CodeAtlas disconnected: ${state.lastError}\nClick to connect`
      : "CodeAtlas is disconnected. Click to connect to your instance.";
    statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
  }
  statusBarItem.show();
}

export function deactivate(): void {
  logger.log("Deactivating CodeAtlas extension.");
  logger.dispose();
}
