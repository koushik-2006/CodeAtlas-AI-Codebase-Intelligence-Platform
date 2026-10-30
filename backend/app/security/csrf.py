import secrets
import time
from typing import Dict

# Simple in-memory state tracker for OAuth CSRF protection with TTL
_oauth_states: Dict[str, float] = {}
STATE_TTL_SECONDS = 600  # 10 minutes


def generate_oauth_state() -> str:
    """Generate a cryptographically secure random state token."""
    state = secrets.token_urlsafe(32)
    _oauth_states[state] = time.time() + STATE_TTL_SECONDS
    return state


def validate_oauth_state(state: str) -> bool:
    """Verify state token and invalidate it immediately (one-time use)."""
    if not state:
        return False
    expires_at = _oauth_states.pop(state, None)
    if expires_at and time.time() < expires_at:
        return True
    return False
