"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAtlasApiClient = void 0;
const config_1 = require("../utils/config");
const logger_1 = require("../utils/logger");
class CodeAtlasApiClient {
    serverUrl;
    token = null;
    timeoutMs;
    constructor(options) {
        const config = (0, config_1.getCodeAtlasConfig)();
        this.serverUrl = (options?.serverUrl || config.serverUrl).replace(/\/+$/, "");
        this.token = options?.token || null;
        this.timeoutMs = options?.timeoutMs || config.requestTimeoutMs;
    }
    setToken(token) {
        this.token = token;
    }
    setServerUrl(url) {
        this.serverUrl = url.replace(/\/+$/, "");
    }
    getServerUrl() {
        return this.serverUrl;
    }
    /**
     * Health and status probe verifying connection and authorized repositories.
     */
    async getStatus() {
        const json = await this.request("/api/vscode/status", {
            method: "GET",
        });
        return {
            user: json.user || null,
            repositories: json.repositories || [],
            serverVersion: json.serverVersion || "1.0.0",
        };
    }
    /**
     * Explains selected code from active editor.
     */
    async explainCode(params) {
        const json = await this.request("/api/vscode/explain", {
            method: "POST",
            body: JSON.stringify(params),
        });
        return {
            summary: json.summary || "Explanation generated.",
            purpose: json.purpose || "",
            howItWorks: json.howItWorks || [],
            inputsAndOutputs: json.inputsAndOutputs || { parameters: [], returnType: "void" },
            dependencies: json.dependencies || [],
            edgeCases: json.edgeCases || [],
            potentialIssues: json.potentialIssues || [],
            complexity: json.complexity || { time: "O(1)", space: "O(1)" },
            relatedSymbols: json.relatedSymbols || [],
            sourceCitations: json.sourceCitations || [],
        };
    }
    /**
     * Answers codebase questions with grounded source citations.
     */
    async askQuestion(params) {
        const json = await this.request("/api/vscode/ask", {
            method: "POST",
            body: JSON.stringify(params),
        });
        return {
            answer: json.answer || "No response generated.",
            sources: json.sources || [],
            confirmedFacts: json.confirmedFacts || [],
            inferredFacts: json.inferredFacts || [],
            unavailableInfo: json.unavailableInfo || [],
            confidence: json.confidence || "supported",
            limitations: json.limitations || [],
            suggestedFollowUps: json.suggestedFollowUps || [],
        };
    }
    /**
     * Reviews active file or snippet for security, bugs, logic errors, and performance.
     */
    async reviewCode(params) {
        const json = await this.request("/api/vscode/review", {
            method: "POST",
            body: JSON.stringify(params),
        });
        return {
            summary: json.summary || "Review complete.",
            findings: json.findings || [],
            analyzedLines: json.analyzedLines || 0,
            timestamp: json.timestamp || new Date().toISOString(),
        };
    }
    /**
     * Change impact analysis for file/symbol.
     */
    async analyzeImpact(params) {
        const json = await this.request("/api/vscode/impact", {
            method: "POST",
            body: JSON.stringify(params),
        });
        const data = json.data || {};
        return {
            impactScore: data.impactScore || 0,
            severity: data.severity || "low",
            affectedComponents: data.affectedComponents || [],
            directCallers: data.directCallers || [],
            recommendedTests: data.recommendedTests || [],
            explanation: data.explanation || "No downstream dependents impacted.",
            bufferWarning: json.bufferWarning,
        };
    }
    /**
     * Stack trace parser and frame resolution.
     */
    async analyzeStackTrace(params) {
        const json = await this.request("/api/vscode/stacktrace", {
            method: "POST",
            body: JSON.stringify(params),
        });
        const parsed = json.parsed || {};
        return {
            errorType: parsed.errorType || "Error",
            errorMessage: parsed.errorMessage || "",
            frames: parsed.frames || [],
            rootCauseHypothesis: parsed.rootCauseHypothesis || "Execution failure encountered.",
            suggestedFix: parsed.suggestedFix || "Inspect frame locations and verify input parameters.",
            matchedWorkspaceFrames: json.matchedWorkspaceFrames || 0,
        };
    }
    /**
     * Generic request executor with timeout, cancellation, and error translation.
     */
    async request(endpoint, init) {
        const url = `${this.serverUrl}${endpoint}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        const headers = {
            "Content-Type": "application/json",
            Accept: "application/json",
            "x-client": "codeatlas-vscode",
        };
        if (this.token) {
            headers["Authorization"] = `Bearer ${this.token}`;
            headers["x-api-key"] = this.token;
        }
        try {
            logger_1.logger.log(`API dispatch -> ${init.method || "GET"} ${endpoint}`);
            const response = await fetch(url, {
                ...init,
                headers: {
                    ...headers,
                    ...init.headers,
                },
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!response.ok) {
                let errorMsg = `Server responded with HTTP ${response.status} ${response.statusText}`;
                try {
                    const errJson = (await response.json());
                    if (errJson && (errJson.message || errJson.error)) {
                        errorMsg = errJson.message || errJson.error;
                    }
                }
                catch {
                    // ignore non-json errors
                }
                if (response.status === 401 || response.status === 403) {
                    throw new Error(`Authentication required: ${errorMsg}. Please connect with an authorized CodeAtlas token.`);
                }
                throw new Error(errorMsg);
            }
            const data = (await response.json());
            return data;
        }
        catch (err) {
            clearTimeout(timeout);
            if (err.name === "AbortError") {
                throw new Error(`CodeAtlas request timed out after ${Math.round(this.timeoutMs / 1000)}s.`);
            }
            if (err.message && err.message.includes("ECONNREFUSED")) {
                throw new Error(`Could not connect to CodeAtlas server at ${this.serverUrl}. Please ensure the server is running.`);
            }
            throw err;
        }
    }
}
exports.CodeAtlasApiClient = CodeAtlasApiClient;
//# sourceMappingURL=codeatlas-client.js.map