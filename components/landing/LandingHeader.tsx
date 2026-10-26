"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LandingHeader() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-color)] bg-[var(--bg-page)]/90 backdrop-blur-md transition-colors duration-200">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:py-4"
        aria-label="Main Navigation"
      >
        {/* Left: Logo & Desktop Links */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            aria-label="CodeAtlas Home"
            onClick={closeMobileMenu}
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            <Logo />
          </Link>

          <div className="hidden items-center gap-6 text-sm font-semibold text-[var(--text-secondary)] md:flex">
            <Link
              href="/features"
              className="transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-md px-1 py-0.5"
            >
              Features
            </Link>
            <Link
              href="/demo"
              className="transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-md px-1 py-0.5"
            >
              Demo
            </Link>
            <Link
              href="/docs"
              className="transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-md px-1 py-0.5"
            >
              Docs
            </Link>
            <Link
              href="/quickstart"
              className="transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-md px-1 py-0.5"
            >
              Quickstart
            </Link>
          </div>
        </div>

        {/* Right: Controls & CTAs */}
        <div className="flex items-center gap-3 sm:gap-4 text-sm font-bold">
          <ThemeToggle />

          <Link
            href="/login"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-full font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            Log in
          </Link>

          <Link
            href="/login"
            className={`hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
              isDark
                ? "bg-[#29D3C2] text-[#0E1116] hover:bg-[#22b5a6] shadow-[0_0_20px_-5px_rgba(41,211,194,0.4)]"
                : "bg-[#1E2022] text-white hover:bg-[#2e3135]"
            }`}
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-b border-[var(--border-color)] bg-[var(--bg-page)]/95 px-5 pb-6 pt-2 backdrop-blur-lg md:hidden"
          >
            <div className="flex flex-col gap-3 py-2 text-base font-semibold">
              <Link
                href="/features"
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-2.5 transition-colors hover:bg-[var(--border-color)]/30 text-[var(--text-primary)]"
              >
                Features
              </Link>
              <Link
                href="/demo"
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-2.5 transition-colors hover:bg-[var(--border-color)]/30 text-[var(--text-primary)]"
              >
                Demo
              </Link>
              <Link
                href="/docs"
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-2.5 transition-colors hover:bg-[var(--border-color)]/30 text-[var(--text-primary)]"
              >
                Documentation
              </Link>
              <Link
                href="/quickstart"
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-2.5 transition-colors hover:bg-[var(--border-color)]/30 text-[var(--text-primary)]"
              >
                Quickstart
              </Link>
              <div className="my-2 border-t border-[var(--border-color)]" />
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="rounded-xl px-4 py-2.5 text-center font-bold text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className={`flex items-center justify-center gap-2 rounded-full py-3 text-center font-bold shadow-sm transition-transform active:scale-98 ${
                  isDark
                    ? "bg-[#29D3C2] text-[#0E1116] shadow-[0_0_20px_-5px_rgba(41,211,194,0.4)]"
                    : "bg-[#1E2022] text-white"
                }`}
              >
                Get started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
