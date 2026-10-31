import { isDemoMode, DEMO_USER } from "@/lib/demo/mock-api";
import { apiClient } from "@/services/api-client";
import { STORAGE_KEYS } from "@/lib/constants";
import { isFirebaseConfigured, getFirebaseAuth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  getAdditionalUserInfo,
  type User as FirebaseUser,
} from "firebase/auth";
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
   * Maps a client-side Firebase User instance to the canonical CodeAtlas AuthUser type.
   */
  mapFirebaseUser(user: FirebaseUser, providerOverride?: string): AuthUser {
    let provider: "google" | "github" | "credentials" | "email" | "demo" = "email";
    const pId = providerOverride || user.providerData?.[0]?.providerId || "";
    if (pId.includes("google")) provider = "google";
    else if (pId.includes("github")) provider = "github";
    else provider = "email";

    let username: string | undefined = undefined;
    let avatar: string | undefined = user.photoURL || undefined;

    if (provider === "github") {
      try {
        const cached = localStorage.getItem("codeatlas_github_profile");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.username) username = parsed.username;
          if (!avatar && parsed.avatar) avatar = parsed.avatar;
        }
      } catch {}
      if (!avatar && username) {
        avatar = `https://avatars.githubusercontent.com/${username}`;
      }
    }

    const displayName = user.displayName || username || user.email?.split("@")[0] || "Developer";

    return {
      id: user.uid,
      name: displayName,
      username,
      email: user.email || "",
      avatar,
      role: "Software Engineer",
      provider,
      createdAt: user.metadata?.creationTime,
    };
  }

  /**
   * Translates Firebase Auth error codes into friendly, actionable user messages.
   */
  formatFirebaseAuthError(err: any): string {
    const code = err?.code || "";
    switch (code) {
      case "auth/popup-blocked":
        return "Popup was blocked by your browser. Please allow popups for this site and try again.";
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed before completing authentication.";
      case "auth/cancelled-popup-request":
        return "Only one sign-in window can be open at a time.";
      case "auth/unauthorized-domain":
        return "This domain is not authorized for OAuth. Please check Firebase domain configuration.";
      case "auth/account-exists-with-different-credential":
        return "This email is already registered with another sign-in method — use that one.";
      case "auth/email-already-in-use":
        return "An account with this email address already exists. Please sign in instead.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Invalid email or password. Please check your credentials.";
      case "auth/user-not-found":
        return "No account found with this email. Please check your email or create an account.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please wait a few minutes before trying again.";
      case "auth/network-request-failed":
        return "Network connection error. Please verify your internet connection and try again.";
      default:
        return (
          err?.message?.replace(/^Firebase:\s*/, "") ||
          "Authentication request failed. Please try again."
        );
    }
  }

  /**
   * Signs in with Google using Firebase Authentication popup (client-side Web SDK).
   */
  async loginWithGoogleFirebase(): Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
  }> {
    const auth = getFirebaseAuth();
    if (!auth) {
      return { success: false, error: "Firebase authentication is not initialized." };
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = this.mapFirebaseUser(result.user, "google");
      this.persistUser(user);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("codeatlas_active_session_type", "firebase");
          localStorage.removeItem("codeatlas_demo_active_user");
          localStorage.removeItem("codeatlas_active_demo_session");
        } catch { }
      }
      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: this.formatFirebaseAuthError(err) };
    }
  }

  /**
   * Signs in with GitHub using Firebase Authentication popup and preserves user access token.
   */
  async loginWithGitHubFirebase(): Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
  }> {
    const auth = getFirebaseAuth();
    if (!auth) {
      return { success: false, error: "Firebase authentication is not initialized." };
    }
    try {
      const provider = new GithubAuthProvider();
      provider.addScope("read:user");
      provider.addScope("user:email");
      const result = await signInWithPopup(auth, provider);
      let githubUsername = "";
      try {
        const info = getAdditionalUserInfo(result);
        if (info?.username) {
          githubUsername = info.username;
        }
      } catch {}

      try {
        const credential = GithubAuthProvider.credentialFromResult(result);
        if (credential?.accessToken && typeof window !== "undefined") {
          sessionStorage.setItem("codeatlas_github_token", credential.accessToken);
          sessionStorage.setItem("github_access_token", credential.accessToken);
        }
      } catch { }

      const photo = result.user.photoURL || (githubUsername ? `https://avatars.githubusercontent.com/${githubUsername}` : undefined);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "codeatlas_github_profile",
            JSON.stringify({ username: githubUsername, avatar: photo })
          );
        } catch {}
      }

      const user = this.mapFirebaseUser(result.user, "github");
      if (githubUsername) user.username = githubUsername;
      if (photo) user.avatar = photo;
      this.persistUser(user);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("codeatlas_active_session_type", "firebase");
          localStorage.removeItem("codeatlas_demo_active_user");
          localStorage.removeItem("codeatlas_active_demo_session");
        } catch { }
      }
      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: this.formatFirebaseAuthError(err) };
    }
  }

  /**
   * Creates a new account with email and password via Firebase Auth and dispatches verification email.
   */
  async registerWithEmailFirebase(
    name: string,
    email: string,
    pass: string
  ): Promise<EmailAuthResponse> {
    const auth = getFirebaseAuth();
    if (!auth) {
      return { success: false, error: "Firebase authentication is not initialized." };
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        try {
          await updateProfile(result.user, { displayName: name.trim() });
        } catch { }
      }
      await sendEmailVerification(result.user);
      return {
        success: true,
        requiresVerification: true,
        email: result.user.email || email,
        message: "We sent a verification link to your email. Check your inbox and spam folder.",
      };
    } catch (err: any) {
      return { success: false, error: this.formatFirebaseAuthError(err) };
    }
  }

  /**
   * Signs in an existing user with email and password via Firebase Auth.
   * Unverified email users are prevented from reaching the dashboard.
   */
  async loginWithEmailFirebase(email: string, pass: string): Promise<EmailAuthResponse> {
    const auth = getFirebaseAuth();
    if (!auth) {
      return { success: false, error: "Firebase authentication is not initialized." };
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (!result.user.emailVerified) {
        return {
          success: false,
          requiresVerification: true,
          email: result.user.email || email,
          error: "Please verify your email address before signing in. Check your inbox and spam folder.",
        };
      }
      const user = this.mapFirebaseUser(result.user, "email");
      this.persistUser(user);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("codeatlas_active_session_type", "firebase");
          localStorage.removeItem("codeatlas_demo_active_user");
          localStorage.removeItem("codeatlas_active_demo_session");
        } catch { }
      }
      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: this.formatFirebaseAuthError(err) };
    }
  }

  /**
   * Dispatches a password reset email via Firebase Auth.
   */
  async sendPasswordResetFirebase(email: string): Promise<EmailAuthResponse> {
    const auth = getFirebaseAuth();
    if (!auth) {
      return { success: false, error: "Firebase authentication is not initialized." };
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return {
        success: true,
        message: "Password reset link sent to your email! Check your inbox and spam folder.",
      };
    } catch (err: any) {
      return { success: false, error: this.formatFirebaseAuthError(err) };
    }
  }

  /**
   * Resends verification email to the currently authenticating Firebase user.
   */
  async resendEmailVerificationFirebase(): Promise<EmailAuthResponse> {
    const auth = getFirebaseAuth();
    if (!auth || !auth.currentUser) {
      return { success: false, error: "No user currently signing in to resend verification." };
    }
    try {
      await sendEmailVerification(auth.currentUser);
      return {
        success: true,
        message: "A new verification link has been sent to your email. Check your spam folder.",
      };
    } catch (err: any) {
      return { success: false, error: this.formatFirebaseAuthError(err) };
    }
  }

  /**
   * Reloads Firebase user state and checks if email verification has completed.
   */
  async checkEmailVerifiedFirebase(): Promise<{
    verified: boolean;
    user?: AuthUser;
    error?: string;
  }> {
    const auth = getFirebaseAuth();
    if (!auth || !auth.currentUser) {
      return { verified: false, error: "No user session found to verify." };
    }
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        const user = this.mapFirebaseUser(auth.currentUser, "email");
        this.persistUser(user);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("codeatlas_active_session_type", "firebase");
            localStorage.removeItem("codeatlas_demo_active_user");
            localStorage.removeItem("codeatlas_active_demo_session");
          } catch { }
        }
        return { verified: true, user };
      }
      return {
        verified: false,
        error: "Email is not yet verified. Please click the link in your email first, then continue.",
      };
    } catch (err: any) {
      return { verified: false, error: this.formatFirebaseAuthError(err) };
    }
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

  async loginWithGoogle(credential?: string): Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
  }> {
    if (isFirebaseConfigured) {
      return this.loginWithGoogleFirebase();
    }

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

          } catch { }

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
        } catch { }
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
    if (typeof window !== "undefined") {
      try {
        if (localStorage.getItem("codeatlas_active_demo_session") === "true") {
          if (localStorage.getItem("codeatlas_demo_active_user") !== "logged_out") {
            return {
              authenticated: true,
              user: DEMO_USER,
              provider: "demo",
            };
          }
        }
      } catch { }
    }

    if (isFirebaseConfigured && typeof window !== "undefined") {
      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        const providerId = auth.currentUser.providerData[0]?.providerId || "";
        const isEmail = providerId === "password" || (!providerId && !auth.currentUser.photoURL);
        if (!isEmail || auth.currentUser.emailVerified) {
          const user = this.mapFirebaseUser(auth.currentUser);
          this.persistUser(user);
          return {
            authenticated: true,
            user,
            provider: user.provider,
          };
        }
      }
      const stored = this.getStoredUser();
      if (stored && stored.provider !== "demo") {
        return {
          authenticated: true,
          user: stored,
          provider: stored.provider,
        };
      }
    }

    if (isDemoMode() && !isFirebaseConfigured) {
      if (typeof window !== "undefined") {
        try {
          if (localStorage.getItem("codeatlas_demo_active_user") === "logged_out") {
            return { authenticated: false, user: null };
          }
        } catch { }
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

      } catch { }

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
    if (isFirebaseConfigured) {
      return this.loginWithEmailFirebase(credentials.email, credentials.password);
    }

    try {

      const res = await apiClient.post<EmailAuthResponse>("/auth/login", credentials);

      if (res.data?.success && res.data.user) {

        if (typeof window !== "undefined" && res.data.access_token) {

          try {

            localStorage.setItem("codeatlas_access_token", res.data.access_token);

          } catch { }

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
        } catch { }
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
    if (isFirebaseConfigured) {
      return this.registerWithEmailFirebase(
        credentials.name,
        credentials.email,
        credentials.password
      );
    }

    try {

      const res = await apiClient.post<EmailAuthResponse>("/auth/register", credentials);

      if (res.data?.success && res.data.user) {

        if (typeof window !== "undefined" && res.data.access_token) {

          try {

            localStorage.setItem("codeatlas_access_token", res.data.access_token);

          } catch { }

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
        } catch { }
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
    if (isFirebaseConfigured) {
      return this.sendPasswordResetFirebase(req.email);
    }

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
    if (isFirebaseConfigured && typeof window !== "undefined") {
      const auth = getFirebaseAuth();
      if (auth) {
        try {
          await signOut(auth);
        } catch { }
      }
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("codeatlas_demo_active_user", "logged_out");
        localStorage.removeItem("codeatlas_active_demo_session");
        localStorage.removeItem("codeatlas_active_session_type");
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
        localStorage.removeItem("codeatlas_access_token");
        sessionStorage.removeItem("codeatlas_github_token");
        sessionStorage.removeItem("github_access_token");
      } catch { }

      if (window.google?.accounts?.id?.disableAutoSelect) {
        try {
          window.google.accounts.id.disableAutoSelect();
        } catch { }
      }
    }

    if (!isFirebaseConfigured) {
      try {
        await apiClient.post("/auth/logout").catch(() => { });
        await apiClient.delete("/auth/session").catch(() => { });
      } catch { }
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

  getCurrentUser(): AuthUser | null {
    return this.getStoredUser();
  }

  async loginWithGitHub(): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    return this.loginWithGitHubFirebase();
  }

  async loginWithEmail(email: string, pass: string): Promise<EmailAuthResponse> {
    return this.loginWithEmailFirebase(email, pass);
  }

  async registerWithEmail(name: string, email: string, pass: string): Promise<EmailAuthResponse> {
    return this.registerWithEmailFirebase(name, email, pass);
  }

  /**

   * Persists user metadata into browser storage

   */

  persistUser(user: AuthUser): void {

    if (typeof window === "undefined") return;

    try {

      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));

      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, "active");

    } catch { }

  }

}



export const authService = new AuthService();

