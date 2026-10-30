# CodeAtlas — PostgreSQL Database Guide for Member 2

This directory contains the production-grade PostgreSQL database schema for the **CodeAtlas AI Codebase Intelligence Platform**.

## Overview
- **Location**: `database/schema.sql`
- **Compatibility**: PostgreSQL 14, 15, and 16+
- **Vector Search Support**: Native `pgvector` compatible (`vector(768)` for Google Gemini `text-embedding-004`).
- **Policy**: CodeAtlas front-end and local scripts will **NOT** automatically connect to or mutate your PostgreSQL database. You have full manual control over database provisioning, migration execution, and credential management.

---

## Quickstart: Running PostgreSQL with Docker (Local Testing)

If you want to spin up a local PostgreSQL instance with `pgvector` installed:

```bash
docker run -d \
  --name codeatlas-postgres \
  -e POSTGRES_USER=codeatlas \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=codeatlas_db \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

---

## Executing the Schema Migration

Run the schema script against your PostgreSQL instance using `psql`:

```bash
psql -h localhost -p 5432 -U codeatlas -d codeatlas_db -f database/schema.sql
```

Or connect via your preferred database GUI (e.g., TablePlus, DBeaver, pgAdmin, Neon console, Supabase SQL editor) and execute `database/schema.sql`.

---

## Table Inventory

| Table Name | Description | Key Relationships |
|---|---|---|
| `users` | User identities & profiles | Primary identity entity |
| `auth_credentials` | PBKDF2 hashed password records & salt | 1-to-1 with `users` |
| `auth_otps` | 6-digit email verification & password reset codes | Short-lived security records |
| `connected_accounts` | GitHub & Google OAuth tokens and permissions | Scoped to `user_id` |
| `workspaces` | Multi-tenant team collaboration spaces | Owned by `users` |
| `workspace_members` | Role-based membership (`owner`, `admin`, `member`) | Links `workspaces` and `users` |
| `repositories` | Indexed repository metadata, branch, status, progress | Scoped to `user_id` |
| `indexing_jobs` | Background indexing lifecycle & progress logs | Scoped to `repository_id` |
| `repository_files` | Recursive file tree & cached source contents | Scoped to `repository_id` |
| `code_symbols` | AST parsed symbols (functions, classes, endpoints, tables) | Scoped to `repository_id` & `path` |
| `code_relationships` | Dependency & call graph edges (`calls`, `imports`, `tests`) | Inbound and outbound links |
| `code_chunks` | Bounded text chunks with 768-dim embeddings | Used for RAG retrieval |
| `ai_conversations` | Assistant chat sessions | Scoped to `user_id` & `repository_id` |
| `ai_messages` | Chat messages with verified AST citation metadata | Scoped to `conversation_id` |
| `code_annotations` | Team inline code comments and architectural decisions | Scoped to `repository_id` & line |
| `review_sessions` | AI Code Review session summaries & security findings | Scoped to `repository_id` & PR |
| `activity_events` | User audit log and activity timeline | Scoped to `user_id` |
| `notifications` | System & review alerts | Scoped to `user_id` |
| `user_settings` | User preferences (model, detail, theme, streaming) | 1-to-1 with `users` |

---

## Backend Environment Configuration

When you deploy your Node.js backend with PostgreSQL, provide this standard connection string:

```env
DATABASE_URL=postgresql://codeatlas:your_secure_password@localhost:5432/codeatlas_db?sslmode=prefer
```
