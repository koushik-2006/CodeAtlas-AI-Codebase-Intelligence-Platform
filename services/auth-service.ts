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
    try {
      const res = await apiClient.get<any>("/auth/session");
      if (res.data?.success && res.data.user) {
        const user: AuthUser = {
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          avatar: res.data.user.avatar,
          role: res.data.user.role || "Software Engineer",
          provider: "google",
        };
        this.persistUser(user);
        return {
          authenticated: true,
          user,
          provider: "google",
        };
      }
    } catch {
      // Backend unavailable; inspect local persistence
    }

    const storedUser = this.getStoredUser();
    if (storedUser) {
      return {
        authenticated: true,
        user: storedUser,
        provider: storedUser.provider || "google",
      };
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
        this.persistUser(res.data.user);
        return res.data;
      }
      if (res.data) {
        return res.data;
      }
      return { success: false, error: res.message || "Failed to sign in." };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Network error connecting to login service.",
      };
    }
  }

  /**
   * Registers a new user account with email and password
   */
  async register(credentials: RegisterCredentials): Promise<EmailAuthResponse> {
    try {
      const res = await apiClient.post<EmailAuthResponse>("/auth/register", credentials);
      return (
        res.data || {
          success: false,
          error: res.message || "Failed to register account.",
        }
      );
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Network error during registration.",
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
    try {
      await apiClient.delete("/auth/session").catch(() => {});
      await apiClient.post("/auth/session").catch(() => {});
    } catch {
      // Ignore network errors on logout
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
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
