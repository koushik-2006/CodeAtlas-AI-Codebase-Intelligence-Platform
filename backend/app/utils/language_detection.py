import os
from typing import Optional

EXTENSION_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".java": "java",
    ".cpp": "cpp",
    ".c": "c",
    ".h": "c",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".go": "go",
    ".rs": "rust",
    ".php": "php",
    ".rb": "ruby",
    ".html": "html",
    ".css": "css",
    ".sql": "sql",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".md": "markdown",
    ".sh": "bash",
}


def detect_language_by_filename(filename: str) -> str:
    """Infer language based on file extension."""
    _, ext = os.path.splitext(filename.lower())
    return EXTENSION_MAP.get(ext, "text")


def detect_language_from_code(code: str) -> str:
    """Heuristic detection of code snippet language."""
    trimmed = code.strip()
    if trimmed.startswith("def ") or "import " in trimmed or "print(" in trimmed:
        if ":" in trimmed and "{" not in trimmed:
            return "python"
    if "function" in trimmed or "const " in trimmed or "let " in trimmed or "console.log" in trimmed:
        return "javascript"
    if "interface " in trimmed or "type " in trimmed or ": string" in trimmed:
        return "typescript"
    if "public class " in trimmed or "System.out.println" in trimmed:
        return "java"
    if "package main" in trimmed or "func " in trimmed:
        return "go"
    if "fn main()" in trimmed or "impl " in trimmed:
        return "rust"
    if "#include <" in trimmed:
        return "cpp"
    return "python"
