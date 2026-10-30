import { isDemoMode, handleMockRequest } from "@/lib/demo/mock-api";
import { ApiResponse } from "@/types/api";

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined> | URLSearchParams;
  timeoutMs?: number;
  retries?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "/api";
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined> | URLSearchParams
  ): string {
    let cleanEndpoint = endpoint;
    const base = this.baseUrl.replace(/\/$/, "");

    if (base.endsWith("/api/v1") && cleanEndpoint.startsWith("/api/v1/")) {
      cleanEndpoint = cleanEndpoint.substring(7);
    } else if (base.endsWith("/api/v1") && cleanEndpoint.startsWith("/api/")) {
      cleanEndpoint = cleanEndpoint.substring(4);
    } else if (base.endsWith("/api") && cleanEndpoint.startsWith("/api/")) {
      cleanEndpoint = cleanEndpoint.substring(4);
    }

    const fullUrl = cleanEndpoint.startsWith("http")
      ? cleanEndpoint
      : `${base}${cleanEndpoint.startsWith("/") ? "" : "/"}${cleanEndpoint}`;

    if (!params) return fullUrl;

    const searchParams = new URLSearchParams();
    if (params instanceof URLSearchParams) {
      params.forEach((val, key) => searchParams.append(key, val));
    } else {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
    }

    const queryStr = searchParams.toString();
    if (!queryStr) return fullUrl;

    const separator = fullUrl.includes("?") ? "&" : "?";
    return `${fullUrl}${separator}${queryStr}`;
  }

  private async execute<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    if (isDemoMode()) {
      try {
        let parsedBody: any = undefined;
        if (options.body) {
          if (typeof options.body === "string") {
            try { parsedBody = JSON.parse(options.body); } catch { parsedBody = options.body; }
          } else {
            parsedBody = options.body;
          }
        }
        const mockResult = await handleMockRequest(
          options.method || "GET",
          endpoint,
          parsedBody,
          options.params
        );
        return {
          success: mockResult?.success !== false,
          data: (mockResult?.data !== undefined ? mockResult.data : mockResult) as T,
          message: mockResult?.message,
          timestamp: mockResult?.timestamp || new Date().toISOString(),
          ...(mockResult && typeof mockResult === "object" ? mockResult : {}),
        };
      } catch (err: any) {
        return {
          success: false,
          data: null as any,
          message: err?.message || "Mock request failed",
          timestamp: new Date().toISOString(),
        };
      }
    }
    const {
      params,
      timeoutMs = 15000,
      retries = options.method === "GET" || !options.method ? 1 : 0,
      headers: customHeaders = {},
      ...fetchOptions
    } = options;

    const url = this.buildUrl(endpoint, params);
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Read stored token if available in browser
    let storedToken: string | null = null;
    if (typeof window !== "undefined") {
      try {
        storedToken = localStorage.getItem("codeatlas_access_token");
      } catch {}
    }

    const headers: Record<string, string> = {
      "Accept": "application/json",
      "x-request-id": requestId,
      ...(storedToken && !("Authorization" in customHeaders)
        ? { "Authorization": `Bearer ${storedToken}` }
        : {}),
      ...(customHeaders as Record<string, string>),
    };

    if (fetchOptions.body && typeof fetchOptions.body === "string" && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    let lastError: any = null;
    let attempts = 0;
    const maxAttempts = 1 + Math.max(0, retries);

    while (attempts < maxAttempts) {
      attempts++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Link external signal if provided
      if (options.signal) {
        options.signal.addEventListener("abort", () => controller.abort());
      }

      try {
        const res = await fetch(url, {
          credentials: (fetchOptions as any).credentials || "include",
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let body: any = null;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            body = await res.json();
          } catch {
            body = null;
          }
        }

        if (!res.ok) {
          let errMsg = `HTTP ${res.status}: ${res.statusText || "Request failed"}`;
          if (body) {
            if (typeof body.detail === "string") {
              errMsg = body.detail;
            } else if (Array.isArray(body.detail)) {
              errMsg = body.detail
                .map((d: any) => d.msg || (typeof d === "string" ? d : JSON.stringify(d)))
                .join("; ");
            } else if (body.error) {
              if (typeof body.error === "string") {
                errMsg = body.error;
              } else if (typeof body.error === "object" && body.error.message) {
                errMsg = body.error.message;
              }
            } else if (body.message) {
              errMsg = body.message;
            }
          }
          const httpErr: any = new Error(errMsg);
          httpErr.status = res.status;
          httpErr.body = body;
          throw httpErr;
        }

        // Return structured response
        if (body && typeof body === "object" && "success" in body) {
          return {
            success: Boolean(body.success),
            data: body.data !== undefined ? body.data : body,
            message: body.message,
            timestamp: body.timestamp || new Date().toISOString(),
          };
        }

        return {
          success: true,
          data: body as T,
          timestamp: new Date().toISOString(),
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;

        // If user cancelled, don't retry
        if (err.name === "AbortError" && options.signal?.aborted) {
          break;
        }

        // If another attempt remaining and safe request, short delay
        if (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 300 * attempts));
        }
      }
    }

    let message = lastError?.message || "Failed to complete API request";
    const isNetworkError =
      !lastError?.status &&
      (lastError?.name === "TypeError" ||
       message.includes("Failed to fetch") ||
       message.includes("NetworkError") ||
       message.includes("ECONNREFUSED") ||
       message.includes("Failed to complete API request") ||
       lastError?.name === "AbortError");

    if (isNetworkError) {
      message = "Unable to connect to the server. Please try again.";
    }

    return {
      success: false,
      data: null as any,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.execute<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
