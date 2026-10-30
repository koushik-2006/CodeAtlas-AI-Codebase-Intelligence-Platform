# CodeAtlas Source Code & Architecture Evidence Inventory

This document establishes the verified evidence base for the academic project report of **CodeAtlas — AI-Powered Codebase Intelligence Platform**, mapping all architectural claims directly to source code files, database models, API routes, automated tests, and configuration files.

---

## 1. Project Identity & Repository Overview
- **Repository Name**: `CodeAtlas-AI-Codebase-Intelligence-Platform`
- **Owner**: `koushik-2006`
- **Repository URL**: `https://github.com/koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform`
- **Frontend Framework**: Next.js 14.2.15 (App Router), React 18.3.1, TypeScript 5.5.3, Tailwind CSS 3.4.6, Framer Motion 14.6.0, Lucide React 1.61.0
- **Backend Framework**: Python 3.13, FastAPI 0.141.1, Starlette 1.6.0, Uvicorn 0.52.4, Pydantic v2 (2.13.5), Pydantic Settings 2.15.0
- **Database Layer**: PostgreSQL (AWS Neon Cloud / Local PostgreSQL), SQLAlchemy 2.0.46, Alembic 1.20.1, Psycopg 3.3.6
- **AI Integration**: Google Gemini API (`@google/genai` 2.31.0 in Node / `google-genai` 2.22.0 in Python) supporting `gemini-1.5-flash` and `gemini-1.5-pro`
- **Static Export Pipeline**: Custom isolation builder `scripts/build-static-pages.ts` generating 47 static HTML pages in `out/` with `basePath: '/CodeAtlas-AI-Codebase-Intelligence-Platform'`
- **Target Hosting**: GitHub Pages for static client frontend; external container hosting (Google Cloud Run / Render / AWS) for FastAPI and Neon PostgreSQL

---

## 2. Source Code Inventory

### 2.1 Frontend Architecture (Next.js App Router)
| Path | Type | Functionality & Implementation Details |
| :--- | :--- | :--- |
| `app/layout.tsx` | Root Layout | Global HTML shell, fonts (`Inter`, `JetBrains Mono`), theme provider, meta tags |
| `app/page.tsx` | Landing Page | Hero section, interactive AST call graph preview, architecture gap highlights, feature grid |
| `app/login/page.tsx` | Auth UI | Dual email/password login and registration form, Google OAuth, GitHub OAuth, session restore |
| `app/verify-email/page.tsx` | OTP UI | 6-digit email OTP verification with countdown timer, resend throttle |
| `app/(app)/dashboard/page.tsx` | Dashboard | Main developer cockpit: personalized welcome greeting, repository cards, codebase health score |
| `app/(app)/architecture/page.tsx` | Visual Graph | Interactive architecture visualization, module dependency graph, 3D city / 2D node view |
| `app/(app)/assistant/page.tsx` | AI Cockpit | Grounded conversational assistant with file receipts, line numbers, verified AST citations |
| `app/(app)/code-review/page.tsx` | Review Center | Automated pull request and file review, security vulnerability scanner, blast-radius calculator |
| `app/(app)/debug/page.tsx` | Debug Engine | Stack trace parser, failure root-cause analyzer, patch generator |
| `app/(app)/multi-repo/page.tsx` | Multi-Repo | Cross-repository dependency analysis, cross-boundary symbol resolution |
| `app/(app)/onboarding/page.tsx` | Developer Guide | Personalized codebase learning paths, module difficulty ratings, key flow walk-throughs |
| `app/(app)/refactoring/page.tsx` | Refactoring | AST-safe symbol renaming preview, reference locator, safe mutation approval gates |
| `app/(app)/repositories/page.tsx` | Repo Manager | Repository catalog, search, tag filters, ingestion trigger, sync status |
| `app/(app)/search/page.tsx` | Global Search | Cross-codebase symbol, file, route, and pattern search with fuzzy matching |
| `app/(app)/settings/page.tsx` | Settings | Profile preferences, connected accounts (GitHub, Google), theme toggles |

### 2.2 Frontend Services & State Management
| Path | Class / Module | Purpose |
| :--- | :--- | :--- |
| `services/api-client.ts` | `ApiClient` | Universal HTTP client with automatic timeout, retry, error sanitization, Bearer auth |
| `services/auth-service.ts` | `AuthService` | Client authentication manager: login, register, session verification, OAuth token decoding |
| `services/architecture-service.ts` | `ArchitectureService` | Graph data retrieval: nodes, edges, circular dependency detection, health score |
| `services/assistant-service.ts` | `AssistantService` | Gemini query orchestration: grounded prompt submission, streaming, evidence citation formatting |
| `services/code-intelligence-service.ts` | `CodeIntelligenceService` | AST symbol navigation, caller/callee tree extraction, definition locator |
| `services/code-review-service.ts` | `CodeReviewService` | PR diff analysis, lint rules, security checks, review comment generation |
| `services/repository-service.ts` | `RepositoryService` | Repository ingestion, indexing status polling, file tree retrieval |
| `providers/AuthProvider.tsx` | `AuthProvider` | React context providing `user`, `isAuthenticated`, `login()`, `logout()`, `refreshSession()` |
| `providers/ThemeProvider.tsx` | `ThemeProvider` | Dark/light theme context, localStorage persistence (`codeatlas-theme`), system preference detection |

### 2.3 Backend Architecture (FastAPI & Services)
| Path | Layer | Description |
| :--- | :--- | :--- |
| `backend/app/main.py` | Application Entry | FastAPI application definition, CORS middleware, global exception handlers, v1 router mounting |
| `backend/app/config.py` | Configuration | Pydantic `BaseSettings`: DB connection, JWT secrets, CORS origins, OAuth credentials |
| `backend/app/api/router.py` | API Router | Aggregation of all 16 API v1 feature routers under `/api/v1` |
| `backend/app/api/v1/auth.py` | Auth Endpoints | `/auth/login`, `/auth/register`, `/auth/verify-otp`, `/auth/session`, `/auth/google` |
| `backend/app/api/v1/github.py` | GitHub Endpoints | `/github/connect`, `/github/callback`, `/github/status`, `/github/disconnect`, `/github/repos` |
| `backend/app/api/v1/repositories.py` | Repo Endpoints | Repository CRUD, `/repositories/{id}/index`, `/repositories/{id}/files` |
| `backend/app/api/v1/assistant.py` | AI Endpoints | Codebase Q&A with grounded AST citations, prompt construction, model invocation |
| `backend/app/api/v1/architecture.py` | Graph Endpoints | Dependency graph synthesis, circular dependency audit, module metrics |
| `backend/app/api/v1/code_explorer.py` | AST Endpoints | Symbol lookup, caller/callee trees, definition resolution, file content retrieval |
| `backend/app/api/v1/search.py` | Search Endpoints | Full-text and symbol search across indexed repositories |
| `backend/app/api/v1/health.py` | Health Check | System health, service status, database connectivity verification |
| `backend/app/services/auth_service.py` | Auth Service | Password hashing (bcrypt), verification, JWT token minting, user lookup |
| `backend/app/security/password.py` | Cryptography | Bcrypt 12-round password hashing and constant-time password verification |
| `backend/app/security/sessions.py` | JWT Tokens | HS256 JWT access token creation, decoding, expiration validation |
| `backend/app/utils/error_handlers.py` | Error Handling | Sanitized error handlers preventing credential and connection string leakage |

### 2.4 Database Models & Repositories (SQLAlchemy & PostgreSQL)
| Path | Entity | Table & Columns |
| :--- | :--- | :--- |
| `backend/app/models/user.py` | `User` | Table `users`: `id` (UUID PK), `email` (Unique Index), `hashed_password`, `display_name`, `avatar_url`, `is_active`, `is_verified`, `created_at`, `updated_at` |
| `backend/app/models/connected_account.py` | `ConnectedAccount` | Table `connected_accounts`: `id`, `user_id` (FK), `provider` (`google`/`github`), `provider_user_id`, `access_token`, `scopes`, `created_at` |
| `backend/app/models/repository.py` | `Repository` | Table `repositories`: `id`, `user_id` (FK), `name`, `full_name`, `owner`, `connection_type`, `is_indexed`, `file_count`, `symbol_count`, `created_at` |
| `backend/app/models/symbol.py` | `CodeSymbol` | Table `code_symbols`: `id`, `repository_id` (FK), `name`, `kind` (`function`/`class`/`interface`/`route`), `file_path`, `start_line`, `end_line`, `callers`, `callees` |
| `backend/app/models/dependency.py` | `Dependency` | Table `dependencies`: `id`, `repository_id` (FK), `source_module`, `target_module`, `dependency_type` |
| `backend/app/database/session.py` | DB Engine | SQLAlchemy `create_engine` with connection pooling, session maker, HTTP 503 fallback |
| `backend/app/repositories/postgres/users.py` | `PostgresUserRepository` | User CRUD with duplicate email conflict detection (`IntegrityError` -> HTTP 400) |
| `backend/app/repositories/postgres/accounts.py` | `PostgresAccountRepository` | Account linking with tenant isolation, account purge on disconnect |

---

## 3. Testing Evidence Inventory
- `scripts/test-unit.ts`: 6/6 tests passed (traversal protection, prompt injection defense, payload bounds, rate limiting, log redaction).
- `scripts/test-google-auth.ts`: 43/43 tests passed (client ID protection, JWT token decoding, audience/issuer validation, session cookie).
- `scripts/test-auth-system.ts`: 54/54 tests passed (login, registration, OTP delivery, 60s cooldown, password reset, session lifecycle).
- `scripts/test-github-oauth.ts`: 63/63 tests passed (OAuth initiation, CSRF state verification, profile binding, repository listing, account isolation).
- `scripts/test-phase21.ts`: 6/6 tests passed (route coverage, theme token, API client methods, CodeLens analysis, architecture catalog, approval gate).
- `scripts/test-gemini-integration.ts`: 43/43 tests passed (config handling, error classification, prompt bounding, verified source citations, offline synthesis, vector similarity).
- `scripts/test-navigation-guard.ts`: 16/16 tests passed (route protection, unauthenticated redirection, cookie invalidation).
- `scripts/test-phase10.ts`: 6/6 tests passed (global search, activity logging, notification lifecycle, developer profile, tenant data isolation).
- TypeScript Typecheck (`npm run typecheck`): 0 errors.
- ESLint Quality Check (`npm run lint`): 0 errors.
- Static Build Pipeline (`npm run build:pages`): 47/47 HTML pages compiled successfully to `out/`.

