import React from "react";
import Link from "next/link";
import { Compass, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0F19] text-[#F3F5FA] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#111725] border border-[#242B39] rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#6C4DFF]/10 border border-[#6C4DFF]/20 text-[#6C4DFF] flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="text-4xl font-black font-mono tracking-tight text-white">404</div>
          <h1 className="text-xl font-bold text-[#F3F5FA]">Page Not Found</h1>
          <p className="text-sm text-[#8E95A8]">
            The route you are looking for does not exist or has been moved in the codebase atlas.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C4DFF] to-[#8B7CFF] text-white font-semibold text-sm hover:opacity-95 transition-opacity shadow-lg shadow-[#6C4DFF]/20"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}

