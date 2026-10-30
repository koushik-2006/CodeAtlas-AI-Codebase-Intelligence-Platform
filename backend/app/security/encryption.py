import base64
import hashlib
from typing import Optional
from cryptography.fernet import Fernet
from app.config import settings


def _get_cipher() -> Fernet:
    """Generate a consistent Fernet key derived from settings.SECRET_KEY."""
    derived_key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    b64_key = base64.urlsafe_b64encode(derived_key)
    return Fernet(b64_key)


def encrypt_token(plain_token: Optional[str]) -> Optional[str]:
    """Encrypt a secret token (e.g. GitHub OAuth token) for safe storage."""
    if not plain_token:
        return None
    cipher = _get_cipher()
    return cipher.encrypt(plain_token.encode()).decode()


def decrypt_token(encrypted_token: Optional[str]) -> Optional[str]:
    """Decrypt an encrypted secret token."""
    if not encrypted_token:
        return None
    try:
        cipher = _get_cipher()
        return cipher.decrypt(encrypted_token.encode()).decode()
    except Exception:
        return None
