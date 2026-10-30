-- =============================================================================
-- CodeAtlas - Production PostgreSQL Database Schema
-- Version: 1.0.0
-- Target: PostgreSQL 14+ (Compatible with Amazon RDS, Supabase, Neon, Railway, Self-Hosted)
--
-- NOTE:
-- This schema file is provided for Member 2 to execute and manage manually.
-- CodeAtlas does NOT connect to, modify, or automatically run migrations against
-- your production database.
-- =============================================================================

-- Optional: Enable UUID extension if using gen_random_uuid() (standard in PG 13+)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional: Enable pgvector extension for native semantic vector search (if installed)
-- If your PostgreSQL instance does not support pgvector, comment out this line and
-- the embedding vector column in code_chunks will fall back to JSONB or text.
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- 1. USERS & AUTHENTICATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    role VARCHAR(100) DEFAULT 'Developer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_credentials (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    salt VARCHAR(128) NOT NULL,
    hash VARCHAR(256) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_otps (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(16) NOT NULL,
    purpose VARCHAR(32) NOT NULL, -- 'verification' | 'password_reset'
    expires_at BIGINT NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_otps_email_purpose ON auth_otps(email, purpose);

-- Connected OAuth accounts (GitHub, Google)
CREATE TABLE IF NOT EXISTS connected_accounts (
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL, -- 'github' | 'google'
    username VARCHAR(255) NOT NULL,
    avatar TEXT,
    access_token TEXT NOT NULL, -- Server-only token; encrypted at rest
    scopes TEXT[] NOT NULL DEFAULT '{}',
    connected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    installation_id VARCHAR(128),
    display_name VARCHAR(255),
    profile_url TEXT,
    public_repo_count INT DEFAULT 0,
    total_private_repos INT DEFAULT 0,
    provider_user_id VARCHAR(128),
    PRIMARY KEY (user_id, provider)
);

-- =============================================================================
-- 2. WORKSPACES & MULTI-TENANCY
-- =============================================================================

CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    plan VARCHAR(64) DEFAULT 'pro',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspace_members (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'member', -- 'owner' | 'admin' | 'member' | 'viewer'
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS workspace_invitations (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'member',
    token VARCHAR(128) NOT NULL UNIQUE,
    invited_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL
);

-- =============================================================================
-- 3. REPOSITORIES & INDEXING
-- =============================================================================

CREATE TABLE IF NOT EXISTS repositories (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    description TEXT,
    visibility VARCHAR(16) NOT NULL DEFAULT 'public', -- 'public' | 'private'
    language VARCHAR(64) DEFAULT 'TypeScript',
    default_branch VARCHAR(128) DEFAULT 'main',
    url TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending' | 'indexing' | 'ready' | 'error'
    progress INT NOT NULL DEFAULT 0,
    current_stage VARCHAR(255),
    symbol_count INT NOT NULL DEFAULT 0,
    file_count INT NOT NULL DEFAULT 0,
    last_analyzed VARCHAR(128),
    error TEXT,
    is_indexed BOOLEAN NOT NULL DEFAULT FALSE,
    connection_type VARCHAR(32) NOT NULL DEFAULT 'github', -- 'github' | 'sample' | 'zip' | 'git_url'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);

CREATE TABLE IF NOT EXISTS workspace_repositories (
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    repository_id VARCHAR(128) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workspace_id, repository_id)
);

CREATE TABLE IF NOT EXISTS indexing_jobs (
    id VARCHAR(128) PRIMARY KEY,
    repository_id VARCHAR(128) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending' | 'fetching' | 'parsing' | 'indexing' | 'completed' | 'failed'
    progress INT NOT NULL DEFAULT 0,
    stage VARCHAR(255),
    file_count INT NOT NULL DEFAULT 0,
    total_files INT NOT NULL DEFAULT 0,
    error TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_indexing_jobs_repo ON indexing_jobs(repository_id);

-- Discovered & ingested files
CREATE TABLE IF NOT EXISTS repository_files (
    id VARCHAR(256) PRIMARY KEY,
    repository_id VARCHAR(128) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    language VARCHAR(64),
    size INT NOT NULL DEFAULT 0,
    content TEXT,
    line_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (repository_id, path)
);

CREATE INDEX IF NOT EXISTS idx_repo_files_repo ON repository_files(repository_id);
CREATE INDEX IF NOT EXISTS idx_repo_files_path ON repository_files(repository_id, path);

-- =============================================================================
-- 4. CODE SYMBOLS & RELATIONSHIPS (AST GRAPH)
-- =============================================================================

CREATE TABLE IF NOT EXISTS code_symbols (
    id VARCHAR(256) PRIMARY KEY,
    repository_id VARCHAR(128) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL, -- 'function' | 'class' | 'endpoint' | 'service' | 'test' | 'table'
    start_line INT NOT NULL,
    end_line INT NOT NULL,
    parameters TEXT[] DEFAULT '{}',
    scope VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_code_symbols_repo ON code_symbols(repository_id);
CREATE INDEX IF NOT EXISTS idx_code_symbols_name ON code_symbols(repository_id, name);
CREATE INDEX IF NOT EXISTS idx_code_symbols_file ON code_symbols(repository_id, file_path);

CREATE TABLE IF NOT EXISTS code_relationships (
    id VARCHAR(256) PRIMARY KEY,
    repository_id VARCHAR(128) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    from_symbol_id VARCHAR(256) NOT NULL,
    from_symbol_name VARCHAR(255) NOT NULL,
    to_symbol_id VARCHAR(256) NOT NULL,
    to_symbol_name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL -- 'calls' | 'imports' | 'queries' | 'tests'
);

CREATE INDEX IF NOT EXISTS idx_relationships_repo ON code_relationships(repository_id);
CREATE INDEX IF NOT EXISTS idx_relationships_from ON code_relationships(repository_id, from_symbol_name);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON code_relationships(repository_id, to_symbol_name);

-- Chunked content for RAG & semantic search
CREATE TABLE IF NOT EXISTS code_chunks (
    id VARCHAR(256) PRIMARY KEY,
    repository_id VARCHAR(128) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    content TEXT NOT NULL,
    start_line INT NOT NULL,
    end_line INT NOT NULL,
    -- 768 dimensions for Google Gemini text-embedding-004
    embedding vector(768),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_code_chunks_repo ON code_chunks(repository_id);

-- Optional HNSW index for high-speed approximate nearest neighbor vector search
-- CREATE INDEX IF NOT EXISTS idx_code_chunks_embedding ON code_chunks USING hnsw (embedding vector_cosine_ops);

-- =============================================================================
-- 5. AI CONVERSATIONS & EVIDENCE-GROUNDED MESSAGES
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id VARCHAR(128) REFERENCES repositories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);

CREATE TABLE IF NOT EXISTS ai_messages (
    id VARCHAR(128) PRIMARY KEY,
    conversation_id VARCHAR(128) NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(16) NOT NULL, -- 'user' | 'ai'
    text TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    confirmed_facts JSONB DEFAULT '[]'::jsonb,
    inferred_facts JSONB DEFAULT '[]'::jsonb,
    model VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_convo ON ai_messages(conversation_id);

-- =============================================================================
-- 6. CODE REVIEWS, ANNOTATIONS & COLLABORATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS code_annotations (
    id VARCHAR(128) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    repository_id VARCHAR(128) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    start_line INT NOT NULL,
    end_line INT NOT NULL,
    symbol_name VARCHAR(255),
    content TEXT NOT NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'decision', -- 'decision' | 'architecture' | 'debt'
    author_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255),
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_code_annotations_repo ON code_annotations(repository_id);

CREATE TABLE IF NOT EXISTS review_sessions (
    id VARCHAR(128) PRIMARY KEY,
    repository_id VARCHAR(128) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    pull_request_id VARCHAR(128),
    pull_request_number INT,
    commit_sha VARCHAR(64),
    summary TEXT,
    findings JSONB DEFAULT '[]'::jsonb,
    affected_components JSONB DEFAULT '[]'::jsonb,
    related_tests JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_sessions_repo ON review_sessions(repository_id);

-- =============================================================================
-- 7. NOTIFICATIONS, ACTIVITY & USER SETTINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS activity_events (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id VARCHAR(128),
    repository_name VARCHAR(255),
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'info',
    href TEXT,
    link_text VARCHAR(128),
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_events_user ON activity_events(user_id);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    type VARCHAR(32) NOT NULL,
    href TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    explanation_style VARCHAR(32) DEFAULT 'detailed',
    response_detail VARCHAR(32) DEFAULT 'standard',
    default_repo_context VARCHAR(128),
    preferred_model VARCHAR(64) DEFAULT 'gemini-1.5-flash',
    use_streaming BOOLEAN DEFAULT TRUE,
    show_line_numbers BOOLEAN DEFAULT TRUE,
    reduced_motion BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- AUTOMATED TIMESTAMPS TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_repositories_updated_at BEFORE UPDATE ON repositories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_code_annotations_updated_at BEFORE UPDATE ON code_annotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
