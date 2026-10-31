/**
 * CodeAtlas AI Service (Client-Side Firebase AI Logic / Gemini Developer API)
 *
 * Direct browser-to-Gemini connection using Firebase AI Logic SDK with App Check protection.
 * No server-side API routes, no exposed API keys in bundle.
 */

import { getCodeAtlasModel, AI_MODEL, isFirebaseConfigured } from "@/lib/firebase";

export interface ChatHistoryItem {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export type CodeAnalysisMode =
  | "explain"
  | "line-by-line"
  | "find-bugs"
  | "optimize"
  | "add-comments"
  | "convert"
  | "generate-tests";

export interface AIErrorDetails {
  type: "app_check_error" | "quota_error" | "network_error" | "not_configured" | "unknown";
  message: string;
  userMessage: string;
  canRetry: boolean;
}

export interface ExtractedCodeResult {
  code: string;
  language: string;
  confidence: number;
}

export interface StreamChatOptions {
  history?: ChatHistoryItem[];
  message: string;
  systemInstruction?: string;
  onChunk: (accumulated: string, delta: string) => void;
  signal?: AbortSignal;
}

export interface ExplainCodeOptions {
  code: string;
  language: string;
  mode?: CodeAnalysisMode;
  targetLanguage?: string;
  onChunk?: (accumulated: string, delta: string) => void;
  signal?: AbortSignal;
}

class AIService {
  /**
   * Translates error details from Firebase AI Logic / Gemini into clear, user-friendly guidance.
   */
  classifyError(error: any): AIErrorDetails {
    const rawMsg = String(error?.message || error || "");
    const lower = rawMsg.toLowerCase();

    if (!isFirebaseConfigured) {
      return {
        type: "not_configured",
        message: rawMsg,
        userMessage:
          "Firebase is not configured. Please ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are present.",
        canRetry: false,
      };
    }

    if (
      lower.includes("appcheck") ||
      lower.includes("app check") ||
      lower.includes("403") ||
      lower.includes("permission-denied") ||
      lower.includes("app_check_token_invalid")
    ) {
      const isLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname === "::1");

      const debugMsg = isLocalhost
        ? "App Check verification required: In local development, check your browser DevTools console for 'Firebase App Check debug token: <UUID>' and register it in Firebase Console -> App Check -> Apps -> Manage debug tokens."
        : "App Check verification failed. Please check that reCAPTCHA v3 is active and your domain is whitelisted in Firebase App Check.";

      return {
        type: "app_check_error",
        message: rawMsg,
        userMessage: debugMsg,
        canRetry: true,
      };
    }

    if (
      lower.includes("429") ||
      lower.includes("quota") ||
      lower.includes("resource_exhausted") ||
      lower.includes("rate limit")
    ) {
      return {
        type: "quota_error",
        message: rawMsg,
        userMessage:
          "Gemini Developer API rate limit or quota reached. Please wait a few moments and click retry.",
        canRetry: true,
      };
    }

    if (
      lower.includes("network") ||
      lower.includes("failed to fetch") ||
      lower.includes("timeout") ||
      lower.includes("offline")
    ) {
      return {
        type: "network_error",
        message: rawMsg,
        userMessage:
          "Network connection issue. Please check your internet connection and try again.",
        canRetry: true,
      };
    }

    return {
      type: "unknown",
      message: rawMsg,
      userMessage:
        rawMsg.length > 200
          ? `${rawMsg.slice(0, 200)}... (Please try again)`
          : rawMsg || "An unexpected error occurred while communicating with Gemini.",
      canRetry: true,
    };
  }

  /**
   * Multi-turn chat session with streaming responses.
   */
  async streamChat(options: StreamChatOptions): Promise<string> {
    const { history = [], message, systemInstruction, onChunk, signal } = options;

    const baseInstruction =
      systemInstruction ||
      "You are CodeAtlas AI, an expert software engineering and codebase intelligence assistant. Answer questions clearly, accurately, and thoroughly. Format code with Markdown code blocks indicating the programming language. When analyzing repository files, cite exact file paths and line ranges.";

    const model = getCodeAtlasModel(baseInstruction);
    if (!model) {
      throw new Error("Unable to initialize Firebase AI Gemini model. Check Firebase configuration.");
    }

    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(message);

      let accumulated = "";
      for await (const chunk of result.stream) {
        if (signal?.aborted) {
          throw new DOMException("Chat generation aborted by user", "AbortError");
        }
        const text = chunk.text();
        accumulated += text;
        onChunk(accumulated, text);
      }

      return accumulated;
    } catch (err: any) {
      if (err?.name === "AbortError" || signal?.aborted) {
        throw err;
      }
      throw err;
    }
  }

  /**
   * Single-prompt generation with streaming tokens.
   */
  async streamAnswer(options: {
    prompt: string;
    systemInstruction?: string;
    onChunk: (accumulated: string, delta: string) => void;
    signal?: AbortSignal;
  }): Promise<string> {
    const { prompt, systemInstruction, onChunk, signal } = options;

    const model = getCodeAtlasModel(systemInstruction);
    if (!model) {
      throw new Error("Unable to initialize Firebase AI Gemini model.");
    }

    try {
      const result = await model.generateContentStream(prompt);

      let accumulated = "";
      for await (const chunk of result.stream) {
        if (signal?.aborted) {
          throw new DOMException("Generation aborted by user", "AbortError");
        }
        const text = chunk.text();
        accumulated += text;
        onChunk(accumulated, text);
      }

      return accumulated;
    } catch (err: any) {
      if (err?.name === "AbortError" || signal?.aborted) {
        throw err;
      }
      throw err;
    }
  }

  /**
   * Code Explanation & Analysis for Visual Code Explorer / CodeLens.
   * Supports explain simply, line-by-line, find bugs, optimize, add comments, convert, generate tests.
   */
  async explainCode(options: ExplainCodeOptions): Promise<string> {
    const { code, language, mode = "explain", targetLanguage = "Python", onChunk, signal } = options;

    let instruction = "You are CodeAtlas CodeLens, a senior code reviewer and software architect. Provide clear, well-structured, production-grade analysis with markdown formatting.";
    let prompt = "";

    switch (mode) {
      case "explain":
        prompt = `Explain the following ${language} code in simple terms. Cover:\n1. Overall purpose\n2. Key inputs, state, and outputs\n3. High-level execution flow\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;

      case "line-by-line":
        prompt = `Provide a detailed line-by-line walkthrough of the following ${language} code. Group related lines into logical blocks and explain the exact mechanical behavior of each step:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;

      case "find-bugs":
        prompt = `Perform a rigorous static security, logic, and edge-case audit on this ${language} code:\n1. Identify bugs, potential crashes, or null pointer/undefined errors\n2. Note security vulnerabilities (e.g., injection, unsanitized input, timing attacks)\n3. Highlight unhandled edge cases\n4. Provide a corrected version of the code snippet with explanations\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;

      case "optimize":
        prompt = `Analyze the performance and efficiency of this ${language} code:\n1. Determine current Time and Space Complexity (Big-O)\n2. Pinpoint CPU, memory, or I/O bottlenecks\n3. Propose an optimized implementation with improved complexity\n4. Contrast before vs after complexity\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;

      case "add-comments":
        prompt = `Rewrite the following ${language} code with clean, descriptive, production-grade comments (JSDoc / docstrings for functions, types, and tricky logical branches). Return the fully commented code block followed by a brief summary of additions:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;

      case "convert":
        prompt = `Convert the following ${language} code into clean, idiomatic ${targetLanguage}. Ensure proper naming conventions, type safety, and standard library patterns for ${targetLanguage}. Provide the converted code and explain notable syntax/idiom differences:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;

      case "generate-tests":
        prompt = `Generate a comprehensive suite of unit tests for this ${language} code (e.g. using Jest, Vitest, Pytest, or standard testing harness). Include:\n- Happy path tests\n- Edge cases (null/empty inputs, boundary conditions)\n- Error handling assertions\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;

      default:
        prompt = `Analyze the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    }

    if (onChunk) {
      return this.streamAnswer({
        prompt,
        systemInstruction: instruction,
        onChunk,
        signal,
      });
    }

    const model = getCodeAtlasModel(instruction);
    if (!model) throw new Error("Unable to initialize Gemini model.");
    const res = await model.generateContent(prompt);
    return res.response.text();
  }

  /**
   * Generates a valid Mermaid.js flowchart diagram representing the control flow of code.
   */
  async generateMermaidFlowchart(code: string, language: string): Promise<string> {
    const systemInstruction =
      "You are a diagram generator. Generate a clean, valid Mermaid.js flowchart diagram (flowchart TD or graph TD) representing the code execution path, decisions, branches, and returns. Output ONLY the raw Mermaid diagram code inside a ```mermaid fence. No other text or markdown.";

    const prompt = `Generate a Mermaid.js control flow diagram for this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``;

    const model = getCodeAtlasModel(systemInstruction);
    if (!model) throw new Error("Unable to initialize Gemini model.");

    const res = await model.generateContent(prompt);
    const text = res.response.text();

    const match = text.match(/```(?:mermaid)?([\s\S]*?)```/i);
    let diagram = match ? match[1].trim() : text.trim();

    if (!diagram.startsWith("graph") && !diagram.startsWith("flowchart")) {
      diagram = `flowchart TD\n${diagram}`;
    }

    return diagram;
  }

  /**
   * Multimodal Code Extraction: Takes a user-uploaded image or camera capture,
   * extracts the exact source code verbatim, detects the language, and returns confidence.
   */
  async explainImage(file: File): Promise<ExtractedCodeResult> {
    const base64Data = await this.fileToBase64(file);
    const mimeType = file.type || "image/png";

    const systemInstruction =
      "You are an expert OCR and code extraction engine. Extract source code from images verbatim, preserving exact syntax, indentation, identifiers, and symbols. Detect the programming language accurately. Return valid JSON only with keys: language, code, confidence.";

    const model = getCodeAtlasModel(systemInstruction);
    if (!model) throw new Error("Unable to initialize Gemini model.");

    const prompt =
      "Carefully extract the exact code visible in this image. Detect the programming language (e.g. TypeScript, JavaScript, Python, Go, Rust, Java, C++, SQL, HTML/CSS). Respond with a strict JSON object with fields: {\"language\": \"<name>\", \"code\": \"<verbatim_extracted_code>\", \"confidence\": <number between 0 and 1>}. Do not include markdown code ticks outside the JSON.";

    const res = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      prompt,
    ]);

    const raw = res.response.text().trim();
    return this.parseCodeExtractionJson(raw);
  }

  private parseCodeExtractionJson(raw: string): ExtractedCodeResult {
    try {
      // Strip markdown json fences if present
      const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(clean);
      return {
        code: typeof parsed.code === "string" ? parsed.code : raw,
        language: typeof parsed.language === "string" ? parsed.language : "typescript",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.95,
      };
    } catch {
      // Fallback: extract code block if present
      const codeMatch = raw.match(/```(?:[\w+-]+)?\n([\s\S]*?)```/);
      if (codeMatch) {
        return {
          code: codeMatch[1].trim(),
          language: "typescript",
          confidence: 0.88,
        };
      }
      return {
        code: raw,
        language: "text",
        confidence: 0.8,
      };
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:image/...;base64, prefix
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Fetches real repository context from GitHub API if the user has a connected token.
   * Grabs README and up to 15 relevant file contents matching the user's question.
   */
  async fetchGitHubRepoContext(repoFullName: string, userQuestion: string = ""): Promise<string> {
    if (typeof window === "undefined") return "";

    const token = sessionStorage.getItem("codeatlas_github_token");
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      // 1. Fetch repo metadata
      const repoRes = await fetch(`https://api.github.com/repos/${repoFullName}`, { headers });
      if (!repoRes.ok) return "";
      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch || "main";

      // 2. Fetch Git tree
      const treeRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/trees/${defaultBranch}?recursive=1`,
        { headers }
      );
      if (!treeRes.ok) return "";
      const treeData = await treeRes.json();
      const files: Array<{ path: string; size?: number }> = (treeData.tree || [])
        .filter((item: any) => item.type === "blob")
        .map((item: any) => ({ path: item.path, size: item.size }));

      // 3. Filter files by keywords in question
      const keywords = userQuestion
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2);

      const codeExtensions = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".json", ".md"];
      const candidateFiles = files.filter((f) =>
        codeExtensions.some((ext) => f.path.toLowerCase().endsWith(ext))
      );

      // Score files based on keyword overlap
      const scored = candidateFiles.map((f) => {
        const lowerPath = f.path.toLowerCase();
        let score = 0;
        for (const kw of keywords) {
          if (lowerPath.includes(kw)) score += 2;
        }
        if (lowerPath.includes("readme") || lowerPath.includes("auth") || lowerPath.includes("index")) {
          score += 1;
        }
        return { file: f, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const topFiles = scored.slice(0, 12).map((s) => s.file);

      // 4. Fetch content for top files (capped at ~1500 chars each)
      const fetchedSnippets: Array<{ path: string; content: string }> = [];
      for (const item of topFiles.slice(0, 6)) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${repoFullName}/${defaultBranch}/${item.path}`;
          const contentRes = await fetch(rawUrl, { headers });
          if (contentRes.ok) {
            const rawText = await contentRes.text();
            const trimmed = rawText.length > 1800 ? `${rawText.slice(0, 1800)}\n// ... [truncated for context]` : rawText;
            fetchedSnippets.push({ path: item.path, content: trimmed });
          }
        } catch {
          // ignore individual fetch errors
        }
      }

      // 5. Build context prompt
      let context = `\n\n--- REPOSITORY CONTEXT (${repoFullName}) ---\n`;
      context += `Default Branch: ${defaultBranch}\n`;
      context += `Total Files in Tree: ${files.length}\n`;
      context += `Key File Tree Sample:\n${files.slice(0, 25).map((f) => `- ${f.path}`).join("\n")}\n\n`;

      if (fetchedSnippets.length > 0) {
        context += `Relevant File Extracts:\n`;
        for (const s of fetchedSnippets) {
          context += `\n### File: \`${s.path}\`\n\`\`\`\n${s.content}\n\`\`\`\n`;
        }
      }

      return context;
    } catch (err) {
      console.warn("[CodeAtlas] Could not load GitHub repository context:", err);
      return "";
    }
  }
}

export const aiService = new AIService();

