import { MAIN_NAVIGATION } from "../../lib/navigation";

export function testNavigation() {
  const hrefs = MAIN_NAVIGATION.map((item) => item.href);
  const required = [
    "/dashboard",
    "/workspaces",
    "/repositories",
    "/multi-repo",
    "/agents",
    "/visual-explorer",
    "/assistant",
    "/debug",
    "/refactoring",
    "/architecture",
    "/change-impact",
    "/code-review",
    "/activity",
    "/system-health",
    "/settings",
  ];

  for (const r of required) {
    console.assert(hrefs.includes(r), `Should include ${r}`);
  }

  const uniqueHrefs = new Set(hrefs);
  console.assert(uniqueHrefs.size === hrefs.length, "Navigation hrefs should be unique");
  console.assert(hrefs.length === 15, `Expected 15 navigation items, got ${hrefs.length}`);
}
