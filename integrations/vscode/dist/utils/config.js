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
exports.getCodeAtlasConfig = getCodeAtlasConfig;
exports.setSelectedRepositoryId = setSelectedRepositoryId;
exports.setServerUrl = setServerUrl;
const vscode = __importStar(require("vscode"));
function getCodeAtlasConfig() {
    const cfg = vscode.workspace.getConfiguration("codeatlas");
    return {
        serverUrl: cfg.get("serverUrl", "http://localhost:3000").replace(/\/+$/, ""),
        selectedRepositoryId: cfg.get("selectedRepositoryId", "").trim(),
        autoDetectRepository: cfg.get("autoDetectRepository", true),
        enableDiagnostics: cfg.get("enableDiagnostics", true),
        requestTimeoutMs: cfg.get("requestTimeoutMs", 15000),
    };
}
async function setSelectedRepositoryId(repoId) {
    const cfg = vscode.workspace.getConfiguration("codeatlas");
    await cfg.update("selectedRepositoryId", repoId, vscode.ConfigurationTarget.Workspace);
}
async function setServerUrl(url) {
    const cfg = vscode.workspace.getConfiguration("codeatlas");
    await cfg.update("serverUrl", url.replace(/\/+$/, ""), vscode.ConfigurationTarget.Global);
}
//# sourceMappingURL=config.js.map