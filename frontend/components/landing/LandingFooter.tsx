"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { Github } from "@/components/Icons";
import { ExternalLink, ShieldCheck } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-[var(--border-color)] bg-[var(--bg-surface)]/60 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand & Tagline Column */}
          <div className="lg:col-span-5 space-y-4">
            <Link
              href="/"
              aria-label="CodeAtlas home"
              className="inline-flex items-center cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              <Logo size="md" />
            </Link>

            <p className="text-sm text-[var(--text-secondary)] font-medium max-w-sm leading-relaxed">
              Understand any codebase. Trace every connection. Deterministic AST parsing and grounded codebase intelligence.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Deterministic AST Engine Active</span>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
            {/* Product Column */}
            <div className="space-y-3">
              <div className="font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
                Product
              </div>
              <ul className="space-y-2 text-[var(--text-secondary)] font-semibold">
                <li>
                  <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-[var(--text-primary)] transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#platform" className="hover:text-[var(--text-primary)] transition-colors">
                    Platform Preview
                  </a>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-[var(--text-primary)] transition-colors">
                    Interactive Demo
                  </Link>
                </li>
                <li>
                  <Link href="/quickstart" className="hover:text-[var(--text-primary)] transition-colors">
                    Quickstart Guide
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div className="space-y-3">
              <div className="font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
                Resources
              </div>
              <ul className="space-y-2 text-[var(--text-secondary)] font-semibold">
                <li>
                  <Link href="/docs" className="hover:text-[var(--text-primary)] transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1.5"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub Repo</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[var(--text-primary)] transition-colors">
                    Contact &amp; Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="space-y-3">
              <div className="font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
                Trust &amp; Legal
              </div>
              <ul className="space-y-2 text-[var(--text-secondary)] font-semibold">
                <li>
                  <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a href="#trust" className="hover:text-[var(--text-primary)] transition-colors">
                    Security Architecture
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-[var(--text-secondary)]">
          <div>
            &copy; {new Date().getFullYear()} CodeAtlas. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Read-Only GitHub Scopes</span>
            <span>•</span>
            <span>Zero Public Model Training</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
