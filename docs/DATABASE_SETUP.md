# CodeAtlas PostgreSQL Database & Migration Guide

This guide details the PostgreSQL database models, SQLAlchemy 2.0 engine configuration, and the safe, non-destructive Alembic migration procedure for CodeAtlas.

---

## 1. Database Configuration & Engine Architecture

CodeAtlas connects to PostgreSQL using SQLAlchemy 2.0 with the modern **psycopg** (v3) database driver:

- **Connection URL Format**:
  `postgresql+psycopg://<username>:<password>@<host>:<port>/<dbname>`
- **Environment Variable**: `DATABASE_URL` in `backend/.env`
- **Driver Type**: Set `DATABASE_TYPE=postgres` in `backend/.env` for production; or `DATABASE_TYPE=memory` for zero-setup local unit testing.
- **Connection Lifecycle**: Managed via scoped session factories in `backend/app/database/session.py`. Connections are returned to the pool after each API request.

---

## 2. Database Models & Schema Summary

All models inherit from `app.database.base.Base` (SQLAlchemy 2.0 DeclarativeBase):

| Model Class | Table Name | Purpose | Key Columns / Constraints |
| :--- | :--- | :--- | :--- |
| **`User`** | `users` | User identity & authentication | `id` (PK), `email` (Unique), `hashed_password` (Nullable for Google OAuth accounts), `name`, `is_active` |
| **`ConnectedAccount`**| `connected_accounts` | Third-party OAuth (GitHub/Google) | `id` (PK), `user_id` (FK -> users.id), `provider`, `account_id`, `access_token` (Encrypted) |
| **`Repository`** | `repositories` | Registered code repositories | `id` (PK), `owner_id` (FK -> users.id), `name`, `full_name`, `default_branch`, `is_private` |
| **`RepositoryIndex`** | `repository_indexes` | Indexing status & metadata | `id` (PK), `repository_id` (FK), `commit_hash`, `status`, `progress`, `total_files`, `total_symbols` |
| **`SourceFile`** | `source_files` | Indexed source file catalog | `id` (PK), `repository_id` (FK), `path`, `content_hash`, `language`, `size_bytes` |
| **`CodeSymbol`** | `code_symbols` | AST extracted functions/classes | `id` (PK), `file_id` (FK), `name`, `kind`, `line_start`, `line_end` |
| **`CodeRelationship`**| `code_relationships`| Graph edges (calls, imports) | `id` (PK), `source_symbol_id` (FK), `target_symbol_id` (FK), `type` |
| **`CodeChunk`** | `code_chunks` | Text chunks for search & RAG | `id` (PK), `file_id` (FK), `content`, `embedding` |
| **`SavedAnalysis`** | `saved_analyses` | History & Bookmarked insights | `id` (PK), `user_id` (FK), `repository_id`, `title`, `analysis_type`, `data` |
| **`ChatSession`** | `chat_sessions` | AI chat session threads | `id` (PK), `user_id` (FK), `repository_id`, `title` |
| **`ChatMessage`** | `chat_messages` | Contextual assistant messages | `id` (PK), `session_id` (FK), `role` (user/assistant), `content` |

---

## 3. Migration History

Migrations are managed with Alembic under `backend/app/database/migrations/`:

1. `20261027_01_init.py`: Base table creation (`users`, `repositories`, `indexes`, `symbols`, etc.).
2. `20261027_02_add_user_password.py`: Non-destructive migration that adds `hashed_password` (`VARCHAR(255) NULL`) to `users`.

---

## 4. Safe Operator Migration Workflow

> [!IMPORTANT]
> Never run destructive migrations (such as dropping tables or resetting sequences) on a live database. Always inspect the migration status and dry-run SQL preview before applying changes.

### Step 1: Preflight Connection Check
Ensure your PostgreSQL server is running and accessible:
```bash
# Verify PostgreSQL credentials
psql -h localhost -U postgres -d codeatlas -c "SELECT 1;"
```

### Step 2: Check Current Migration State
```bash
cd backend
python -m alembic -c alembic.ini current
```
If the database is fresh, this will output empty or `(head)`.

### Step 3: Dry-Run Offline SQL Preview (Recommended)
Generate the exact raw SQL statements that Alembic will execute without altering the database:
```bash
cd backend
python -m alembic -c alembic.ini upgrade head --sql
```
Review the output to confirm that all operations are additive (`CREATE TABLE`, `ALTER TABLE ... ADD COLUMN`) and no destructive `DROP TABLE` statements exist.

### Step 4: Apply Migrations
```bash
cd backend
python -m alembic -c alembic.ini upgrade head
```

### Step 5: Verify Tables & Constraints
Confirm the tables and the new `hashed_password` column exist:
```bash
psql -h localhost -U postgres -d codeatlas -c "\d users"
```
You will see:
```
                               Table "public.users"
     Column      |          Type          | Collation | Nullable | Default
-----------------+------------------------+-----------+----------+---------
 id              | character varying(36)  |           | not null |
 email           | character varying(255) |           | not null |
 hashed_password | character varying(255) |           |          |
 name            | character varying(255) |           | not null |
 is_active       | boolean                |           | not null | true
...
Indexes:
    "pk_users" PRIMARY KEY, btree (id)
    "uq_users_email" UNIQUE CONSTRAINT, btree (email)
```
