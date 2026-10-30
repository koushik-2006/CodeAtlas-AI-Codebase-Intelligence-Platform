# CodeAtlas Local Development & Testing Guide

This guide provides end-to-end instructions for running the Next.js frontend, FastAPI backend, and PostgreSQL database locally.

---

## 1. Prerequisites

- **Node.js**: 18.x or 20.x+ (tested on Node 20 / 22)
- **Python**: 3.10, 3.11, 3.12, or 3.13 (tested on Python 3.13)
- **PostgreSQL**: PostgreSQL 14+ (or set `DATABASE_TYPE=memory` for instant offline testing without running a PostgreSQL instance)

---

## 2. Backend Setup (FastAPI + Python)

### Step 1: Open the backend folder
```bash
cd backend
```

### Step 2: (Optional but recommended) Create a Virtual Environment
```bash
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux / macOS:
source .venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment
Copy `backend/.env.example` to `backend/.env`:
```ini
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
DEBUG=True
API_V1_STR=/api/v1
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# Security
SECRET_KEY=at_least_32_characters_random_string_for_jwt_session
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database
DATABASE_TYPE=postgres
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/codeatlas

# AI Provider (mock | gemini | openai)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Tip: Set `DATABASE_TYPE=memory` if you want to run completely offline without PostgreSQL!)*

### Step 5: Run Database Migrations
```bash
python -m alembic -c alembic.ini upgrade head
```

### Step 6: Start FastAPI
```bash
python -m uvicorn app.main:app --reload --port 8000
```
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- ReDoc API Docs: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/api/v1/health`

---

## 3. Frontend Setup (Next.js + React)

### Step 1: Open the root repository folder
```bash
cd ..
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Configure Frontend Environment
Ensure `.env.local` contains:
```ini
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### Step 4: Start Next.js Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 4. End-to-End Verification Walkthrough

1. **Register an Account**:
   - Navigate to `http://localhost:3000/login`.
   - Toggle to the **Create Account** tab.
   - Enter your name, email, and password (8+ characters).
   - Click **Create Account**.
   - Your account is hashed with bcrypt, saved to PostgreSQL, and your session is established.
2. **Access Protected Dashboard**:
   - You are automatically redirected to `http://localhost:3000/dashboard`.
   - Your session is validated by the backend via `GET /api/v1/auth/session` and `GET /api/v1/auth/me`.
3. **Session Persistence**:
   - Refresh the page (`F5`). Notice that your session persists smoothly through the HttpOnly cookie and Bearer token transport.
4. **Logout**:
   - Click **Sign Out** in the user menu.
   - The backend clears cookies and session state, redirecting you back to the login screen.
5. **Verify Wrong Password**:
   - Attempt to log in with an incorrect password. Notice the clean, descriptive error message without exposing server internals.

---

## 5. Running Automated Tests

### Run Backend Tests (Pytest)
```bash
cd backend
python -m pytest tests -v
```
*Expected: 30 passed in ~1.5s.*

### Run Frontend Tests (Jest)
```bash
npm run test
```
*Expected: 19 test suites passed, 78 tests passed.*

### Run Static Typecheck
```bash
npm run typecheck
```
*Expected: 0 errors.*

### Run Production Builds
```bash
npm run build:pages   # GitHub Pages Static Export (47 routes)
npm run build         # Next.js Full Production Build
```
*Expected: Both exit with code 0.*
