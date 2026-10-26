import Link from "next/link";
import { siteConfig } from "@/config/site";

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-[var(--border-color)] bg-[var(--bg-surface)]/40 transition-colors">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-10 text-xs font-semibold text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} CodeAtlas. All rights reserved.</span>
        </div>
        <div className="flex flex-wrap items-center gap-5 sm:gap-6">
          <Link
            href="/features"
            className="hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded px-1 py-0.5"
          >
            Features
          </Link>
          <Link
            href="/demo"
            className="hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded px-1 py-0.5"
          >
            Demo
          </Link>
          <Link
            href="/docs"
            className="hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded px-1 py-0.5"
          >
            Docs
          </Link>
          <Link
            href="/quickstart"
            className="hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded px-1 py-0.5"
          >
            Quickstart
          </Link>
          <Link
            href="/privacy"
            className="hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded px-1 py-0.5"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded px-1 py-0.5"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded px-1 py-0.5"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
