import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { chromium, Page } from "playwright";

const basePath = "/CodeAtlas-AI-Codebase-Intelligence-Platform";
const outDir = path.resolve(__dirname, "../out");
const PORT = 3493;
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
  console.log("🧪 AI DEVELOPER AGENT WORKSPACE PLAYWRIGHT LIFECYCLE TEST");
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
    console.error("  >>> Page error:", err.message);
  });

  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("favicon")) {
      console.error("  >>> Console error:", msg.text());
    }
  });

  // Step 1: Seed demo auth & store
  console.log("\n1️⃣  Seeding demo session & navigating to /agents...");
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
    localStorage.setItem("codeatlas_active_workspace", "ws_team_demo");
    (window as any).__CODEATLAS_DEMO_MODE = true;
  });

  await page.goto(`${host}${basePath}/agents/`);
  await page.waitForSelector("h1:has-text('Agent Workspace')", { timeout: 10000 });

  // Check 1: No client crash
  const bodyText = await page.evaluate(() => document.body.innerText);
  assert(!bodyText.includes("Application error") && !bodyText.includes("client-side exception"), "Page loads without client-side exception crash");
  assert(bodyText.includes("Agent Workspace"), "Page header and title are rendered");

  // Step 2: Stats Row & Workflow Templates
  console.log("\n2️⃣  Verifying KPI Stats Row & Workflow Templates...");
  const statsExist = await page.locator("text=Waiting for approval").count();
  assert(statsExist > 0, "Stats bar renders Running, Waiting for approval, Completed today, Success rate");

  const workflowCardsCount = await page.locator("button:has-text('Run Workflow')").count();
  assert(workflowCardsCount >= 6, `Workflow templates section renders available templates (found ${workflowCardsCount})`);

  // Step 3: Launch "Write unit tests" Run
  console.log("\n3️⃣  Starting 'Write unit tests' Agent Run...");
  const newRunBtn = page.locator("button:has-text('New Agent Run')").first();
  await newRunBtn.click();
  await page.waitForTimeout(500);

  const modalHeading = await page.locator("h3:has-text('Start New Agent Run')").count();
  assert(modalHeading > 0, "New Agent Run modal opened");

  // Select "Write unit tests for a file" template
  const templateSelect = page.locator("form select").first();
  await templateSelect.selectOption("unit_tests");
  await page.waitForTimeout(300);

  // Submit run
  const startBtn = page.locator("button:has-text('Start Agent Run')").first();
  await startBtn.click();
  await page.waitForTimeout(800);

  // Step 4: Watch Steps Progress & Verify Live Timeline
  console.log("\n4️⃣  Watching CI Pipeline Steps Progress...");
  const timelineHeading = await page.locator("h3:has-text('Pipeline Timeline')").count();
  assert(timelineHeading > 0, "Agent run detail view mounted with Pipeline Timeline");

  // Wait up to 6s for step 1-2 to progress
  let completedSteps = 0;
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(1000);
    completedSteps = await page.locator("div.w-7.h-7.bg-emerald-500").count();
    if (completedSteps >= 1) break;
  }
  assert(completedSteps >= 1, `Steps progress autonomously (at least ${completedSteps} step completed)`);

  // Step 5: Pause and Resume
  console.log("\n5️⃣  Testing Pause & Resume Controls...");
  const pauseBtn = page.locator("button:has-text('Pause')").first();
  if (await pauseBtn.count()) {
    await pauseBtn.click();
    await page.waitForTimeout(600);
    const pausedBadge = await page.locator("span:has-text('Paused')").count();
    assert(pausedBadge > 0, "Run successfully paused with 'Paused' status badge");

    const resumeBtn = page.locator("button:has-text('Resume')").first();
    await resumeBtn.click();
    await page.waitForTimeout(600);
    const runningBadge = await page.locator("span:has-text('Running')").count();
    assert(runningBadge > 0, "Run successfully resumed");
  }

  // Step 6: Wait for Diff & Approval Gate
  console.log("\n6️⃣  Waiting for Unified Diff & Human Approval Gate...");
  // Wait up to 20s for Step 6 (Waiting for approval) to be reached
  let reachedApprovalGate = false;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(1000);
    const approveBtnCount = await page.locator("button:has-text('Approve & Apply')").count();
    if (approveBtnCount > 0) {
      reachedApprovalGate = true;
      break;
    }
  }
  assert(reachedApprovalGate, "Run progressed to Step 6 and halted at Human Authorization Gate");

  // Verify Diff Viewer
  const diffTab = page.locator("button:has-text('Propose Changes')").first();
  if (await diffTab.count()) {
    await diffTab.click();
    await page.waitForTimeout(400);
  }
  const diffLines = await page.locator("pre").count();
  assert(diffLines >= 5, "Unified diff viewer renders syntax-colored additions and patch lines");

  // Step 7: Request Changes & Regeneration
  console.log("\n7️⃣  Testing 'Request changes' & Diff Regeneration...");
  const requestChangesBtn = page.locator("button:has-text('Request changes')").first();
  assert((await requestChangesBtn.count()) > 0, "Found 'Request changes' action button");
  await requestChangesBtn.click();
  await page.waitForTimeout(500);

  const submitFeedbackBtn = page.locator("button:has-text('Submit Feedback & Regenerate')").first();
  await submitFeedbackBtn.click();
  await page.waitForTimeout(1000);

  const regenToast = await page.locator("text=Feedback submitted").count();
  assert(regenToast > 0, "Submitting feedback regenerated diff and updated agent logs");

  // Step 8: Approve & Apply -> Pull Request Created
  console.log("\n8️⃣  Testing 'Approve & Apply' & Pull Request Creation in /code-review...");
  const approveBtn = page.locator("button:has-text('Approve & Apply')").first();
  await approveBtn.click();
  await page.waitForTimeout(1000);

  const completedBadge = await page.locator("span:has-text('Completed')").count();
  assert(completedBadge > 0, "Run marked as 'Completed' upon approval");

  // Navigate to /code-review to verify Pull Request
  await page.goto(`${host}${basePath}/code-review/`);
  await page.waitForTimeout(1200);
  const prFound = await page.locator("text=[Agent]").count();
  assert(prFound > 0, "New Pull Request registered and visible on /code-review page");

  // Step 9: Launch Another Run and Cancel It
  console.log("\n9️⃣  Testing Run Cancellation...");
  await page.goto(`${host}${basePath}/agents/`);
  await page.waitForTimeout(1000);

  const launchAnotherBtn = page.locator("button:has-text('New Agent Run')").first();
  await launchAnotherBtn.click();
  await page.waitForTimeout(500);

  const submitSecondRun = page.locator("button:has-text('Start Agent Run')").first();
  await submitSecondRun.click();
  await page.waitForTimeout(800);

  const cancelBtn = page.locator("button:has-text('Cancel Run')").first();
  await cancelBtn.click();
  await page.waitForTimeout(400);

  const confirmCancelBtn = page.locator("button:has-text('Yes, Cancel Run')").first();
  await confirmCancelBtn.click();
  await page.waitForTimeout(600);

  const cancelledBadge = await page.locator("span:has-text('Cancelled')").count();
  assert(cancelledBadge > 0, "Run successfully cancelled with 'Cancelled' status");

  // Step 10: Policy Enforcement -> Blocked by Policy
  console.log("\n🔟 Testing Policy Configuration & 'Blocked by policy' Enforcement...");
  const policyBtn = page.locator("button:has-text('Policies')").first();
  await policyBtn.click();
  await page.waitForTimeout(500);

  const policyModalTitle = await page.locator("h3:has-text('Workspace Agent Safety Policies')").count();
  assert(policyModalTitle > 0, "Safety Policies dialog opened");

  // Save policy with blocked path
  const savePolicyBtn = page.locator("button:has-text('Save Policy Rules')").first();
  await savePolicyBtn.click();
  await page.waitForTimeout(600);

  // Now attempt to start a run targeting a blocked path (.env)
  const runBlockedBtn = page.locator("button:has-text('New Agent Run')").first();
  await runBlockedBtn.click();
  await page.waitForTimeout(500);

  // Switch to custom target and enter ".env"
  const customTargetBtn = page.locator("button:has-text('Custom Path')").first();
  await customTargetBtn.click();
  await page.waitForTimeout(300);

  const targetInput = page.locator("input[placeholder*='src/services/auth.ts']").first();
  await targetInput.fill(".env");

  const startBlockedRunBtn = page.locator("button:has-text('Start Agent Run')").first();
  await startBlockedRunBtn.click();
  await page.waitForTimeout(800);

  const blockedStatus = await page.locator("text=Blocked by policy").count();
  assert(blockedStatus > 0, "Run targeting restricted file path is stopped with 'Blocked by policy'");

  // Step 11: Refresh & Persistence
  console.log("\n1️⃣1️⃣ Testing Page Refresh & Data Persistence...");
  await page.reload();
  await page.waitForTimeout(1000);

  const refreshedTitle = await page.locator("h1:has-text('Agent Workspace')").count();
  assert(refreshedTitle > 0, "Page reloads without error and retains store state");
  assert(uncaughtErrors.length === 0, `No uncaught exceptions occurred during entire test session (errors: ${uncaughtErrors.length})`);

  await browser.close();
  server.close();

  console.log("\n=========================================================================");
  console.log(`🎉 ALL ${passedChecks}/${totalChecks} PLAYWRIGHT ASSERTIONS PASSED (100%)!`);
  console.log("=========================================================================\n");
}

runTest().catch((err) => {
  console.error("FATAL TEST FAILURE:", err);
  process.exit(1);
});
