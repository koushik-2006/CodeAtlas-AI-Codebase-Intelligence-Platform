"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Menu, X, ExternalLink } from "lucide-react";
import { Github } from "@/components/Icons";
import { motion, AnimatePresence } from "framer-motion";

export function LandingHeader() {
  const { isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Platform", href: "#platform" },
    { label: "Documentation", href: "/docs" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-[var(--border-color)] bg-[var(--bg-page)]/90 backdrop-blur-xl shadow-xs"
          : "border-b border-transparent bg-[var(--bg-page)]/70 backdrop-blur-md"
      }`}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5"
        aria-label="Main Navigation"
      >
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            aria-label="CodeAtlas home"
            onClick={closeMobileMenu}
            className="flex items-center cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] group"
          >
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-semibold text-[var(--text-secondary)]">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-1.5 rounded-lg transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://github.com/koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] inline-flex items-center gap-1.5"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* Right: Controls & CTAs */}
        <div className="flex items-center gap-2.5 sm:gap-3 text-sm font-semibold">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-sm active:scale-95 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-[0_0_20px_-5px_rgba(124,92,252,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  window.location.reload();
                }}
                className="px-3 py-2 rounded-xl font-semibold text-xs text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                Sign In
              </Link>

              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-all shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] bg-gradient-to-r from-[#7C5CFC] to-[#5A38E6] hover:from-[#6A4BE8] hover:to-[#4A28D6] text-white shadow-[0_0_24px_-6px_rgba(124,92,252,0.45)]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] hover:bg-[var(--border-color)]/30 transition-colors"
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
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-b border-[var(--border-color)] bg-[var(--bg-page)]/98 px-5 pb-6 pt-3 backdrop-blur-xl lg:hidden shadow-lg"
          >
            <div className="flex flex-col gap-1.5 py-1 text-base font-semibold">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="rounded-xl px-4 py-2.5 transition-colors hover:bg-[var(--border-color)]/30 text-[var(--text-primary)]"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="https://github.com/koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobileMenu}
                className="flex items-center justify-between rounded-xl px-4 py-2.5 transition-colors hover:bg-[var(--border-color)]/30 text-[var(--text-primary)]"
              >
                <span className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  GitHub Repository
                </span>
                <ExternalLink className="w-4 h-4 opacity-60" />
              </a>

              <div className="my-2 border-t border-[var(--border-color)]" />

              {isAuthenticated ? (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center gap-2 rounded-xl py-3 text-center font-bold bg-[var(--primary)] text-white shadow-sm"
                  >
                    <span>Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      closeMobileMenu();
                      window.location.reload();
                    }}
                    className="w-full py-2.5 rounded-xl font-semibold text-xs text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="rounded-xl px-4 py-2.5 text-center font-semibold text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors border border-[var(--border-color)]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center gap-2 rounded-xl py-3 text-center font-bold bg-gradient-to-r from-[#7C5CFC] to-[#5A38E6] text-white shadow-sm"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
