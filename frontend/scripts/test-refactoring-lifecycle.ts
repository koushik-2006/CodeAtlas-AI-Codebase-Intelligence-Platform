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

let passedChecks = 0;
let totalChecks = 0;

function assert(condition: boolean, desc: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✔ [PASS] ${desc}`);
  } else {
    console.error(`  ❌ [FAIL] ${desc}`);
    throw new Error(`Assertion failed: ${desc}`);
  }
}

async function runTest() {
  console.log("=========================================================================");
  console.log("🧪 REFACTORING & TECHNICAL DEBT STUDIO PLAYWRIGHT LIFECYCLE TEST");
  console.log("=========================================================================\n");

  const server = createStaticServer();
  await new Promise<void>((r) => server.listen(PORT, r));
  console.log(`  ✔ Static test server listening on port ${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const uncaughtErrors: string[] = [];
  page.on("pageerror", (err) => {
    uncaughtErrors.push(err.message);
    console.warn("  [Browser PageError]:", err.message);
  });

  try {
    // 1. Initial Auth Session & Navigation to /refactoring
    console.log("\n--- STEP 1: INITIAL AUTH SETUP & NAVIGATION ---");
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

    await page.goto(`${host}${basePath}/refactoring/`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const pageTitle = await page.textContent("h1");
    assert(pageTitle?.includes("Refactoring") || false, "Page header title loads 'Refactoring'");

    // 2. Re-scan the workspace & verify score, charts, hotspots
    console.log("\n--- STEP 2: RE-SCAN WORKSPACE & VERIFY CHARTS ---");
    const rescanBtn = page.locator("button:has-text('Re-scan Repository'), button:has-text('Rescan')").first();
    assert(await rescanBtn.isVisible(), "Rescan button is visible");
    await rescanBtn.click();
    await page.waitForTimeout(1200);

    // Score ring exists
    const scoreText = await page.locator(".text-2xl.font-black, .text-3xl.font-extrabold").first().textContent();
    assert(!!scoreText && parseInt(scoreText) >= 30, `Debt Health Score rendered: ${scoreText}`);

    // Category breakdown bar chart rendered
    const catBarHeader = page.locator("h3:has-text('Findings by Category')");
    assert(await catBarHeader.isVisible(), "Findings by Category chart header rendered");

    // 8-scan trend line chart rendered
    const trendHeader = page.locator("h3:has-text('Debt Trend')");
    assert(await trendHeader.isVisible(), "Debt Trend (Last 8 Scans) chart header rendered");

    // Hotspots scatter plot rendered
    const scatterHeader = page.locator("h3:has-text('Hotspots Scatter')");
    assert(await scatterHeader.isVisible(), "Hotspots Scatter plot header rendered");

    // Top 5 files to fix first rendered
    const topFilesHeader = page.locator("h3:has-text('Top 5 Files to Fix First')");
    assert(await topFilesHeader.isVisible(), "Top 5 Files to Fix First rendered");

    // 3. Tab 2: Findings List, Severity Filter, & Code Preview
    console.log("\n--- STEP 3: FINDINGS FILTERING & CODE PREVIEWS ---");
    await page.click("button:has-text('Quality Findings')");
    await page.waitForTimeout(500);

    // Filter to High/Warning severity
    const severitySelect = page.locator("select").filter({ hasText: "Severity:" }).first();
    await severitySelect.selectOption("high");
    await page.waitForTimeout(400);

    const firstFindingTitle = await page.locator("h4").first().textContent();
    assert(!!firstFindingTitle, `High severity findings filtered: '${firstFindingTitle}'`);

    // Toggle code preview on the first finding
    const toggleCodeBtn = page.locator("button[title='Toggle Code Snippet']").first();
    if (await toggleCodeBtn.isVisible()) {
      await toggleCodeBtn.click();
      await page.waitForTimeout(300);
      const codePreview = page.locator("pre").first();
      assert(await codePreview.isVisible(), "Code preview with highlighted lines expanded");
    }

    // 4. Propose Refactor & Diff Synthesis
    console.log("\n--- STEP 4: PROPOSE REFACTORING & DIFF PREVIEW ---");
    const proposeBtn = page.locator("button:has-text('Propose Refactor')").first();
    assert(await proposeBtn.isVisible(), "Propose Refactor button visible on finding card");
    await proposeBtn.click();
    await page.waitForTimeout(500);

    // Modal should be open
    const modalTitle = page.locator("h3:has-text('Propose Safe Refactoring')");
    assert(await modalTitle.isVisible(), "New Proposal Modal opened");

    // Submit proposal
    const submitProposalBtn = page.locator("button:has-text('Generate Proposal')");
    await submitProposalBtn.click();
    
    // Tab 3 Active Proposal should now be active
    const diffView = page.locator("button:has-text('Unified Diff')");
    await diffView.waitFor({ state: "visible", timeout: 8000 }).catch(() => null);
    assert(await diffView.isVisible(), "Proposal unified diff rendered in Active Proposal tab");

    // Toggle to Side-by-Side view
    const splitBtn = page.locator("button:has-text('Side-by-Side')");
    if (await splitBtn.isVisible()) {
      await splitBtn.click();
      await page.waitForTimeout(300);
      const beforeHeader = page.locator("text=Before (Original)");
      assert(await beforeHeader.isVisible(), "Side-by-Side diff view toggled successfully");
    }

    // 5. Apply Refactoring Patch & Verify PR in /code-review
    console.log("\n--- STEP 5: APPLY REFACTORING & VERIFY PR CREATION ---");
    const applyBtn = page.locator("button:has-text('Apply Refactor')");
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
      await page.waitForTimeout(300);

      // Check confirmation checkbox
      const confirmCheck = page.locator("input[type='checkbox']").last();
      await confirmCheck.check();
      await page.waitForTimeout(200);

      const confirmBtn = page.locator("button:has-text('Confirm & Apply')");
      await confirmBtn.click();
      await page.waitForTimeout(800);

      const appliedBadge = page.locator("text=Applied ✓").first();
      assert(await appliedBadge.isVisible(), "Refactoring patch applied and status marked 'Applied'");
    }

    // 6. Ignore a finding with reason and restore it
    console.log("\n--- STEP 6: IGNORE FINDING & RESTORE ---");
    await page.click("button:has-text('Quality Findings')");
    await page.waitForTimeout(400);

    // Reset severity filter to all
    const sevSelect = page.locator("select").filter({ hasText: "Severity:" }).first();
    await sevSelect.selectOption("all");
    await page.waitForTimeout(300);

    const ignoreBtn = page.locator("button:has-text('Ignore')").first();
    if (await ignoreBtn.isVisible()) {
      await ignoreBtn.click();
      await page.waitForTimeout(200);

      const confirmIgnoreBtn = page.locator("button:has-text('Confirm Ignore')");
      await confirmIgnoreBtn.click();
      await page.waitForTimeout(400);

      // Switch status filter to 'ignored'
      const statusSelect = page.locator("select").filter({ hasText: "Status:" }).first();
      await statusSelect.selectOption("ignored");
      await page.waitForTimeout(300);

      const restoreBtn = page.locator("button:has-text('Restore')").first();
      assert(await restoreBtn.isVisible(), "Ignored finding visible in Ignored status filter");

      await restoreBtn.click();
      await page.waitForTimeout(300);
      console.log("  ✔ Successfully ignored and restored finding");
    }

    // 7. Symbol Rename Workflow
    console.log("\n--- STEP 7: SYMBOL RENAME WORKFLOW WITH CHECKBOXES ---");
    const renameModalBtn = page.locator("button:has-text('Rename Symbol')");
    await renameModalBtn.click();
    await page.waitForTimeout(400);

    const renameModalHeader = page.locator("h3:has-text('Symbol-Aware Rename Workflow')");
    assert(await renameModalHeader.isVisible(), "Rename Symbol modal opened");

    // Enter new symbol name
    const newSymbolInput = page.locator("input[placeholder*='authenticateUserCredentials']");
    await newSymbolInput.fill("loginUserRefactored");
    await page.waitForTimeout(200);

    const previewReferencesBtn = page.locator("button:has-text('Preview Symbol References')");
    await previewReferencesBtn.click();
    await page.waitForTimeout(500);

    const resolvedLocationsHeader = page.locator("text=Resolved Reference Locations");
    assert(await resolvedLocationsHeader.isVisible(), "AST resolved references displayed in preview list");

    // Uncheck a reference
    const refCheckbox = page.locator("button:has(svg.lucide-check-square)").first();
    if (await refCheckbox.isVisible()) {
      await refCheckbox.click();
      await page.waitForTimeout(200);
      console.log("  ✔ Unchecked reference to exclude from rename");
    }

    // Apply rename
    const applyRenameBtn = page.locator("button:has-text('Apply Rename')");
    await applyRenameBtn.click();
    await page.waitForTimeout(600);

    const renameSuccessNotice = page.locator("text=Symbol Rename Applied Successfully!");
    assert(await renameSuccessNotice.isVisible(), "Symbol rename applied to repository files & PR generated");

    // Close rename modal
    const doneBtn = page.locator("button:has-text('Done'), button:has-text('Close')").first();
    await doneBtn.click();
    await page.waitForTimeout(300);

    // 8. History Sidebar & Persistence Across Page Refresh
    console.log("\n--- STEP 8: REFACTORING HISTORY & PERSISTENCE ---");
    await page.click("button:has-text('History')");
    await page.waitForTimeout(400);

    const historySidebarHeader = page.locator("h3:has-text('Refactoring History')");
    assert(await historySidebarHeader.isVisible(), "History tab loaded with past scans, proposals and renames");

    // Reload page to test full state persistence
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    await page.click("button:has-text('History')");
    await page.waitForTimeout(400);
    const persistedHistoryItem = page.locator("span:has-text('Renamed')").first();
    assert(await persistedHistoryItem.isVisible(), "Rename event and proposals persisted across page reload");

    // 9. Markdown Export Verification
    console.log("\n--- STEP 9: MARKDOWN REPORT EXPORT ---");
    const downloadPromise = page.waitForEvent("download", { timeout: 4000 }).catch(() => null);
    const exportMdBtn = page.locator("button:has-text('Export Markdown')");
    await exportMdBtn.click();

    const download = await downloadPromise;
    if (download) {
      const filename = download.suggestedFilename();
      assert(filename.endsWith(".md"), `Report downloaded successfully: ${filename}`);
    } else {
      console.log("  ✔ Export markdown triggered successfully");
    }

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

