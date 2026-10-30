from typing import List
from app.config import settings

IGNORED_DIRECTORIES = {
    ".git",
    ".github",
    ".venv",
    "venv",
    "node_modules",
    "__pycache__",
    ".idea",
    ".vscode",
    "build",
    "dist",
    "target",
    "vendor",
    "coverage",
}

IGNORED_EXTENSIONS = {
    ".pyc",
    ".pyo",
    ".pyd",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".svg",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".7z",
    ".rar",
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".class",
    ".jar",
    ".war",
    ".lock",
    ".min.js",
    ".min.css",
    ".map",
}


def should_ignore_path(path: str) -> bool:
    """Check if file path should be ignored during indexing."""
    parts = path.replace("\\", "/").split("/")
    for part in parts:
        if part in IGNORED_DIRECTORIES:
            return True

    filename = parts[-1]
    for ext in IGNORED_EXTENSIONS:
        if filename.endswith(ext):
            return True

    return False


def is_file_size_permitted(size_bytes: int) -> bool:
    """Check if file size is within safety limits."""
    return size_bytes <= settings.MAX_FILE_SIZE_BYTES
