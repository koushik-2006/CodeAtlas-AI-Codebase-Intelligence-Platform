"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error boundary captured:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-[var(--bg-card,#111725)] border border-[var(--border-color,#242B39)] rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[var(--text-primary,#F3F5FA)]">
            Something went wrong on this page
          </h2>
          <p className="text-sm text-[var(--text-secondary,#8E95A8)]">
            An unexpected error occurred while rendering this view. You can reload the component or return to the main dashboard.
          </p>
        </div>

        {error?.message && (
          <details className="text-left bg-[var(--bg-page,#0A0F19)] border border-[var(--border-color,#242B39)] rounded-xl p-3 text-xs text-[var(--text-secondary,#8E95A8)]">
            <summary className="font-mono cursor-pointer font-semibold text-[var(--text-primary,#F3F5FA)] hover:text-amber-400 select-none">
              View technical error details
            </summary>
            <div className="mt-2.5 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap break-all text-rose-400">
              {error.message}
              {error.stack && (
                <div className="mt-2 pt-2 border-t border-[var(--border-color,#242B39)] text-[10px] text-zinc-500">
                  {error.stack}
                </div>
              )}
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C4DFF] to-[#8B7CFF] text-white font-semibold text-sm hover:opacity-95 transition-opacity shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color,#242B39)] bg-[var(--bg-card,#111725)] text-[var(--text-primary,#F3F5FA)] font-semibold text-sm hover:bg-white/5 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
