# CodeAtlas Local Setup & Developer Guide

This document walks through setting up the complete CodeAtlas full-stack development environment.

## Prerequisites

- **Node.js**: v20.x LTS or higher
- **npm**: v10.x or higher
- **Python**: v3.11 or higher
- **PostgreSQL**: v14+ (or Docker)
- **Git**

## Quick Start (Monorepo)

### 1. Clone Repository & Set Environment Files

```bash
git clone https://github.com/koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform.git
cd CodeAtlas-AI-Codebase-Intelligence-Platform

# Frontend environment
cp frontend/.env.example frontend/.env.local

# Backend environment
cp backend/.env.example backend/.env
```

### 2. Frontend Setup

```bash
cd frontend
npm ci
npm run dev
```
The frontend starts on `http://localhost:3000`.

### 3. Backend Setup

```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
The backend API starts on `http://localhost:8000`.
Interactive Swagger API documentation is available at `http://localhost:8000/docs`.

### 4. Database Setup (Optional for Postgres Mode)

By default, the backend runs in memory mode for zero-configuration local development.
To enable real PostgreSQL persistence:

```bash
docker compose up -d postgres
```
Update `backend/.env`:
```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql+psycopg://codeatlas_user:codeatlas_password@localhost:5432/codeatlas
```

### 5. Running Quality Checks & Tests

```bash
# Frontend checks
cd frontend
npm run lint
npm run typecheck
npm test

# Backend checks
cd backend
pytest
```

