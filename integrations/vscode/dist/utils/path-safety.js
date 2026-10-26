"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSafeRelativePath = isSafeRelativePath;
exports.resolveSafeWorkspaceUri = resolveSafeWorkspaceUri;
let vscodeRuntime;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    vscodeRuntime = require("vscode");
}
catch {
    // Headless test or CLI environment
}
/**
 * Validates a file path to prevent directory traversal attacks (e.g. `../../etc/passwd`).
 */
function isSafeRelativePath(filePath) {
    if (!filePath || typeof filePath !== "string") {
        return false;
    }
    // Null byte injection check
    if (filePath.includes("\0")) {
        return false;
    }
    // Normalize path using forward slashes
    const normalized = filePath.replace(/\\/g, "/").trim();
    // Prevent directory traversal
    const segments = normalized.split("/");
    if (segments.includes("..")) {
        return false;
    }
    // Prevent absolute drive letters or absolute unix root
    if (normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized)) {
        return false;
    }
    return true;
}
/**
 * Resolves a safe URI within the user's active workspace folders.
 * Returns null if the path cannot be securely resolved within any workspace root.
 */
function resolveSafeWorkspaceUri(relativePath) {
    if (!isSafeRelativePath(relativePath)) {
        return null;
    }
    const vscode = vscodeRuntime;
    if (!vscode || !vscode.workspace) {
        return null;
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
    }
    const normalizedRel = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
    // Search each workspace folder for the file
    for (const folder of workspaceFolders) {
        const candidateUri = vscode.Uri.joinPath(folder.uri, normalizedRel);
        // Ensure the resolved URI is inside the folder
        const folderPath = folder.uri.fsPath.replace(/\\/g, "/").toLowerCase();
        const candidatePath = candidateUri.fsPath.replace(/\\/g, "/").toLowerCase();
        if (candidatePath.startsWith(folderPath)) {
            return candidateUri;
        }
    }
    // Fallback to first workspace folder if valid relative path
    return vscode.Uri.joinPath(workspaceFolders[0].uri, normalizedRel);
}
//# sourceMappingURL=path-safety.js.map