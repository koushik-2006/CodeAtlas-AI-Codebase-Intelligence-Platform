import * as vscode from "vscode";

export interface CodeAtlasConfig {
  serverUrl: string;
  selectedRepositoryId: string;
  autoDetectRepository: boolean;
  enableDiagnostics: boolean;
  requestTimeoutMs: number;
}

export function getCodeAtlasConfig(): CodeAtlasConfig {
  const cfg = vscode.workspace.getConfiguration("codeatlas");
  return {
    serverUrl: cfg.get<string>("serverUrl", "http://localhost:3000").replace(/\/+$/, ""),
    selectedRepositoryId: cfg.get<string>("selectedRepositoryId", "").trim(),
    autoDetectRepository: cfg.get<boolean>("autoDetectRepository", true),
    enableDiagnostics: cfg.get<boolean>("enableDiagnostics", true),
    requestTimeoutMs: cfg.get<number>("requestTimeoutMs", 15000),
  };
}

export async function setSelectedRepositoryId(repoId: string): Promise<void> {
  const cfg = vscode.workspace.getConfiguration("codeatlas");
  await cfg.update("selectedRepositoryId", repoId, vscode.ConfigurationTarget.Workspace);
}

export async function setServerUrl(url: string): Promise<void> {
  const cfg = vscode.workspace.getConfiguration("codeatlas");
  await cfg.update("serverUrl", url.replace(/\/+$/, ""), vscode.ConfigurationTarget.Global);
}
