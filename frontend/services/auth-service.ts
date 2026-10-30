import { isDemoMode, DEMO_USER } from "@/lib/demo/mock-api";
import { apiClient } from "@/services/api-client";

import { STORAGE_KEYS } from "@/lib/constants";

import {

  AuthUser,

  AuthSession,

  GoogleAuthResponse,

  GoogleDecodedToken,

  LoginCredentials,

  RegisterCredentials,

  VerifyOtpRequest,

  ResendOtpRequest,

  ForgotPasswordRequest,

  ResetPasswordRequest,

  EmailAuthResponse,

} from "@/types/auth";



export const DEFAULT_GOOGLE_CLIENT_ID =

  "13168760256-mebb2hjbi0nl6hnlcclqoeaognkqu8ru.apps.googleusercontent.com";



export class AuthService {

  private clientId: string;



  constructor() {

    this.clientId =

      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

  }



  /**

   * Retrieves the configured public Google OAuth 2.0 Web Client ID

   */

  getClientId(): string {

    return this.clientId;

  }



  /**

   * Safely decodes a Google JWT credential payload on the client without external dependencies.

   */

  decodeGoogleToken(token: string): GoogleDecodedToken | null {

    if (!token || typeof token !== "string") return null;

    try {

      const parts = token.split(".");

      if (parts.length !== 3) return null;

      // Convert Base64URL to standard Base64

      const base64Url = parts[1];

      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

      const jsonPayload = decodeURIComponent(

        atob(base64)

          .split("")

          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))

          .join("")

      );

      return JSON.parse(jsonPayload) as GoogleDecodedToken;

    } catch (err) {

      console.error("[AuthService] Failed to decode Google token:", err);

      return null;

    }

  }



  /**

   * Submits the Google ID Token credential to the backend authentication endpoint.

   */

  async loginWithGoogle(credential: string): Promise<{

    success: boolean;

    user?: AuthUser;

    error?: string;

  }> {

    if (!credential) {

      return { success: false, error: "Missing Google ID token credential." };

    }



    try {

      // 1. Send ID token to real backend endpoint for cryptographic signature & audience verification

      const res = await apiClient.post<GoogleAuthResponse>("/auth/google", {

        credential,

      });



      const authData = (res.data as any) || {};



      if (res.success && authData.user) {

        const user = authData.user;

        if (typeof window !== "undefined" && authData.access_token) {

          try {

            localStorage.setItem("codeatlas_access_token", authData.access_token);

          } catch {}

        }

        this.persistUser(user);

        return { success: true, user };

      }



      return {

        success: false,

        error:

          authData.error ||

          res.message ||

          "Google authentication was rejected by CodeAtlas backend.",

      };

    } catch (networkErr: any) {
      if (typeof window !== "undefined") {
        try {
          const fallbackRes = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential }),
            credentials: "include",
          });
          const fallbackData = await fallbackRes.json();
          if (fallbackData?.success && fallbackData?.data?.user) {
            const user = fallbackData.data.user;
            this.persistUser(user);
            return { success: true, user };
          }
          if (fallbackData?.error) {
            return { success: false, error: fallbackData.error };
          }
        } catch {}
      }

      return {
        success: false,
        error:
          networkErr?.message ||
          "Network error connecting to CodeAtlas authentication service.",
      };
    }

  }



  /**

   * Retrieves the current authenticated user session

   */

  async getSession(): Promise<AuthSession> {
    if (isDemoMode()) {
      if (typeof window !== "undefined") {
        try {
          if (localStorage.getItem("codeatlas_demo_active_user") === "logged_out") {
            return { authenticated: false, user: null };
          }
        } catch {}
      }
      return {
        authenticated: true,
        user: DEMO_USER,
        provider: "demo",
      };
    }

    try {

      const res = await apiClient.get<any>("/auth/session");

      if (res.data?.success && res.data.isAuthenticated && res.data.user) {

        const user: AuthUser = {

          id: res.data.user.id,

          name: res.data.user.name,

          email: res.data.user.email,

          avatar: res.data.user.avatar || res.data.user.avatar_url,

          role: res.data.user.role || "Software Engineer",

          provider: res.data.user.provider || "credentials",

        };

        this.persistUser(user);

        return {

          authenticated: true,

          user,

          provider: user.provider,

        };

      }

    } catch {

      // Backend request failed or unreachable

    }



    // Fallback: Check Next.js session endpoint if backend is unreachable or during local full-stack dev
    if (typeof window !== "undefined") {
      try {
        const nextRes = await fetch("/api/auth/session", {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (nextRes.ok) {
          const nextData = await nextRes.json();
          if (nextData?.success && nextData?.isAuthenticated && nextData?.user) {
            const user: AuthUser = {
              id: nextData.user.id,
              name: nextData.user.name,
              email: nextData.user.email,
              avatar: nextData.user.avatar,
              role: nextData.user.role || "Software Engineer",
              provider: nextData.auth?.github?.connected
                ? "github"
                : nextData.auth?.google?.connected
                ? "google"
                : "credentials",
            };
            this.persistUser(user);
            return {
              authenticated: true,
              user,
              provider: user.provider,
            };
          }
        }
      } catch {
        // Next.js fallback session unreachable
      }
    }

    // Authoritative: No active session found across tiers

    if (typeof window !== "undefined") {

      try {

        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);

        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);

        localStorage.removeItem("codeatlas_access_token");

      } catch {}

    }



    return {

      authenticated: false,

      user: null,

    };

  }



  /**

   * Signs in a user using email and password

   */

  async loginWithCredentials(credentials: LoginCredentials): Promise<EmailAuthResponse> {

    try {

      const res = await apiClient.post<EmailAuthResponse>("/auth/login", credentials);

      if (res.data?.success && res.data.user) {

        if (typeof window !== "undefined" && res.data.access_token) {

          try {

            localStorage.setItem("codeatlas_access_token", res.data.access_token);

          } catch {}

        }

        this.persistUser(res.data.user);

        return res.data;

      }

      if (res.data && res.data.error) {

        return res.data;

      }

      return {

        success: false,

        error: res.message || "Incorrect email or password.",

      };

    } catch (err: any) {

      const msg = err?.message || "";

      const isNet =

        msg.includes("Failed to fetch") ||

        msg.includes("NetworkError") ||

        msg.includes("Unable to connect") ||

        err?.name === "TypeError";





      if (isNet && typeof window !== "undefined") {
        try {
          const fallbackRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
            credentials: "include",
          });
          const fallbackData = await fallbackRes.json();
          if (fallbackData?.success && fallbackData?.user) {
            this.persistUser(fallbackData.user);
            return fallbackData;
          }
          if (fallbackData?.error) {
            return fallbackData;
          }
        } catch {}
      }

      return {
        success: false,
        error: isNet
          ? "Unable to connect to the authentication server. Please verify the backend service is running or try again."
          : (msg || "Unable to connect to the server. Please try again."),
      };

    }

  }



  /**

   * Registers a new user account with email and password

   */

  async register(credentials: RegisterCredentials): Promise<EmailAuthResponse> {

    try {

      const res = await apiClient.post<EmailAuthResponse>("/auth/register", credentials);

      if (res.data?.success && res.data.user) {

        if (typeof window !== "undefined" && res.data.access_token) {

          try {

            localStorage.setItem("codeatlas_access_token", res.data.access_token);

          } catch {}

        }

        this.persistUser(res.data.user);

        return res.data;

      }

      if (res.data && res.data.error) {

        return res.data;

      }

      return {

        success: false,

        error: res.message || "Unable to create account. Please try again.",

      };

    } catch (err: any) {
      const msg = err?.message || "";
      const isNet =
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("Unable to connect") ||
        err?.name === "TypeError";

      if (isNet && typeof window !== "undefined") {
        try {
          const registerRes = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
            credentials: "include",
          });
          const registerData = await registerRes.json();
          if (registerData?.success && registerData?.user) {
            this.persistUser(registerData.user);
            return registerData;
          }
          if (registerData) {
            return registerData;
          }
        } catch {}
      }

      return {
        success: false,
        error: isNet
          ? "Unable to connect to the authentication server. Please verify the backend service is running or try again."
          : (msg || "Unable to connect to the server. Please try again."),
      };
    }
  }

  /**
   * Verifies email using 6-digit OTP code

   */

  async verifyOtp(req: VerifyOtpRequest): Promise<EmailAuthResponse> {

    try {

      const res = await apiClient.post<EmailAuthResponse>("/auth/verify-otp", req);

      if (res.data?.success && res.data.user) {

        this.persistUser(res.data.user);

      }

      return (

        res.data || {

          success: false,

          error: res.message || "Failed to verify code.",

        }

      );

    } catch (err: any) {

      return {

        success: false,

        error: err?.message || "Network error during code verification.",

      };

    }

  }



  /**

   * Resends verification OTP code with cooldown enforcement

   */

  async resendOtp(req: ResendOtpRequest): Promise<EmailAuthResponse> {

    try {

      const res = await apiClient.post<EmailAuthResponse>("/auth/resend-otp", req);

      return (

        res.data || {

          success: false,

          error: res.message || "Failed to resend code.",

        }

      );

    } catch (err: any) {

      return {

        success: false,

        error: err?.message || "Network error while resending code.",

      };

    }

  }



  /**

   * Requests password reset instructions

   */

  async forgotPassword(req: ForgotPasswordRequest): Promise<EmailAuthResponse> {

    try {

      const res = await apiClient.post<EmailAuthResponse>("/auth/forgot-password", req);

      return (

        res.data || {

          success: false,

          error: res.message || "Failed to request password reset.",

        }

      );

    } catch (err: any) {

      return {

        success: false,

        error: err?.message || "Network error while requesting password reset.",

      };

    }

  }



  /**

   * Resets password using recovery token/OTP

   */

  async resetPassword(req: ResetPasswordRequest): Promise<EmailAuthResponse> {

    try {

      const res = await apiClient.post<EmailAuthResponse>("/auth/reset-password", req);

      return (

        res.data || {

          success: false,

          error: res.message || "Failed to reset password.",

        }

      );

    } catch (err: any) {

      return {

        success: false,

        error: err?.message || "Network error while resetting password.",

      };

    }

  }



  /**

   * Terminates the current authenticated session

   */

  async logout(): Promise<void> {
    if (isDemoMode()) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("codeatlas_demo_active_user", "logged_out");
          localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
          localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
          localStorage.removeItem("codeatlas_access_token");
        } catch {}
      }
      return;
    }

    try {

      await apiClient.post("/auth/logout").catch(() => {});

      await apiClient.delete("/auth/session").catch(() => {});

    } catch {

      // Ignore network errors on logout

    }



    if (typeof window !== "undefined") {

      try {

        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);

        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);

        localStorage.removeItem("codeatlas_access_token");

      } catch {}



      if (window.google?.accounts?.id?.disableAutoSelect) {

        window.google.accounts.id.disableAutoSelect();

      }

    }

  }



  /**

   * Reads stored user from LocalStorage safely

   */

  getStoredUser(): AuthUser | null {

    if (typeof window === "undefined") return null;

    try {

      const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);

      if (!raw) return null;

      return JSON.parse(raw) as AuthUser;

    } catch {

      return null;

    }

  }



  /**

   * Persists user metadata into browser storage

   */

  private persistUser(user: AuthUser): void {

    if (typeof window === "undefined") return;

    try {

      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));

      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, "active");

    } catch {}

  }

}



export const authService = new AuthService();

