"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { useTheme } from "@/hooks/useTheme";
import { authService } from "@/services/auth-service";
import { GoogleCredentialResponse } from "@/types/auth";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function GoogleSignInButton({
  onCredential,
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
  const [isRendered, setIsRendered] = useState<boolean>(false);

  // Directly read process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID with fallback to authService
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    authService.getClientId() ||
    "13168760256-mebb2hjbi0nl6hnlcclqoeaognkqu8ru.apps.googleusercontent.com";

  // Stable callback reference to prevent duplicate initialization
  const handleCredentialCallback = useCallback(
    (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        const errorMsg = "No credential returned from Google Identity Services.";
        onError?.(errorMsg);
        return;
      }
      onCredential(response.credential);
    },
    [onCredential, onError]
  );

  // Initialize and render GIS button once script is ready and container is mounted
  const initializeGoogleSignIn = useCallback(() => {
    if (typeof window === "undefined" || !window.google?.accounts?.id) {
      return;
    }

    if (!clientId || clientId.includes("your-google-client-id")) {
      const errorMsg =
        "Missing Google Client ID. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local.";
      setScriptError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      // Prevent duplicate GIS initialize calls
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

      // Render official button in container
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

        setIsRendered(true);
        setScriptError(null);
      }
    } catch (err: any) {
      console.error("[GoogleSignInButton] Initialization failed:", err);
      setScriptError(err.message || "Failed to initialize Google Sign-In.");
    }
  }, [clientId, handleCredentialCallback, isDark, onError]);

  // Re-render button if theme changes or script finishes loading
  useEffect(() => {
    if (scriptLoaded || (typeof window !== "undefined" && window.google?.accounts?.id)) {
      initializeGoogleSignIn();
    }
  }, [scriptLoaded, isDark, initializeGoogleSignIn]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch {}
      }
    };
  }, []);

  const handleRetryScript = () => {
    setScriptError(null);
    setScriptLoaded(false);
    // Reload script dynamically if failed
    const existingScript = document.getElementById("google-gsi-client");
    if (existingScript) existingScript.remove();

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setScriptLoaded(true);
      initializeGoogleSignIn();
    };
    script.onerror = () => {
      setScriptError("Google Identity Services script could not be loaded. Please disable ad-blockers or content blockers and try again.");
    };
    document.head.appendChild(script);
  };

  return (
    <div className={`w-full flex flex-col items-center gap-3 ${className}`}>
      {/* Official Google Identity Services Script Loader */}
      <Script
        id="google-gsi-client"
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptLoaded(true);
        }}
        onError={() => {
          setScriptError(
            "Google Identity Services could not be loaded. Check network connectivity or ad-blockers."
          );
        }}
      />

      {/* Target Container where Google GIS renders iframe */}
      <div
        ref={buttonContainerRef}
        id="google-signin-target"
        className={`w-full flex justify-center min-h-[44px] transition-opacity ${
          disabled || isLoading ? "pointer-events-none opacity-50" : ""
        } ${!isRendered && !scriptError ? "hidden" : "flex"}`}
        aria-label="Google Sign In Button Container"
      />

      {/* Loading Skeleton while GIS script loads */}
      {!isRendered && !scriptError && (
        <div
          className={`w-full max-w-[360px] h-[44px] rounded-full border flex items-center justify-center gap-3 animate-pulse ${
            isDark
              ? "bg-[#0D111B] border-[#242B39] text-[#9AA4B5]"
              : "bg-white border-[#E8E5F4] text-[#68677D]"
          }`}
        >
          <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
          <span className="text-xs font-semibold">Loading Google Sign-In...</span>
        </div>
      )}

      {/* Script Loading / Network Error Fallback */}
      {scriptError && (
        <div className="w-full max-w-[360px] p-3.5 rounded-2xl border border-red-500/20 bg-red-500/10 text-xs text-red-500 space-y-2 text-center animate-in fade-in">
          <div className="flex items-center justify-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Google Sign-In Unavailable</span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">{scriptError}</p>
          <button
            type="button"
            onClick={handleRetryScript}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/20 text-red-400 font-bold hover:bg-red-500/30 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Loading
          </button>
        </div>
      )}

      {/* Loading state indicator during active authentication */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[var(--primary)] animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Verifying Google token with backend...</span>
        </div>
      )}
    </div>
  );
}
