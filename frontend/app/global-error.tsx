"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0A0F19] text-[#F3F5FA] flex items-center justify-center p-6 antialiased">
        <div className="max-w-lg w-full bg-[#111725] border border-[#242B39] rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-[#F3F5FA]">
              Something went wrong
            </h1>
            <p className="text-sm text-[#8E95A8]">
              A critical application error occurred. You can attempt to refresh the application state or navigate back to the dashboard.
            </p>
          </div>

          {error?.message && (
            <details className="text-left bg-[#0A0F19] border border-[#242B39] rounded-xl p-3 text-xs text-[#8E95A8]">
              <summary className="font-mono cursor-pointer font-semibold text-[#F3F5FA] hover:text-amber-400 select-none">
                View technical details
              </summary>
              <div className="mt-2.5 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap break-all text-rose-400">
                {error.message}
                {error.stack && (
                  <div className="mt-2 pt-2 border-t border-[#242B39] text-[10px] text-zinc-500">
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#242B39] bg-[#111725] text-[#F3F5FA] font-semibold text-sm hover:bg-white/5 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Back to Overview
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

