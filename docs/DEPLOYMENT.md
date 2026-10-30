# CodeAtlas Production Deployment & Organization Guide

This document is the authoritative guide for organizing, configuring, building, and deploying the **CodeAtlas AI Codebase Intelligence Platform** across its dual-tier architecture:
1. **Frontend**: Static Single-Page Application (SPA) deployed to **GitHub Pages** at:  
   `https://koushik-2006.github.io/CodeAtlas-AI-Codebase-Intelligence-Platform/`
2. **Backend**: Python FastAPI service running in a container or cloud runtime (Render, Railway, AWS ECS, Fly.io, or self-hosted VPS) connected to **PostgreSQL**.
3. **Database**: PostgreSQL 14/15/16+ with `pgvector` extension for AST embeddings.

---

## 1. Project Directory Structure

CodeAtlas employs a clean, organized modular architecture separating the static frontend, Python backend, database definitions, deployment automation, and test pipelines:

```text
CodeAtlas-AI-Codebase-Intelligence-Platform/
├── app/                       # Next.js 14 App Router frontend pages & client layouts
│   ├── (app)/                 # Authenticated application views (dashboard, repositories, architecture, etc.)
│   ├── api/                   # Runtime backend route handlers (excluded during static export)
│   ├── globals.css            # Tailwind CSS and design tokens
│   ├── layout.tsx             # Root document shell with theme provider
│   ├── page.tsx               # High-converting modular landing page
│   └── login/page.tsx         # Unified authentication (Email, Google, GitHub)
├── backend/                   # Python FastAPI backend service
│   ├── app/                   # FastAPI application (routers, services, models, repositories)
│   ├── tests/                 # Backend test fixtures & pytest test cases
│   ├── alembic.ini            # Database migration configuration
│   ├── requirements.txt       # Python dependencies (FastAPI, Uvicorn, SQLAlchemy, Psycopg)
│   └── README.md              # Backend architecture and API documentation
├── database/                  # PostgreSQL database resources
│   ├── schema.sql             # Complete production DDL schema with pgvector
│   └── README.md              # Database setup & schema execution guide
├── components/                # Modular React UI components & visual design system
├── services/                  # Typed frontend API client and service layer
├── lib/                       # Utilities, server helpers, and navigation configuration
├── public/                    # Static assets, brand marks, and icons
├── scripts/                   # Build and verification scripts
│   ├── build-static-pages.ts  # Isolated static export pipeline for GitHub Pages
│   └── test-*.ts              # Automated quality test suites
├── docs/                      # Technical guides and architecture documentation
│   ├── DEPLOYMENT.md          # Dual-tier production deployment guide (GitHub Pages + FastAPI)
│   ├── API_INTEGRATION.md     # Frontend-backend API contract
│   ├── DATABASE_SETUP.md      # PostgreSQL configuration guide
│   └── TROUBLESHOOTING.md     # Deployment & build issue resolution
├── .github/workflows/         # GitHub Actions automation workflows
│   ├── ci.yml                 # Continuous Integration quality gate
│   └── deploy-pages.yml       # Automated GitHub Pages static deployment
├── out/                       # Compiled static assets for GitHub Pages (gitignored)
├── next.config.mjs            # Next.js configuration with basePath & assetPrefix handling
├── package.json               # Frontend dependencies & npm script definitions
└── package-lock.json          # Deterministic dependency lockfile
```

---

## 2. Architecture & Security Boundaries

```
[ User Browser ]
       │
       ├─ HTTPS (Static Assets: HTML, JS, CSS) ────────► [ GitHub Pages ]
       │                                                 (https://koushik-2006.github.io/CodeAtlas-AI-Codebase-Intelligence-Platform/)
       │
       └─ HTTPS + Secure HttpOnly Cookies ─────────────► [ Hosted FastAPI Backend ]
          (JSON API: /api/v1/*)                          (https://api.yourdomain.com/api/v1)
                                                                 │
                                                                 ▼
                                                        [ Managed PostgreSQL ]
```

### Critical Security Isolation:
- **Zero Secrets on GitHub Pages**: GitHub Pages serves only compiled client-side static JavaScript, HTML, and CSS. Secrets (`GEMINI_API_KEY`, `SESSION_SECRET`, `GITHUB_CLIENT_SECRET`, database passwords) reside strictly on the backend cloud server.
- **Cross-Origin Resource Sharing (CORS)**: The FastAPI backend must be configured with the exact GitHub Pages domain in its `CORS_ORIGINS` environment variable. Wildcards with credentials are disallowed.
- **Base Path Routing**: The static frontend utilizes `basePath: '/CodeAtlas-AI-Codebase-Intelligence-Platform'` to ensure all assets, internal links, scripts, and CSS load properly under GitHub Pages subpath hosting.

---

## 3. Local Development Startup Commands

### Frontend Startup (Next.js)

```bash
# 1. Install frontend dependencies deterministically
npm ci

# 2. Start Next.js local development server (port 3000)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend Startup (FastAPI)

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a Python virtual environment (Windows PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Linux / macOS:
# python3 -m venv .venv && source .venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Start the FastAPI development server with reload (port 8000)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend endpoints:
- API Root: [http://localhost:8000/api/v1](http://localhost:8000/api/v1)
- Swagger Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc Documentation: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- Health Check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 4. PostgreSQL Setup & Migration Steps

### Step 1: Provision PostgreSQL
Run PostgreSQL locally with Docker or use a managed database (Neon, Supabase, Render, AWS RDS):
```bash
docker run -d \
  --name codeatlas-postgres \
  -e POSTGRES_USER=codeatlas \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=codeatlas_db \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

### Step 2: Apply the Database Schema
Execute the schema script in `database/schema.sql`:
```bash
psql -h localhost -p 5432 -U codeatlas -d codeatlas_db -f database/schema.sql
```

### Step 3: Run Alembic Migrations
```bash
cd backend
python -m alembic -c alembic.ini upgrade head
```

---

## 5. GitHub Pages Deployment Workflow

The workflow file `.github/workflows/deploy-pages.yml` automates testing, static export, and deployment:

### Triggers:
- **Automatic**: Every push to the `main` branch.
- **Manual**: Via GitHub Actions `workflow_dispatch` button (with an optional custom Backend API URL input).

### Pipeline Stages:
1. **Environment Setup**:
   - `actions/checkout@v4` checks out the repository.
   - `actions/setup-node@v4` configures **Node.js 20 LTS** with npm caching.
2. **Deterministic Dependency Installation**:
   - Runs `npm ci` against the synced `package-lock.json`.
3. **Quality & Security Gates**:
   - Runs `npm run lint` (`next lint`).
   - Runs `npm run typecheck` (`tsc --noEmit`).
   - Executes core test suites (`test:unit`, `test:integration`, `test:google-auth`, `test:auth-system`, `test:phase21`, `test:gemini`).
4. **Isolated Static Export Build**:
   - Runs `npm run build:pages` (`scripts/build-static-pages.ts`).
   - Isolates client pages into a clean staging folder, excluding Next.js App Router Route Handlers (`app/api/**`).
   - Executes `next build` with `STATIC_EXPORT=true` and `GITHUB_PAGES=true`.
   - Generates `out/` containing static HTML, CSS, and JS bundles.
   - Emits `out/.nojekyll` to ensure GitHub Pages does not ignore `_next` static assets.
   - Emits `out/404.html` (SPA fallback) to support client-side routing on page reloads and deep links.
5. **Artifact Verification & Upload**:
   - Checks that `out/`, `out/index.html`, and `out/.nojekyll` exist.
   - Packages and uploads artifacts via `actions/upload-pages-artifact@v3`.
6. **Deployment**:
   - Deploys the static site to GitHub Pages environment via `actions/deploy-pages@v4`.

---

## 6. Diagnosing & Resolving Build Issues

### Issue 1: `npm ci` Fails with `EUSAGE` (Lockfile Out of Sync)
- **Root Cause**: `package-lock.json` is missing packages or peer dependencies declared in `package.json` or by indirect dependencies (e.g., `@emnapi/core` and `@emnapi/runtime` required by `@napi-rs/wasm-runtime`).
- **Forbidden Workaround**: Replacing `npm ci` with `npm install` in CI is dangerous because `npm install` can introduce non-deterministic version bumps and hide breaking changes.
- **Correct Resolution**:
  1. Inspect the missing package names and required version constraints from the npm error log.
  2. Add the exact package entries to `package-lock.json` with appropriate tarball URLs and SHA-512 integrity hashes, or run `npm install --package-lock-only` in a controlled environment.
  3. Validate locally with `npm ci`. A successful run exits with code 0 without modifying `package-lock.json`.

### Issue 2: Static Export Fails on API Routes
- **Root Cause**: Next.js App Router Route Handlers (`app/api/**/route.ts`) cannot be statically exported by `next build` when `output: 'export'` is set.
- **Correct Resolution**:
  - CodeAtlas uses `scripts/build-static-pages.ts` to temporarily stage frontend client routes into `.pages_export_temp` while keeping runtime API handlers intact in the repository.
  - The runtime APIs are served by the separately hosted FastAPI backend.

### Issue 3: Assets Return 404 (`_next/static/...`) on GitHub Pages
- **Root Cause**: Jekyll (GitHub Pages default processor) ignores directories prefixed with an underscore (`_next`).
- **Correct Resolution**: Ensure `out/.nojekyll` exists. CodeAtlas creates this automatically in `scripts/build-static-pages.ts`.

### Issue 4: Client-Side Routing Fails on Deep Link Refresh
- **Root Cause**: GitHub Pages serves static files and returns a 404 error when navigating directly to `/dashboard` or `/login`.
- **Correct Resolution**: CodeAtlas creates `out/404.html` by duplicating `out/index.html`. GitHub Pages serves `404.html` with HTTP 200/404, allowing the Next.js client router to mount and render the requested client route seamlessly.

---

## 7. Configuring GitHub Repository Settings for Deployment

1. Open your repository on GitHub:
   `https://github.com/koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform`
2. Navigate to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions** (not "Deploy from a branch").
4. (Optional) Under **Settings → Secrets and variables → Actions → Variables**, configure `NEXT_PUBLIC_API_BASE_URL` with your production FastAPI backend URL:
   ```text
   https://api.yourdomain.com/api/v1
   ```
5. Trigger the deployment under **Actions → Deploy CodeAtlas to GitHub Pages → Run workflow**.
6. Visit the live deployment at:  
   `https://koushik-2006.github.io/CodeAtlas-AI-Codebase-Intelligence-Platform/`
