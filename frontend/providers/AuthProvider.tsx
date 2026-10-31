"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  VerifyOtpRequest,
  ResendOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  EmailAuthResponse,
} from "@/types/auth";
import { authService } from "@/services/auth-service";
import { isFirebaseConfigured, getFirebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { DEMO_USER, isDemoMode } from "@/lib/demo/mock-api";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (credential?: string) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  loginWithGitHub: () => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  loginWithCredentials: (credentials: LoginCredentials) => Promise<EmailAuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<EmailAuthResponse>;
  verifyOtp: (request: VerifyOtpRequest) => Promise<EmailAuthResponse>;
  resendOtp: (request: ResendOtpRequest) => Promise<EmailAuthResponse>;
  forgotPassword: (request: ForgotPasswordRequest) => Promise<EmailAuthResponse>;
  resetPassword: (request: ResetPasswordRequest) => Promise<EmailAuthResponse>;
  checkEmailVerified: () => Promise<{ verified: boolean; user?: AuthUser; error?: string }>;
  resendEmailVerification: () => Promise<EmailAuthResponse>;
  enterDemoMode: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await authService.getSession();
      if (session.authenticated && session.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // When Firebase is configured, onAuthStateChanged is the authoritative source of truth.
    // isLoading stays true until its first callback so guards never redirect too early.
    if (isFirebaseConfigured && typeof window !== "undefined") {
      const auth = getFirebaseAuth();
      if (auth) {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          try {
            if (firebaseUser) {
              const providerId = firebaseUser.providerData[0]?.providerId || "";
              const isEmailProvider =
                providerId === "password" || (!providerId && !firebaseUser.photoURL);

              if (isEmailProvider && !firebaseUser.emailVerified) {
                // Unverified email users must NOT reach the dashboard
                setUser(null);
              } else {
                const authUser = authService.mapFirebaseUser(firebaseUser);
                setUser(authUser);
                authService.persistUser(authUser);
                try {
                  localStorage.removeItem("codeatlas_demo_active_user");
                  localStorage.removeItem("codeatlas_active_demo_session");
                } catch {}
              }
            } else {
              // No active Firebase user; check if an explicit demo mode session was selected
              try {
                const isDemoSession =
                  localStorage.getItem("codeatlas_active_demo_session") === "true";
                const isLoggedOut =
                  localStorage.getItem("codeatlas_demo_active_user") === "logged_out";

                if (isDemoSession && !isLoggedOut) {
                  setUser(DEMO_USER);
                } else {
                  setUser(null);
                }
              } catch {
                setUser(null);
              }
            }
          } finally {
            setIsLoading(false);
          }
        });

        return () => unsubscribe();
      }
    }

    // Fallback: non-Firebase environment (dev or backend auth)
    refreshSession();

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "codeatlas-auth-user" ||
        e.key === "codeatlas-auth-session" ||
        e.key === "codeatlas_active_demo_session"
      ) {
        refreshSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshSession]);

  const loginWithGoogle = async (credential?: string) => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured) {
        const result = await authService.loginWithGoogleFirebase();
        if (result.success && result.user) {
          setUser(result.user);
        }
        return result;
      }
      const result = await authService.loginWithGoogle(credential || "");
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGitHub = async () => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured) {
        const result = await authService.loginWithGitHubFirebase();
        if (result.success && result.user) {
          setUser(result.user);
        }
        return result;
      }
      return { success: false, error: "GitHub Authentication is configured via Firebase." };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithCredentials = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const result = await authService.loginWithCredentials(credentials);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      return await authService.register(credentials);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (request: VerifyOtpRequest) => {
    setIsLoading(true);
    try {
      const result = await authService.verifyOtp(request);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (request: ResendOtpRequest) => {
    return await authService.resendOtp(request);
  };

  const forgotPassword = async (request: ForgotPasswordRequest) => {
    return await authService.forgotPassword(request);
  };

  const resetPassword = async (request: ResetPasswordRequest) => {
    return await authService.resetPassword(request);
  };

  const checkEmailVerified = async () => {
    if (isFirebaseConfigured) {
      const res = await authService.checkEmailVerifiedFirebase();
      if (res.verified && res.user) {
        setUser(res.user);
      }
      return res;
    }
    return { verified: false, error: "Verification check requires Firebase Auth." };
  };

  const resendEmailVerification = async () => {
    if (isFirebaseConfigured) {
      return await authService.resendEmailVerificationFirebase();
    }
    return { success: false, error: "Email verification requires Firebase Auth." };
  };

  const enterDemoMode = () => {
    try {
      localStorage.setItem("codeatlas_active_demo_session", "true");
      localStorage.removeItem("codeatlas_demo_active_user");
    } catch {}
    setUser(DEMO_USER);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        loginWithGoogle,
        loginWithGitHub,
        loginWithCredentials,
        register,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        checkEmailVerified,
        resendEmailVerification,
        enterDemoMode,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
