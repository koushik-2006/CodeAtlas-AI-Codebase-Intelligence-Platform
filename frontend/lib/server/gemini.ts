import { GoogleGenAI } from "@google/genai";
import { aiCircuitBreaker, withRetry } from "./resilience";
import { aiMetrics } from "./telemetry/ai-metrics";
import { tracer } from "./telemetry/tracer";
import { logger, redactSecrets } from "./telemetry/logger";

export interface GeminiCompletionOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  correlationId?: string;
  timeoutMs?: number;
}

export interface GeminiCompletionResult {
  text: string;
  model: string;
  tokensReported?: number;
  tokensEstimated: number;
  durationMs: number;
}

export interface GeminiVisionResult {
  code: string;
  language: string;
  confidence: number;
}

export class GeminiService {
  private client: GoogleGenAI | null = null;
  private apiKey: string;
  private modelName: string;

  constructor() {
    this.apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || "").trim();
    this.modelName = (process.env.GEMINI_MODEL || "gemini-1.5-flash").trim();

    if (this.isConfigured()) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (err: any) {
        logger.error("gemini.client_init_failed", `Failed to initialize GoogleGenAI client: ${err.message}`);
        this.client = null;
      }
    }
  }

  /**
   * Refreshes credentials from environment (useful when .env is reloaded or updated dynamically).
   */
  reloadConfiguration(): void {
    this.apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || "").trim();
    this.modelName = (process.env.GEMINI_MODEL || "gemini-1.5-flash").trim();

    if (this.isConfigured()) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (err: any) {
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  /**
   * Checks whether a valid Gemini API key is configured.
   * Returns false if key is missing, empty, or a dummy template placeholder.
   */
  isConfigured(): boolean {
    const key = (this.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || "").trim();
    return Boolean(
      key &&
      key.length > 10 &&
      !key.includes("your_") &&
      !key.includes("placeholder") &&
      !key.startsWith("AIzaSy_placeholder")
    );
  }

  /**
   * Returns the active Gemini model name.
   */
  getModelName(): string {
    return this.modelName || process.env.GEMINI_MODEL || "gemini-1.5-flash";
  }

  /**
   * Validates configuration and returns a clear descriptive message if unconfigured.
   */
  assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new Error(
        "Google Gemini API is not configured. Please add GEMINI_API_KEY to your server .env.local file and restart the server."
      );
    }
  }

  /**
   * Generates text completion using the official Google Gen AI SDK.
   * Wrapped in circuit breaker, distributed tracing, and operational metrics.
   */
  async generateContent(options: GeminiCompletionOptions): Promise<GeminiCompletionResult> {
    this.reloadConfiguration();
    this.assertConfigured();

    const model = this.getModelName();
    const correlationId = options.correlationId || tracer.getOrCreateCorrelationId();
    const spanContext = tracer.startSpan("gemini.generate_content", { model }, correlationId);
    const t0 = performance.now();

    try {
      const result = await aiCircuitBreaker.execute(async () => {
        return await withRetry(
          async () => {
            const client = this.client || new GoogleGenAI({ apiKey: this.apiKey });
            const response = await client.models.generateContent({
              model,
              contents: options.prompt,
              config: {
                systemInstruction: options.systemInstruction,
                temperature: options.temperature ?? 0.2,
                maxOutputTokens: options.maxOutputTokens ?? 2048,
              },
            });

            return response;
          },
          { maxRetries: 2, initialBackoffMs: 300 }
        );
      });

      const durationMs = Math.max(1, Math.round(performance.now() - t0));
      const generatedText = result?.text || "";

      // Estimate tokens (~4 characters per token)
      const estimatedTokens = Math.round((options.prompt.length + generatedText.length) / 4);

      aiMetrics.recordRequest({
        durationMs,
        success: true,
        provider: "google_gemini",
        model,
        tokensEstimated: estimatedTokens,
      });

      spanContext.end("ok", { durationMs, estimatedTokens });

      return {
        text: generatedText,
        model,
        tokensEstimated: estimatedTokens,
        durationMs,
      };
    } catch (err: any) {
      const durationMs = Math.max(1, Math.round(performance.now() - t0));
      const sanitizedMessage = redactSecrets(err.message || "Gemini API request failed");

      let errorType: "rate_limit" | "timeout" | "other" = "other";
      if (sanitizedMessage.includes("429") || sanitizedMessage.toLowerCase().includes("quota") || sanitizedMessage.toLowerCase().includes("rate limit")) {
        errorType = "rate_limit";
      } else if (sanitizedMessage.toLowerCase().includes("timeout") || sanitizedMessage.toLowerCase().includes("aborted")) {
        errorType = "timeout";
      }

      aiMetrics.recordRequest({
        durationMs,
        success: false,
        provider: "google_gemini",
        model,
        errorType,
      });

      spanContext.end("error", { error: sanitizedMessage });

      throw this.classifyError(sanitizedMessage, model);
    }
  }

  /**
   * Classifies raw API errors into user-friendly actionable diagnostic messages.
   */
  classifyError(rawError: Error | string, modelOverride?: string): Error {
    const rawMsg = typeof rawError === "string" ? rawError : rawError?.message || "";
    const sanitized = redactSecrets(rawMsg);
    const model = modelOverride || this.getModelName();

    if (
      sanitized.includes("429") ||
      sanitized.toLowerCase().includes("quota") ||
      sanitized.toLowerCase().includes("rate limit") ||
      sanitized.toLowerCase().includes("resource_exhausted")
    ) {
      return new Error(
        "Gemini API rate limit or quota exceeded. Please wait a moment before trying again, or check your Google AI Studio quota."
      );
    }

    if (
      sanitized.includes("401") ||
      sanitized.includes("403") ||
      sanitized.toLowerCase().includes("api_key_invalid") ||
      sanitized.toLowerCase().includes("permission_denied")
    ) {
      return new Error(
        "Invalid Gemini API key. Please verify that your GEMINI_API_KEY in .env.local is valid and active."
      );
    }

    if (
      sanitized.includes("404") ||
      sanitized.toLowerCase().includes("model not found") ||
      sanitized.toLowerCase().includes("not_found")
    ) {
      return new Error(
        `Gemini model '${model}' was not found. Please verify GEMINI_MODEL in your server configuration (e.g., gemini-1.5-flash).`
      );
    }

    return new Error(`Gemini AI service error: ${sanitized}`);
  }

  /**
   * Generates streaming text completion yielding content chunks as they arrive.
   */
  async *generateContentStream(
    options: GeminiCompletionOptions & { signal?: AbortSignal }
  ): AsyncIterable<string> {
    this.reloadConfiguration();
    this.assertConfigured();

    const model = this.getModelName();
    const correlationId = options.correlationId || tracer.getOrCreateCorrelationId();
    const spanContext = tracer.startSpan("gemini.generate_content_stream", { model }, correlationId);
    const t0 = performance.now();

    try {
      const client = this.client || new GoogleGenAI({ apiKey: this.apiKey });
      const streamResponse = await client.models.generateContentStream({
        model,
        contents: options.prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxOutputTokens ?? 2048,
        },
      });

      let accumulatedLength = 0;

      for await (const chunk of streamResponse) {
        if (options.signal?.aborted) {
          break;
        }

        const chunkText = chunk.text;
        if (chunkText) {
          accumulatedLength += chunkText.length;
          yield chunkText;
        }
      }

      const durationMs = Math.max(1, Math.round(performance.now() - t0));
      const estimatedTokens = Math.round((options.prompt.length + accumulatedLength) / 4);

      aiMetrics.recordRequest({
        durationMs,
        success: true,
        provider: "google_gemini",
        model,
        tokensEstimated: estimatedTokens,
      });

      spanContext.end("ok", { durationMs, estimatedTokens });
    } catch (err: any) {
      const durationMs = Math.max(1, Math.round(performance.now() - t0));
      const sanitizedMessage = redactSecrets(err.message || "Gemini streaming failed");

      aiMetrics.recordRequest({
        durationMs,
        success: false,
        provider: "google_gemini",
        model,
      });

      spanContext.end("error", { error: sanitizedMessage });
      throw new Error(`Gemini streaming error: ${sanitizedMessage}`);
    }
  }

  /**
   * Extracts source code from image using Gemini Vision capabilities.
   */
  async extractCodeFromImage(
    imageBase64: string,
    mimeType: string = "image/png"
  ): Promise<GeminiVisionResult> {
    this.reloadConfiguration();
    this.assertConfigured();

    const model = this.getModelName();
    const client = this.client || new GoogleGenAI({ apiKey: this.apiKey });
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const response = await client.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Extract ONLY the source code shown in this screenshot or photo. Preserve exact indentation, casing, line breaks, and punctuation. Do NOT include markdown code fences (```) or conversational preamble.",
            },
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
    });

    const code = response.text?.trim() || "";
    const language = this.detectLanguageFromCode(code);

    return {
      code,
      language,
      confidence: code.length > 0 ? 0.96 : 0,
    };
  }

  private detectLanguageFromCode(code: string): string {
    if (/import React|export default function|<[A-Z]\w+|className=/.test(code)) return "TypeScript (React)";
    if (/interface \w+|type \w+ =|:\s*string|:\s*number/.test(code)) return "TypeScript";
    if (/def \w+\(.*\):|import \w+|from \w+ import/.test(code)) return "Python";
    if (/func \w+\(.*\)|package \w+/.test(code)) return "Go";
    if (/fn \w+\(.*\)|let mut |impl \w+/.test(code)) return "Rust";
    if (/public class \w+|System\.out\.println/.test(code)) return "Java";
    if (/SELECT .* FROM|INSERT INTO|CREATE TABLE/i.test(code)) return "SQL";
    return "JavaScript";
  }

  /**
   * Generates vector embedding for text using Google Gemini text-embedding-004.
   */
  async embedContent(text: string, model: string = "text-embedding-004"): Promise<number[]> {
    this.reloadConfiguration();
    this.assertConfigured();

    const client = this.client || new GoogleGenAI({ apiKey: this.apiKey });
    const response = await client.models.embedContent({
      model,
      contents: text,
    });

    const resAny = response as any;
    const values = resAny?.embeddings?.[0]?.values || resAny?.embedding?.values || [];
    return values;
  }
}

/**
 * Computes cosine similarity between two numeric vectors.
 * Returns a score between -1 and 1 (1 indicates maximum semantic alignment).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export const geminiService = new GeminiService();
