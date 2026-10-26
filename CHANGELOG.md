# Changelog

All notable changes to the **CodeAtlas — AI-Powered Codebase Intelligence Platform** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-10-24

### Added (Phase 13: Public Launch & Release Experience)
- **Interactive Product Demo (`/demo`)**: Zero-credential sandbox allowing developers to explore real TypeScript AST call traces, pre-configured grounded AI queries with source receipts, change impact preview, and sample code exploration.
- **Product Onboarding Journey (`/onboarding`)**: 6-step guided walkthrough introducing newly authenticated developers to repository selection, read-only permissions, real-time AST indexing status, and first-question guidance.
- **Documentation Portal (`/docs`)**: Comprehensive 6-section technical documentation covering Getting Started, Core Features, Configuration, Development, Troubleshooting, and Security/Privacy.
- **Developer Quickstart (`/quickstart`)**: Concise 5-minute setup guide with verified terminal commands, copyable code blocks, and system prerequisites.
- **Trustworthy Feature Showcase (`/features`)**: Deep-dive feature catalog detailing problems solved, technical implementations, UI previews, and transparent limitation disclosures.
- **SEO & Search Crawler Directives**: Dynamic XML sitemap (`app/sitemap.ts`) and crawler robots policy (`app/robots.ts`) explicitly allowing public product pages while disallowing private user workspaces, source code viewers, and APIs.
- **Safe Authentication Redirects**: Preserves relative redirect targets on `/login?redirect=...` to ensure seamless deep-linking post-authentication.

### Added (Phase 12: Advanced Code Intelligence & Knowledge Graph)
- **Repository Knowledge Graph**: 10 entity types and 9 relationship types with AST-verified vs. heuristic evidence tags.
- **Symbol-Level Navigation**: In-viewer popover resolving definitions, upstream callers, downstream callees, cross-file references, and linked automated tests.
- **Workflow Trace Explorer**: Sequential execution path tracing from UI event handlers (`handleSubmit`) through services to database operations and test assertions.
- **Repository Learning Path**: Milestone curriculum with calculated reading times and server-persisted user completion tracking.
- **Codebase Health Insights**: Evidence-based structural health audits calculating coupling ratios, untested methods, circular imports, and dismissal persistence.

### Added (Phase 11: Production Hardening & E2E Verification)
- Unified test suite covering security unit tests, integration suites, and 6 end-to-end user journeys.
- Docker multi-stage containerization (`Dockerfile`, `docker-compose.yml`).
- Security middleware with rate limiting, prompt injection defenses, and secret redaction.

### Added (Phases 6–10: Platform Core)
- GitHub OAuth repository ingestion and background indexing.
- Contextual AI Assistant with exact file and line citation receipts.
- Visual CodeLens with OCR screenshot extraction.
- Interactive Architecture Graph and Change-Impact risk scoring.
- Pull request code review intelligence and findings publisher.
- Command-palette global search and developer workspace preferences.
