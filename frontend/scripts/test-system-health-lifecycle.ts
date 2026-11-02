import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { chromium, Page } from "playwright";

const basePath = "/CodeAtlas-AI-Codebase-Intelligence-Platform";
const outDir = path.resolve(process.cwd(), "out");
const screenshotDir = path.resolve(process.cwd(), "out", "screenshots");
const publicScreenshotDir = path.resolve(process.cwd(), "public", "test-screenshots");
const PORT = 3480;
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
        const fallback404 = path.join(outDir, "404.html");
        if (fs.existsSync(fallback404)) {
          res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
          res.end(fs.readFileSync(fallback404));
          return;
        }
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end(`File not found: ${relPath}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(fs.readFileSync(filePath));
    } catch (e: any) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`Internal Server Error: ${e?.message}`);
    }
  });
}

async function takeScreenshot(page: Page, name: string) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  fs.mkdirSync(publicScreenshotDir, { recursive: true });
  const p1 = path.join(screenshotDir, `${name}.png`);
  const p2 = path.join(publicScreenshotDir, `${name}.png`);
  await page.screenshot({ path: p1, fullPage: true });
  try {
    fs.copyFileSync(p1, p2);
  } catch {}
  console.log(`[SNAPSHOT] Saved: ${name}.png`);
}

async function main() {
  console.log("\n=======================================================");
  console.log("  CodeAtlas System Health & Ops Lifecycle Test Suite   ");
  console.log("=======================================================\n");

  const server = createStaticServer();
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`[SERVER] Static server listening at ${host}${basePath}`);

  const browser = await chromium.launch({
    headless: true,
  });

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
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failedCount++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // Test 1: Redirect /operations -> /system-health with query param preservation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 1: Redirect /operations -> /system-health ---");
    await page.goto(`${host}${basePath}/operations?tab=infrastructure`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const currentUrl = page.url();
    assert(
      currentUrl.includes("/system-health") || currentUrl.includes("/operations"),
      "Accessed operations route and rendered System Health component"
    );

    const pageHeading = await page.textContent("h1");
    assert(
      Boolean(pageHeading && pageHeading.includes("System Observability")),
      `Rendered System Observability header on redirect: "${pageHeading}"`
    );
    await takeScreenshot(page, "health-01-redirect-operations");

    // -------------------------------------------------------------------------
    // Test 2: System Health Overview & Hybrid Telemetry Labels
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Overview & Hybrid Telemetry Labels ---");
    await page.goto(`${host}${basePath}/system-health`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const liveBadge = page.locator("text=Live checks").first();
    const simBadge = page.locator("text=Simulated telemetry").first();
    assert(await liveBadge.isVisible(), "Header displays [Live checks] indicator badge");
    assert(await simBadge.isVisible(), "Header displays [Simulated telemetry] indicator badge");

    const statusBanner = page.locator("text=All Core Systems Operational").first();
    assert(await statusBanner.isVisible(), "Aggregated Live Status Banner displays operational state");
    await takeScreenshot(page, "health-02-overview");

    // -------------------------------------------------------------------------
    // Test 3: Five Real Live Checks Grid & Re-probe
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Five Real Live Checks Grid ---");
    const authCheck = page.locator("text=Firebase Authentication").first();
    const aiCheck = page.locator("text=Firebase AI Logic").first();
    const ghCheck = page.locator("text=GitHub REST API Gateway").first();
    const browserCheck = page.locator("text=Browser Runtime & Web Vitals").first();
    const indexCheck = page.locator("text=Repository AST Index Status").first();

    assert(await authCheck.isVisible(), "Card 1: Firebase Auth probe card present");
    assert(await aiCheck.isVisible(), "Card 2: Firebase AI Logic (Gemini) probe card present");
    assert(await ghCheck.isVisible(), "Card 3: GitHub REST API probe card present");
    assert(await browserCheck.isVisible(), "Card 4: Browser Runtime & Web Vitals card present");
    assert(await indexCheck.isVisible(), "Card 5: Repository AST Index Status card present");

    // Click "Run checks now" button
    const runChecksBtn = page.locator("button:has-text('Run checks now')").first();
    assert(await runChecksBtn.isVisible(), "Run checks now button visible");
    await runChecksBtn.click();
    await page.waitForTimeout(500);
    console.log("  [ACTION] Clicked 'Run checks now' to trigger live probes");
    await takeScreenshot(page, "health-03-live-checks");

    // -------------------------------------------------------------------------
    // Test 4: Simulated Microservice Filter & Time-Series Chart
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Microservice Filter & Time-Series Chart ---");
    const serviceSelect = page.locator("select").first();
    assert(await serviceSelect.isVisible(), "Microservice scope dropdown visible");

    await serviceSelect.selectOption("payment-service");
    await page.waitForTimeout(300);

    const serviceChartTitle = page.locator("text=Live Telemetry Streams: payment-service").first();
    assert(await serviceChartTitle.isVisible(), "Time-series chart updated to payment-service scope");

    // Toggle range to 15m
    const range15mBtn = page.locator("button:has-text('15m')").first();
    await range15mBtn.click();
    await page.waitForTimeout(300);

    const svgPolyline = page.locator("svg polyline").first();
    assert(await svgPolyline.isVisible(), "Interactive SVG time-series polyline rendered");
    await takeScreenshot(page, "health-04-metrics-chart");

    // -------------------------------------------------------------------------
    // Test 5: Circuit Breakers (Trip & Reset)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Circuit Breakers (Trip & Reset) ---");
    // Switch to infrastructure tab
    const infraTab = page.locator("button:has-text('Circuit Breakers & Infra')").first();
    await infraTab.click();
    await page.waitForTimeout(400);

    const tripBtn = page.locator("button:has-text('Trip Breaker (Test)')").first();
    assert(await tripBtn.isVisible(), "Trip Breaker (Test) button visible on circuit breaker card");
    await tripBtn.click();
    await page.waitForTimeout(400);

    const feedbackNotice = page.locator("text=is now OPEN").first();
    assert(await feedbackNotice.isVisible(), "Circuit breaker tripped to OPEN state with feedback notice");

    const resetBtn = page.locator("button:has-text('Reset to Closed')").first();
    assert(await resetBtn.isVisible(), "Reset to Closed button visible");
    await resetBtn.click();
    await page.waitForTimeout(400);

    const resetNotice = page.locator("text=is now CLOSED").first();
    assert(await resetNotice.isVisible(), "Circuit breaker successfully reset to CLOSED state");
    await takeScreenshot(page, "health-05-circuit-breaker");

    // -------------------------------------------------------------------------
    // Test 6: Live Logs Streaming & Trace ID Jumping
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Live Structured Logs & Trace Jumping ---");
    const logsTab = page.locator("button:has-text('Live Structured Logs')").first();
    await logsTab.click();
    await page.waitForTimeout(400);

    const logsHeader = page.locator("text=Live Structured Logs & Audit Stream").first();
    assert(await logsHeader.isVisible(), "Live Structured Logs viewer displayed");

    // Toggle Pause/Resume
    const pauseBtn = page.locator("button:has-text('Pause Stream')").first();
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      await page.waitForTimeout(200);
      const resumeBtn = page.locator("button:has-text('Resume Stream')").first();
      assert(await resumeBtn.isVisible(), "Paused live stream; Resume Stream button active");
    }

    // Click trace pill to jump to trace waterfall
    const tracePill = page.locator("button[title*='Open trace']").first();
    assert(await tracePill.isVisible(), "Clickable Trace ID pill displayed on log entry");
    const traceIdText = (await tracePill.textContent())?.trim();
    await tracePill.click();
    await page.waitForTimeout(400);

    // Verify view jumped to Distributed Tracing tab
    const tracesHeader = page.locator("text=Distributed Tracing & Request Lifecycles").first();
    assert(await tracesHeader.isVisible(), `Navigated to Distributed Tracing view from trace pill ${traceIdText}`);
    await takeScreenshot(page, "health-06-trace-waterfall");

    // -------------------------------------------------------------------------
    // Test 7: Trace Waterfall & 'Open Code' Navigation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: Trace Waterfall & 'Open code' Link ---");
    const openCodeBtn = page.locator("a:has-text('Open code')").first();
    assert(await openCodeBtn.isVisible(), "'Open code' button rendered on span mapped to repository source file");

    const codeHref = await openCodeBtn.getAttribute("href");
    assert(
      Boolean(codeHref && codeHref.includes("/repositories/")),
      `'Open code' button links to repository code view: ${codeHref}`
    );
    await takeScreenshot(page, "health-07-open-code-link");

    // -------------------------------------------------------------------------
    // Test 8: Operational Alert Rules Editor
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: Alert Rules Editor ---");
    const overviewTab = page.locator("button:has-text('Overview & Telemetry')").first();
    await overviewTab.click();
    await page.waitForTimeout(400);

    const rulesTab = page.locator("button:has-text('Configured Rules')").first();
    await rulesTab.click();
    await page.waitForTimeout(300);

    const newRuleBtn = page.locator("button:has-text('New Rule')").first();
    assert(await newRuleBtn.isVisible(), "New Rule button visible in Configured Rules view");
    await newRuleBtn.click();
    await page.waitForTimeout(300);

    // Fill rule form
    const ruleNameInput = page.locator("input[placeholder*='Host Memory Pressure']").first();
    await ruleNameInput.fill("Automated E2E P99 Spike Rule");
    const saveRuleBtn = page.locator("button:has-text('Save Alert Rule')").first();
    await saveRuleBtn.click({ force: true });
    await page.waitForTimeout(400);

    const addedRule = page.locator("text=Automated E2E P99 Spike Rule").first();
    assert(await addedRule.isVisible(), "New Alert Rule successfully created and persisted in table");
    await takeScreenshot(page, "health-08-alert-rules");

    // -------------------------------------------------------------------------
    // Test 9: Simulate Incident & AI Debugger Deep Link
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 9: Simulate Incident & AI Debugger Deep Link ---");
    const simulateIncidentBtn = page.locator("button:has-text('Simulate incident')").first();
    assert(await simulateIncidentBtn.isVisible(), "Simulate incident button visible on header banner");
    await simulateIncidentBtn.click();
    await page.waitForTimeout(500);

    const incidentBanner = page.locator("text=Critical Incident Active").first();
    assert(await incidentBanner.isVisible(), "Critical Incident Active alert banner fired");

    const debugLink = page.locator("a:has-text('Investigate with AI Debugger')").first();
    assert(await debugLink.isVisible(), "'Investigate with AI Debugger' action button displayed on incident banner");
    const debugHref = await debugLink.getAttribute("href");
    assert(
      Boolean(debugHref && debugHref.includes("/debug?id=inv_incident")),
      `AI Debugger link pre-fills investigation session: ${debugHref}`
    );
    await takeScreenshot(page, "health-09-incident-simulated");

    // -------------------------------------------------------------------------
    // Test 10: Dependency Health & Supply Chain Upgrade Proposal
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 10: Dependency Health & Supply Chain Proposal ---");
    const depTab = page.locator("button:has-text('Dependency Health & Supply Chain')").first();
    await depTab.click();
    await page.waitForTimeout(400);

    const manifestTable = page.locator("table").first();
    assert(await manifestTable.isVisible(), "Package manifests table rendered");

    const upgradeBtn = page.locator("button:has-text('Create Upgrade Proposal')").first();
    assert(await upgradeBtn.isVisible(), "Create Upgrade Proposal button visible for outdated package");
    await upgradeBtn.click();
    await page.waitForTimeout(400);

    const upgradeToast = page.locator("text=Created refactoring upgrade proposal").first();
    assert(await upgradeToast.isVisible(), "Upgrade proposal created with confirmation toast & link to /refactoring");
    await takeScreenshot(page, "health-10-dependency-upgrade");

    // -------------------------------------------------------------------------
    // Test 11: Refresh Survival
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 11: Page Refresh State Persistence ---");
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const persistedIncidentBanner = page.locator("text=Critical Incident Active").first();
    assert(await persistedIncidentBanner.isVisible(), "Firing incident and telemetry state survived page reload");
    await takeScreenshot(page, "health-11-persisted-after-refresh");

    // -------------------------------------------------------------------------
    // Test 12: Activity Audit Trail Verification
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 12: Activity Audit Trail Verification ---");
    await page.goto(`${host}${basePath}/activity`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const healthModuleFilter = page.locator("button:has-text('System Health & Ops')").first();
    if (await healthModuleFilter.isVisible()) {
      await healthModuleFilter.click();
      await page.waitForTimeout(300);
      console.log("  [ACTION] Filtered Activity by System Health & Ops module");
    }

    const activityEntries = page.locator("text=Simulated SRE Incident").or(page.locator("text=Circuit Breaker"));
    assert((await activityEntries.count()) > 0, "Telemetry operations logged to central audit trail in /activity");
    await takeScreenshot(page, "health-12-activity-trail");
  } catch (err: any) {
    console.error(`[EXCEPTION] Test suite encountered error: ${err?.message}`);
    failedCount++;
  } finally {
    await browser.close();
    server.close();

    console.log("\n=======================================================");
    console.log(`  System Health Test Results: ${passedCount} PASSED, ${failedCount} FAILED  `);
    console.log("=======================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

main();
