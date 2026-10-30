# CodeAtlas Feature Implementation Status Matrix

This document provides a rigorous, verified classification of all functional capabilities within the **CodeAtlas — AI-Powered Codebase Intelligence Platform**, differentiating between fully verified implementations, partially complete modules, and planned future enhancements.

---

## 1. Feature Classification Matrix

| Feature Module | Specific Capability | Status | Implementation Details & Supporting Files | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Security** | Email/Password Registration | **Verified Implemented** | `app/login/page.tsx`, `services/auth-service.ts`, `backend/app/api/v1/auth.py`, `backend/app/repositories/postgres/users.py` | Verified in `test:auth-system` (54/54 passed); PostgreSQL unique index enforcement; HTTP 400 on duplicates |
| **Authentication & Security** | Password Hashing (Bcrypt) | **Verified Implemented** | `backend/app/security/password.py` using `bcrypt` 12-round salt | Verified: Plaintext passwords never stored; hashes excluded from API responses |
| **Authentication & Security** | Email OTP Verification | **Verified Implemented** | `app/verify-email/page.tsx`, `lib/server/email-service.ts`, `data/auth-otps.json` | Verified in `test:auth-system`: 6-digit OTP delivery, 60s cooldown, single-use invalidation |
| **Authentication & Security** | Google OAuth & OIDC Sign-In | **Verified Implemented** | `services/auth-service.ts`, `backend/app/api/v1/auth.py`, `components/auth/GoogleSignInButton.tsx` | Verified in `test:google-auth` (43/43 passed): JWT token verification, issuer & audience checks, session cookie |
| **Authentication & Security** | GitHub OAuth Integration | **Verified Implemented** | `components/auth/GitHubSignInButton.tsx`, `app/api/auth/github/route.ts`, `app/api/auth/github/callback/route.ts` | Verified in `test:github-oauth` (63/63 passed): CSRF state cookie, token exchange, account binding |
| **Authentication & Security** | Session Persistence | **Verified Implemented** | `services/auth-service.ts`, `providers/AuthProvider.tsx`, `backend/app/security/sessions.py` | Verified in `test:nav-guard` (16/16 passed): `codeatlas_session` HttpOnly cookie, session restore on load |
| **Codebase Exploration** | Repository File Tree & Viewer | **Verified Implemented** | `components/code-viewer/RepositoryFileTree.tsx`, `components/code-viewer/RepositoryDetailPageClient.tsx` | Verified in `test:unit` and `test:phase21`: dynamic tree hierarchy, syntax highlighting, line navigation |
| **Codebase Exploration** | AST Symbol Extraction | **Verified Implemented** | `lib/server/code-parser.ts`, `lib/server/indexer.ts`, `services/code-intelligence-service.ts` | Verified in `test:real-repo-ingestion`: extracts functions, classes, interfaces, routes with line ranges |
| **Codebase Exploration** | Deterministic Caller/Callee Graph | **Verified Implemented** | `lib/server/code-parser.ts`, `services/code-intelligence-service.ts` | Verified in `test:unit`: bidirectional call graph resolution without AI hallucination |
| **Architecture Visualization** | Interactive Dependency Graph | **Verified Implemented** | `app/(app)/architecture/page.tsx`, `services/architecture-service.ts`, `components/landing/HeroVisualization.tsx` | Verified in `test:phase21`: 2D node graph, edge rendering, module cluster mapping, circular dependency warning |
| **Architecture Visualization** | 3D City Visualization Preview | **Verified Implemented** | `app/(app)/architecture/page.tsx`, `components/landing/ProductPreviewSection.tsx` | Implemented with SVG 2.5D isometric rendering; building heights scaled to LOC and complexity |
| **AI Intelligence & Grounding** | Grounded AST Chatbot | **Verified Implemented** | `services/assistant-service.ts`, `lib/server/gemini.ts`, `app/(app)/assistant/page.tsx` | Verified in `test:gemini` (43/43 passed): prompt bounding, RAG citations with exact file and line numbers |
| **AI Intelligence & Grounding** | Deterministic Offline Fallback | **Verified Implemented** | `lib/server/gemini.ts`, `lib/server/ai-provider.ts` | Verified in `test:gemini`: generates AST-grounded answers even when Gemini API key is unconfigured |
| **Developer Productivity** | Blast-Radius Impact Analysis | **Verified Implemented** | `services/impact-service.ts`, `app/(app)/impact/page.tsx` | Verified: calculates transitive dependencies affected when a symbol or file is modified |
| **Developer Productivity** | CodeLens Semantic Analysis | **Verified Implemented** | `services/code-extraction-service.ts`, `app/api/codelens/explain/route.ts` | Verified in `test:phase21`: standalone explanation of selected code snippets with receipt links |
| **Developer Productivity** | Developer Onboarding Paths | **Verified Implemented** | `app/(app)/onboarding/page.tsx`, `lib/server/onboarding-engine.ts` | Verified: generates curated reading sequences for unfamiliar codebases based on architectural rank |
| **Search & Navigation** | Global Codebase & Symbol Search | **Verified Implemented** | `app/(app)/search/page.tsx`, `services/api-client.ts` | Verified in `test:integration` (Phase 10): 57 search results across files, symbols, APIs with category filters |
| **Deployment & CI/CD** | Static Next.js Export Pipeline | **Verified Implemented** | `scripts/build-static-pages.ts`, `next.config.mjs` | Verified: compiles 47 static pages into `out/` with `.nojekyll` and `404.html` SPA fallback |
| **Deployment & CI/CD** | GitHub Pages Deployment Workflow | **Verified Implemented** | `.github/workflows/deploy-pages.yml` | Verified: Node 20 LTS, `npm ci`, lint, typecheck, core test execution, static artifact upload |
| **Database & Persistence** | PostgreSQL Database Models | **Verified Implemented** | `backend/app/models/*.py`, `backend/app/database/session.py` | Verified schema: `users`, `connected_accounts`, `repositories`, `code_symbols`, `dependencies` |
| **External Collaboration** | VS Code Extension Integration | **Partially Implemented** | `integrations/vscode/` | TypeScript client and extension files compiled; WebView sidebar implemented; marketplace packaging pending |
| **AI Refactoring** | Automated Pull Request Commits | **Planned / Future Scope** | `app/(app)/refactoring/page.tsx` | UI preview and safe approval gates implemented; remote Git branch creation and push planned for Phase 2 |
| **Enterprise Security** | SAML 2.0 / Okta Enterprise SSO | **Planned / Future Scope** | Documented in roadmap | Planned for multi-tenant enterprise deployment |

---

## 2. External Dependencies & Deployment Boundaries

1. **GitHub Pages Boundary**:
   - GitHub Pages serves pure static assets (HTML, CSS, JS, SVG, images).
   - In static export mode, Next.js dynamic Route Handlers (`app/api/**/route.ts`) are excluded from `out/`.
   - The frontend communicates with the backend via `NEXT_PUBLIC_API_BASE_URL` (e.g., hosted on Render, Cloud Run, or AWS).
2. **PostgreSQL Database Boundary**:
   - The production PostgreSQL database is hosted on AWS Neon Cloud (`neondb`).
   - In sandboxed or offline test runs, in-memory SQLite fixtures or mocked repositories are utilized to prevent network timeouts.
3. **OAuth Provider Verification**:
   - Google OAuth and GitHub OAuth require real Client IDs and Secrets provisioned in Google Cloud Console and GitHub Developer Settings.
   - For offline test suites, mock JWT decoders and OAuth response emulators are used to verify cryptographic parsing and state safety without network dependency.

