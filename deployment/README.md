# CodeAtlas Deployment Guide

This directory organizes deployment targets, configuration templates, and containerization recipes for the CodeAtlas platform across various environments.

## Directory Structure

```text
deployment/
├── github-pages/     # Static export configuration and workflow for GitHub Pages
│   └── README.md
├── backend/          # FastAPI backend containerization and environment guides
│   ├── Dockerfile
│   └── README.md
├── docker/           # Full-stack multi-container Docker Compose definitions
│   ├── docker-compose.yml
│   └── README.md
└── README.md         # Deployment overview (this file)
```

## Deployment Targets

### 1. Static Frontend on GitHub Pages
- **URL**: `https://koushik-2006.github.io/CodeAtlas-AI-Codebase-Intelligence-Platform/`
- **Build Command**: `npm --prefix frontend run build:pages`
- **Artifacts**: Pure static HTML/JS/CSS bundle in `frontend/out` with `.nojekyll` and `404.html` SPA routing.
- **Workflow**: Automated via `.github/workflows/deploy-pages.yml` on push to `main`.

### 2. Standalone Full-Stack Docker
- **Frontend Port**: `3000`
- **Backend Port**: `8000`
- **PostgreSQL Port**: `5432`
- **Command**: `docker compose up -d`

### 3. Cloud Container Hosting (AWS ECS, GCP Cloud Run, DigitalOcean)
- **Frontend**: Deploy `frontend/Dockerfile` image with `NEXT_PUBLIC_API_BASE_URL` pointing to the backend domain.
- **Backend**: Deploy `backend/Dockerfile` image with `DATABASE_URL` pointing to managed PostgreSQL.

