"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { useTheme } from "@/hooks/useTheme";
import { authService } from "@/services/auth-service";
import { isFirebaseConfigured } from "@/lib/firebase";
import { AlertCircle, RotateCw } from "lucide-react";

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
  clientId?: string;
}

interface GoogleSignInButtonProps {
  onCredential?: (idToken: string) => void;
  onClick?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  onCredential,
  onClick,
  onError,
  disabled = false,
  isLoading = false,
  className = "",
}: GoogleSignInButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  // Fallback credentials for legacy Google Identity Services
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    authService.getClientId() ||
    "13168760256-mebb2hjbi0nl6hnlcclqoeaognkqu8ru.apps.googleusercontent.com";

  const handleCredentialCallback = useCallback(
    (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        const errorMsg = "No credential returned from Google Identity Services.";
        onError?.(errorMsg);
        return;
      }
      onCredential?.(response.credential);
    },
    [onCredential, onError]
  );

  const initializeGoogleSignIn = useCallback(() => {
    if (isFirebaseConfigured || typeof window === "undefined" || !window.google?.accounts?.id) {
      return;
    }

    try {
      if (!isInitializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: "signin",
          itp_support: true,
        });
        isInitializedRef.current = true;
      }

      if (buttonContainerRef.current) {
        buttonContainerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          theme: isDark ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 360,
        });
        setScriptError(null);
      }
    } catch (err: any) {
      setScriptError(err?.message || "Failed to initialize Google Sign-In.");
    }
  }, [clientId, handleCredentialCallback, isDark]);

  useEffect(() => {
    if (!isFirebaseConfigured && (scriptLoaded || (typeof window !== "undefined" && window.google?.accounts?.id))) {
      initializeGoogleSignIn();
    }
  }, [scriptLoaded, isDark, initializeGoogleSignIn]);

  useEffect(() => {
    return () => {
      if (!isFirebaseConfigured && typeof window !== "undefined" && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch {}
      }
    };
  }, []);

  // Primary Path: Firebase client-side auth button
  if (isFirebaseConfigured) {
    return (
      <div className={`w-full flex justify-center ${className}`}>
        <button
          type="button"
          onClick={() => {
            if (disabled || isLoading) return;
            onClick?.();
          }}
          disabled={disabled || isLoading}
          aria-label="Continue with Google"
          className={`w-full max-w-[360px] h-[44px] rounded-full border px-4 flex items-center justify-center gap-3 text-sm font-semibold transition-all duration-150 select-none shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed ${
            isDark
              ? "bg-[#131314] border-[#8e918f] hover:bg-[#202124] text-[#e3e3e3]"
              : "bg-white border-[#747775] hover:bg-[#f8fafd] text-[#1f1f1f]"
          }`}
        >
          {isLoading ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin text-[var(--primary)]" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>Continue with Google</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Fallback: Legacy Google Identity Services script rendering
  return (
    <div className={`w-full flex flex-col items-center gap-3 ${className}`}>
      <Script
        id="google-gsi-client"
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptLoaded(true);
          initializeGoogleSignIn();
        }}
        onError={() => {
          setScriptError(
            "Google Identity Services script could not be loaded. Please disable ad-blockers and try again."
          );
        }}
      />

      <div
        ref={buttonContainerRef}
        id="google-signin-btn-container"
        className="w-full flex justify-center min-h-[44px]"
      />

      {scriptError && (
        <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20 max-w-sm text-center">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{scriptError}</span>
        </div>
      )}
    </div>
  );
}
