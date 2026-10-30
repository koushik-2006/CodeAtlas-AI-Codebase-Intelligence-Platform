import os


def normalize_repo_path(raw_path: str) -> str:
    """Normalize path to forward slashes without leading/trailing slashes."""
    cleaned = raw_path.strip().replace("\\", "/")
    return cleaned.strip("/")


def get_parent_directory(path: str) -> str:
    """Get the parent folder name."""
    parts = normalize_repo_path(path).split("/")
    if len(parts) > 1:
        return "/".join(parts[:-1])
    return ""
