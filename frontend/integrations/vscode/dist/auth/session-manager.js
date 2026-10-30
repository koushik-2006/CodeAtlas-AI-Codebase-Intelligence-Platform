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
exports.SessionManager = void 0;
const vscode = __importStar(require("vscode"));
const config_1 = require("../utils/config");
const logger_1 = require("../utils/logger");
const SECRET_KEY_TOKEN = "codeatlas.apiToken";
class SessionManager {
    secrets;
    client;
    state = {
        isConnected: false,
        serverUrl: "http://localhost:3000",
        user: null,
        repositories: [],
        selectedRepositoryId: null,
        lastError: null,
    };
    onDidChangeStateEmitter = new vscode.EventEmitter();
    onDidChangeState = this.onDidChangeStateEmitter.event;
    constructor(secrets, client) {
        this.secrets = secrets;
        this.client = client;
        this.state.serverUrl = client.getServerUrl();
    }
    getState() {
        return { ...this.state };
    }
    getClient() {
        return this.client;
    }
    async initialize() {
        const token = await this.secrets.get(SECRET_KEY_TOKEN);
        if (token) {
            this.client.setToken(token);
        }
        const config = (0, config_1.getCodeAtlasConfig)();
        this.state.serverUrl = config.serverUrl;
        this.client.setServerUrl(config.serverUrl);
        // Try connecting
        try {
            await this.refresh();
        }
        catch (err) {
            logger_1.logger.warn(`Initial connection attempt deferred: ${err.message}`);
        }
    }
    async connect(serverUrl, token) {
        if (serverUrl) {
            this.state.serverUrl = serverUrl.replace(/\/+$/, "");
            this.client.setServerUrl(this.state.serverUrl);
            await (0, config_1.setServerUrl)(this.state.serverUrl);
        }
        if (token !== undefined) {
            if (token && token.trim()) {
                await this.secrets.store(SECRET_KEY_TOKEN, token.trim());
                this.client.setToken(token.trim());
            }
            else {
                await this.secrets.delete(SECRET_KEY_TOKEN);
                this.client.setToken(null);
            }
        }
        return await this.refresh();
    }
    async disconnect() {
        await this.secrets.delete(SECRET_KEY_TOKEN);
        this.client.setToken(null);
        this.state.isConnected = false;
        this.state.user = null;
        this.state.repositories = [];
        this.state.selectedRepositoryId = null;
        this.state.lastError = null;
        logger_1.logger.log("CodeAtlas disconnected.");
        this.onDidChangeStateEmitter.fire(this.getState());
    }
    async selectRepository(repoId) {
        const found = this.state.repositories.find((r) => r.id === repoId);
        if (found || repoId === "") {
            this.state.selectedRepositoryId = repoId || null;
            await (0, config_1.setSelectedRepositoryId)(repoId);
            logger_1.logger.log(`Active repository set to: ${repoId || "none"}`);
            this.onDidChangeStateEmitter.fire(this.getState());
        }
        else {
            throw new Error(`Repository '${repoId}' is not in authorized list.`);
        }
    }
    async refresh() {
        try {
            logger_1.logger.log(`Probing connection to ${this.client.getServerUrl()}`);
            const status = await this.client.getStatus();
            this.state.isConnected = true;
            this.state.user = status.user;
            this.state.repositories = status.repositories;
            this.state.lastError = null;
            // Auto-detect or restore selected repository
            const config = (0, config_1.getCodeAtlasConfig)();
            if (config.selectedRepositoryId && this.state.repositories.some((r) => r.id === config.selectedRepositoryId)) {
                this.state.selectedRepositoryId = config.selectedRepositoryId;
            }
            else if (config.autoDetectRepository) {
                const detected = this.detectRepositoryFromWorkspace(this.state.repositories);
                if (detected) {
                    this.state.selectedRepositoryId = detected.id;
                    await (0, config_1.setSelectedRepositoryId)(detected.id);
                }
                else if (this.state.repositories.length > 0) {
                    this.state.selectedRepositoryId = this.state.repositories[0].id;
                }
            }
            this.onDidChangeStateEmitter.fire(this.getState());
            return true;
        }
        catch (err) {
            this.state.isConnected = false;
            this.state.lastError = err.message || "Failed to connect to CodeAtlas server.";
            this.onDidChangeStateEmitter.fire(this.getState());
            throw err;
        }
    }
    detectRepositoryFromWorkspace(repos) {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0)
            return null;
        for (const folder of folders) {
            const folderName = folder.name.toLowerCase();
            const match = repos.find((r) => r.name.toLowerCase() === folderName ||
                r.id.toLowerCase() === folderName ||
                folderName.includes(r.id.toLowerCase()));
            if (match)
                return match;
        }
        return null;
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=session-manager.js.map