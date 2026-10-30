# CodeAtlas API Integration Reference

This document provides the complete API specification for the FastAPI backend (`/api/v1`) and how each endpoint binds to the Next.js frontend services.

---

## 1. General Request & Response Standards

- **Base URL**: `http://localhost:8000/api/v1` (or local Next.js proxy `/api/v1`)
- **Authentication**:
  - Browser: HttpOnly cookie `codeatlas_session=<jwt_token>`
  - API / Cross-Origin: Header `Authorization: Bearer <jwt_token>`
- **Error Format**:
  FastAPI returns JSON error payloads:
  ```json
  {
    "detail": "Descriptive error message or validation array"
  }
  ```
  The frontend `services/api-client.ts` automatically extracts `detail` and presents friendly UI toast notifications.

---

## 2. API Endpoints Specification

### A. Authentication & Session (`/auth`)

#### 1. Register User
- **Endpoint**: `POST /api/v1/auth/register`
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "user": {
      "id": "usr_abc123",
      "email": "jane@example.com",
      "name": "Jane Doe",
      "avatar_url": null,
      "is_active": true
    },
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 86400
  }
  ```
- **Cookie**: Sets `codeatlas_session` (HttpOnly, SameSite=Lax).

#### 2. Email Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response** (`200 OK`): Same as `Register`. Returns active user profile and token.

#### 3. Session Status
- **Endpoint**: `GET /api/v1/auth/session`
- **Response** (`200 OK`):
  ```json
  {
    "isAuthenticated": true,
    "user": { "id": "usr_abc123", "email": "jane@example.com", "name": "Jane Doe" }
  }
  ```

#### 4. Current User Profile
- **Endpoint**: `GET /api/v1/auth/me`
- **Response** (`200 OK`): User details object. Returns `401 Unauthorized` if session is invalid.

#### 5. Logout
- **Endpoint**: `POST /api/v1/auth/logout`
- **Response** (`200 OK`): Clears `codeatlas_session` and `access_token` cookies.

#### 6. Google Sign-In
- **Endpoint**: `POST /api/v1/auth/google`
- **Request Body**: `{ "credential": "<google_id_token>" }`

---

### B. GitHub Integration (`/github`)

- **Start OAuth Flow**: `GET /api/v1/github/connect` -> Returns authorization URL.
- **OAuth Callback**: `GET /api/v1/github/callback?code=<code>&state=<state>` -> Exchanging code for token and returning connection status.
- **Connection Status**: `GET /api/v1/github/status` -> `{ "connected": bool, "username": str }`
- **Disconnect**: `DELETE /api/v1/github/disconnect` -> Purges stored GitHub access tokens.
- **List Repositories**: `GET /api/v1/github/repositories` -> Returns accessible public and private repos.

---

### C. Repositories & Files (`/repositories`)

- **Repository Details**: `GET /api/v1/repositories/{repo_id}`
- **File Hierarchy Tree**: `GET /api/v1/repositories/{repo_id}/files`
  Returns recursive folder structure:
  ```json
  {
    "name": "src",
    "path": "src",
    "type": "directory",
    "children": [
      { "name": "index.ts", "path": "src/index.ts", "type": "file", "size": 1420 }
    ]
  }
  ```
- **File Content**: `GET /api/v1/repositories/{repo_id}/files/content?path=src/index.ts`
  Returns `{ "path": "src/index.ts", "content": "...", "size": 1420, "language": "typescript" }`
- **Start Indexing**: `POST /api/v1/repositories/{repo_id}/index`
  Body: `{ "force_reindex": false }`
- **Indexing Status**: `GET /api/v1/repositories/{repo_id}/index/status`
  Returns `{ "status": "completed", "progress": 1.0, "total_files": 48, "total_symbols": 210 }`

---

### D. Code Intelligence & AI

- **Code Explanation**: `POST /api/v1/code/explain`
  Body: `{ "code": "...", "language": "python", "level": "intermediate" }`
  Returns structured summary, line-by-line breakdown, complexity score, and risks.
- **Code Comparison**: `POST /api/v1/code/compare`
  Body: `{ "code_a": "...", "code_b": "...", "language": "python" }`
  Returns syntactic diffs, breaking changes, and performance implications.
- **AI Assistant Chat**: `POST /api/v1/assistant/ask`
  Body: `{ "query": "How is authentication handled?", "repository_id": "repo_123" }`
  Returns answer grounded in repository source code with file paths and line citations.
- **Semantic & Keyword Search**: `POST /api/v1/search`
  Body: `{ "repository_id": "repo_123", "query": "authService", "type": "all", "limit": 20 }`

---

### E. Graph Analysis & Visual Explorer

- **Architecture Graph**: `GET /api/v1/repositories/{repo_id}/architecture`
  Returns nodes (files/modules) and edges (imports/calls) for interactive graph rendering.
- **Symbol Dependencies**: `GET /api/v1/repositories/{repo_id}/symbols/{symbol_id}/dependencies`
  Returns upstream callers and downstream callees.
- **BugTrail Error Analysis**: `POST /api/v1/debug/analyze`
  Body: `{ "stack_trace": "...", "repository_id": "repo_123" }`
  Identifies failing lines, root causes, and suggested fixes.
- **ChangeRadar Impact Analysis**: `POST /api/v1/impact/analyze`
  Body: `{ "repository_id": "repo_123", "file_path": "...", "diff_or_code": "..." }`
  Returns risk scores and dependent files likely to break.
- **Visual Code Extraction (OCR)**: `POST /api/v1/visual/extract`
  Accepts multipart file or base64 image and extracts formatted source code.
- **FlowTrace Workflow Tracing**: `POST /api/v1/visual/workflow`
  Traces code execution through callers and dependencies into a directed workflow graph.
