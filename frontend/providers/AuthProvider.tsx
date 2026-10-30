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

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  loginWithCredentials: (credentials: LoginCredentials) => Promise<EmailAuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<EmailAuthResponse>;
  verifyOtp: (request: VerifyOtpRequest) => Promise<EmailAuthResponse>;
  resendOtp: (request: ResendOtpRequest) => Promise<EmailAuthResponse>;
  forgotPassword: (request: ForgotPasswordRequest) => Promise<EmailAuthResponse>;
  resetPassword: (request: ResetPasswordRequest) => Promise<EmailAuthResponse>;
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
    refreshSession();

    // Synchronize authentication status across multiple browser tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "codeatlas-auth-user" || e.key === "codeatlas-auth-session") {
        refreshSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshSession]);

  const loginWithGoogle = async (credential: string) => {
    setIsLoading(true);
    try {
      const result = await authService.loginWithGoogle(credential);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
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
        loginWithCredentials,
        register,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
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
