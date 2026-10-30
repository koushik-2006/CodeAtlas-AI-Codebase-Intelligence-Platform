from fastapi import HTTPException, status
from typing import Any, Dict


def check_resource_ownership(user_id: str, resource_owner_id: str, resource_name: str = "Resource") -> None:
    """Enforce that the requesting user owns the requested resource."""
    if user_id != resource_owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: You do not have permission to access this {resource_name.lower()}."
        )
