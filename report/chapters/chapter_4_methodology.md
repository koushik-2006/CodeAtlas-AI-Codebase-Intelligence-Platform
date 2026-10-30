# CHAPTER 4 — METHODOLOGY AND IMPLEMENTATION

## 4.1 Development Methodology
The development of CodeAtlas followed an iterative, test-driven engineering methodology structured across progressive milestone phases. Each phase encompassed requirement specification, architectural design, component implementation, security auditing, and automated verification. Development progressed systematically from core infrastructural foundations (database models, authentication, security cryptography) through static code analysis algorithms, AI prompt engineering, interactive frontend visualizers, and finally production CI/CD pipelines.

By adopting a test-driven approach, all critical functional requirements were paired with automated verification scripts in `scripts/test-*.ts`. Continuous regression testing ensured that enhancements to the AST parsing engine or frontend UI components did not introduce regressions into the session management, cryptographic hashing, or API routing layers.

## 4.2 Technology Stack
The technology stack of CodeAtlas was selected to achieve optimal execution performance, strict type safety, asynchronous scalability, and robust security:

- **Frontend Tier**:
  - **Framework**: Next.js 14.2.15 (React 18.3.1, App Router).
  - **Language**: TypeScript 5.5.3 with strict type checking (`tsc --noEmit`).
  - **Styling**: Tailwind CSS 3.4.6 with custom CSS variables for dark/light themes.
  - **Animation & Graphics**: Framer Motion 14.6.0 for fluid layout transitions; custom SVG and Canvas 2D/2.5D renderers for architecture graphs.
  - **Icons**: Lucide React 1.61.0.
- **Backend Tier**:
  - **Framework**: Python 3.13, FastAPI 0.141.1, Starlette 1.6.0.
  - **ASGI Server**: Uvicorn 0.52.4.
  - **Validation**: Pydantic v2 (2.13.5) and Pydantic Settings 2.15.0.
  - **Security & Cryptography**: Bcrypt 5.0.0 (12 salt rounds), PyJWT 2.15.1 (HS256).
- **Database & Persistence Tier**:
  - **Database Engine**: PostgreSQL 16 (AWS Neon Serverless Cloud & Local PostgreSQL).
  - **ORM**: SQLAlchemy 2.0.46 with asynchronous session factories.
  - **Driver**: Psycopg 3.3.6 (native binary C-bindings).
  - **Migrations**: Alembic 1.20.1.
- **Artificial Intelligence & Reasoning Tier**:
  - **AI Provider**: Google Gemini API (`gemini-1.5-flash` and `gemini-1.5-pro`).
  - **SDK**: `@google/genai` (Node.js) and `google-genai` (Python).
- **Deployment & CI/CD**:
  - **Static Host**: GitHub Pages (Edge CDN).
  - **CI/CD Pipeline**: GitHub Actions (`deploy-pages.yml` and `ci.yml`).
  - **Node Runtime**: Node.js 20 LTS.

---

## 4.3 Frontend Implementation
The frontend is constructed using the Next.js 14 App Router, organized into public marketing/landing pages and authenticated application cockpit routes located in `app/(app)/`.

### 4.3.1 Theme & Layout System
A custom Theme Provider (`providers/ThemeProvider.tsx`) manages theme transitions, persisting developer preferences (`dark` or `light`) in `localStorage` under the key `codeatlas-theme`. The root layout (`app/layout.tsx`) injects an inline pre-render script that reads the stored theme before DOM rendering, eliminating the "flash of unstyled content" (FOUC). Colors, borders, surfaces, and typography dynamically bind to CSS custom properties (`--bg-page`, `--bg-surface`, `--text-primary`, `--primary`).

### 4.3.2 Navigation & Routing Architecture
Client navigation is orchestrated through `components/layout/AppSidebar.tsx` and `components/layout/AppHeader.tsx`. All routes are registered as centralized constants in `lib/navigation.ts`, ensuring route consistency. The navigation guard (`scripts/test-navigation-guard.ts`) verifies that unauthenticated access to protected cockpit routes (`/dashboard`, `/architecture`, `/assistant`, `/code-review`) redirects cleanly to `/login?redirect=...`.

---

## 4.4 Backend Implementation
The backend entry point (`backend/app/main.py`) instantiates the FastAPI application, registers global exception handlers, configures CORS middleware, and includes the root API router (`backend/app/api/router.py`).

### 4.4.1 Cross-Origin Resource Sharing (CORS) Configuration
To accommodate both local development and static GitHub Pages hosting, CORS middleware is configured with dynamic origin validation:
```python
# backend/app/main.py (lines 18-25)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.github\.io",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
This ensures that the static frontend hosted at `https://koushik-2006.github.io/CodeAtlas-AI-Codebase-Intelligence-Platform/` can securely invoke cross-origin API endpoints with credentials while unauthorized origins are strictly rejected.

---

## 4.5 Database Implementation & Session Management
Database connections are managed via SQLAlchemy 2.0 in `backend/app/database/session.py`. Connection pooling is configured with `pool_pre_ping=True` and a 10-second connection timeout. 

To prevent cascading failures when the cloud database is temporarily unreachable, the `get_db()` dependency is wrapped in a fail-safe try-except block that raises an HTTP 503 (`Database service is unavailable. Please try again later.`) instead of throwing uncaught database exceptions or falling back silently to in-memory mocks:
```python
# backend/app/database/session.py
def get_db():
    try:
        session = SessionLocal()
        yield session
    except SQLAlchemyError as exc:
        logger.error(f"Database connection error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is unavailable. Please try again later."
        )
    finally:
        session.close()
```

---

## 4.6 User Registration and Login Implementation
The registration and login lifecycle is implemented across `app/login/page.tsx`, `services/auth-service.ts`, `backend/app/api/v1/auth.py`, and `backend/app/repositories/postgres/users.py`.

### 4.6.1 Password Hashing with Bcrypt
Passwords are submitted over TLS, validated for minimum length (>= 8 characters), and hashed using bcrypt with 12 salt rounds in `backend/app/security/password.py`:
```python
# backend/app/security/password.py
import bcrypt

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
```

### 4.6.2 Registration Workflow & Duplicate Email Prevention
During registration, the backend normalizes the email address and checks for uniqueness against the PostgreSQL `ix_users_email` index. If a duplicate is detected, an explicit HTTP 400 Bad Request is returned (`"An account with this email already exists."`). A 6-digit cryptographic OTP is generated and dispatched to the user, and an unverified user record is persisted.

### 4.6.3 Login Verification & Non-Enumerating Error Responses
During login, credentials are checked. Non-existent accounts and invalid passwords return the exact same response: `HTTP 401 Unauthorized` with detail `"Incorrect email or password."`. This prevents user enumeration attacks while providing clear guidance to legitimate developers.

---

## 4.7 Google Authentication (OpenID Connect)
Google OAuth is implemented in `services/auth-service.ts` and `backend/app/api/v1/auth.py`. 
1. The client loads the Google Identity Services SDK via `GoogleSignInButton.tsx` using `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
2. Upon user selection, Google returns a cryptographically signed OpenID Connect JWT credential.
3. The credential is submitted to `POST /api/v1/auth/google`.
4. The backend verifies the token's signature, audience (`aud == GOOGLE_CLIENT_ID`), issuer (`accounts.google.com`), and expiration.
5. The verified email, name, and avatar are extracted.
6. The user is found or created in the PostgreSQL `users` table, and an active session cookie is issued.

---

## 4.8 GitHub Authentication and Repository Access
GitHub OAuth integration is implemented in `app/api/auth/github/route.ts` and `app/api/auth/github/callback/route.ts`.
1. **OAuth Initiation**: When the developer selects "Continue with GitHub", the system generates a cryptographically random 32-byte CSRF token, stores it in an `HttpOnly` cookie named `codeatlas_oauth_state`, and redirects the browser to `https://github.com/login/oauth/authorize` with scopes `read:user user:email repo`.
2. **Callback Verification**: GitHub redirects back to `/api/auth/github/callback?code=...&state=...`.
3. **Anti-CSRF Validation**: The received state is matched against the `codeatlas_oauth_state` cookie. Tampered or missing state tokens are immediately rejected.
4. **Token Exchange**: The backend performs a secure server-to-server POST to `https://github.com/login/oauth/access_token`, exchanging the authorization code and `GITHUB_CLIENT_SECRET` for a GitHub access token.
5. **Account Persistence**: The GitHub profile and access token are stored in `connected_accounts` linked to the authenticated user ID. Raw access tokens are never returned in public API payloads.

---

## 4.9 Dashboard Implementation
The developer cockpit (`app/(app)/dashboard/page.tsx`) consumes the `useAuth()` hook to render a personalized greeting: `Welcome back, {userName}!` (e.g., `Welcome back, Arun Kumar!`) with a fallback to `Welcome to CodeAtlas`. The dashboard displays repository cards, ingestion statuses, codebase metrics bars (LOC, AST symbols, circular dependency counts), and quick-start links to the architecture explorer and code review center.

---

## 4.10 Repository Ingestion & Crawling Pipeline
The repository intake pipeline operates as follows:
```
Repository Archive / GitHub Clone
       │
       ▼
Recursive Directory Traversal
       │  (Filters: node_modules, .git, dist, out, binary assets)
       ▼
Language Classification (TS, JS, Python, Go)
       │
       ▼
AST Lexical Parser
```
Source code files are filtered against an exclusion list (`node_modules`, `.next`, `.git`, `dist`, `out`, `__pycache__`, image/binary files). Retained source files are categorized by language extension and scheduled for lexical parsing.

---

## 4.11 Code Parsing & Abstract Syntax Tree Exploration
The AST parsing engine (`lib/server/code-parser.ts` and `services/code-intelligence-service.ts`) parses JavaScript, TypeScript, and Python source code. 

### Algorithm 4.1: AST Symbol Extraction & Boundary Mapping
```text
Input:  Source code text S, File path P, Language L
Output: List of Symbol records with line ranges and caller/callee links

1. Parse S into an Abstract Syntax Tree T using lexical grammar for L.
2. Traverse nodes in T:
   a. If node is FunctionDeclaration or MethodDefinition:
      - Extract symbol name N.
      - Calculate start_line = node.loc.start.line, end_line = node.loc.end.line.
      - Extract parameters and return type annotations.
      - Scan function body for CallExpressions; append to callees.
   b. If node is ClassDeclaration or InterfaceDeclaration:
      - Extract class name, methods, and heritage clauses (extends/implements).
   c. If node is RouteHandler (e.g., @app.get, export async function POST):
      - Extract HTTP method, path string, and handler routine.
3. For each CallExpression identified:
   - Resolve target symbol name against local scope or imported module paths.
   - Register bidirectional edge: Symbol(caller) -> Symbol(callee).
4. Return extracted symbol catalog.
```

---

## 4.12 AI-Assisted Code Understanding with Grounded RAG
The AI assistant (`services/assistant-service.ts`, `lib/server/gemini.ts`) connects developer inquiries to Google Gemini foundation models (`gemini-1.5-flash` and `gemini-1.5-pro`).

### 4.12.1 Bounded Grounded Prompt Engineering
To eliminate hallucinations, user questions are wrapped with strictly formatted AST receipts:
```text
SYSTEM INSTRUCTION:
You are CodeAtlas AI. You answer software engineering questions strictly based on the provided AST context.
Never invent functions, parameters, or file paths not present in the context.
Always cite your evidence using verified file coordinates: `[file_path:start_line-end_line]`.

AST CONTEXT EVIDENCE:
[Symbol: authorize]
File: services/auth-service.ts (Lines 42-88)
Callers: POST /api/auth -> oauthHandler()
Callees: UserService.findByEmail(), verifyPassword()
Source Code:
42: export async function authorize(email: string, pass: string) {
...
88: }

USER QUESTION:
How is password authentication verified in this codebase?
```

### 4.12.2 Deterministic Offline Fallback
If the Gemini API key is unconfigured or network access is restricted, CodeAtlas engages its **Deterministic Offline Fallback**. The platform parses the local symbol table, determines the caller/callee chain, and outputs a structured technical breakdown directly from the AST graph, ensuring uninterrupted developer operation.

---

## 4.13 Search and Navigation
Global search (`app/(app)/search/page.tsx`) implements multi-category indexing. Inquiries are tokenized and matched against three distinct entity categories:
1. **File Names & Paths**: Matches file paths (e.g., `services/auth-service.ts`).
2. **AST Symbols**: Matches functions, classes, and interfaces (e.g., `handleSubmit`, `authorize`).
3. **API Routes**: Matches HTTP methods and route patterns (e.g., `POST /api/v1/auth/login`).
Filter toggles allow developers to isolate specific entity types, and clicking any result instantly jumps to the exact line in the code viewer.

---

## 4.14 Dependency Analysis & Architecture Visualization
The architecture visualizer (`app/(app)/architecture/page.tsx`, `services/architecture-service.ts`) provides two complementary visual perspectives:
1. **2D Interactive Graph**: Uses a force-directed layout rendering SVG nodes (blue for frontend components, green for backend APIs, purple for services, amber for database tables). Directed edges show call directions, with pulsing animated markers indicating active execution paths.
2. **2.5D Isometric City View**: Renders modules as an architectural city. Building footprints scale with the number of internal functions, while building heights scale with Lines of Code (LOC). Colors indicate structural health, with red highlighting modules containing circular dependencies.

### Algorithm 4.2: Circular Dependency Detection (Tarjan's Strongly Connected Components)
```text
Input:  Directed Graph G = (V, E) where V are modules, E are import edges
Output: Set of circular dependency cycles C

1. Initialize index = 0, Stack S = empty.
2. For each node v in V:
   If v.index is undefined, execute strongconnect(v):
     a. v.index = index; v.lowlink = index; index = index + 1; S.push(v); v.onStack = true.
     b. For each edge (v, w) in E:
        If w.index is undefined:
           strongconnect(w)
           v.lowlink = min(v.lowlink, w.lowlink)
        Else if w.onStack:
           v.lowlink = min(v.lowlink, w.index)
     c. If v.lowlink == v.index:
        Pop nodes from S until v is popped; form strongly connected component SCC.
        If |SCC| > 1 or (v, v) in E:
           Add SCC to C as a circular dependency cycle.
3. Return C.
```

---

## 4.15 Additional Implemented Modules
- **PR Blast-Radius Impact Analysis (`app/(app)/impact/page.tsx`)**: Traverses reverse dependency edges from a modified symbol, computing all upstream services, controllers, and tests that could be affected by an interface modification.
- **Developer Onboarding Engine (`app/(app)/onboarding/page.tsx`)**: Computes PageRank over the call graph to identify core "gateway" routines, generating a step-by-step reading list for newly joined engineers.
- **Debug Stack Trace Parser (`app/(app)/debug/page.tsx`)**: Ingests raw Python or JavaScript error stack traces, matches frames to local repository files, extracts relevant line ranges, and suggests targeted code fixes.

---

## 4.16 API Communication & Client Architecture
The frontend `ApiClient` (`services/api-client.ts`) provides a unified interface for HTTP communication with the FastAPI backend. It incorporates automatic abort timeouts (default 30 seconds), exponential backoff retries for transient 503 errors, and automatic network error translation: raw browser exceptions (`TypeError: Failed to fetch`, `ECONNREFUSED`) are sanitized to clear user-facing messages (`"Unable to connect to the server. Please try again."`).

---

## 4.17 Error Handling and Validation
All backend requests are validated using Pydantic v2 schemas (`backend/app/schemas/`). If request parameters violate constraints, custom validation handlers return standardized JSON errors (`HTTP 422 Unprocessable Entity`) indicating the exact invalid field without exposing internal server paths. Unhandled database exceptions are intercepted by `generic_exception_handler` (`backend/app/utils/error_handlers.py`), logging detailed tracebacks internally while returning clean HTTP 503 responses to the client.

---

## 4.18 Testing Methodology
Testing adhered to a multi-tiered verification hierarchy:
- **Unit Testing**: Verified isolated logic (path traversal blocking, secret redaction in logs, prompt injection filters).
- **Authentication Integration Testing**: Tested registration, login, bcrypt verification, OTP delivery, 60s cooldowns, and password resets (54/54 passed).
- **OAuth Integration Testing**: Verified Google OIDC decoding and GitHub OAuth state validation (106/106 passed across Google and GitHub).
- **AI Grounding Testing**: Tested prompt bounding, source citation extraction, and offline fallback (43/43 passed).
- **Static Analysis & Typecheck**: Verified 0 TypeScript errors (`tsc --noEmit`) and 0 ESLint warnings (`next lint`).

---

## 4.19 Build & Deployment Pipeline
To deploy CodeAtlas to GitHub Pages, a dedicated static export pipeline (`scripts/build-static-pages.ts`) was constructed:
1. **Workspace Isolation**: Creates `.pages_export_temp/`, copying application assets while excluding runtime API routes (`app/api/**`).
2. **Next.js Static Export Configuration**: Injects `output: 'export'`, `basePath: '/CodeAtlas-AI-Codebase-Intelligence-Platform'`, and `unoptimized: true` for Next.js images.
3. **Static Generation**: Executes Next.js static build, compiling 47 HTML routes into `out/`.
4. **SPA & Asset Directives**: Injects `out/.nojekyll` to disable Jekyll processing on GitHub Pages and copies `out/index.html` to `out/404.html` to enable client-side SPA routing fallback on page refreshes.

---

## 4.20 GitHub Pages Compatibility & Architectural Limitations
GitHub Pages is a static file server; it cannot execute Node.js runtime code, run Python processes, or host PostgreSQL databases. CodeAtlas accommodates this architectural boundary through clear operational separation:
- The static frontend bundle in `out/` is deployed to GitHub Pages and served via GitHub's global edge CDN.
- The Python FastAPI backend and PostgreSQL database are hosted separately on cloud container infrastructure (e.g., Google Cloud Run, Render, AWS ECS, Neon Cloud).
- The frontend dynamically communicates with the backend via `NEXT_PUBLIC_API_BASE_URL`.
- The backend CORS middleware (`backend/app/main.py`) explicitly permits requests originating from `https://.*\.github\.io`, enabling complete, secure cloud-to-static communication.

