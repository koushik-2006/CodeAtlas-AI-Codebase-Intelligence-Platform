# CodeAtlas Multi-Container Docker Deployment

This directory contains Docker Compose orchestration files for spinning up the full CodeAtlas stack (Frontend, Backend, and PostgreSQL) with a single command.

## Architecture

| Service | Technology | Port | Purpose |
|---|---|---|---|
| `frontend` | Next.js 14 App Router (Node.js 20 LTS Alpine) | `3000` | UI, City visualizer, Monaco editor, Architecture graph |
| `backend` | FastAPI (Python 3.11-slim, Uvicorn) | `8000` | Code parsing, AST indexing, AI embeddings, OAuth |
| `postgres` | PostgreSQL 16 Alpine | `5432` | Persistent storage with initialized schemas and seed data |

## Quick Start

```bash
# Start all services in the background
docker compose -f deployment/docker/docker-compose.yml up -d

# Check service logs
docker compose -f deployment/docker/docker-compose.yml logs -f

# Stop all services
docker compose -f deployment/docker/docker-compose.yml down
```

## Initial Database Seeding
The compose file automatically mounts:
- `database/schemas/schema.sql` into `/docker-entrypoint-initdb.d/01_schema.sql`
- `database/seeds/seed_dev.sql` into `/docker-entrypoint-initdb.d/02_seeds.sql`
When PostgreSQL starts for the first time, tables and dev accounts are initialized automatically.

