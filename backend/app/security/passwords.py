"""Password hashing and verification using modern bcrypt."""
from typing import Optional
import bcrypt


def hash_password(plain_password: str) -> str:
    """Hash a plain text password using bcrypt with 12 rounds of salt.
    
    Never stores or logs plain text passwords.
    """
    if not plain_password or len(plain_password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    
    password_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Verify a plain text password against a stored bcrypt hash.
    
    Returns False safely if the stored hash is None (e.g. Google-only user),
    empty, or malformed.
    """
    if not plain_password or not hashed_password:
        return False
    
    try:
        password_bytes = plain_password.encode("utf-8")
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False
