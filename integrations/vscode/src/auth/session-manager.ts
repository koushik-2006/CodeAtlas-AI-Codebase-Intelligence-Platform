import * as vscode from "vscode";
import { ConnectionState, RepositoryInfo, UserProfile } from "../types";
import { CodeAtlasApiClient } from "../api/codeatlas-client";
import { getCodeAtlasConfig, setSelectedRepositoryId, setServerUrl } from "../utils/config";
import { logger } from "../utils/logger";

const SECRET_KEY_TOKEN = "codeatlas.apiToken";

export class SessionManager {
  private secrets: vscode.SecretStorage;
  private client: CodeAtlasApiClient;
  private state: ConnectionState = {
    isConnected: false,
    serverUrl: "http://localhost:3000",
    user: null,
    repositories: [],
    selectedRepositoryId: null,
    lastError: null,
  };

  private onDidChangeStateEmitter = new vscode.EventEmitter<ConnectionState>();
  public readonly onDidChangeState = this.onDidChangeStateEmitter.event;

  constructor(secrets: vscode.SecretStorage, client: CodeAtlasApiClient) {
    this.secrets = secrets;
    this.client = client;
    this.state.serverUrl = client.getServerUrl();
  }

  public getState(): ConnectionState {
    return { ...this.state };
  }

  public getClient(): CodeAtlasApiClient {
    return this.client;
  }

  public async initialize(): Promise<void> {
    const token = await this.secrets.get(SECRET_KEY_TOKEN);
    if (token) {
      this.client.setToken(token);
    }

    const config = getCodeAtlasConfig();
    this.state.serverUrl = config.serverUrl;
    this.client.setServerUrl(config.serverUrl);

    // Try connecting
    try {
      await this.refresh();
    } catch (err: any) {
      logger.warn(`Initial connection attempt deferred: ${err.message}`);
    }
  }

  public async connect(serverUrl?: string, token?: string): Promise<boolean> {
    if (serverUrl) {
      this.state.serverUrl = serverUrl.replace(/\/+$/, "");
      this.client.setServerUrl(this.state.serverUrl);
      await setServerUrl(this.state.serverUrl);
    }

    if (token !== undefined) {
      if (token && token.trim()) {
        await this.secrets.store(SECRET_KEY_TOKEN, token.trim());
        this.client.setToken(token.trim());
      } else {
        await this.secrets.delete(SECRET_KEY_TOKEN);
        this.client.setToken(null);
      }
    }

    return await this.refresh();
  }

  public async disconnect(): Promise<void> {
    await this.secrets.delete(SECRET_KEY_TOKEN);
    this.client.setToken(null);

    this.state.isConnected = false;
    this.state.user = null;
    this.state.repositories = [];
    this.state.selectedRepositoryId = null;
    this.state.lastError = null;

    logger.log("CodeAtlas disconnected.");
    this.onDidChangeStateEmitter.fire(this.getState());
  }

  public async selectRepository(repoId: string): Promise<void> {
    const found = this.state.repositories.find((r) => r.id === repoId);
    if (found || repoId === "") {
      this.state.selectedRepositoryId = repoId || null;
      await setSelectedRepositoryId(repoId);
      logger.log(`Active repository set to: ${repoId || "none"}`);
      this.onDidChangeStateEmitter.fire(this.getState());
    } else {
      throw new Error(`Repository '${repoId}' is not in authorized list.`);
    }
  }

  public async refresh(): Promise<boolean> {
    try {
      logger.log(`Probing connection to ${this.client.getServerUrl()}`);
      const status = await this.client.getStatus();

      this.state.isConnected = true;
      this.state.user = status.user;
      this.state.repositories = status.repositories;
      this.state.lastError = null;

      // Auto-detect or restore selected repository
      const config = getCodeAtlasConfig();
      if (config.selectedRepositoryId && this.state.repositories.some((r) => r.id === config.selectedRepositoryId)) {
        this.state.selectedRepositoryId = config.selectedRepositoryId;
      } else if (config.autoDetectRepository) {
        const detected = this.detectRepositoryFromWorkspace(this.state.repositories);
        if (detected) {
          this.state.selectedRepositoryId = detected.id;
          await setSelectedRepositoryId(detected.id);
        } else if (this.state.repositories.length > 0) {
          this.state.selectedRepositoryId = this.state.repositories[0].id;
        }
      }

      this.onDidChangeStateEmitter.fire(this.getState());
      return true;
    } catch (err: any) {
      this.state.isConnected = false;
      this.state.lastError = err.message || "Failed to connect to CodeAtlas server.";
      this.onDidChangeStateEmitter.fire(this.getState());
      throw err;
    }
  }

  private detectRepositoryFromWorkspace(repos: RepositoryInfo[]): RepositoryInfo | null {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return null;

    for (const folder of folders) {
      const folderName = folder.name.toLowerCase();
      const match = repos.find(
        (r) =>
          r.name.toLowerCase() === folderName ||
          r.id.toLowerCase() === folderName ||
          folderName.includes(r.id.toLowerCase())
      );
      if (match) return match;
    }

    return null;
  }
}
