# CodeAtlas — Backend Architecture & API Documentation

CodeAtlas is an AI-powered codebase intelligence platform. This backend powers code understanding, repository ingestion, interactive FlowTrace execution graphs, BugTrail automated triage, ChangeRadar blast radius assessment, and CodeMemory persistent history.

---

## 1. Quickstart & Local Setup

### Prerequisites
- Python 3.12+ (Python 3.14 compatible)
- Windows PowerShell / Linux / macOS

### Setup Virtual Environment
```powershell
# From the backend directory:
py -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install all dependencies:
pip install -r requirements.txt
```

### Environment Configuration
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```

### Run Backend Server
```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive Documentation:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- Health Check: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### Running Automated Test Suite
```powershell
pytest -v
```

---

## 2. Architecture: Phase A (In-Memory) to Phase B (PostgreSQL)

The codebase strictly follows the **Repository & Service Pattern** to ensure the database can be connected without rewriting business logic or API endpoints:

```
FastAPI Route Handlers (app/api/v1/)
       |
       v
Service Layer (app/services/)
       |
       v
Repository Interfaces (app/repositories/interfaces.py)
       |
       +----------------------------+
       |                            |
       v                            v
Memory Adapters (Phase A)     PostgreSQL Adapters (Phase B)
(app/repositories/memory/)    (app/repositories/postgres/)
                                    |
                                    v
                              PostgreSQL + pgvector
```

### Transitioning to PostgreSQL (Phase B)
1. In `.env`, set:
   ```env
   DATABASE_TYPE=postgres
   DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/codeatlas
   ```
2. The SQLAlchemy models (`app/models/`) and Postgres adapters (`app/repositories/postgres/`) are already built and ready.
3. Run Alembic migrations to create tables.

---

## 3. Frontend Integration API Reference (`/api/v1`)

All endpoints are prefixed with `/api/v1`.

### A. Authentication & User Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/google/login` | Returns Google OAuth authorization URL and CSRF state. |
| `GET` | `/auth/google/callback` | Exchanges Google code for access JWT session token. |
| `GET` | `/auth/me` | Returns current user identity and GitHub connection state. |
| `POST` | `/auth/logout` | Invalidate current session. |
| `GET` | `/users/me` | Returns complete user profile. |

### B. GitHub Integration & Repository Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/github/connect` | Initiates GitHub OAuth flow with `repo` scopes. |
| `GET` | `/github/callback` | Stores encrypted GitHub OAuth token. |
| `GET` | `/github/status` | Returns GitHub connection state (`connected: true/false`). |
| `DELETE` | `/github/disconnect` | Revokes and purges GitHub tokens. |
| `GET` | `/github/repositories` | Lists public and private repos accessible to the account. |
| `GET` | `/repositories/{repo_id}` | Details, index status, and symbol count. |
| `GET` | `/repositories/{repo_id}/files` | Returns nested directory hierarchy for tree view. |
| `GET` | `/repositories/{repo_id}/files/content?path=...` | Read file contents safely. |
| `POST` | `/repositories/{repo_id}/index` | Triggers AST parsing and symbol extraction. |
| `GET` | `/repositories/{repo_id}/index/status` | Current indexing progress & metrics. |

### C. Visual CodeLens & AI Code Explanation
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/code/explain` | Line-by-line explanation with complexity & risks. |
| `POST` | `/visual/extract` | OCR/Vision extraction from camera snapshot or image upload. |
| `POST` | `/visual/analyze` | Explains extracted code and links to matched repo. |
| `POST` | `/visual/match` | Matches pasted/extracted snippet to repository file & lines. |
| `POST` | `/visual/workflow` | Traces snippet callers and dependencies (**FlowTrace graph**). |
| `POST` | `/assistant/ask` | Contextual Q&A on codebase with exact file/line citations. |
| `POST` | `/search` | Keyword, symbol, and semantic search. |
| `POST` | `/code/compare` | Structural and logic difference analyzer. |

### D. Graphs, Debugging, Testing, & History
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/repositories/{repo_id}/architecture` | Module and dependency graph (React Flow / Cytoscape). |
| `GET` | `/repositories/{repo_id}/symbols/{id}/dependencies` | Callers and callees for a specific function. |
| `POST` | `/impact/analyze` | ChangeRadar: Blast radius assessment. |
| `POST` | `/debug/analyze` | BugTrail: Error log analysis and suggested fixes. |
| `POST` | `/tests/discover` | TestPilot: Discovers test cases and untested modules. |
| `GET` | `/history` | CodeMemory: Retrieve saved analyses. |
| `POST` | `/history` | CodeMemory: Save an analysis. |
| `DELETE` | `/history/{id}` | Delete saved analysis. |
| `GET` | `/health` | Service health status. |

---

## 4. Example Payload Formats

### 1. Code Explanation Request (`POST /api/v1/code/explain`)
```json
{
  "code": "def process_payment(amount):\n    if amount <= 0:\n        raise ValueError('Invalid amount')\n    return gateway.charge(amount)",
  "language": "python",
  "level": "developer"
}
```

### 2. FlowTrace Workflow Response (`POST /api/v1/visual/workflow`)
```json
{
  "match_status": "matched",
  "matched_file": "app/services/payment.py",
  "nodes": [
    {
      "id": "node_upstream",
      "label": "Payment Controller",
      "type": "function",
      "file": "app/api/payments.py"
    },
    {
      "id": "node_target",
      "label": "process_payment",
      "type": "function",
      "file": "app/services/payment.py",
      "line": 1
    }
  ],
  "edges": [
    {
      "source": "node_upstream",
      "target": "node_target",
      "type": "calls"
    }
  ],
  "sources": [
    {
      "file": "app/services/payment.py",
      "start_line": 1,
      "end_line": 4,
      "match_score": 1.0
    }
  ],
  "workflow_summary": "Successfully matched snippet to app/services/payment.py..."
}
```

---

## 5. Security Best Practices
- **Token Encryption**: GitHub OAuth access tokens are encrypted symmetrically at rest using Fernet before saving.
- **CSRF Protection**: OAuth callback flows use cryptographically random state tokens with a 10-minute TTL.
- **Path Traversal Protection**: All file path access is normalized and sanitized against `../` directory escapes.
- **File & Size Limits**: Configurable file-size and repo-size limits prevent memory exhaustion.
- **CORS Support**: Pre-configured to allow local frontend development (`localhost:3000`, `localhost:5173`) and GitHub Pages deployment.
