# CodeAtlas Troubleshooting Guide

This guide provides actionable solutions for common issues across development, database migrations, authentication, AI integration, and deployment.

---

## 1. Authentication & Session Issues

### A. "Account was created with Google OAuth" Error on Password Login
- **Cause**: The user originally registered using Google One Tap or Google OAuth. For security, Google accounts do not possess a password hash.
- **Solution**: The user must log in using the **Sign in with Google** button. If password authentication is desired, the user can set a password while authenticated.

### B. "Session expired" / Infinite Redirect Loop
- **Cause**: The JWT token expired (default: 1440 minutes / 24 hours) or the `SECRET_KEY` on the FastAPI server was regenerated after a server restart.
- **Solution**:
  1. Ensure `SECRET_KEY` is fixed in `backend/.env` rather than randomly generated on each startup.
  2. The frontend `services/api-client.ts` automatically detects `401 Unauthorized`, clears stale local tokens, and redirects cleanly to `/login` without a loop.

### C. Cookies Not Being Sent Cross-Origin
- **Cause**: Missing `credentials: "include"` or cookie attributes (`SameSite=None` and `Secure=True` required across different domains).
- **Solution**:
  - In development (`http://localhost:3000` to `http://localhost:8000`), `SameSite=Lax` works when using same-origin proxy or CORS with `allow_credentials=True`.
  - In cross-origin production (GitHub Pages HTTPS to backend HTTPS), configure `SameSite=None; Secure=True` in `backend/app/api/v1/auth.py`.

---

## 2. PostgreSQL & Database Migrations

### A. "ModuleNotFoundError: No module named 'psycopg'"
- **Cause**: SQLAlchemy 2.0 URL specifies `postgresql+psycopg://` which requires `psycopg` (v3).
- **Solution**: Run `pip install "psycopg[binary]"` inside your backend Python environment.

### B. "Target database is not up to date"
- **Cause**: Alembic detected unapplied migration versions.
- **Solution**:
  1. Run `python -m alembic -c alembic.ini current` to check the current head.
  2. Run `python -m alembic -c alembic.ini upgrade head` to apply pending migrations.
  3. If you want to review the raw SQL first, execute `python -m alembic -c alembic.ini upgrade head --sql`.

### C. Testing Without PostgreSQL
- **Solution**: Set `DATABASE_TYPE=memory` in `backend/.env`. The backend includes a thread-safe in-memory repository implementation that passes all 30 tests without running a database server.

---

## 3. GitHub OAuth & Repository Access

### A. "Redirect URI mismatch" (error=redirect_uri_mismatch)
- **Cause**: The callback URL registered in the GitHub Developer Settings does not match the URL requested by the backend.
- **Solution**:
  - Local: Register `http://localhost:8000/api/v1/github/callback` (or your reverse proxy callback).
  - Production: Register `https://api.yourdomain.com/api/v1/github/callback`.
  - Ensure `GITHUB_REDIRECT_URI` in `backend/.env` matches the registered URI exactly.

### B. "Bad verification code"
- **Cause**: GitHub authorization codes are single-use and expire within 10 minutes.
- **Solution**: Restart the connection flow from `/dashboard` or `/settings`.

---

## 4. Gemini AI Provider

### A. AI Responses Fall Back to Deterministic/Mock Analysis
- **Cause**: `AI_PROVIDER=mock` or `GEMINI_API_KEY` is unset or blank in `backend/.env`.
- **Solution**:
  1. Generate a key from [Google AI Studio](https://aistudio.google.com/).
  2. Set `AI_PROVIDER=gemini` and `GEMINI_API_KEY=AIzaSy...` in `backend/.env`.
  3. Restart FastAPI: `uvicorn app.main:app --reload`.

### B. "ResourceExhausted" / Quota Exceeded (HTTP 429)
- **Cause**: Free tier Gemini 1.5 rate limit exceeded (15 requests/minute).
- **Solution**: CodeAtlas catches rate-limit exceptions and surfaces an informative retry notification rather than crashing the chat session.

---

## 5. CSS & Tailwind Warnings in Code Editor

### "Unknown at rule @tailwind(unknownAtRules)" in VS Code / IDE
- **Diagnosis**: This is an editor language service diagnostic, not a build error. Next.js and PostCSS compile Tailwind v3.4.6 without errors.
- **Solution**:
  Ensure `.vscode/settings.json` exists in the repository root with:
  ```json
  {
    "css.lint.unknownAtRules": "ignore",
    "scss.lint.unknownAtRules": "ignore",
    "less.lint.unknownAtRules": "ignore"
  }
  ```
  This tells the CSS language server to recognize Tailwind at-rules without suppressing real CSS syntax errors.

---

## 6. GitHub Pages Static Export Issues

### A. Direct Links Return 404 on Refresh
- **Cause**: GitHub Pages looks for physical static files matching URL paths (e.g., `/dashboard/index.html`).
- **Solution**: The static build script (`scripts/build-static-pages.ts`) automatically generates `out/404.html` from `out/index.html`. GitHub Pages serves `404.html` on deep links, allowing the client-side router to mount and render the target page.

### B. CSS / JS Assets Fail to Load (Underscore Directories Ignored)
- **Cause**: Jekyll on GitHub Pages ignores directories prefixed with an underscore (`_next`).
- **Solution**: The build script writes `out/.nojekyll`. This disables Jekyll and ensures all `_next/static` assets are served properly.
