# CodeAtlas Architecture & System Design

## 1. System Overview

CodeAtlas is an AI-powered codebase intelligence platform that maps code repositories, analyzes dependencies, extracts symbols via AST, provides contextual code explanations, and delivers interactive visual workflow tracing (FlowTrace).

```
                                      ┌──────────────────────────────────────────────┐
                                      │           CodeAtlas Web Frontend             │
                                      │        (Next.js 14 / React 18 / TS)          │
                                      └──────────────────────┬───────────────────────┘
                                                             │
                                     HTTP / REST (JSON)      │ Dual-Transport:
                                     (Reverse Proxy / CORS)  │ - HttpOnly Cookie (codeatlas_session)
                                                             │ - Bearer Token (Authorization)
                                                             ▼
                                      ┌──────────────────────────────────────────────┐
                                      │           CodeAtlas API Gateway              │
                                      │            (FastAPI / Python 3)              │
                                      └──────┬───────────────┬────────────────┬──────┘
                                             │               │                │
                        ┌────────────────────┴───┐   ┌───────┴──────┐   ┌─────┴──────────────────┐
                        │ Authentication & Users │   │ Repositories │   │  Code Intelligence &   │
                        │ (Bcrypt / JWT / OAuth) │   │ & Ingestion  │   │     AI Services        │
                        └────────────┬───────────┘   └───────┬──────┘   └─────┬──────────────────┘
                                     │                       │                │
                                     ▼                       ▼                ▼
                        ┌────────────────────────────────────────────────────────────┐
                        │              SQLAlchemy 2.0 / PostgreSQL ORM               │
                        │    (users, repos, indexes, symbols, chunks, analyses)      │
                        └────────────────────────────┬───────────────────────────────┘
                                                     │
                                                     ▼
                                      ┌──────────────────────────────┐
                                      │      PostgreSQL Database     │
                                      │   (psycopg v3 async/sync)    │
                                      └──────────────────────────────┘
```

---

## 2. Layered Architecture

### A. Frontend Layer (`app/`, `components/`, `services/`)
- **Next.js 14 App Router**: Provides client-side routing, protected layouts, and responsive interfaces.
- **Centralized API Client (`services/api-client.ts`)**: Encapsulates fetch operations, attaches authentication headers, parses FastAPI error responses into UI-friendly feedback, and handles network timeouts.
- **Dual Transport Authentication**: Automatically passes `codeatlas_session` cookies via `credentials: "include"` and attaches `Authorization: Bearer <token>` when tokens exist in local session storage.

### B. Backend Layer (`backend/app/`)
- **FastAPI Framework**: High-performance asynchronous API engine with Pydantic v2 schemas and automatic OpenAPI documentation (`/docs`, `/redoc`).
- **Domain Services (`backend/app/services/`)**:
  - `AuthService`: Registration, bcrypt hashing, login verification, JWT token issuance.
  - `RepositoryService`: Repository registration, authorized GitHub fetch, file tree traversal, and content reading.
  - `IndexingService`: Repository AST parsing, symbol extraction, chunk generation, and indexing progress tracking.
  - `AIService` / `AssistantService`: Multi-provider LLM abstraction (Gemini 1.5, OpenAI GPT-4o, Anthropic Claude, deterministic mock).
  - `GraphService`: Module architecture maps and workflow execution tracing (FlowTrace).
  - `DebuggingService` (BugTrail): Stack trace analysis, root-cause identification, and source line linking.
  - `ImpactService` (ChangeRadar): Blast-radius estimation for code modifications.
  - `SnippetMatchingService` (CodeLens): Fingerprint-based snippet-to-repository matching.
- **Repositories & Persistence (`backend/app/repositories/`)**: Abstract repository pattern with dual implementations:
  - `postgres/`: Production SQLAlchemy 2.0 implementations.
  - `memory/`: In-memory thread-safe storage for offline testing and rapid CI validation.

### C. Data Persistence Layer (`backend/app/database/`)
- **Database Engine**: SQLAlchemy 2.0 with PostgreSQL using the official `psycopg` (v3) driver (`postgresql+psycopg://...`).
- **Migrations (`backend/app/database/migrations/`)**: Alembic migration versions with full support for safe, non-destructive schema evolutions and dry-run SQL preview.

---

## 3. Security Architecture

1. **Password Security**: Passwords are never stored in plaintext. They are hashed using `bcrypt` with 12 computational rounds.
2. **Session Security**: JWT tokens are signed using `HS256` with a server-side `SECRET_KEY`. Browser sessions utilize `HttpOnly`, `SameSite=Lax`, and `Secure` cookies.
3. **Multi-Tenant User Isolation**: Every repository, file, index, and analysis operation strictly enforces `current_user["id"]` ownership. Users cannot query or mutate repositories belonging to other accounts.
4. **Server-Side Secret Containment**: External API keys (`GEMINI_API_KEY`, `GITHUB_CLIENT_SECRET`, database connection credentials) reside exclusively on the server runtime and are never included in frontend builds or client responses.
