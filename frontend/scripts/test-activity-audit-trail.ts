import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { chromium, Page } from "playwright";

const basePath = "/CodeAtlas-AI-Codebase-Intelligence-Platform";
const outDir = path.resolve(process.cwd(), "out");
const screenshotDir = path.resolve(process.cwd(), "out", "screenshots");
const publicScreenshotDir = path.resolve(process.cwd(), "public", "test-screenshots");
const PORT = 3470;
const host = `http://localhost:${PORT}`;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

function createStaticServer(): http.Server {
  return http.createServer((req, res) => {
    try {
      const rawUrl = req.url || "/";
      const parsedUrl = new URL(rawUrl, host);
      let pathname = decodeURIComponent(parsedUrl.pathname);

      if (!pathname.startsWith(basePath)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found (invalid basePath)");
        return;
      }

      let relPath = pathname.slice(basePath.length);
      if (!relPath || relPath === "/") {
        relPath = "/index.html";
      }

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
        const notFoundPath = path.join(outDir, "404.html");
        if (fs.existsSync(notFoundPath)) {
          filePath = notFoundPath;
        } else {
          filePath = path.join(outDir, "index.html");
        }
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      const content = fs.readFileSync(filePath);

      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`Internal Server Error: ${err.message}`);
    }
  });
}

async function captureScreenshot(page: Page, name: string) {
  try {
    const file1 = path.join(screenshotDir, `${name}.png`);
    const file2 = path.join(publicScreenshotDir, `${name}.png`);
    await page.screenshot({ path: file1, fullPage: false });
    fs.copyFileSync(file1, file2);
    console.log(`  📸 Screenshot captured: ${name}.png`);
  } catch (err: any) {
    console.warn(`  ⚠️ Screenshot warning (${name}):`, err.message);
  }
}

async function main() {
  console.log("=========================================================================");
  console.log("🧪 CodeAtlas Activity & Audit Trail End-to-End Test Suite");
  console.log("=========================================================================\n");

  fs.mkdirSync(screenshotDir, { recursive: true });
  fs.mkdirSync(publicScreenshotDir, { recursive: true });

  const server = createStaticServer();
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  console.log(`🚀 Serving static build from /out on ${host}${basePath}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  // Inject session auth on every page load
  await context.addInitScript(() => {
    localStorage.setItem("codeatlas_demo_mode", "true");
    localStorage.setItem("codeatlas_active_demo_session", "true");
    localStorage.setItem(
      "codeatlas-auth-user",
      JSON.stringify({
        id: "usr_lead_arch",
        name: "Dev Lead Architect",
        email: "lead@codeatlas.dev",
        role: "Principal Architect",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      })
    );
  });

  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Initial Page Load, Headers, Counts, Day Grouping
    // -------------------------------------------------------------------------
    console.log("📋 Test 1: Activity & Audit Trail Initial Load & Layout...");
    await page.goto(`${host}${basePath}/activity`);
    await page.waitForLoadState("networkidle");

    const pageTitle = await page.textContent("h1");
    assert(pageTitle?.includes("Activity & Audit Trail") === true, "Header title contains 'Activity & Audit Trail'");

    // Check count chips
    const todayCard = page.locator("text=Today").first();
    assert((await todayCard.count()) > 0, "Today count metric card exists");

    const totalCard = page.locator("text=Total Trail").first();
    assert((await totalCard.count()) > 0, "Total Trail count metric card exists");

    // Check module filter pills
    const allModulesBtn = page.locator("button:has-text('All Modules')").first();
    assert((await allModulesBtn.count()) > 0, "'All Modules' filter pill rendered");

    const codeReviewPill = page.locator("button:has-text('Code Review')").first();
    assert((await codeReviewPill.count()) > 0, "'Code Review' module pill rendered");

    // Check day groupings
    const todayGroup = page.locator("span:text-is('Today')").first();
    assert((await todayGroup.count()) > 0, "'Today' chronological day section header exists");

    await captureScreenshot(page, "activity-01-initial-feed");

    // -------------------------------------------------------------------------
    // TEST 2: Filter Interactivity & URL Synchronization
    // -------------------------------------------------------------------------
    console.log("\n📋 Test 2: Filter Interactivity & URL Synchronization...");
    await codeReviewPill.click();
    await page.waitForTimeout(300);

    // Verify URL updated with module
    const currentUrl = page.url();
    assert(currentUrl.includes("module=code-review"), "URL reflects module=code-review filter");

    // Verify filtered items
    const eventsCount = await page.locator(".group:has-text('PR')").count();
    assert(eventsCount > 0, "Code Review pull request activities visible under filter");

    // Test search filter
    const searchInput = page.locator("input[placeholder*='Search audit trail']");
    await searchInput.fill("WebAuthn");
    await page.waitForTimeout(300);

    const searchUrl = page.url();
    assert(searchUrl.includes("search=WebAuthn"), "URL reflects search query parameter");

    // Reset filters
    await allModulesBtn.click();
    await searchInput.fill("");
    await page.waitForTimeout(300);
    assert(!page.url().includes("module="), "Resetting modules clears URL filter");

    await captureScreenshot(page, "activity-02-filters");

    // -------------------------------------------------------------------------
    // TEST 3: Detail Drawer (Slide-Over Panel) with Diff & Comparison
    // -------------------------------------------------------------------------
    console.log("\n📋 Test 3: Detail Drawer Inspection...");
    // Find an event with 'Inspect' button
    const inspectBtn = page.locator("button:has-text('Inspect')").first();
    await inspectBtn.click();
    await page.waitForTimeout(300);

    const drawerTitle = page.locator("h3:has-text('Audit Event Details')");
    assert((await drawerTitle.count()) > 0, "Slide-over detail drawer opened");

    // Verify copy event link
    const copyLinkBtn = page.locator("button:has-text('Copy Event Link')");
    assert((await copyLinkBtn.count()) > 0, "Copy Event Link button exists in drawer footer");
    await copyLinkBtn.click();
    await page.waitForTimeout(400);

    const toast = page.locator("text=Link Copied").first();
    assert((await toast.count()) > 0, "Toast notification shows after copying link");

    await captureScreenshot(page, "activity-03-detail-drawer");

    // Close drawer
    const closeBtn = page.locator("button:has-text('Close')");
    await closeBtn.click();
    await page.waitForTimeout(300);
    assert((await drawerTitle.count()) === 0, "Detail drawer closed cleanly");

    // -------------------------------------------------------------------------
    // TEST 4: Export CSV & JSON Downloads
    // -------------------------------------------------------------------------
    console.log("\n📋 Test 4: Export CSV and JSON...");
    const exportBtn = page.locator("button:has-text('Export')");
    await exportBtn.click();
    await page.waitForTimeout(200);

    const exportCsvBtn = page.locator("button:has-text('Export CSV')");
    assert((await exportCsvBtn.count()) > 0, "Export CSV menu item exists");

    const [downloadCsv] = await Promise.all([
      page.waitForEvent("download"),
      exportCsvBtn.click(),
    ]);
    const csvFilename = downloadCsv.suggestedFilename();
    assert(csvFilename.endsWith(".csv"), `CSV download triggered: ${csvFilename}`);

    // Export JSON
    await exportBtn.click();
    await page.waitForTimeout(200);
    const exportJsonBtn = page.locator("button:has-text('Export JSON')");
    const [downloadJson] = await Promise.all([
      page.waitForEvent("download"),
      exportJsonBtn.click(),
    ]);
    const jsonFilename = downloadJson.suggestedFilename();
    assert(jsonFilename.endsWith(".json"), `JSON download triggered: ${jsonFilename}`);

    // -------------------------------------------------------------------------
    // TEST 5: Real-time Live Reactivity Across 4 Modules
    // -------------------------------------------------------------------------
    console.log("\n📋 Test 5: Live Activity Audit Trail Across 4 Modules...");
    // Inject mutations via store helpers in page context:
    // Module 1: Workspaces (create workspace)
    // Module 2: Indexing (reindex repo)
    // Module 3: Code Review (merge PR)
    // Module 4: Agents (apply agent diff)
    await page.evaluate(() => {
      const storeModule = (window as any).__CODEATLAS_STORE__ || require("@/lib/demo/store");
      if (storeModule) {
        // Module 1: Workspace Created
        storeModule.logActivity({
          module: "workspaces",
          action: "create",
          type: "workspace_created",
          title: "Created Workspace 'Enterprise Cloud Architecture'",
          description: "New platform workspace provisioned with 3 linked repositories.",
          target: { type: "workspace", id: "ws_ent_1", name: "Enterprise Cloud Architecture" },
          status: "success",
          href: "/workspaces/ws_ent_1",
          details: { after: { name: "Enterprise Cloud Architecture" } },
        });

        // Module 2: Indexing Re-indexed
        storeModule.logActivity({
          module: "indexing",
          action: "index",
          type: "indexing_completed",
          title: "Re-indexed repository demo-auth-service",
          description: "AST symbol table refreshed: 24 symbols, 0 syntax violations.",
          target: { type: "repository", id: "sample-project", name: "demo-auth-service" },
          status: "success",
          href: "/repositories/sample-project",
        });

        // Module 3: Code Review PR Approved
        storeModule.logActivity({
          module: "code-review",
          action: "approve",
          type: "review_approved",
          title: "Approved Pull Request #105: Strict Input Validation",
          description: "Verified cryptographic nonce challenge and approved PR for production deployment.",
          target: { type: "pr", id: "pr_105", name: "PR #105" },
          status: "success",
          href: "/code-review?pr=pr_105",
        });

        // Module 4: Agents Applied Diff
        storeModule.logActivity({
          module: "agents",
          action: "apply",
          type: "agent_patch_applied",
          title: "Agent Applied Security Patch: Memory Leak Remediation",
          description: "Automated agent closed open file descriptors in cache layer.",
          target: { type: "agent", id: "agent_mem_leak", name: "Memory Leak Remediation" },
          status: "success",
          href: "/agents",
          details: {
            diff: "--- a/src/cache.ts\n+++ b/src/cache.ts\n@@ -10,3 +10,4 @@\n-  socket.open();\n+  socket.open();\n+  defer socket.close();",
          },
        });
      }
    });

    await page.waitForTimeout(500);

    // Verify all 4 show up in feed
    const wsEvent = page.locator("text=Created Workspace 'Enterprise Cloud Architecture'").first();
    assert((await wsEvent.count()) > 0, "Live Event 1 (Workspaces) displayed in audit feed");

    const indexEvent = page.locator("text=AST symbol table refreshed: 24 symbols").first();
    assert((await indexEvent.count()) > 0, "Live Event 2 (Indexing) displayed in audit feed");

    const prEvent = page.locator("text=Approved Pull Request #105: Strict Input Validation").first();
    assert((await prEvent.count()) > 0, "Live Event 3 (Code Review) displayed in audit feed");

    const agentEvent = page.locator("text=Agent Applied Security Patch: Memory Leak Remediation").first();
    assert((await agentEvent.count()) > 0, "Live Event 4 (Agents) displayed in audit feed");

    // Inspect the Agent event with Diff
    const agentCard = page.locator(".group", { hasText: "Agent Applied Security Patch" });
    const agentInspectBtn = agentCard.locator("button:has-text('Inspect')");
    await agentInspectBtn.click();
    await page.waitForTimeout(300);

    // Verify diff viewer rendered the patch lines
    const diffLine = page.locator("text=defer socket.close();");
    assert((await diffLine.count()) > 0, "Mini diff viewer rendered colored addition patch line");

    await captureScreenshot(page, "activity-04-live-events-and-diff");

    const closeDrawerBtn2 = page.locator("button:has-text('Close')");
    await closeDrawerBtn2.click();

    // -------------------------------------------------------------------------
    // TEST 6: Persistence across Refresh
    // -------------------------------------------------------------------------
    console.log("\n📋 Test 6: Persistence Across Page Reload...");
    await page.reload();
    await page.waitForLoadState("networkidle");

    const persistentWsEvent = page.locator("text=Created Workspace 'Enterprise Cloud Architecture'").first();
    assert((await persistentWsEvent.count()) > 0, "Activity event persisted in shared store across page reload");

    await captureScreenshot(page, "activity-05-after-refresh");

  } catch (err: any) {
    console.error("❌ Test crashed with exception:", err);
    failed++;
  } finally {
    await browser.close();
    server.close();

    console.log("\n=========================================================================");
    console.log(`🏁 Test Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log("=========================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  }
}

main();
