"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "Do I need an OpenAI or Anthropic API key to run CodeAtlas?",
      a: "No. CodeAtlas functions out of the box with zero external credentials. Our deterministic AST parsing engine, Knowledge Graph, Symbol Navigator, and Workflow Tracer run entirely locally. If you add an optional API key in `.env.local`, it powers natural-language chat synthesis with real source receipts.",
    },
    {
      q: "Does CodeAtlas upload my proprietary code to external third parties?",
      a: "No. CodeAtlas operates with strict data isolation. Repository indexes and symbol tables are stored in your local workspace database. We never train models on your code or share snippets across users.",
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
    <section id="faq" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 scroll-mt-20">
      <div className="text-center space-y-3 mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3.5 py-1.5 font-mono text-xs font-bold text-[var(--primary)] shadow-xs">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FREQUENTLY ASKED QUESTIONS</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-[var(--text-primary)]">
          Frequently Asked Questions
        </h2>
        <p className="text-base text-[var(--text-secondary)] max-w-2xl mx-auto">
          Clear, straightforward answers about how CodeAtlas works under the hood.
        </p>
      </div>

      <div className="space-y-3.5">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                isOpen
                  ? "border-[var(--primary)]/40 bg-[var(--bg-surface)] shadow-sm"
                  : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--primary)]/30"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="w-full p-5 sm:p-6 text-left font-bold text-sm sm:text-base text-[var(--text-primary)] flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[var(--text-secondary)] shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-[var(--primary)]" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-color)]/40 mt-1">
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
