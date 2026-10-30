import os
import re

out_dir = "out"
patterns = [
    ("Gemini / Google API Key", re.compile(r"AIzaSy[0-9A-Za-z_-]{33}")),
    ("GitHub Personal Access Token", re.compile(r"ghp_[0-9A-Za-z]{36}")),
    ("GitHub Fine-Grained PAT", re.compile(r"github_pat_[0-9A-Za-z_]{82}")),
    ("PostgreSQL URL with Password", re.compile(r"postgres(?:ql)?://[^:]+:[^@]+@[^\s\"\']+")),
    ("Google Client Secret", re.compile(r"GOCSPX-[0-9A-Za-z_-]{28}")),
]

matches_found = []
file_count = 0

for root, dirs, files in os.walk(out_dir):
    for f in files:
        if f.endswith((".html", ".js", ".css", ".json", ".txt", ".xml")):
            file_count += 1
            file_path = os.path.join(root, f)
            with open(file_path, "r", encoding="utf-8", errors="ignore") as fp:
                content = fp.read()
                for label, pat in patterns:
                    m = pat.findall(content)
                    if m:
                        matches_found.append((file_path, label, m))

print(f"Scanned {file_count} static asset files in '{out_dir}'.")
if matches_found:
    print("WARNING: Secrets detected!")
    for file_path, label, m in matches_found:
        print(f"  {file_path} [{label}]: {m}")
    exit(1)
else:
    print("SUCCESS: 0 secrets found across all static files in out/!")

