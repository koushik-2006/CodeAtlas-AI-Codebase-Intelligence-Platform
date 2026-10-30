# CodeAtlas: Full Frontend + FastAPI Backend + PostgreSQL Integration Guide

## 1. Executive Summary

This document details the complete end-to-end integration of the **CodeAtlas Next.js Frontend** with the **FastAPI Backend and PostgreSQL Database**.

The integration satisfies all primary goals:
- **Email/Password Registration & Login**: Full bcrypt password hashing, unique constraint handling, transactional user persistence in PostgreSQL, and JWT issuance.
- **Dual-Mode Session Transport**: Supports both secure **HttpOnly Cookies** (`codeatlas_session`) for browser navigation and **Bearer Tokens** (`Authorization: Bearer <token>`) for cross-origin and programmatic API calls.
- **Protected Dashboard & Session Persistence**: The frontend checks the active backend session via `/api/v1/auth/session` and `/api/v1/auth/me`. Expired or invalid sessions redirect safely without UI emulation.
- **Real Backend APIs**: Code intelligence, repository indexing, AST symbols, architecture diagrams, search, and flowtrace are wired directly to the FastAPI endpoints.
- **Safe PostgreSQL Migrations**: Alembic migrations preserve existing database data with non-destructive `add_column` operations. Supports offline SQL generation for manual execution.
- **Strict Security & Isolation**: API secrets (`GEMINI_API_KEY`, `SECRET_KEY`, OAuth secrets) reside exclusively on the server backend.

---

## 2. Project Directory Structure

```
CodeAtlas — AI Codebase Intelligence/
├── app/                          # Next.js App Router (Frontend Pages & UI)
│   ├── dashboard/                # Protected Dashboard views
│   ├── login/                    # Login & Registration authentication forms
│   ├── layout.tsx                # Root layout & providers
│   └── page.tsx                  # Landing page
├── components/                   # UI components (Flowtrace, Search, Assistant, etc.)
├── hooks/                        # React hooks (useAuth, useSession, useRepo)
├── services/                     # Frontend API clients
│   ├── api-client.ts             # Centralized Fetch client (Bearer + Cookie + error mapping)
│   ├── auth-service.ts           # Authentication client (Login, Register, Logout, Me)
│   ├── repo-service.ts           # Repository ingestion & indexing API client
│   └── assistant-service.ts      # AI assistant API client
├── types/                        # TypeScript interfaces & API schemas
├── backend/                      # Supplied Python FastAPI Application
│   ├── app/
│   │   ├── api/
│   │   │   ├── router.py         # Main /api/v1 router
│   │   │   └── v1/               # Endpoint routers: auth, github, repository, code, etc.
│   │   ├── core/                 # Config & application settings (Pydantic v2)
│   │   ├── database/             # SQLAlchemy engine & session factory
│   │   │   ├── migrations/       # Alembic migration scripts
│   │   │   │   ├── env.py
│   │   │   │   └── versions/     # Versioned migration files
│   │   │   └── base.py           # Declarative Base
│   │   ├── models/               # SQLAlchemy 2.0 ORM models (User, Repo, Index, Symbol)
│   │   ├── repositories/         # Repository pattern (PostgreSQL & In-Memory fallback)
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── security/             # JWT token handling & bcrypt password hashing
│   │   └── services/             # Domain services (Auth, AI, Ingestion, Symbol, Graph)
│   ├── tests/                    # Pytest test suite (30 passing tests)
│   ├── alembic.ini               # Database migration configuration
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Backend environment template
├── docs/                         # Integration documentation
│   └── INTEGRATION_GUIDE.md      # This guide
├── next.config.mjs               # Next.js config (with backend reverse proxy rewrite)
├── package.json                  # Frontend dependencies and scripts
└── tsconfig.json                 # TypeScript compiler options
```

---

## 3. Compatibility Map

| Frontend Feature | Frontend Service / Route | Backend Route (`/api/v1`) | Backend Service / Model | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Email Registration** | `auth-service.ts` -> `/login` | `POST /auth/register` | `AuthService.register_user` -> `User` model | **Active (Integrated)** |
| **Email Login** | `auth-service.ts` -> `/login` | `POST /auth/login` | `AuthService.login_user` -> `User` model | **Active (Integrated)** |
| **Google Sign-In** | `GoogleSignInButton.tsx` | `POST /auth/google` | `AuthService.login_with_google_credential` | **Active (Integrated)** |
| **Session Status** | `useAuth()` hook | `GET /auth/session` | `get_optional_current_user` | **Active (Integrated)** |
| **User Profile** | `useAuth()` hook | `GET /auth/me` | `get_current_user` -> `User` model | **Active (Integrated)** |
| **Logout** | `useAuth()` -> `logout()` | `POST /auth/logout` | Clears cookie + frontend token | **Active (Integrated)** |
| **Repository Connect**| `repo-service.ts` | `POST /repositories` | `RepositoryService.create_repository` | **Active (Integrated)** |
| **Repository Indexing**| `repo-service.ts` | `POST /repositories/{id}/index` | `IndexingService.start_indexing` | **Active (Integrated)** |
| **Index Status** | `repo-service.ts` | `GET /repositories/{id}/index/status`| `IndexingService.get_index_status` | **Active (Integrated)** |
| **File Tree & Content**| `repo-service.ts` | `GET /repositories/{id}/files` | `RepositoryService.get_files` | **Active (Integrated)** |
| **Code Explanation** | `code-service.ts` | `POST /code/explain` | `CodeExplanationService` + AI Provider | **Active (Integrated)** |
| **AI Assistant Chat** | `assistant-service.ts` | `POST /assistant/ask` | `AssistantService` + Gemini/OpenAI | **Active (Integrated)** |
| **Semantic Code Search**| `search-service.ts` | `POST /search` | `SearchService` + Inverted/Vector Index | **Active (Integrated)** |
| **Architecture Graph** | `architecture-service.ts` | `GET /repositories/{id}/architecture` | `ArchitectureService` + AST Graph | **Active (Integrated)** |
| **Symbol Dependencies**| `symbol-service.ts` | `GET /repositories/{id}/symbols/{id}/dependencies` | `SymbolService` | **Active (Integrated)** |
| **Bug Trail / Debug** | `debug-service.ts` | `POST /debug/analyze` | `DebuggingService` | **Active (Integrated)** |
| **Flowtrace / Visual** | `visual-service.ts` | `POST /visual/workflow` | `VisualExtractionService` | **Active (Integrated)** |

---

## 4. Authentication Architecture & Security Details

### A. Password Hashing
- Implemented using **bcrypt** via Python's standard `bcrypt` library with a work factor of 12 rounds (`backend/app/security/passwords.py`).
- Plaintext passwords are never logged, never stored, and never returned in API payloads.

### B. User Model & PostgreSQL Schema
- Column `hashed_password` added to `users` table as `VARCHAR(255) NULLABLE`.
- Allowing `NULL` ensures existing Google OAuth users who registered passwordlessly do not experience account corruption or broken invariants.
- A user registered via Google cannot log in with a password unless they explicitly set one; an unauthorized party cannot bypass Google authentication by attempting a blank password.

### C. Dual Session Transport
1. **HttpOnly Cookie**:
   - Cookie Name: `codeatlas_session`
   - Attributes: `HttpOnly=True`, `SameSite=Lax`, `Secure=False` (in local development; `Secure=True` in production), `Path=/`.
   - Protects against Cross-Site Scripting (XSS) token theft in modern browsers.
2. **Bearer Token**:
   - Header: `Authorization: Bearer <access_token>`
   - Generated on login/registration and stored in memory / local state for cross-origin or standalone API clients.
   - Centralized `api-client.ts` automatically sends both headers and credentials.

---

## 5. PostgreSQL Migration Procedure

The database schema uses Alembic with SQLAlchemy 2.0 and the modern `psycopg` (v3) driver:
`postgresql+psycopg://username:password@hostname:5432/dbname`.

### Migration Versions History
1. `20261027_01_init.py`: Base schema creation (`users`, `repositories`, `indexes`, `symbols`, `code_nodes`).
2. `20261027_02_add_user_password.py`: Non-destructive addition of `hashed_password` column to `users` table.

### How to Check and Apply Migrations Safely

#### 1. Inspect Current State
```bash
cd backend
python -m alembic -c alembic.ini current
```

#### 2. Dry-Run / Offline SQL Generation (Safe Review Before Running)
To inspect the exact SQL that will execute without touching the live database:
```bash
cd backend
python -m alembic -c alembic.ini upgrade head --sql
```

#### 3. Apply Migrations to PostgreSQL
```bash
cd backend
python -m alembic -c alembic.ini upgrade head
```

---

## 6. Local Setup & Execution Guide

### Prerequisites
- Node.js 18+ (tested with Node 20 / 22)
- Python 3.10+ (tested with Python 3.13)
- PostgreSQL (or set `DATABASE_TYPE=memory` for instant offline testing)

### Step 1: Configure Backend Environment
Create `backend/.env` (copy from `backend/.env.example`):
```ini
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
DEBUG=True
API_V1_STR=/api/v1
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

SECRET_KEY=generate_a_secure_random_key_with_at_least_32_characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Configuration
DATABASE_TYPE=postgres
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/codeatlas

# AI Provider Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 2: Install Backend Dependencies & Start Server
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
The FastAPI backend will start at `http://localhost:8000`. Interactive OpenAPI documentation is accessible at `http://localhost:8000/docs`.

### Step 3: Configure Frontend Environment
In the root directory, create `.env.local`:
```ini
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### Step 4: Install Frontend Dependencies & Start Next.js
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 7. Verification & Automated Test Results

| Test Category | Suite / Command | Scope | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Integration Tests** | `python -m pytest backend/tests` | 9 test files, 30 test cases: Auth, Repos, Code Explain, Models, Graph | **30 passed in 1.48s** | **100% Pass** |
| **Password & Auth Tests** | `test_auth_integration.py` | Registration, Duplicate Email, Bcrypt Hashing, Login, Inactive Users, Bearer & Cookie Transport, Expired Tokens, Logout, CORS | **13 passed** | **100% Pass** |
| **Frontend Static Types** | `npm run typecheck` (`tsc --noEmit`) | Entire Next.js project & services | **0 errors** | **100% Pass** |
| **Frontend Unit Tests** | `npm run test` (`jest`) | 19 test suites, 78 unit/integration tests | **19 passed, 78 passed** | **100% Pass** |

---

## 8. External Provider Setup & Operational Notes

1. **Google OAuth**:
   - Provide `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`.
   - Authorized Javascript origin: `http://localhost:3000`.
   - Authorized redirect URI: `http://localhost:8000/api/v1/auth/google/callback`.
2. **GitHub OAuth**:
   - Provide `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `backend/.env`.
   - Authorization callback URL: `http://localhost:8000/api/v1/github/callback`.
3. **Google Gemini AI**:
   - Provide `GEMINI_API_KEY` in `backend/.env`.
   - Never expose this key in frontend environment variables. All Gemini requests are dispatched server-side via `backend/app/services/ai_service.py`.
4. **Email Delivery / Password Reset**:
   - If no external SMTP/Resend provider is configured, the system explicitly reports verification requirements rather than generating fake OTP delivery messages.
