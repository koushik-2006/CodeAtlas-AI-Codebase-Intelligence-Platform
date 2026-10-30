from typing import Any, Dict, List, Optional
from app.repositories.interfaces import ISourceFileRepository, ISymbolRepository


class TestDiscoveryService:
    def __init__(self, source_repo: ISourceFileRepository, symbol_repo: ISymbolRepository):
        self.source_repo = source_repo
        self.symbol_repo = symbol_repo

    async def discover_tests(self, project_id: str, target_file: Optional[str] = None) -> Dict[str, Any]:
        """TestPilot: Locate test files, test methods, and untested areas without mock percentage claims."""
        files = await self.source_repo.list_files(project_id)
        test_files = [f for f in files if "test" in f["path"].lower()]
        app_files = [f for f in files if "test" not in f["path"].lower()]

        test_cases = []
        for tf in test_files:
            content = tf.get("content", "")
            lines = content.split("\n")
            for line in lines:
                if "def test_" in line or "it(" in line or "test(" in line:
                    test_name = line.split("(")[0].replace("def ", "").strip()
                    test_cases.append({
                        "test_file": tf["path"],
                        "test_name": test_name,
                        "targets": [target_file] if target_file else []
                    })

        # Untested candidate areas
        tested_stems = {tf["path"].split("/")[-1].replace("test_", "").replace(".py", "") for tf in test_files}
        untested_areas = []
        for af in app_files:
            stem = af["path"].split("/")[-1].replace(".py", "")
            if stem not in tested_stems:
                untested_areas.append(af["path"])

        suggested = [
            f"Add unit test for {untested_areas[0]}" if untested_areas else "Maintain test suite",
            "Add edge cases testing invalid input parameters",
            "Add integration test verifying API endpoint contracts"
        ]

        return {
            "repository_id": project_id,
            "total_test_files": len(test_files),
            "test_cases": test_cases,
            "untested_areas": untested_areas[:10],
            "suggested_tests": suggested
        }
