from typing import Any, Dict, List
from app.repositories.interfaces import ISymbolRepository, ISourceFileRepository


class ImpactService:
    def __init__(self, symbol_repo: ISymbolRepository, source_repo: ISourceFileRepository):
        self.symbol_repo = symbol_repo
        self.source_repo = source_repo

    async def analyze_impact(
        self,
        project_id: str,
        file_path: str,
        changed_symbols: List[str] = [],
        diff_or_code: str = None
    ) -> Dict[str, Any]:
        """ChangeRadar: Assess blast radius and dependent components affected by a change."""
        relationships = await self.symbol_repo.get_relationships(project_id)
        affected = []

        # Find direct callers/importers of the changed symbols
        for sym_name in changed_symbols:
            for rel in relationships:
                if rel.get("target") == sym_name:
                    affected.append({
                        "file": rel.get("source_file", "unknown"),
                        "symbol_name": rel.get("source"),
                        "relationship": "caller",
                        "risk_level": "medium",
                        "reason": f"Directly invokes modified function `{sym_name}`."
                    })

        # If no specific symbol callers found, check files importing this path
        if not affected:
            files = await self.source_repo.list_files(project_id)
            module_name = file_path.replace(".py", "").replace("/", ".")
            for f in files:
                if f["path"] != file_path and module_name in f.get("content", ""):
                    affected.append({
                        "file": f["path"],
                        "symbol_name": None,
                        "relationship": "importer",
                        "risk_level": "low",
                        "reason": f"Imports module `{module_name}`."
                    })

        overall_risk = "high" if len(affected) > 5 else ("medium" if affected else "low")
        summary = (
            f"Modifying `{file_path}` affects {len(affected)} known downstream components. "
            f"Overall risk assessment: {overall_risk.upper()}."
        )

        return {
            "summary": summary,
            "overall_risk": overall_risk,
            "affected_components": affected,
            "recommended_checks": [
                f"Run regression tests on {affected[0]['file']}" if affected else "Run unit test suite",
                "Verify return type contracts",
                "Review backwards compatibility for API callers"
            ]
        }
