import * as vscode from "vscode";
import { SessionManager } from "../auth/session-manager";
import { CodeAtlasSidebarProvider } from "../webview/sidebar-provider";
import { getActiveEditorContext } from "../context/document-context";
import { ReviewFindingItem } from "../types";
import { logger } from "../utils/logger";

export function registerCommands(
  context: vscode.ExtensionContext,
  sessionManager: SessionManager,
  sidebarProvider: CodeAtlasSidebarProvider
): void {
  // Command 1: Connect to Server
  context.subscriptions.push(
    vscode.commands.registerCommand("codeatlas.connect", async () => {
      const state = sessionManager.getState();
      const serverUrl = await vscode.window.showInputBox({
        title: "CodeAtlas: Connect to Server",
        prompt: "Enter CodeAtlas server URL",
        value: state.serverUrl || "http://localhost:3000",
        ignoreFocusOut: true,
      });

      if (!serverUrl) return;

      const token = await vscode.window.showInputBox({
        title: "CodeAtlas: API Token (Optional)",
        prompt: "Enter your CodeAtlas access token (leave empty for local default session)",
        password: true,
        ignoreFocusOut: true,
      });

      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "CodeAtlas: Connecting to server...",
          },
          async () => {
            await sessionManager.connect(serverUrl, token);
          }
        );
        vscode.window.showInformationMessage(
          `CodeAtlas: Connected to ${serverUrl} as ${sessionManager.getState().user?.name || "Developer"}`
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(`CodeAtlas: Connection failed - ${err.message}`);
      }
    })
  );

  // Command 2: Disconnect
  context.subscriptions.push(
    vscode.commands.registerCommand("codeatlas.disconnect", async () => {
      await sessionManager.disconnect();
      vscode.window.showInformationMessage("CodeAtlas: Successfully disconnected.");
    })
  );

  // Command 3: Select Active Repository
  context.subscriptions.push(
    vscode.commands.registerCommand("codeatlas.selectRepository", async () => {
      const state = sessionManager.getState();
      if (!state.isConnected) {
        const connectNow = "Connect Now";
        const res = await vscode.window.showWarningMessage(
          "CodeAtlas: Not connected to server.",
          connectNow
        );
        if (res === connectNow) {
          vscode.commands.executeCommand("codeatlas.connect");
        }
        return;
      }

      if (state.repositories.length === 0) {
        vscode.window.showInformationMessage("CodeAtlas: No authorized repositories found for this account.");
        return;
      }

      const items = state.repositories.map((r) => ({
        label: r.name,
        description: `${r.language} • ${r.status}`,
        detail: `ID: ${r.id} | Default branch: ${r.defaultBranch} | Rev: ${r.commitSha?.slice(0, 7) || "head"}`,
        repoId: r.id,
      }));

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: "Select active repository for CodeAtlas intelligence",
      });

      if (picked) {
        await sessionManager.selectRepository(picked.repoId);
        vscode.window.showInformationMessage(`CodeAtlas: Active repository set to ${picked.label}`);
      }
    })
  );

  // Command 4: Explain Selected Code
  context.subscriptions.push(
    vscode.commands.registerCommand("codeatlas.explainSelectedCode", async () => {
      await vscode.commands.executeCommand("codeatlas.sidebarView.focus");
      await sidebarProvider.executeExplainCode();
    })
  );

  // Command 5: Ask About Codebase
  context.subscriptions.push(
    vscode.commands.registerCommand("codeatlas.askAboutCodebase", async () => {
      const editorCtx = getActiveEditorContext();
      let promptDefault = "";
      if (editorCtx.currentWord) {
        promptDefault = `Where is ${editorCtx.currentWord} defined and called?`;
      }

      const question = await vscode.window.showInputBox({
        title: "CodeAtlas: Ask About This Codebase",
        prompt: "Enter your question about the codebase",
        value: promptDefault,
        ignoreFocusOut: true,
      });

      if (question && question.trim()) {
        await vscode.commands.executeCommand("codeatlas.sidebarView.focus");
        await sidebarProvider.executeAskQuestion(question);
      }
    })
  );

  // Command 6: Find Related Implementations
  context.subscriptions.push(
    vscode.commands.registerCommand("codeatlas.findRelatedImplementations", async () => {
      const editorCtx = getActiveEditorContext();
      if (!editorCtx.hasActiveEditor) {
        vscode.window.showWarningMessage("CodeAtlas: Open a source file to find related implementations.");
        return;
      }

      const client = sessionManager.getClient();
      const state = sessionManager.getState();
      const repoId = state.selectedRepositoryId || "sample-project";

      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `CodeAtlas: Resolving related implementations for ${editorCtx.currentWord || editorCtx.fileName}...`,
          },
          async () => {
            const query = editorCtx.currentWord || editorCtx.fileName || "";
            const result = await client.askQuestion({
              repositoryId: repoId,
              question: `Find all implementations, callers, and duplicate patterns for ${query} in ${editorCtx.relativePath}.`,
              selectedCode: editorCtx.selectedText,
              activeFile: editorCtx.relativePath,
              activeLine: editorCtx.activeLine,
            });

            await vscode.commands.executeCommand("codeatlas.sidebarView.focus");
            sidebarProvider.showResult("qa", result);
          }
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(`CodeAtlas: Could not resolve implementations - ${err.message}`);
      }
    })
  );

  // Command 7: Explain Dependencies
  context.subscriptions.push(
    vscode.commands.registerCommand("codeatlas.explainDependencies", async () => {
      const editorCtx = getActiveEditorContext();
      const client = sessionManager.getClient();
      const state = sessionManager.getState();
      const repoId = state.selectedRepositoryId || "sample-project";

      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "CodeAtlas: Tracing dependency relationships...",
          },
          async () => {
            const target = editorCtx.relativePath || "all";
            const result = await client.askQuestion({
              repositoryId: repoId,
              question: `Explain the dependencies, package manifests, and service relationships for ${target}.`,
              activeFile: editorCtx.relativePath,
            });

            await vscode.commands.executeCommand("codeatlas.sidebarView.focus");
            sidebarProvider.showResult("qa", result);
          }
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(`CodeAtlas: Could not explain dependencies - ${err.message}`);
      }
    })
  );

  // Command 8: Analyze Change Impact
  context.subscriptions.push(
    vscode.commands.registerCommand("codeatlas.analyzeChangeImpact", async () => {
      await vscode.commands.executeCommand("codeatlas.sidebarView.focus");
      await sidebarProvider.executeAnalyzeImpact();
    })
  );

  // Command 9: Review Selected Code
  context.subscriptions.push(
    vscode.commands.registerCommand("codeatlas.reviewSelectedCode", async () => {
      await vscode.commands.executeCommand("codeatlas.sidebarView.focus");
      await sidebarProvider.executeReviewCode();
    })
  );

  // Command 10: Analyze Stack Trace
  context.subscriptions.push(
    vscode.commands.registerCommand("codeatlas.analyzeStackTrace", async () => {
      await vscode.commands.executeCommand("codeatlas.sidebarView.focus");
      await sidebarProvider.executeAnalyzeStackTrace();
    })
  );

  // Command 11: Open Dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand("codeatlas.openDashboard", async () => {
      const state = sessionManager.getState();
      const url = `${state.serverUrl}/dashboard`;
      await vscode.env.openExternal(vscode.Uri.parse(url));
    })
  );

  // Command 12: Refresh Repository Context
  context.subscriptions.push(
    vscode.commands.registerCommand("codeatlas.refreshRepositoryContext", async () => {
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "CodeAtlas: Refreshing repository context...",
          },
          async () => {
            await sessionManager.refresh();
          }
        );
        vscode.window.showInformationMessage("CodeAtlas: Repository context updated.");
      } catch (err: any) {
        vscode.window.showErrorMessage(`CodeAtlas refresh failed: ${err.message}`);
      }
    })
  );

  // Helper Command: Show Remediation Modal
  context.subscriptions.push(
    vscode.commands.registerCommand("codeatlas.showRemediationModal", (finding: ReviewFindingItem) => {
      vscode.window.showInformationMessage(
        `[CodeAtlas Review Remediation]\n${finding.title}\n\nRecommended Action:\n${finding.suggestedRemediation}\n\nWhy it matters: ${finding.whyItMatters}`,
        { modal: true }
      );
    })
  );

  logger.log("All CodeAtlas editor commands successfully registered.");
}
