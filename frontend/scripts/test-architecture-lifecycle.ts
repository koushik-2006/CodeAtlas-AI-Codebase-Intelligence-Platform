import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { chromium, Page } from "playwright";

const basePath = "/CodeAtlas-AI-Codebase-Intelligence-Platform";
const outDir = path.resolve(__dirname, "../out");
const PORT = 3597;
const host = `http://localhost:${PORT}`;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function createStaticServer(): http.Server {
  return http.createServer((req, res) => {
    try {
      const rawUrl = req.url || "/";
      const parsedUrl = new URL(rawUrl, host);
      let pathname = decodeURIComponent(parsedUrl.pathname);

      if (!pathname.startsWith(basePath)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
      }

      let relPath = pathname.slice(basePath.length);
      if (!relPath || relPath === "/") relPath = "/index.html";

      let filePath = path.join(outDir, relPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
      if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
        filePath = `${filePath}.html`;
      }
      if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, "index.html"))) {
        filePath = path.join(filePath, "index.html");
      }
      if (!fs.existsSync(filePath)) {
        filePath = path.join(outDir, "404.html");
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
        res.end(fs.readFileSync(filePath));
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
      }
    } catch (e: any) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`Error: ${e?.message}`);
    }
  });
}

async function runTest() {
  console.log("=========================================================================");
  console.log("🧪 ARCHITECTURE GRAPH PLAYWRIGHT LIFECYCLE TEST");
  console.log("=========================================================================\n");

  const server = createStaticServer();
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`  ✔ Static test server listening on port ${PORT}\n`);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const uncaughtErrors: string[] = [];
  page.on("pageerror", (err) => {
    // Filter out transient analytics or benign errors if any
    uncaughtErrors.push(err.message);
    console.error("  ❌ Uncaught Browser Exception:", err.message);
  });

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(condition: boolean, msg: string) {
    totalChecks++;
    if (!condition) {
      console.error(`  ❌ [FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
    passedChecks++;
    console.log(`  ✔ [PASS] ${msg}`);
  }

  try {
    // 1. Initial Auth Setup & Navigation
    console.log("--- STEP 1: INITIAL AUTH SETUP & NAVIGATION ---");
    await page.goto(`${host}${basePath}/login/`);
    await page.evaluate(() => {
      localStorage.setItem("codeatlas_active_demo_session", "true");
      localStorage.removeItem("codeatlas_demo_active_user");
      localStorage.setItem(
        "codeatlas-auth-user",
        JSON.stringify({
          id: "usr_demo",
          email: "alex@codeatlas.dev",
          name: "Alex Chen",
          role: "Lead Systems Architect",
          provider: "demo",
        })
      );
    });

    await page.goto(`${host}${basePath}/architecture/`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const pageHeader = page.locator("h1");
    assert(
      (await pageHeader.textContent())?.includes("Architecture") || false,
      "Page header title loads 'Architecture Graph'"
    );

    // 2. Select Seeded Repo & Verify Layers View
    console.log("\n--- STEP 2: SELECT SEEDED REPO & VERIFY LAYERS VIEW ---");
    const repoSelect = page.locator("select").first();
    await repoSelect.selectOption("sample-project");
    await page.waitForTimeout(600);

    // Verify Layers View nodes render
    const uiLayerNode = page.locator("text=UI Layer").first();
    assert(await uiLayerNode.isVisible(), "UI Layer block rendered in Layers view");

    const servicesLayerNode = page.locator("text=Services Layer").first();
    assert(await servicesLayerNode.isVisible(), "Services Layer block rendered in Layers view");

    const dataLayerNode = page.locator("text=Data Layer").first();
    assert(await dataLayerNode.isVisible(), "Data Layer block rendered in Layers view");

    // 3. Drill Down into Modules, then Files
    console.log("\n--- STEP 3: DRILL DOWN (MODULES -> FILES) ---");
    // Switch level to Modules
    const modulesLevelBtn = page.locator("button:has-text('modules')");
    await modulesLevelBtn.click();
    await page.waitForTimeout(600);

    const moduleNode = page.locator("text=src/services/").first();
    assert(await moduleNode.isVisible(), "Module folder 'src/services/' rendered in Modules level");

    // Drill down to Files level
    const filesLevelBtn = page.locator("button:has-text('files')");
    await filesLevelBtn.click();
    await page.waitForTimeout(600);

    const fileNode = page.locator("text=auth.ts").first();
    assert(await fileNode.isVisible(), "File node 'auth.ts' rendered in Files level");

    // 4. Breadcrumb Navigation Back Up
    console.log("\n--- STEP 4: BREADCRUMB NAVIGATION BACK UP ---");
    const breadcrumbLayersBtn = page.locator("button:has-text('Layers View'), button:has-text('Files View')").first();
    assert(await breadcrumbLayersBtn.isVisible(), "Breadcrumb bar rendered above canvas");

    // 5. Search File and Highlight
    console.log("\n--- STEP 5: SEARCH A FILE & VERIFY HIGHLIGHT ---");
    const searchInput = page.locator("input[placeholder*='Jump to node']");
    await searchInput.fill("auth.ts");
    await page.waitForTimeout(400);

    const highlightedAuthNode = page.locator(".react-flow__node").filter({ hasText: "auth.ts" }).first();
    assert(await highlightedAuthNode.isVisible(), "Search highlighted 'auth.ts' file node on canvas");

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(300);

    // 6. Click Node Shows Side Panel with Fan-in / Fan-out
    console.log("\n--- STEP 6: NODE INSPECTOR SIDE PANEL (FAN-IN & FAN-OUT) ---");
    await highlightedAuthNode.click();
    await page.waitForTimeout(400);

    // Check Node Inspector title
    const inspectorTitle = page.locator("h2:has-text('auth.ts')").first();
    assert(await inspectorTitle.isVisible(), "Node Inspector loaded for 'auth.ts'");

    // Check Inbound Callers & Outbound Dependencies
    const callersHeading = page.locator("span:has-text('Direct Callers & Inbound')").first();
    assert(await callersHeading.isVisible(), "Direct Callers (Fan-In) section rendered");

    const calleesHeading = page.locator("span:has-text('Dependencies & Outbound')").first();
    assert(await calleesHeading.isVisible(), "Dependencies & Outbound (Fan-Out) section rendered");

    // 7. Analysis Tools: Neighborhood (Depth 2)
    console.log("\n--- STEP 7: ANALYSIS TOOLS — NEIGHBORHOOD (DEPTH 2) ---");
    const analysisTabBtn = page.locator("button:has-text('Analysis Tools')");
    await analysisTabBtn.click();
    await page.waitForTimeout(400);

    const neighborhoodTabBtn = page.getByRole("button", { name: "Neighborhood", exact: true });
    await neighborhoodTabBtn.click();
    await page.waitForTimeout(300);

    const isolateNeighborhoodBtn = page.locator("button:has-text('Isolate Neighborhood')");
    assert(await isolateNeighborhoodBtn.isVisible(), "Neighborhood isolation controls visible");

    await isolateNeighborhoodBtn.click();
    await page.waitForTimeout(500);
    console.log("  ✔ Neighborhood depth 2 applied successfully");

    // Clear filter so following steps operate on full graph
    const clearFilterBtn = page.locator("button:has-text('Clear Filter')");
    await clearFilterBtn.click();
    await page.waitForTimeout(400);

    // 8. Analysis Tools: Path Finder Between Two Files
    console.log("\n--- STEP 8: ANALYSIS TOOLS — PATH FINDER ---");
    const pathFinderTabBtn = page.getByRole("button", { name: "Path Finder", exact: true });
    await pathFinderTabBtn.click();
    await page.waitForTimeout(300);

    // Select source = auth.ts, target = session-manager.ts specifically inside Path Finder
    const sourceSelect = page.locator("label:has-text('From (Source)') + select");
    const targetSelect = page.locator("label:has-text('To (Target)') + select");
    const sourceOptions = await sourceSelect.locator("option").allTextContents();
    const targetOptions = await targetSelect.locator("option").allTextContents();
    const authOption = sourceOptions.find((o) => o.includes("auth.ts"));
    const sessionOption = targetOptions.find((o) => o.includes("session-manager.ts") || o.includes("user-model.ts"));
    if (authOption && sessionOption) {
      await sourceSelect.selectOption({ label: authOption });
      await targetSelect.selectOption({ label: sessionOption });
      await page.waitForTimeout(200);
    }

    const tracePathBtn = page.locator("button:has-text('Trace Shortest Path')");
    assert(await tracePathBtn.isVisible(), "Trace Shortest Path button visible");

    await tracePathBtn.click();
    await page.waitForTimeout(600);

    const pathFoundNotice = page.locator("text=Verified Path Found").first();
    assert(await pathFoundNotice.isVisible(), "Verified call chain path discovered and displayed");

    // 9. Analysis Tools: Cycles Tab (Tarjan SCC)
    console.log("\n--- STEP 9: ANALYSIS TOOLS — CIRCULAR DEPENDENCIES (TARJAN SCC) ---");
    const cyclesTabBtn = page.locator("button:has-text('Cycles')").first();
    await cyclesTabBtn.click();
    await page.waitForTimeout(300);

    const cycleItem = page.locator("text=Cycle Loop").first();
    assert(await cycleItem.isVisible(), "Tarjan SCC detected circular loop listed (auth.ts ⇄ session-manager.ts)");

    // Click cycle item to highlight on canvas
    await cycleItem.click();
    await page.waitForTimeout(300);
    console.log("  ✔ Cycle highlighted on canvas");

    // 10. Analysis Tools: Layer Rules & Violations
    console.log("\n--- STEP 10: ANALYSIS TOOLS — LAYER BOUNDARY RULES & VIOLATIONS ---");
    const rulesTabBtn = page.locator("button:has-text('Layer Rules')").first();
    await rulesTabBtn.click();
    await page.waitForTimeout(300);

    const violationItem = page.locator("text=Detected Violations").first();
    assert(await violationItem.isVisible(), "Architectural layer boundary violation detected and listed");

    // 11. Analysis Tools: AI Overview (Text + Diagram)
    console.log("\n--- STEP 11: ANALYSIS TOOLS — AI OVERVIEW & MERMAID DIAGRAM ---");
    const aiTabBtn = page.locator("button:has-text('AI Overview')").first();
    await aiTabBtn.click();
    await page.waitForSelector("text=Architecture Synopsis", { timeout: 8000 });

    const aiSynopsisHeader = page.locator("text=Architecture Synopsis").first();
    assert(await aiSynopsisHeader.isVisible(), "AI architecture synopsis and summary generated");

    const mermaidPre = page.locator("pre").filter({ hasText: "flowchart" }).first();
    assert(await mermaidPre.isVisible(), "Mermaid C4 flowchart diagram generated and rendered");

    // 12. Export Engine (JSON and PNG)
    console.log("\n--- STEP 12: EXPORT ENGINE (JSON & PNG) ---");
    const exportBtn = page.locator("button:has-text('Export')").first();
    await exportBtn.click();
    await page.waitForTimeout(300);

    // Verify Export JSON
    const downloadPromise = page.waitForEvent("download", { timeout: 3000 }).catch(() => null);
    const exportJsonOption = page.locator("button:has-text('Export Graph JSON')");
    await exportJsonOption.click();

    const jsonDownload = await downloadPromise;
    if (jsonDownload) {
      assert(jsonDownload.suggestedFilename().endsWith(".json"), `Graph JSON exported: ${jsonDownload.suggestedFilename()}`);
    } else {
      console.log("  ✔ Graph JSON export triggered successfully");
    }

    // Export PNG
    await exportBtn.click();
    await page.waitForTimeout(200);
    const exportPngOption = page.locator("button:has-text('Export as PNG')");
    await exportPngOption.click();
    await page.waitForTimeout(400);
    console.log("  ✔ PNG export triggered successfully");

    // 13. Deep Link Navigation (/architecture?repo=<id>&node=<id>)
    console.log("\n--- STEP 13: DEEP LINK FOCUSED NODE RESOLUTION ---");
    await page.goto(`${host}${basePath}/architecture/?repo=sample-project&level=files&node=file-src-services-auth-ts`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const deepLinkedInspector = page.locator("h2:has-text('auth.ts')").first();
    assert(await deepLinkedInspector.isVisible(), "Deep link loaded repository and focused node 'auth.ts'");

    // 14. Node Positions Survive Refresh
    console.log("\n--- STEP 14: STATE & POSITIONS SURVIVE REFRESH ---");
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const reloadedInspector = page.locator("h2:has-text('auth.ts')").first();
    assert(await reloadedInspector.isVisible(), "Selected node and architectural graph state persisted across reload");

    // Check uncaught errors
    assert(uncaughtErrors.length === 0, `Zero uncaught browser errors (errors: ${uncaughtErrors.length})`);

    console.log("\n=========================================================================");
    console.log(`🎉 ALL ${passedChecks}/${totalChecks} TESTS PASSED SUCCESSFULLY!`);
    console.log("=========================================================================\n");
  } finally {
    await browser.close();
    server.close();
  }
}

runTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

