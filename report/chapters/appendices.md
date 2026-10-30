# APPENDICES

## APPENDIX A: Core Source Code Excerpts

### A.1 Password Cryptography (`backend/app/security/password.py`)
```python
import bcrypt

def get_password_hash(password: str) -> str:
    """Hash password securely using bcrypt with 12 salt rounds."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify candidate password against stored bcrypt hash using constant-time comparison."""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False
```

### A.2 Stateless JWT Session Management (`backend/app/security/sessions.py`)
```python
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.config import settings

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
```

### A.3 Fail-Safe Database Dependency Injection (`backend/app/database/session.py`)
```python
from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from app.database.session import SessionLocal

def get_db():
    """Yield database session or raise HTTP 503 if unavailable."""
    try:
        session = SessionLocal()
        yield session
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is unavailable. Please try again later."
        )
    finally:
        session.close()
```

### A.4 Static Export Builder (`scripts/build-static-pages.ts`)
```typescript
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// 1. Write dedicated static export next.config.mjs
const repoEnv = process.env.GITHUB_REPOSITORY || "koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform";
const repoName = repoEnv.includes("/") ? repoEnv.split("/")[1] : repoEnv;
const basePath = `/${repoName}`;

const staticNextConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: ${JSON.stringify(basePath)},
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
};
export default nextConfig;
`;
fs.writeFileSync(path.join(tempWorkspace, "next.config.mjs"), staticNextConfig.trim());

// 2. Copy page routes excluding runtime server APIs
copyRecursiveSync(path.join(rootDir, "app"), path.join(tempWorkspace, "app"), (relPath) => {
  const normalized = relPath.replace(/\\/g, "/");
  return normalized === "app/api" || normalized.startsWith("app/api/");
});

// 3. Execute build and generate .nojekyll and 404.html
execSync("npx next build", { cwd: tempWorkspace, stdio: "inherit" });
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
fs.copyFileSync(path.join(outDir, "index.html"), path.join(outDir, "404.html"));
```

---

## APPENDIX B: API Endpoint Catalog

| Endpoint Route | HTTP Method | Router Tag | Description & Request/Response Contract |
| :--- | :---: | :--- | :--- |
| `/api/v1/health` | GET | Health | Check system status and service health (`{status: "ok", service: "CodeAtlas API"}`). |
| `/api/v1/auth/register` | POST | Auth | Register new user; validate email uniqueness; return HTTP 201; dispatch 6-digit OTP. |
| `/api/v1/auth/login` | POST | Auth | Authenticate user credentials; verify bcrypt hash; set `codeatlas_session` cookie. |
| `/api/v1/auth/verify-otp` | POST | Auth | Validate 6-digit OTP; mark user verified; issue active session cookie. |
| `/api/v1/auth/resend-otp` | POST | Auth | Resend OTP code; enforce 60-second cooldown rate limit. |
| `/api/v1/auth/forgot-password`| POST | Auth | Trigger password recovery; return generic anti-enumeration response. |
| `/api/v1/auth/reset-password` | POST | Auth | Reset password with recovery OTP; hash new password with 12-round bcrypt. |
| `/api/v1/auth/session` | GET | Auth | Retrieve current session claims; validate HttpOnly cookie. |
| `/api/v1/auth/session` | DELETE | Auth | Invalidate session; expire `codeatlas_session` cookie. |
| `/api/v1/auth/google` | POST | Auth | Verify Google OpenID Connect token; upsert user record; issue session cookie. |
| `/api/v1/github/connect` | GET | GitHub | Generate OAuth authorization URL with anti-CSRF state token cookie. |
| `/api/v1/github/callback` | GET | GitHub | Validate CSRF state; exchange auth code for GitHub access token; link account. |
| `/api/v1/github/status` | GET | GitHub | Return connection status and username without exposing raw access token. |
| `/api/v1/github/disconnect` | POST | GitHub | Purge connected GitHub account record from database. |
| `/api/v1/github/repos` | GET | GitHub | Fetch list of accessible public and private GitHub repositories. |
| `/api/v1/repositories` | GET | Repositories | List indexed repositories for authenticated tenant. |
| `/api/v1/repositories` | POST | Repositories | Ingest new repository into platform. |
| `/api/v1/repositories/{id}/index`| POST | Repositories | Trigger AST parsing and symbol extraction for repository. |
| `/api/v1/repositories/{id}/files`| GET | Repositories | Retrieve hierarchical file tree of repository. |
| `/api/v1/repositories/{id}/symbols`| GET | Code Explorer| Retrieve indexed symbol catalog (functions, classes, routes). |
| `/api/v1/repositories/{id}/symbols/navigate`| GET | Code Explorer| Return caller/callee trees and exact line numbers for target symbol. |
| `/api/v1/assistant/query` | POST | Assistant | Submit codebase question with AST context; stream Gemini answer with citations. |
| `/api/v1/architecture/{id}/graph`| GET | Architecture | Return 2D/3D node-link graph data, circular dependencies, and health score. |
| `/api/v1/search` | GET | Search | Multi-category fuzzy search across symbols, files, and API routes. |
| `/api/v1/impact/analyze` | POST | Impact | Calculate transitive blast radius of modified symbol or file. |

---

## APPENDIX C: Database Schema Specification (PostgreSQL DDL)

```sql
-- PostgreSQL DDL for CodeAtlas Platform
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255),
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX ix_users_email ON users(email);

-- 2. Connected Accounts Table (OAuth Identity Federation)
CREATE TABLE connected_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google' or 'github'
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_connected_accounts_user ON connected_accounts(user_id);
CREATE UNIQUE INDEX ix_connected_accounts_provider ON connected_accounts(provider, provider_user_id);

-- 3. Repositories Table
CREATE TABLE repositories (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    connection_type VARCHAR(50) NOT NULL, -- 'github' or 'local'
    is_indexed BOOLEAN NOT NULL DEFAULT FALSE,
    file_count INTEGER NOT NULL DEFAULT 0,
    symbol_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_repositories_user ON repositories(user_id);

-- 4. Code Symbols Table (AST Symbol Catalog)
CREATE TABLE code_symbols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id VARCHAR(100) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    kind VARCHAR(50) NOT NULL, -- 'function', 'class', 'interface', 'route'
    file_path TEXT NOT NULL,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    callers JSONB NOT NULL DEFAULT '[]',
    callees JSONB NOT NULL DEFAULT '[]'
);
CREATE INDEX ix_symbols_repo_name ON code_symbols(repository_id, name);

-- 5. Dependencies Table (Module Coupling & Graph Edges)
CREATE TABLE dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id VARCHAR(100) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    source_module VARCHAR(255) NOT NULL,
    target_module VARCHAR(255) NOT NULL,
    dependency_type VARCHAR(50) NOT NULL, -- 'import', 'api', 'rpc'
    is_circular BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX ix_dependencies_repo ON dependencies(repository_id);
```

---

## APPENDIX D: Configuration Examples & Environment Variables

```bash
# Frontend Environment Configuration (.env.local)
NEXT_PUBLIC_APP_URL=https://koushik-2006.github.io/CodeAtlas-AI-Codebase-Intelligence-Platform
NEXT_PUBLIC_API_BASE_URL=https://api.codeatlas.example.com/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=13168760256-mebb2hjbi0nl6hnlcclqoeaognkqu8ru.apps.googleusercontent.com
NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv23liCodeAtlasApp

# Backend Environment Configuration (backend/.env)
PROJECT_NAME="CodeAtlas API"
VERSION="1.0.0"
API_V1_STR="/api/v1"
CORS_ORIGINS=["http://localhost:3000","https://koushik-2006.github.io"]

# Database Connection (AWS Neon Cloud)
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://neondb_owner:REDACTED@ep-cool-snowflake-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT & Cryptography Secrets
JWT_SECRET_KEY=REDACTED_SECURE_RANDOM_HEX_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Provider Configuration (Google Gemini)
GEMINI_API_KEY=REDACTED_GOOGLE_AI_STUDIO_KEY
GEMINI_MODEL=gemini-1.5-flash

# OAuth Secrets (Never exposed to client bundles)
GOOGLE_CLIENT_SECRET=REDACTED_GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_SECRET=REDACTED_GITHUB_CLIENT_SECRET
```

---

## APPENDIX E: Automated Test Execution Evidence

```text
=========================================================================
CODEATLAS COMPREHENSIVE AUTOMATED VERIFICATION RESULTS (237/237 PASSED)
=========================================================================
1. Unit Test Suite (scripts/test-unit.ts):
   ✔ Test 1: Navigation & Theme Architecture Constants (Passed)
   ✔ Test 2: Security - Directory Traversal Defense (Passed)
   ✔ Test 3: Security - AI Prompt Injection Mitigation (Passed)
   ✔ Test 4: Security - Code Payload Size Bounding (Passed)
   ✔ Test 5: Security - API Request Rate Limiter (Passed)
   ✔ Test 6: Observability - Secret Redaction in Logs (Passed)
   Status: 6/6 Passed (100%)

2. Google Authentication Test Suite (scripts/test-google-auth.ts):
   ✔ Section 1: Client ID Protection & Secret Exclusion (2/2 Passed)
   ✔ Section 2: Client-Side Token Decoding & Validation (7/7 Passed)
   ✔ Section 3: Server Endpoint Malformed Rejection (3/3 Passed)
   ✔ Section 4: Security Verification - Audience & Expiry (5/5 Passed)
   ✔ Section 5: End-to-End Success & Session Establishment (9/9 Passed)
   ✔ Section 6: Session Verification & Logout Lifecycle (8/8 Passed)
   ✔ Section 7: Frontend AuthService Persistence (2/2 Passed)
   ✔ Section 8: GitHub Pages Static Export Compatibility (2/2 Passed)
   Status: 43/43 Passed (100%)

3. Authentication System Test Suite (scripts/test-auth-system.ts):
   ✔ Section 1: Secure Email Presentation & Masking (3/3 Passed)
   ✔ Section 2: Email & Password Sign In (11/11 Passed)
   ✔ Section 3: Session Retrieval via Cookie (3/3 Passed)
   ✔ Section 4: Account Registration & OTP Dispatch (11/11 Passed)
   ✔ Section 5: Email OTP Verification (8/8 Passed)
   ✔ Section 6: Resend OTP & 60s Cooldown (5/5 Passed)
   ✔ Section 7: Password Recovery & Reset (11/11 Passed)
   ✔ Section 8: Logout & Cookie Invalidation (2/2 Passed)
   Status: 54/54 Passed (100%)

4. GitHub OAuth & REST API Test Suite (scripts/test-github-oauth.ts):
   ✔ Phase 1: OAuth Initiation & CSRF State Security (7/7 Passed)
   ✔ Phase 2: OAuth Callback & State Verification (4/4 Passed)
   ✔ Phase 3: Successful Connection & Profile Binding (3/3 Passed)
   ✔ Phase 4: Status Endpoint & Secret Token Protection (6/6 Passed)
   ✔ Phase 5: Multi-Tenant User Isolation (6/6 Passed)
   ✔ Phase 6: Repository Discovery, Search & Pagination (4/4 Passed)
   ✔ Phase 7: Repository Ingestion & AST Indexing (6/6 Passed)
   ✔ Phase 8: Disconnect & Token Purge (4/4 Passed)
   ✔ Phase 9: Continue with GitHub Login Lifecycle (18/18 Passed)
   Status: 63/63 Passed (100%)

5. Gemini AI Integration & Grounded RAG (scripts/test-gemini-integration.ts):
   ✔ Tests 1-10: Resilience, Prompts, Citations, Vector Math (43/43 Passed)
   Status: 43/43 Passed (100%)

6. Navigation Guard & Route Protection (scripts/test-navigation-guard.ts):
   ✔ Tests 1-6: Target Inspection, Session Rejection, Logout (16/16 Passed)
   Status: 16/16 Passed (100%)

7. Developer Workspace Integration (scripts/test-phase10.ts):
   ✔ Tests 1-6: Global Search, Activity Logging, Audit Trails (6/6 Passed)
   Status: 6/6 Passed (100%)

8. Premium Frontend Integration (scripts/test-phase21.ts):
   ✔ Tests 1-6: Route Coverage, Themes, CodeLens, Approval Gate (6/6 Passed)
   Status: 6/6 Passed (100%)

9. Static Code Quality & Build Verification:
   ✔ npm run typecheck: tsc --noEmit (0 Errors)
   ✔ npm run lint: next lint (0 Errors)
   ✔ npm run build:pages: 47/47 HTML pages compiled to out/
=========================================================================
TOTAL VERIFIED AUTOMATED ASSERTIONS: 237 / 237 (100% PASS RATE)
=========================================================================
```

---

## APPENDIX F: Platform Interface & Visual Screenshots
The CodeAtlas platform provides a responsive, high-contrast visual interface. Key application screens include:
1. **Landing Page (`/`)**: Hero section featuring an interactive architecture workflow graph with live SVG pulses, AST citation receipts, and value proposition cards.
2. **Authentication Center (`/login`)**: Unified sign-in cockpit supporting email/password authentication, Google One-Tap sign-in, GitHub OAuth button, and redirect parameter handling (`?redirect=%2Fdashboard`).
3. **Email OTP Verification (`/verify-email`)**: Clean 6-digit numeric OTP input interface with animated focus transitions and a 60-second cooldown countdown.
4. **Developer Cockpit (`/dashboard`)**: Personalized welcome header (`Welcome back, Arun Kumar!`), codebase metrics bar (LOC, symbol count, architectural health index), and quick-action repository cards.
5. **Interactive Architecture Visualizer (`/architecture`)**: Multi-level 2D node-link graph with clustering, edge filtering, and 2.5D isometric city visualization.
6. **AI Grounded Assistant (`/assistant`)**: Natural language chat interface displaying conversational explanations accompanied by verified AST citation cards with clickable file ranges.
7. **Pull Request Blast-Radius Analyzer (`/code-review` & `/impact`)**: Transitive impact analysis interface highlighting affected callers and downstream modules prior to merging code.

---

## APPENDIX G: Local Setup & Execution Guide

### Prerequisites
- Node.js 20 LTS or higher (`node -v`).
- Python 3.12 or 3.13 (`python --version`).
- PostgreSQL 15+ (local or AWS Neon cloud connection string).

### Step 1: Clone Repository & Install Frontend Dependencies
```bash
git clone https://github.com/koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform.git
cd CodeAtlas-AI-Codebase-Intelligence-Platform
npm ci
```

### Step 2: Install Backend Dependencies
```bash
cd backend
python -m pip install -r requirements.txt
cd ..
```

### Step 3: Run Database Migrations
```bash
cd backend
alembic upgrade head
cd ..
```

### Step 4: Start Development Servers
In Terminal 1 (FastAPI Backend):
```bash
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
In Terminal 2 (Next.js Frontend):
```bash
npm run dev
```
Navigate to `http://localhost:3000` in any modern web browser.

---

## APPENDIX H: GitHub Actions & Pages Workflow (`deploy-pages.yml`)

```yaml
name: Deploy CodeAtlas to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    name: Build Static Frontend Artifacts
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js 20 LTS
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install Dependencies
        run: npm ci

      - name: Code Quality & Lint Check
        run: npm run lint

      - name: TypeScript Static Typecheck
        run: npm run typecheck

      - name: Run Core Test Suites
        run: |
          npm run test:unit
          npm run test:google-auth
          npm run test:auth-system
          npm run test:github-oauth
          npm run test:phase21
          npm run test:gemini

      - name: Build Static Export for GitHub Pages
        run: npm run build:pages
        env:
          GITHUB_REPOSITORY: ${{ github.repository }}
          GITHUB_PAGES: "true"
          STATIC_EXPORT: "true"

      - name: Verify Static Export Directory
        run: |
          test -d out
          test -f out/index.html
          test -f out/.nojekyll
          test -f out/404.html

      - name: Upload GitHub Pages Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    name: Deploy to GitHub Pages
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

