import ast
import re
from typing import Any, Dict, List
from app.parsers.base import BaseParser


class UniversalCodeParser(BaseParser):
    """Robust multi-language code parser using AST for Python and structural parsing for JS/TS/Go/Java."""

    def parse_symbols(self, code: str, file_path: str = "") -> List[Dict[str, Any]]:
        symbols: List[Dict[str, Any]] = []

        if file_path.endswith(".py"):
            try:
                tree = ast.parse(code)
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                        # Determine if method or function
                        doc = ast.get_docstring(node)
                        args = [a.arg for a in node.args.args]
                        sig = f"def {node.name}({', '.join(args)})"
                        symbols.append({
                            "name": node.name,
                            "symbol_type": "function",
                            "start_line": node.lineno,
                            "end_line": getattr(node, "end_lineno", node.lineno),
                            "docstring": doc,
                            "signature": sig,
                            "file_path": file_path
                        })
                    elif isinstance(node, ast.ClassDef):
                        doc = ast.get_docstring(node)
                        bases = [b.id for b in node.bases if isinstance(b, ast.Name)]
                        sig = f"class {node.name}({', '.join(bases)})"
                        symbols.append({
                            "name": node.name,
                            "symbol_type": "class",
                            "start_line": node.lineno,
                            "end_line": getattr(node, "end_lineno", node.lineno),
                            "docstring": doc,
                            "signature": sig,
                            "file_path": file_path
                        })
                return symbols
            except Exception:
                pass  # Fall back to regex parsing on syntax errors

        # Pattern-based parsing for JS/TS/Python fallback/Java
        lines = code.split("\n")
        fn_pattern = re.compile(r"^\s*(?:async\s+)?(?:def|function|\bconst\b\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|\b\w+\s*\([^)]*\)\s*\{)")
        class_pattern = re.compile(r"^\s*(?:class|interface|type)\s+([A-Za-z0-9_]+)")

        for idx, line in enumerate(lines, start=1):
            class_match = class_pattern.search(line)
            if class_match:
                name = class_match.group(1)
                symbols.append({
                    "name": name,
                    "symbol_type": "class",
                    "start_line": idx,
                    "end_line": min(idx + 15, len(lines)),
                    "signature": line.strip(),
                    "file_path": file_path
                })
                continue

            if "def " in line or "function " in line:
                parts = line.strip().split("(")
                if parts:
                    name_part = parts[0].replace("def ", "").replace("function ", "").replace("async ", "").strip()
                    if name_part.isidentifier():
                        symbols.append({
                            "name": name_part,
                            "symbol_type": "function",
                            "start_line": idx,
                            "end_line": min(idx + 10, len(lines)),
                            "signature": line.strip(),
                            "file_path": file_path
                        })

        return symbols

    def extract_dependencies(self, code: str) -> List[str]:
        deps: List[str] = []
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        deps.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        deps.append(node.module)
            return list(set(deps))
        except Exception:
            pass

        # Regex fallback for imports (JS/TS/Python)
        for line in code.split("\n"):
            line = line.strip()
            if line.startswith("import ") or line.startswith("from "):
                deps.append(line)
            elif "require(" in line:
                deps.append(line)
        return deps
