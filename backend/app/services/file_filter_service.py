from typing import List, Dict, Any
from app.utils.file_limits import should_ignore_path, is_file_size_permitted


class FileFilterService:
    """Filters repository files to eliminate noise, vendor dirs, binaries, and oversized files."""

    def filter_tree(self, tree: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        filtered = []
        for item in tree:
            path = item.get("path", "")
            size = item.get("size", 0)
            if not should_ignore_path(path) and is_file_size_permitted(size):
                filtered.append(item)
        return filtered

    def build_nested_tree(self, files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Converts flat file paths into a nested directory tree suitable for frontend renderers."""
        root: Dict[str, Any] = {"children": {}}

        for f in files:
            parts = f["path"].split("/")
            curr = root
            for idx, part in enumerate(parts):
                is_file = idx == len(parts) - 1
                if part not in curr["children"]:
                    curr["children"][part] = {
                        "name": part,
                        "path": "/".join(parts[: idx + 1]),
                        "type": "file" if is_file else "dir",
                        "size": f.get("size") if is_file else None,
                        "children": {} if not is_file else None,
                    }
                curr = curr["children"][part]

        def format_node(node_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
            res = []
            for child in node_dict.get("children", {}).values():
                item = {
                    "name": child["name"],
                    "path": child["path"],
                    "type": child["type"],
                    "size": child.get("size"),
                }
                if child["type"] == "dir" and child.get("children") is not None:
                    item["children"] = format_node(child)
                res.append(item)
            return sorted(res, key=lambda x: (x["type"] == "file", x["name"]))

        return format_node(root)


file_filter_service = FileFilterService()
