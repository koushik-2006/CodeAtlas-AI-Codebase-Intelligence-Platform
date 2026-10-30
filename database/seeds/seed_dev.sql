-- =============================================================================
-- CodeAtlas - Development Seed Data
-- =============================================================================
-- Use this file to populate a local development or staging PostgreSQL database
-- with initial test accounts, sample repositories, architectures, and analysis.
-- =============================================================================

-- 1. Insert Initial Development Users
INSERT INTO users (id, email, name, avatar, role, created_at, updated_at)
VALUES 
    (
        'usr_default',
        'koushik@codeatlas.dev',
        'Koushik (CodeAtlas Lead)',
        'https://avatars.githubusercontent.com/u/9919?v=4',
        'Lead Architect',
        NOW(),
        NOW()
    ),
    (
        'usr_gh_sandbox_dev',
        'github.developer@codeatlas.dev',
        'GitHub Developer (Sandbox)',
        'https://avatars.githubusercontent.com/u/9919?v=4',
        'Software Engineer',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Default Connected Accounts
INSERT INTO connected_accounts (user_id, provider, username, display_name, avatar, profile_url, public_repo_count, total_private_repos, scopes, connected_at)
VALUES
    (
        'usr_default',
        'github',
        'koushik-2006',
        'Koushik',
        'https://avatars.githubusercontent.com/u/9919?v=4',
        'https://github.com/koushik-2006',
        18,
        5,
        '["repo", "read:user", "user:email"]'::jsonb,
        NOW()
    )
ON CONFLICT DO NOTHING;

-- 3. Insert Sample Repositories for Local Exploration
INSERT INTO repositories (id, user_id, name, full_name, owner, default_branch, is_private, language, stars_count, description, status, created_at, updated_at)
VALUES
    (
        'repo_sample_codeatlas',
        'usr_default',
        'CodeAtlas-AI-Codebase-Intelligence-Platform',
        'koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform',
        'koushik-2006',
        'main',
        FALSE,
        'TypeScript',
        42,
        'AI-Powered Codebase Intelligence and Architectural Visualization Platform',
        'ready',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

