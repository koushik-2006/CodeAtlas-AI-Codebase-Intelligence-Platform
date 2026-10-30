import time
from typing import Optional
import jwt


class GitHubAppAuth:
    """Provides JWT signing for GitHub Apps integration."""

    @staticmethod
    def create_jwt(app_id: str, private_key_pem: str) -> str:
        now = int(time.time())
        payload = {
            "iat": now - 60,
            "exp": now + (10 * 60),  # 10 minute maximum expiration
            "iss": app_id
        }
        return jwt.encode(payload, private_key_pem, algorithm="RS256")
