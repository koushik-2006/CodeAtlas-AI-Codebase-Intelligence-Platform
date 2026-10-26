"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { ChevronDown } from "lucide-react";

export function FAQSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "Do I need an OpenAI or Anthropic API key to run CodeAtlas?",
      a: "No. CodeAtlas functions out of the box with zero external credentials. Our deterministic AST parsing engine, Knowledge Graph, Symbol Navigator, and Workflow Tracer run entirely locally. If you add an optional API key in `.env.local`, it powers natural-language chat synthesis with real source receipts.",
    },
    {
      q: "Does CodeAtlas upload my proprietary code to external third parties?",
      a: "No. CodeAtlas operates with strict data isolation. Repository indexes and symbol tables are stored in your local workspace database (`data/codeatlas-db.json`). We never train models on your code or share snippets across users.",
    },
    {
      q: "How is CodeAtlas different from generic AI chat assistants?",
      a: "Generic chat tools hallucinate non-existent files and guess line numbers. CodeAtlas builds an Abstract Syntax Tree (AST) knowledge graph first. Every answer is grounded in real source citations with verified line ranges, caller/callee trees, and automated test linkages.",
    },
    {
      q: "Which programming languages are supported with full AST parsing?",
      a: "TypeScript, JavaScript, TSX, and JSX have full deep AST call-tree and symbol resolution out of the box. Markdown, JSON, and documentation files are structured into the knowledge graph. Other languages (Go, Python, Java) use syntactic token indexing with transparent heuristic labeling.",
    },
    {
      q: "Can I run CodeAtlas completely offline?",
      a: "Yes. CodeAtlas is designed for enterprise and air-gapped environments. You can run all core features—repository indexing, symbol navigation, workflow tracing, and change-impact scoring—with zero internet connectivity.",
    },
    {
      q: "What permissions does the GitHub OAuth integration request?",
      a: "We only request read-only access to repository metadata and source files (`repo:read`). We never request write, commit, or administrative permissions to your repositories.",
    },
  ];

  return (
    <section className="mx-auto max-w-4xl px-5 py-16 scroll-mt-16">
      <div className="text-center space-y-3 mb-10">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          FAQ
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-[var(--text-primary)]">
          Frequently Asked Questions
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Clear, straightforward answers about how CodeAtlas works under the hood.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden transition-all shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-5 text-left font-bold text-sm text-[var(--text-primary)] flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--text-secondary)] shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-[var(--primary)]" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-color)]/40">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
