"""create CodeAtlas database schema

Revision ID: 20261024_01
Revises: 
Create Date: 2026-10-24 10:30:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from app.database.types import GUID, JSONType

revision: str = '20261024_01'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('display_name', sa.String(length=255), nullable=True),
        sa.Column('avatar_url', sa.String(length=512), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. connected_accounts
    op.create_table(
        'connected_accounts',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('user_id', GUID(), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('provider_user_id', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=255), nullable=True),
        sa.Column('avatar_url', sa.String(length=512), nullable=True),
        sa.Column('access_token_encrypted', sa.Text(), nullable=True),
        sa.Column('refresh_token_encrypted', sa.Text(), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('provider', 'provider_user_id', name='uq_connected_accounts_provider_user')
    )
    op.create_index('ix_connected_accounts_user_id', 'connected_accounts', ['user_id'])

    # 3. repositories
    op.create_table(
        'repositories',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('user_id', GUID(), nullable=False),
        sa.Column('github_repository_id', sa.BigInteger(), nullable=True),
        sa.Column('owner', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=512), nullable=False),
        sa.Column('default_branch', sa.String(length=100), nullable=False, server_default='main'),
        sa.Column('is_private', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_repositories_user_id', 'repositories', ['user_id'])
    op.create_index('ix_repositories_full_name', 'repositories', ['full_name'])
    op.create_index('ix_repositories_github_id', 'repositories', ['github_repository_id'])

    # 4. repository_indexes
    op.create_table(
        'repository_indexes',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('repository_id', GUID(), nullable=False),
        sa.Column('commit_sha', sa.String(length=40), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='unindexed'),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['repository_id'], ['repositories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_repository_indexes_repository_id', 'repository_indexes', ['repository_id'])

    # 5. source_files
    op.create_table(
        'source_files',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('repository_index_id', GUID(), nullable=False),
        sa.Column('path', sa.String(length=512), nullable=False),
        sa.Column('language', sa.String(length=50), nullable=False, server_default='text'),
        sa.Column('content_hash', sa.String(length=64), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('size_bytes', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['repository_index_id'], ['repository_indexes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('repository_index_id', 'path', name='uq_source_files_index_path')
    )
    op.create_index('ix_source_files_index_id', 'source_files', ['repository_index_id'])
    op.create_index('ix_source_files_path', 'source_files', ['path'])

    # 6. code_symbols
    op.create_table(
        'code_symbols',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('source_file_id', GUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('qualified_name', sa.String(length=512), nullable=True),
        sa.Column('symbol_type', sa.String(length=50), nullable=False),
        sa.Column('start_line', sa.Integer(), nullable=False),
        sa.Column('end_line', sa.Integer(), nullable=False),
        sa.Column('signature', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['source_file_id'], ['source_files.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_code_symbols_file_id', 'code_symbols', ['source_file_id'])
    op.create_index('ix_code_symbols_name', 'code_symbols', ['name'])

    # 7. code_relationships
    op.create_table(
        'code_relationships',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('repository_index_id', GUID(), nullable=False),
        sa.Column('source_symbol_id', GUID(), nullable=False),
        sa.Column('target_symbol_id', GUID(), nullable=True),
        sa.Column('relationship_type', sa.String(length=50), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False, server_default='1.0'),
        sa.ForeignKeyConstraint(['repository_index_id'], ['repository_indexes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_symbol_id'], ['code_symbols.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_symbol_id'], ['code_symbols.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_code_relationships_index_id', 'code_relationships', ['repository_index_id'])

    # 8. code_chunks
    op.create_table(
        'code_chunks',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('source_file_id', GUID(), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('start_line', sa.Integer(), nullable=False),
        sa.Column('end_line', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('embedding', JSONType(), nullable=True),
        sa.ForeignKeyConstraint(['source_file_id'], ['source_files.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_code_chunks_file_id', 'code_chunks', ['source_file_id'])

    # 9. analysis_jobs
    op.create_table(
        'analysis_jobs',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('user_id', GUID(), nullable=False),
        sa.Column('repository_id', GUID(), nullable=True),
        sa.Column('job_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('progress', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('result_reference', sa.String(length=512), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['repository_id'], ['repositories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_analysis_jobs_user_id', 'analysis_jobs', ['user_id'])

    # 10. saved_analyses
    op.create_table(
        'saved_analyses',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('user_id', GUID(), nullable=False),
        sa.Column('repository_id', GUID(), nullable=True),
        sa.Column('analysis_type', sa.String(length=50), nullable=False),
        sa.Column('input_data', JSONType(), nullable=True),
        sa.Column('result_data', JSONType(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['repository_id'], ['repositories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_saved_analyses_user_id', 'saved_analyses', ['user_id'])

    # 11. chat_sessions & chat_messages
    op.create_table(
        'chat_sessions',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('user_id', GUID(), nullable=False),
        sa.Column('repository_id', GUID(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False, server_default='Codebase Conversation'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['repository_id'], ['repositories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_chat_sessions_user_id', 'chat_sessions', ['user_id'])

    op.create_table(
        'chat_messages',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('session_id', GUID(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_chat_messages_session_id', 'chat_messages', ['session_id'])

    # 12. user_notes
    op.create_table(
        'user_notes',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('user_id', GUID(), nullable=False),
        sa.Column('repository_id', GUID(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['repository_id'], ['repositories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_notes_user_id', 'user_notes', ['user_id'])


def downgrade() -> None:
    op.drop_table('user_notes')
    op.drop_table('chat_messages')
    op.drop_table('chat_sessions')
    op.drop_table('saved_analyses')
    op.drop_table('analysis_jobs')
    op.drop_table('code_chunks')
    op.drop_table('code_relationships')
    op.drop_table('code_symbols')
    op.drop_table('source_files')
    op.drop_table('repository_indexes')
    op.drop_table('repositories')
    op.drop_table('connected_accounts')
    op.drop_table('users')
