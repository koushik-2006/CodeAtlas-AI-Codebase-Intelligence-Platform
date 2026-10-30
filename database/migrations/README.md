# CodeAtlas Database Migrations

This directory tracks schema migration scripts and procedures for the PostgreSQL database backend.

## Migration Tooling

CodeAtlas supports two migration approaches:

1. **Alembic (Python / SQLAlchemy)**:
   Alembic is configured in `backend/alembic.ini` for version-controlled Python migration revisions.
   ```bash
   cd backend
   alembic revision --autogenerate -m "description_of_change"
   alembic upgrade head
   ```

2. **Direct SQL Migrations**:
   Versioned SQL scripts can be placed in this directory formatted as:
   - `001_initial_schema.sql`
   - `002_add_vector_embeddings.sql`
   - etc.

## Running Migrations in Local Docker

When starting PostgreSQL with Docker Compose:
```bash
docker compose up -d postgres
psql -h localhost -U codeatlas_user -d codeatlas -f database/schemas/schema.sql
psql -h localhost -U codeatlas_user -d codeatlas -f database/seeds/seed_dev.sql
```

