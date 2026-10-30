"""add hashed_password to users table

Revision ID: 20261027_02
Revises: 20261024_01
Create Date: 2026-10-27 21:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '20261027_02'
down_revision: Union[str, None] = '20261024_01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('hashed_password', sa.String(length=255), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('users', 'hashed_password')
