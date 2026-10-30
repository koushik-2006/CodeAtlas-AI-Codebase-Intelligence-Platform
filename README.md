# CodeAtlas — AI Codebase Intelligence Platform

Next.js 14 (App Router) · React 18 · TypeScript 5.5 · Tailwind CSS 3.4 · Python FastAPI · PostgreSQL

> **"Understand any codebase. Trace every connection."**  
> Photograph code, connect a repo, and follow any function through files, APIs, and tests with verified AST receipts.

---

## 🎨 Dual Visual Identity System

CodeAtlas features a synchronized dual theme architecture:

1. **Light Theme:**
   - Soft off-white canvas (`#FAF9FF`), pure elevated white surfaces (`#FFFFFF`), and deep violet typography (`#19143D`).
   - Deep violet primary accents (`#6C4DFF`).
   - Balanced status accents (mint `#2FD6A0`, soft sun `#FFC53D`, coral `#FF5A5F`, lilac `#8B7CFF`).
   - 3D isometric SVG code city visualization.

2. **Dark Theme:**
   - Near-black page canvas (`#070A12`), deep navy panels (`#0D111B`), and elevated surfaces (`#111725`).
   - Vivid teal/cyan primary accents (`#29D3C2`) and tech-violet secondary highlights (`#8B7CFF`).
   - Technical node graph visualization with high-contrast cyber connections.

3. **Motion & Accessibility:**
   - Spring-driven theme transitions.
   - Respects `prefers-reduced-motion`.
   - Accessible WCAG contrast and keyboard navigation (`⌘K` / `Ctrl+K` palette, focus rings, ARIA dialogs).

---

## 🏗️ Repository Architecture & Boundaries

```text
CodeAtlas/
├── frontend/                          # Next.js 14 App Router frontend application
│   ├── app/                           # Frontend pages, routes, and layouts
│   ├── components/                    # Design system and UI components
│   ├── hooks/                         # React hooks (useAuth, useTheme, useCity)
│   ├── lib/                           # Core utilities, constants, server helpers
│   ├── services/                      # API client, auth service, code intelligence services
│   ├── public/                        # Static assets, logos, and icons
│   ├── styles/                        # Global styles and Tailwind configuration
│   ├── types/                         # TypeScript interfaces and API schemas
│   ├── tests/                         # Component and navigation tests
│   ├── scripts/                       # Static export generator and test suites
│   ├── package.json                   # Frontend npm package dependencies
│   ├── package-lock.json              # Dependency lockfile
│   ├── next.config.mjs                # Next.js configuration
│   └── tsconfig.json                  # TypeScript configuration
│
├── backend/                           # Python FastAPI backend service
│   ├── app/                           # FastAPI routers, services, models, repositories
│   │   ├── api/                       # API v1 routes (auth, github, repos, intelligence)
│   │   ├── models/                    # Database models and data schemas
│   │   ├── services/                  # Business logic services
│   │   ├── repositories/              # Database persistence layer
│   │   └── security/                  # JWT, bcrypt, and OAuth handlers
│   ├── tests/                         # Pytest test suites & fixtures
│   ├── requirements.txt               # Python package dependencies
│   ├── Dockerfile                     # Containerization recipe
│   ├── alembic.ini                    # Database migrations configuration
│   └── README.md                      # Backend API specification & Swagger documentation
│
├── database/                          # PostgreSQL database definitions
│   ├── migrations/                    # Database migration scripts & instructions
│   ├── schemas/                       # Production schema DDL (`schema.sql`)
│   ├── seeds/                         # Sample development seed data (`seed_dev.sql`)
│   └── README.md                      # Database setup, Docker run, & migration execution
│
├── deployment/                        # Multi-environment deployment definitions
│   ├── github-pages/                  # Static export configuration and guide
│   ├── backend/                       # FastAPI Dockerfile and deployment guide
│   ├── docker/                        # Multi-container Docker Compose configuration
│   └── README.md                      # Deployment overview
│
├── tests/                             # Root test suites
│   ├── integration/                   # Cross-service API integration tests
│   └── e2e/                           # End-to-end user journey tests
│
├── docs/                              # Technical guides and architecture documentation
│   ├── ARCHITECTURE.md                # System design & architecture specification
│   ├── SETUP.md                       # Comprehensive local developer setup
│   ├── DEPLOYMENT.md                  # Deployment guide across all environments
│   ├── AUTHENTICATION.md              # OAuth 2.0 & identity architecture
│   └── TROUBLESHOOTING.md             # Common issues and debugging steps
│
├── report/                            # College academic project reports (DOCX & PDF)
├── docker-compose.yml                 # Root multi-container orchestration
├── Makefile                           # Developer workflow shortcuts
├── .gitignore                         # Git exclusion rules
└── README.md                          # Platform documentation & quickstart
```

---

## 🔒 Critical System Boundaries

- **Backend & Database Service (`backend/` & `database/`):**
  - Python FastAPI REST API with endpoints for authentication, GitHub integration, Visual CodeLens, CodeReview, ChangeRadar, and FlowTrace.
  - PostgreSQL schema (`database/schema.sql`) with `pgvector` support for semantic code embeddings.
  - SQLAlchemy models and Alembic migrations.
- **Frontend Client (`app/`, `components/`, `services/`):**
  - Pure Next.js client application with dynamic routing, responsive navigation, and theme provider.
  - Communicates with the FastAPI backend via `services/api-client.ts`.
  - Statically compiled to `out/` for automated deployment to **GitHub Pages**.

---

## 🚀 Local Development Setup

### Prerequisites

- Node.js 18 LTS or 20 LTS (Node 20 recommended)
- npm 9+ or npm 10+
- Python 3.12+ (for FastAPI backend)
- PostgreSQL 14+ with pgvector (optional for local in-memory testing)

### 1. Frontend Setup (Next.js)

```bash
# Clone repository
git clone https://github.com/koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform.git
cd CodeAtlas-AI-Codebase-Intelligence-Platform

# Install dependencies deterministically
npm ci

# Configure environment variables
cp .env.example .env.local

# Start frontend development server (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Backend Setup (FastAPI)

```bash
# In a separate terminal, navigate to backend
cd backend

# Create and activate virtual environment (Windows PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Linux / macOS:
# python3 -m venv .venv && source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Start FastAPI server (port 8000)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API Base: [http://localhost:8000/api/v1](http://localhost:8000/api/v1)
- Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Service Health: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 🧪 Testing & Verification Commands

```bash
# Run ESLint check
npm run lint

# Run TypeScript static type check
npm run typecheck

# Run Unit tests
npm run test:unit

# Run Integration tests
npm run test:integration

# Run Google OAuth & Security Verification Suite (43 tests)
npm run test:google-auth

# Run Complete Authentication System Test Suite (Email, OTP, Password Reset - 54 tests)
npm run test:auth-system

# Run GitHub OAuth Integration Suite (63 tests)
npm run test:github-oauth

# Run Google Gemini AI Integration Suite (43 tests)
npm run test:gemini

# Run Phase 21 Frontend & Integration Tests
npm run test:phase21

# Run full test suite
npm test
```

---

## 🌐 GitHub Pages Deployment Guide

**Target GitHub Pages URL:**  
`https://koushik-2006.github.io/CodeAtlas-AI-Codebase-Intelligence-Platform/`

### Deployment Architecture

1. **Static Frontend Export**:
   - The frontend is compiled into pure HTML/CSS/JS in `out/` via `npm run build:pages` (`scripts/build-static-pages.ts`).
   - Excludes server-side Route Handlers (`app/api/**`) during static export to maintain 100% static compatibility.
   - Automatically generates `out/.nojekyll` to prevent Jekyll from omitting `_next` static bundles.
   - Generates `out/404.html` (SPA fallback) to support client-side routing on page reloads and deep links.
2. **Automated CI/CD Workflow (`.github/workflows/deploy-pages.yml`)**:
   - Runs automatically on every push to `main` and supports manual dispatch (`workflow_dispatch`).
   - Uses Node.js 20 LTS and strict `npm ci`.
   - Runs linting, typechecking, and core test suites prior to building.
   - Deploys static build artifacts to GitHub Pages using `actions/deploy-pages@v4`.

### Step 1: Configure GitHub Repository Settings

1. Open your repository on GitHub:
   `https://github.com/koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform`
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.

### Step 2: Configure Environment Variables in GitHub (Optional)

Under **Settings → Secrets and variables → Actions → Variables**, you may specify:
- `NEXT_PUBLIC_API_BASE_URL`: `https://api.yourdomain.com/api/v1`

### Step 3: Local Static Export Testing

To test the exact static build locally:
```bash
npm run build:pages
```

To preview the generated static export:
```bash
npx serve out
```

For complete deployment and database instructions, see [docs/DEPLOYMENT.md](file:///c:/Users/koush/OneDrive/Desktop/CodeAtlas%20%E2%80%94%20AI%20Codebase%20Intelligence/docs/DEPLOYMENT.md).

---

## 🛠️ Troubleshooting Common Deployment Issues

### 1. `npm ci` Fails with `EUSAGE` (Lockfile Out of Sync)
- **Cause:** Peer dependencies (e.g. `@emnapi/core` or `@emnapi/runtime`) missing from `package-lock.json`.
- **Solution:** Keep `package-lock.json` synchronized. Never replace `npm ci` with `npm install` in CI workflows.

### 2. Assets Return 404 (`_next/static/...`)
- **Cause:** Jekyll ignores folders starting with an underscore.
- **Solution:** CodeAtlas generates `out/.nojekyll` automatically during `npm run build:pages`.

### 3. Deep Linking / Page Refresh Returns 404
- **Cause:** Static file servers cannot resolve dynamic URL paths.
- **Solution:** CodeAtlas generates `out/404.html` SPA fallback to enable client-side route mounting.

---

## 📄 License

CodeAtlas is licensed under the Apache 2.0 License.
