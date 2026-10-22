# CodeAtlas — AI Codebase Intelligence Platform

Next.js 14 (App Router) · React 18 · TypeScript 5.5 · Tailwind CSS 3.4 · Framer Motion

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
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Continuous integration quality gate
│       └── deploy-pages.yml           # GitHub Pages automated static deployment
├── public/
│   ├── icons/
│   │   └── icon.svg                   # Brand mark vector
│   ├── images/
│   │   └── logo.svg                   # Full logotype vector
│   ├── icon.svg                       # Root SVG icon
│   └── favicon.ico                    # Standard ICO favicon
├── app/
│   ├── (app)/
│   │   ├── layout.tsx                 # Authenticated application shell & navigation
│   │   ├── dashboard/page.tsx         # Health indicators, metrics, recent activity & quick actions
│   │   ├── repositories/page.tsx      # Repository management & indexing catalog
│   │   ├── repositories/[id]/page.tsx # Source viewer, file tree, symbol navigation & intelligence
│   │   ├── architecture/page.tsx      # Interactive AST graph, 3D city map & accessible table
│   │   ├── assistant/page.tsx         # Grounded AI assistant with markdown & code receipts
│   │   ├── code-review/page.tsx       # Pull request diff viewer & AST findings
│   │   ├── change-impact/page.tsx     # Change impact blast-radius analyzer
│   │   ├── impact/page.tsx            # Ripple effect scoring & API breakage risk
│   │   ├── debug/page.tsx             # Stack trace analyzer & automated patch generator
│   │   ├── refactoring/page.tsx       # Safe refactoring proposals with confirmation gates
│   │   ├── multi-repo/page.tsx        # Cross-repository search & microservice discovery
│   │   ├── agents/page.tsx            # Autonomous developer agents & workflow runs
│   │   ├── workspaces/page.tsx        # Multi-user workspaces catalog
│   │   ├── workspaces/[id]/page.tsx   # Team workspace artifact sharing & discussions
│   │   ├── activity/page.tsx          # Chronological audit timeline & event filter
│   │   ├── settings/page.tsx          # Appearance, profile, GitHub & AI preferences
│   │   ├── city-map/page.tsx          # 3D isometric codebase city map
│   │   └── [slug]/page.tsx            # Dynamic workspace route fallback
│   ├── api/                           # [MEMBER 2 BACKEND] 21 runtime REST API route groups
│   ├── login/page.tsx                 # Split-screen responsive authentication
│   ├── page.tsx                       # High-converting modular landing page
│   ├── layout.tsx                     # Root layout with Google Fonts (Inter, JetBrains Mono)
│   ├── globals.css                    # Semantic CSS variables & theme design tokens
│   ├── robots.ts                      # SEO crawlers directive
│   └── sitemap.ts                     # Dynamic XML sitemap generator
│
├── components/
│   ├── ui/                            # Button, Card, Badge, Input, Tooltip, Skeleton, ConfirmDialog
│   ├── layout/                        # AppShell, AppSidebar, AppHeader, MobileNavigation
│   ├── dashboard/                     # WelcomeSection, QuickActionCards, RepositoryOverview, RecentActivityPanel
│   ├── explorer/                      # CodeLensWorkspace, ImageUploadZone, CameraCapture, CodeInputTabs
│   ├── code-viewer/                   # RepositoryFileTree, SourceCodeViewer, RepositoryDetailPageClient
│   ├── assistant/                     # AssistantWorkspace, ChatMessage, MarkdownMessage, EvidenceReferences
│   ├── architecture/                  # ArchitectureCanvas, ArchitectureNode, ArchitectureTableAlternative
│   ├── review/                        # DiffViewer, FindingsList, ReviewImpactSidebar, PublishCommentModal
│   ├── workspace/                     # WorkspaceDetailPageClient, InvitationPageClient, InviteMemberModal
│   └── landing/                       # HeroSection, FeatureGrid, LiveDemoSection, Footer
│
├── services/                          # Typed API Client & REST service abstractions
│   ├── api-client.ts                  # Typed fetch client with retry, timeout, correlation IDs & abort signals
│   ├── repository-service.ts          # Repository catalog & indexing management
│   ├── architecture-service.ts        # Node graph & relationship retrieval
│   ├── assistant-service.ts           # Grounded Q&A with AST evidence citations
│   └── source-file-service.ts         # Repository tree & syntax-highlighted file contents
│
├── lib/
│   ├── server/                        # [MEMBER 2 BACKEND] AST parser, RAG engine, DB store & agents
│   ├── constants.ts                   # Storage keys & default sample data
│   ├── navigation.ts                  # Centralized sidebar route definitions
│   └── utils.ts                       # Class names & formatting helpers
│
├── scripts/
│   ├── build-static-pages.ts          # Isolated static export pipeline for GitHub Pages
│   ├── test-phase21.ts                # Phase 21 frontend verification test suite
│   ├── test-unit.ts                   # Frontend unit tests
│   ├── test-phase10.ts                # Integration test suite
│   └── test-e2e-journeys.ts           # End-to-end user journeys
│
├── out/                               # Generated static export directory for GitHub Pages (gitignored)
├── next.config.mjs                    # Next.js configuration (supports static export & dynamic basePath)
├── package.json                       # Scripts, dependencies & engine versions
└── README.md                          # Documentation & deployment guide
```

---

## 🔒 Critical Team Boundaries

- **Member 2 owns the backend and database:**
  - `app/api/*`: 21 REST endpoint controllers (auth, github, codelens, review, impact, refactoring, agents, workspaces, etc.).
  - `lib/server/*`: Tree-sitter AST parsers, RAG service, indexing engines, database models, and agent runtimes.
- **Frontend boundary:**
  - Client components, layouts, state management, design system tokens, and API integration in `services/api-client.ts`.
  - When deployed statically to GitHub Pages, the frontend acts as a **Pure Static Single-Page Client (SPA)** communicating with Member 2's separately hosted backend over HTTPS.

---

## 🚀 Local Development Setup

### Prerequisites

- Node.js 18 LTS or 20 LTS (Node 20 recommended)
- npm 9+ or npm 10+

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform.git
cd CodeAtlas-AI-Codebase-Intelligence-Platform
npm ci
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure your local environment variables in `.env.local`:

```env
# Google OAuth 2.0 Web Client ID (Public configuration for Google Identity Services)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=13168760256-mebb2hjbi0nl6hnlcclqoeaognkqu8ru.apps.googleusercontent.com

# Backend API URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### 3. Google OAuth Cloud Console Origin Configuration

For Google Sign-In to function properly without `Error 401: invalid_client / no registered origin`:

1. Open **Google Cloud Console → Credentials** (Project: `annular-system-512810-p8`).
2. Select Web Application OAuth Client ID:
   `13168760256-mebb2hjbi0nl6hnlcclqoeaognkqu8ru.apps.googleusercontent.com`.
3. Under **Authorized JavaScript origins**, register:
   - `http://localhost:3000` (Local Development)
   - `https://koushik-2006.github.io` (GitHub Pages Production)
4. Under **Authorized redirect URIs**, register:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3000`
5. Save changes (allow 2-5 minutes for Google's global CDN propagation).

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification Commands

```bash
# Run ESLint check
npm run lint

# Run TypeScript static type check
npm run typecheck

# Run Google OAuth & Security Verification Suite (43 tests)
npm run test:google-auth

# Run Complete Authentication System Test Suite (Email, OTP, Password Reset - 44 tests)
npm run test:auth-system

# Run Phase 21 Frontend & Integration Tests
npm run test:phase21

# Run full test suite (Unit, Integration, E2E, Auth, Phases 12-21)
npm test

# Run full CI quality check + VS Code build + Production build
npm run test:all
```

---

## 🌐 GitHub Pages Deployment Guide

### Architecture Overview

GitHub Pages is a static asset host without a Node.js runtime. Therefore:
1. The frontend is exported as static HTML/CSS/JS into `out/`.
2. Dynamic parameter routes (`[id]`, `[slug]`, `[token]`) use static fallback prerendering with React Suspense boundaries.
3. Member 2's runtime backend APIs (`app/api/*`) and database services are hosted on a Node.js cloud runtime (e.g. Docker, Railway, AWS ECS, Vercel).
4. The static frontend connects to Member 2's backend via the public environment variable `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_BASE_URL`.

### Step 1: Configure GitHub Repository Settings

Navigate to your repository settings on GitHub:

**GitHub repository → Settings → Pages → Build and deployment → Source:**
Select **GitHub Actions** (not "Deploy from a branch").

### Step 2: Configure Environment Variables in GitHub (Optional)

If connecting to Member 2's production backend:
1. Go to **Settings → Secrets and variables → Actions → Variables**.
2. Add `NEXT_PUBLIC_API_URL`:
   ```text
   https://api.codeatlas.yourdomain.com/api
   ```
3. Add `NEXT_PUBLIC_API_BASE_URL`:
   ```text
   https://api.codeatlas.yourdomain.com/api
   ```

### Step 3: Trigger Deployment

The GitHub Actions workflow `.github/workflows/deploy-pages.yml` automatically executes on every push to `main`.

You can also trigger it manually:
1. Go to **Actions** tab in GitHub.
2. Select **Deploy CodeAtlas to GitHub Pages**.
3. Click **Run workflow** (optionally supply a custom Backend API URL).

### Step 4: Local Static Export Testing

To test the exact static export build locally:

```bash
npm run build:pages
```

This script (`scripts/build-static-pages.ts`):
1. Safely isolates page routes for static compilation without modifying Member 2's backend files.
2. Runs Next.js with `STATIC_EXPORT=true`.
3. Emits the distribution into `out/`.
4. Generates `out/.nojekyll` (ensures GitHub Pages does not ignore `_next` static assets).
5. Generates `out/404.html` (SPA fallback for deep links and client routing).

You can preview the exported static website using any static server:
```bash
npx serve out
```

---

## 🤝 Member 2 Backend Coordination & CORS

When the static frontend is hosted on GitHub Pages (`https://username.github.io`), the browser issues cross-origin requests to Member 2's backend server.

### Member 2 Requirements Checklist

1. **CORS Headers:**  
   Member 2's backend must permit the GitHub Pages origin in HTTP response headers:
   ```http
   Access-Control-Allow-Origin: https://username.github.io
   Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization, x-request-id
   Access-Control-Allow-Credentials: true
   ```
2. **Options Preflight:**  
   Ensure all endpoints respond with `204 No Content` or `200 OK` on `OPTIONS` preflight requests.
3. **Correlation ID:**  
   Frontend sends `x-request-id` with every API request. Member 2 should log this ID for end-to-end tracing.

---

## ⚠️ Known Static Hosting Limitations

| Feature | Static Hosting Behavior | Full-Stack (Hosted Backend) Behavior |
| :--- | :--- | :--- |
| **Landing & Docs** | 100% Static HTML/CSS | 100% Static HTML/CSS |
| **Theme Switching** | Client-side LocalStorage | Client-side LocalStorage |
| **CodeLens (Mode A: Snippet)** | Deterministic AST analysis fallback | Full AI reasoning (Gemini/OpenAI/Claude) |
| **CodeLens (Mode B: Repo)** | Matches sample repositories | Live repository file AST matching |
| **Architecture City & Graph** | Interactive client rendering & catalog | Dynamic server topology re-calculation |
| **Live Git Cloning & Webhooks** | Blocked (requires server runtime) | Active background git worker |
| **Autonomous Agent Loop** | Requires backend API connection | Full server agent execution engine |

When the backend API URL is not reachable, the frontend automatically falls back to deterministic AST intelligence and informative offline states. It never pretends a failed network call succeeded.

---

## 🛠️ Troubleshooting Common Deployment Issues

### 1. Assets Return 404 (`_next/static/...`)
- **Cause:** Jekyll on GitHub Pages ignores directories starting with an underscore (`_next`).
- **Fix:** CodeAtlas automatically writes `.nojekyll` into `out/`. Ensure `out/.nojekyll` is present.

### 2. Deep Linking / Refresh Returns 404
- **Cause:** GitHub Pages tries to find a static file matching the URL path on direct navigation or refresh.
- **Fix:** CodeAtlas generates `out/404.html` from `out/index.html`. GitHub Pages serves `404.html`, allowing the client-side router to mount and render the route.

### 3. Broken Paths on Project URLs (`username.github.io/codeatlas/`)
- **Cause:** Assets requesting `/logo.svg` instead of `/codeatlas/logo.svg`.
- **Fix:** In `next.config.mjs`, `basePath` and `assetPrefix` are dynamically set to `/${repository_name}` when building with `GITHUB_PAGES=true` unless a custom domain is configured (`CUSTOM_DOMAIN=true`).

### 4. API Requests Blocked by Browser
- **Cause:** Missing CORS configuration on Member 2's server.
- **Fix:** Add `https://username.github.io` to `CORS_ALLOWED_ORIGINS` on Member 2's backend server.

---

## 📄 License

CodeAtlas is licensed under the Apache 2.0 License.
