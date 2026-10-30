import {
  ExplanationResult,
  ImpactResult,
  QAResult,
  RepositoryInfo,
  ReviewResult,
  StackTraceResult,
  UserProfile,
} from "../types";
import { getCodeAtlasConfig } from "../utils/config";
import { logger } from "../utils/logger";

export interface ApiClientOptions {
  serverUrl?: string;
  token?: string | null;
  timeoutMs?: number;
}

export class CodeAtlasApiClient {
  private serverUrl: string;
  private token: string | null = null;
  private timeoutMs: number;

  constructor(options?: ApiClientOptions) {
    const config = getCodeAtlasConfig();
    this.serverUrl = (options?.serverUrl || config.serverUrl).replace(/\/+$/, "");
    this.token = options?.token || null;
    this.timeoutMs = options?.timeoutMs || config.requestTimeoutMs;
  }

  public setToken(token: string | null): void {
    this.token = token;
  }

  public setServerUrl(url: string): void {
    this.serverUrl = url.replace(/\/+$/, "");
  }

  public getServerUrl(): string {
    return this.serverUrl;
  }

  /**
   * Health and status probe verifying connection and authorized repositories.
   */
  public async getStatus(): Promise<{
    user: UserProfile | null;
    repositories: RepositoryInfo[];
    serverVersion: string;
  }> {
    const json = await this.request<any>("/api/vscode/status", {
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
  public async explainCode(params: {
    repositoryId?: string;
    filePath?: string;
    code: string;
    language?: string;
    startLine?: number;
    endLine?: number;
  }): Promise<ExplanationResult> {
    const json = await this.request<any>("/api/vscode/explain", {
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
  public async askQuestion(params: {
    repositoryId?: string;
    repositoryIds?: string[];
    question: string;
    selectedCode?: string;
    activeFile?: string;
    activeLine?: number;
  }): Promise<QAResult> {
    const json = await this.request<any>("/api/vscode/ask", {
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
  public async reviewCode(params: {
    repositoryId?: string;
    filePath?: string;
    code: string;
    language?: string;
  }): Promise<ReviewResult> {
    const json = await this.request<any>("/api/vscode/review", {
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
  public async analyzeImpact(params: {
    repositoryId?: string;
    filePath: string;
    symbolName?: string;
    proposedChange?: string;
  }): Promise<ImpactResult> {
    const json = await this.request<any>("/api/vscode/impact", {
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
  public async analyzeStackTrace(params: {
    stackTrace: string;
    repositoryId?: string;
  }): Promise<StackTraceResult> {
    const json = await this.request<any>("/api/vscode/stacktrace", {
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
  private async request<T>(endpoint: string, init: RequestInit): Promise<T> {
    const url = `${this.serverUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-client": "codeatlas-vscode",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
      headers["x-api-key"] = this.token;
    }

    try {
      logger.log(`API dispatch -> ${init.method || "GET"} ${endpoint}`);
      const response = await fetch(url, {
        ...init,
        headers: {
          ...headers,
          ...(init.headers as Record<string, string>),
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorMsg = `Server responded with HTTP ${response.status} ${response.statusText}`;
        try {
          const errJson = (await response.json()) as any;
          if (errJson && (errJson.message || errJson.error)) {
            errorMsg = errJson.message || errJson.error;
          }
        } catch {
          // ignore non-json errors
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication required: ${errorMsg}. Please connect with an authorized CodeAtlas token.`);
        }
        throw new Error(errorMsg);
      }

      const data = (await response.json()) as T;
      return data;
    } catch (err: any) {
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
