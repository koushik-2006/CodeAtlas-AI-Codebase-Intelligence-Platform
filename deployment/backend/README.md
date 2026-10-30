# CodeAtlas Backend Deployment

This directory contains containerization and deployment instructions for the FastAPI backend service.

## Container Architecture
- **Framework**: FastAPI (Python 3.11-slim)
- **ASGI Server**: Uvicorn
- **Default Port**: 8000
- **Database Driver**: `psycopg` (v3) with SQLAlchemy 2.0+ ORM
- **Authentication**: JWT tokens, bcrypt password hashing, Google & GitHub OAuth 2.0

## Building and Running Backend Container

### Standalone Docker Build
```bash
docker build -t codeatlas-backend -f deployment/backend/Dockerfile .
docker run -p 8000:8000 --env-file backend/.env codeatlas-backend
```

### Healthcheck
The container provides a built-in healthcheck:
```bash
curl http://localhost:8000/api/v1/health
```
Expected response:
```json
{"status":"healthy","version":"1.0.0"}
```

