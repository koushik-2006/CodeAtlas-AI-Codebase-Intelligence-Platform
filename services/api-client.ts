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
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "/api";
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined> | URLSearchParams
  ): string {
    const fullUrl = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

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
    const {
      params,
      timeoutMs = 15000,
      retries = options.method === "GET" || !options.method ? 1 : 0,
      headers: customHeaders = {},
      ...fetchOptions
    } = options;

    const url = this.buildUrl(endpoint, params);
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const headers: Record<string, string> = {
      "Accept": "application/json",
      "x-request-id": requestId,
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
          const errMsg =
            (body && (body.error || body.message)) ||
            `HTTP ${res.status}: ${res.statusText || "Request failed"}`;
          throw new Error(errMsg);
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

    return {
      success: false,
      data: null as any,
      message: lastError?.message || "Failed to complete API request",
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
