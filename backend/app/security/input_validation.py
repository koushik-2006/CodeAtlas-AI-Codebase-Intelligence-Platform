import os
from fastapi import HTTPException, status


def sanitize_file_path(path: str) -> str:
    """Ensure path cannot escape repository root or execute directory traversal."""
    cleaned = os.path.normpath(path).replace("\\", "/")
    if cleaned.startswith("../") or "/../" in cleaned or cleaned.startswith("/"):
        cleaned = cleaned.lstrip("/")
        if ".." in cleaned.split("/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file path: Directory traversal not permitted."
            )
    return cleaned
