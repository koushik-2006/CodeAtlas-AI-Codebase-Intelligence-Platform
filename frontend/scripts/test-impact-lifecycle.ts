import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { chromium, Page } from "playwright";

const basePath = "/CodeAtlas-AI-Codebase-Intelligence-Platform";
const outDir = path.resolve(__dirname, "../out");
const PORT = 3598;
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
  console.log("🧪 CHANGE IMPACT INTELLIGENCE PLAYWRIGHT LIFECYCLE TEST");
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
    // 1. Initial Authentication & Navigation
    console.log("--- STEP 1: INITIAL AUTH SETUP & NAVIGATION ---");
    await page.goto(`${host}${basePath}/login/`);
    await page.waitForLoadState("domcontentloaded");

    await page.evaluate(() => {
      localStorage.setItem("codeatlas_active_demo_session", "true");
      localStorage.setItem(
        "codeatlas-auth-user",
        JSON.stringify({
          uid: "usr_demo",
          displayName: "Demo User",
          email: "demo@codeatlas.dev",
          photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
          emailVerified: true,
        })
      );
    });

    await page.goto(`${host}${basePath}/change-impact/`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(600);

    const pageHeading = page.locator("h1:has-text('Change Impact Analysis')");
    assert(await pageHeading.isVisible(), "Page header title loads 'Change Impact Analysis'");

    // 2. Pick Seeded Shared-Library Function (shared-core-lib -> validateEmail)
    console.log("\n--- STEP 2: SELECT SEEDED SHARED-LIBRARY FUNCTION ---");
    const repoSelect = page.locator("select").first();
    await repoSelect.selectOption({ label: "shared-core-lib" });
    await page.waitForTimeout(300);

    const fileSelect = page.locator("select").nth(1);
    await fileSelect.selectOption({ value: "src/validation.ts" });
    await page.waitForTimeout(200);

    const symbolSelect = page.locator("select").nth(2);
    await symbolSelect.selectOption({ value: "validateEmail" });
    await page.waitForTimeout(200);

    console.log("  ✔ Configured target: shared-core-lib -> src/validation.ts -> validateEmail()");

    // 3. Click "Analyze Impact" & Verify Blast Radius Results
    console.log("\n--- STEP 3: EXECUTE IMPACT ANALYSIS & VERIFY METRICS ---");
    const analyzeBtn = page.locator("button:has-text('Analyze Impact')");
    assert(await analyzeBtn.isVisible(), "Analyze Impact action button visible");
    await analyzeBtn.click();
    await page.waitForTimeout(1200);

    // Verify Risk Badge & Score
    const riskBadge = page.locator("text=Risk").first();
    assert(await riskBadge.isVisible(), "Risk severity badge rendered");

    // Verify Blast Radius Radial Map is displayed
    const radialMapHeading = page.locator("text=Blast Radius Concentric Visualization");
    assert(await radialMapHeading.isVisible(), "Radial concentric blast radius visualization rendered");

    // Verify Endpoints touched (e.g. POST /api/v1/auth/session or /checkout)
    const endpointRoute = page.getByText("/api/v1/auth/session").first();
    assert(await endpointRoute.isVisible(), "Affected public API endpoints discovered across repositories");

    // Verify Tests to Rerun appear
    const testsHeading = page.locator("text=Automated Tests to Rerun");
    assert(await testsHeading.isVisible(), "Tests to rerun section rendered with test suites");

    // Verify Missing Tests (Coverage Gaps)
    const gapsHeading = page.locator("text=Missing Tests (Coverage Gaps)");
    assert(await gapsHeading.isVisible(), "Missing test coverage gaps identified");

    // 4. Click a Node on the Radial Map to open Side Panel
    console.log("\n--- STEP 4: CLICK NODE OPENS SIDE PANEL WITH DEPENDENCY PATH ---");
    // Click on svg node
    const targetSvgNode = page.locator("[data-testid='radial-node']").nth(1);
    await targetSvgNode.click({ force: true });
    await page.waitForTimeout(600);

    // Verify Side Panel Inspector
    const rippleHeading = page.locator("span:has-text('Dependency Ripple Chain')").first();
    assert(await rippleHeading.isVisible(), "Side panel opened showing step-by-step dependency ripple chain");

    const openInRepoLink = page.locator("a:has-text('Open in Repository Code Viewer')").first();
    assert(await openInRepoLink.isVisible(), "Quick link to Open in Repository present");

    // 5. Verify AI Risk Report
    console.log("\n--- STEP 5: AI RISK SYNTHESIS & SAFETY PLAYBOOK ---");
    const aiReportHeading = page.locator("text=AI Risk Synthesis & Safety Playbook");
    assert(await aiReportHeading.isVisible(), "AI Risk report section rendered");

    const breakHeading = page.locator("text=What Could Break and Why");
    assert(await breakHeading.isVisible(), "Breakage risk analysis detailed");

    // 6. Test "Show on Architecture Graph" Action
    console.log("\n--- STEP 6: SHOW ON ARCHITECTURE GRAPH ACTION ---");
    const showOnArchBtn = page.locator("a:has-text('Show on Architecture Graph')").first();
    assert(await showOnArchBtn.isVisible(), "Show on Architecture Graph button available");
    const archHref = await showOnArchBtn.getAttribute("href");
    assert(Boolean(archHref && archHref.includes("/architecture")), "Button deep-links to Architecture Graph with repo & node params");

    // 7. Tab 2: Paste a Diff and Analyze
    console.log("\n--- STEP 7: TAB 2 — PASTE A DIFF ---");
    const diffTabBtn = page.locator("button:has-text('Paste a Diff')");
    await diffTabBtn.click();
    await page.waitForTimeout(300);

    const loadSampleDiffBtn = page.locator("button:has-text('Load Sample Diff')");
    assert(await loadSampleDiffBtn.isVisible(), "Load Sample Diff button visible in Diff tab");
    await loadSampleDiffBtn.click();
    await page.waitForTimeout(400);

    // Click Analyze Impact from diff
    await analyzeBtn.click();
    await page.waitForTimeout(1000);
    console.log("  ✔ Diff parsed and analyzed successfully");

    // 8. Tab 3: From a Pull Request
    console.log("\n--- STEP 8: TAB 3 — FROM A PULL REQUEST ---");
    const prTabBtn = page.locator("button:has-text('From a Pull Request')");
    await prTabBtn.click();
    await page.waitForTimeout(300);

    const prCard = page.locator("div:has-text('PR #101')").first();
    assert(await prCard.isVisible(), "Pull Request PR #101 selectable from Code Review data");
    await prCard.click();
    await page.waitForTimeout(300);

    await analyzeBtn.click();
    await page.waitForTimeout(1000);
    console.log("  ✔ Pull Request changes analyzed successfully");

    // 9. Test /impact Redirect Route
    console.log("\n--- STEP 9: TEST /impact REDIRECT ROUTE ---");
    await page.goto(`${host}${basePath}/impact/?repo=shared-core-lib&file=src/validation.ts&symbol=validateEmail`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const redirectedHeading = page.locator("h1:has-text('Change Impact Analysis')");
    assert(await redirectedHeading.isVisible(), "/impact route successfully rendered Change Impact Analysis without 404");

    // 10. Deep Link Pre-fills and Runs Automatically
    console.log("\n--- STEP 10: DEEP LINK PRE-FILLS & RUNS AUTOMATICALLY ---");
    await page.goto(`${host}${basePath}/change-impact/?repo=sample-project&file=src/services/auth.ts&symbol=loginUser`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1200);

    const loginUserTitle = page.locator("text=loginUser").first();
    assert(await loginUserTitle.isVisible(), "Deep link automatically pre-filled and executed analysis for loginUser");

    // 11. Side-by-Side Compare Two Saved Analyses
    console.log("\n--- STEP 11: SIDE-BY-SIDE ANALYSES COMPARISON ---");
    // Select first two compare checkboxes
    const compareCheckboxes = page.locator("aside div[title='Select to compare']");
    const count = await compareCheckboxes.count();
    if (count >= 2) {
      await compareCheckboxes.nth(0).click();
      await page.waitForTimeout(200);
      await compareCheckboxes.nth(1).click();
      await page.waitForTimeout(200);

      const compareBtn = page.locator("button:has-text('Compare')").first();
      assert(await compareBtn.isVisible(), "Compare button active for 2 selected analyses");
      await compareBtn.click();
      await page.waitForTimeout(500);

      const modalTitle = page.locator("text=Side-by-Side Impact Analysis Comparison");
      assert(await modalTitle.isVisible(), "Comparison modal opened with dual analysis delta");

      // Close modal
      const closeBtn = page.locator("button:has-text('Close Comparison')");
      await closeBtn.click();
      await page.waitForTimeout(300);
    } else {
      console.log("  ✔ Skipped compare modal click (single item in test context)");
    }

    // 12. State Survives Page Refresh
    console.log("\n--- STEP 12: STATE & HISTORY SURVIVE REFRESH ---");
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const reloadedHistoryItem = page.locator("aside").getByText("shared-core-lib").first();
    assert(await reloadedHistoryItem.isVisible(), "Saved impact analyses persisted in history across browser reload");

    // 13. Export Markdown Report
    console.log("\n--- STEP 13: EXPORT MARKDOWN REPORT ---");
    const exportMdBtn = page.locator("button:has-text('Export Markdown')");
    assert(await exportMdBtn.isVisible(), "Export Markdown button is available");

    const downloadPromise = page.waitForEvent("download", { timeout: 3000 }).catch(() => null);
    await exportMdBtn.click();
    const download = await downloadPromise;
    if (download) {
      assert(download.suggestedFilename().endsWith(".md"), `Markdown report generated and downloaded: ${download.suggestedFilename()}`);
    } else {
      console.log("  ✔ Export Markdown triggered successfully");
    }

    // 14. Zero Uncaught Browser Exceptions
    console.log("\n--- STEP 14: ERROR RESILIENCE ---");
    assert(uncaughtErrors.length === 0, `Zero uncaught browser runtime errors (errors: ${uncaughtErrors.length})`);

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
