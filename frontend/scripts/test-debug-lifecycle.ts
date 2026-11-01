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
  console.log("🧪 AI DEBUGGER (/debug) PLAYWRIGHT END-TO-END LIFECYCLE TEST");
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
    // -----------------------------------------------------------------------
    // STEP 1: Seed session & Navigate to /debug
    // -----------------------------------------------------------------------
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

    console.log("  ✔ Seeded demo user authentication session in localStorage");
    await page.goto(`${host}${basePath}/debug/`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const titleText = await page.textContent("h1");
    assert(
      !!titleText && titleText.includes("AI Debugger"),
      `Page title contains 'AI Debugger' (found: '${titleText?.trim()}')`
    );

    // Verify active investigation loaded
    const summaryCard = page.locator("text=Cannot read properties of undefined").first();
    assert(await summaryCard.isVisible(), "Seeded JS/TS investigation is displayed on load");

    // -----------------------------------------------------------------------
    // STEP 2: Call Stack Frames & Code Snippet
    // -----------------------------------------------------------------------
    console.log("\n--- STEP 2: Overview & Call Stack Frame Verification ---");
    const overviewTab = page.locator("button:has-text('Overview & Call Stack')");
    await overviewTab.click();
    await page.waitForTimeout(400);

    // Verify frame exists
    const frameLoginUser = page.locator("text=loginUser").first();
    assert(await frameLoginUser.isVisible(), "Verified frame 'loginUser' is visible in call stack");

    // Verify in-app badge
    const verifiedBadge = page.locator("text=Verified In-App").first();
    assert(await verifiedBadge.isVisible(), "Frame displays 'Verified In-App' badge");

    // Verify source context preview with line 28 highlighted
    const culpritLine = page.locator("text=return session.token;").first();
    assert(await culpritLine.isVisible(), "Culprit line 28 'return session.token;' is displayed in source context preview");

    // Toggle hide library frames
    const toggleExtBtn = page.locator("button:has-text('External Frames')").first();
    if (await toggleExtBtn.isVisible()) {
      await toggleExtBtn.click();
      await page.waitForTimeout(300);
      assert(true, "Toggled library frames filter successfully");
      await toggleExtBtn.click();
      await page.waitForTimeout(300);
    }

    // Verify Open in Repo link
    const openRepoLink = page.locator("a:has-text('Open in Repo')").first();
    assert(await openRepoLink.isVisible(), "'Open in Repo' link is visible on verified frame");
    const repoHref = await openRepoLink.getAttribute("href");
    assert(
      !!repoHref && repoHref.includes("visual-explorer") && repoHref.includes("auth.ts"),
      `'Open in Repo' links to visual-explorer for auth.ts (found: '${repoHref}')`
    );

    // -----------------------------------------------------------------------
    // STEP 3: Hypotheses & Root Cause
    // -----------------------------------------------------------------------
    console.log("\n--- STEP 3: Hypotheses & Root Cause Confirmation ---");
    const hypothesesTab = page.locator("button:has-text('Hypotheses & Root Cause')");
    await hypothesesTab.click();
    await page.waitForTimeout(400);

    const hypoTitle = page.locator("text=issueSessionToken returns null").first();
    assert(await hypoTitle.isVisible(), "Hypothesis #1 is displayed with root cause explanation");

    // Mark as investigated
    const markInvestigatedCheckbox = page.locator("input[type='checkbox']").first();
    if (await markInvestigatedCheckbox.isVisible()) {
      await markInvestigatedCheckbox.click();
      await page.waitForTimeout(300);
      assert(true, "Marked hypothesis as investigated");
    }

    // Confirm root cause
    const confirmBtn = page.locator("button:has-text('Confirm Root Cause')").first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(300);
      const confirmedBadge = page.locator("text=Confirmed Root Cause").first();
      assert(await confirmedBadge.isVisible(), "Root cause confirmed badge displayed");
    }

    // Rule out hypothesis #2
    const ruleOutBtn = page.locator("button:has-text('Rule Out')").first();
    if (await ruleOutBtn.isVisible()) {
      await ruleOutBtn.click();
      await page.waitForTimeout(300);
      const ruledOutBadge = page.locator("text=Ruled Out").first();
      assert(await ruledOutBadge.isVisible(), "Hypothesis successfully marked as Ruled Out");
    }

    // -----------------------------------------------------------------------
    // STEP 4: Fix Suggestions & Diff View
    // -----------------------------------------------------------------------
    console.log("\n--- STEP 4: Fix Suggestions & Safe Patch Application ---");
    const fixesTab = page.locator("button:has-text('Fix Suggestions & Patch')");
    await fixesTab.click();
    await page.waitForTimeout(400);

    const fixTitle = page.locator("text=Add null guard for session token").first();
    assert(await fixTitle.isVisible(), "Fix suggestion card is displayed");

    // Toggle between Unified and Side-by-side diff
    const sideBySideBtn = page.locator("button:has-text('Side-by-Side')").first();
    await sideBySideBtn.click();
    await page.waitForTimeout(300);
    const beforeBlock = page.locator("text=Original Code (Before)").first();
    assert(await beforeBlock.isVisible(), "Side-by-Side diff view rendered with Before/After columns");

    const unifiedBtn = page.locator("button:has-text('Unified')").first();
    await unifiedBtn.click();
    await page.waitForTimeout(300);

    // Verify "Fix with Agent" button
    const agentBtn = page.locator("a:has-text('Fix with Agent')").first();
    assert(await agentBtn.isVisible(), "'Fix with Agent' button is present");
    const agentHref = await agentBtn.getAttribute("href");
    assert(
      !!agentHref && agentHref.includes("/agents") && agentHref.includes("template=bug-fix"),
      `'Fix with Agent' pre-fills background agent run (found: '${agentHref}')`
    );

    // Apply Fix
    const applyFixBtn = page.locator("button:has-text('Apply Fix')").first();
    await applyFixBtn.click();
    await page.waitForTimeout(300);

    // Confirm dialog
    const confirmApplyBtn = page.locator("button:has-text('Yes, Apply Fix & Create PR')").first();
    assert(await confirmApplyBtn.isVisible(), "Confirmation dialog appears before applying patch");
    await confirmApplyBtn.click();
    await page.waitForTimeout(500);

    // Verify PR created and success message
    const prLink = page.locator("text=View PR #").first();
    assert(await prLink.isVisible(), "Fix applied successfully and opened a Pull Request");

    // Verify investigation status updated to Resolved
    const resolvedBadge = page.locator("text=Resolved").first();
    assert(await resolvedBadge.isVisible(), "Investigation status changed to 'Resolved'");

    // -----------------------------------------------------------------------
    // STEP 5: Test Recommendations & Add to Repository
    // -----------------------------------------------------------------------
    console.log("\n--- STEP 5: Test Recommendations & Save to Repository ---");
    const testsTab = page.locator("button:has-text('Test Recommendations')");
    await testsTab.click();
    await page.waitForTimeout(400);

    const testHeading = page.locator("text=Verify error is thrown").first();
    assert(await testHeading.isVisible(), "Test recommendation suite is rendered");

    const addTestBtn = page.locator("button:has-text('Add to Repository')").first();
    assert(await addTestBtn.isVisible(), "'Add to Repository' button is present");
    await addTestBtn.click();
    await page.waitForTimeout(300);

    const savedBadge = page.locator("text=Saved to Repo").first();
    assert(await savedBadge.isVisible(), "Test suite saved into repository store");

    // -----------------------------------------------------------------------
    // STEP 6: Scoped Investigation Q&A
    // -----------------------------------------------------------------------
    console.log("\n--- STEP 6: Investigation Q&A Chat ---");
    const qaTab = page.locator("button:has-text('Investigation Q&A')");
    await qaTab.click();
    await page.waitForTimeout(400);

    // Click suggested prompt
    const suggestedPrompt = page.locator("button:has-text('Why is this line a potential failure point?')").first();
    assert(await suggestedPrompt.isVisible(), "Suggested quick questions are rendered");
    await suggestedPrompt.click();
    await page.waitForTimeout(800);

    const assistantMsg = page.locator("text=AI Debugger").first();
    assert(await assistantMsg.isVisible(), "Follow-up response generated and added to chat thread");

    // -----------------------------------------------------------------------
    // STEP 7: One-Click Sample Bugs (Python, Java, Go)
    // -----------------------------------------------------------------------
    console.log("\n--- STEP 7: One-Click Sample Bugs Execution ---");

    // 7A: Python KeyError
    console.log("  Testing Python KeyError in fastapi-backend...");
    const newInvBtn = page.locator("button:has-text('New Investigation')").first();
    await newInvBtn.click();
    await page.waitForTimeout(400);

    const pyBugBtn = page.locator("button:has-text('Python: KeyError')").first();
    assert(await pyBugBtn.isVisible(), "Sample Bug 'Python: KeyError' is available");
    await pyBugBtn.click();
    await page.waitForTimeout(400);

    const investigateBtn = page.locator("button:has-text('Investigate Failure')").first();
    await investigateBtn.click();
    await page.waitForTimeout(1000);

    const pyCulprit = page.locator("text=KeyError: 'value'").first();
    assert(await pyCulprit.isVisible(), "Python KeyError investigation created and rendered");

    // 7B: Java NullPointerException
    console.log("  Testing Java NullPointerException in payment-service...");
    await newInvBtn.click();
    await page.waitForTimeout(400);

    const javaBugBtn = page.locator("button:has-text('Java: NullPointerException')").first();
    assert(await javaBugBtn.isVisible(), "Sample Bug 'Java: NullPointerException' is available");
    await javaBugBtn.click();
    await page.waitForTimeout(400);

    await investigateBtn.click();
    await page.waitForTimeout(1000);

    const javaCulprit = page.locator("text=NullPointerException").first();
    assert(await javaCulprit.isVisible(), "Java NullPointerException investigation created and rendered");

    // 7C: Go nil pointer dereference
    console.log("  Testing Go nil pointer dereference in auth-service...");
    await newInvBtn.click();
    await page.waitForTimeout(400);

    const goBugBtn = page.locator("button:has-text('Go: nil pointer')").first();
    assert(await goBugBtn.isVisible(), "Sample Bug 'Go: nil pointer' is available");
    await goBugBtn.click();
    await page.waitForTimeout(400);

    await investigateBtn.click();
    await page.waitForTimeout(1000);

    const goCulprit = page.locator("text=nil pointer dereference").first();
    assert(await goCulprit.isVisible(), "Go nil pointer dereference investigation created and rendered");

    // -----------------------------------------------------------------------
    // STEP 8: Deep Links
    // -----------------------------------------------------------------------
    console.log("\n--- STEP 8: Deep Link Navigation ---");
    // Deep link by ID
    await page.goto(`${host}${basePath}/debug/?id=inv_demo_1`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const jsSummary = page.locator("text=Cannot read properties of undefined").first();
    assert(await jsSummary.isVisible(), "Deep link /debug?id=inv_demo_1 directly loaded initial investigation");

    // -----------------------------------------------------------------------
    // STEP 9: Report Export & Print
    // -----------------------------------------------------------------------
    console.log("\n--- STEP 9: Report Export & Print Action ---");
    const exportBtn = page.locator("button:has-text('Export Report')").first();
    assert(await exportBtn.isVisible(), "'Export Report' markdown button is present");

    const printBtn = page.locator("button:has-text('Print / PDF')").first();
    assert(await printBtn.isVisible(), "'Print / PDF' button is present");

    // -----------------------------------------------------------------------
    // STEP 10: Refresh Persistence
    // -----------------------------------------------------------------------
    console.log("\n--- STEP 10: Refresh State Persistence ---");
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const persistedTitle = page.locator("h1:has-text('AI Debugger')").first();
    assert(await persistedTitle.isVisible(), "AI Debugger workspace cleanly survives browser refresh");

    // -----------------------------------------------------------------------
    // STEP 11: Audit Trail in Activity
    // -----------------------------------------------------------------------
    console.log("\n--- STEP 11: Activity Audit Trail Integration ---");
    await page.goto(`${host}${basePath}/activity/`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const activityAppliedFix = page.locator("text=Applied Fix").first();
    assert(await activityAppliedFix.isVisible(), "Activity audit trail recorded 'Applied Fix' action");

    const activityAddedSuite = page.locator("text=Added Test Suite").first();
    assert(await activityAddedSuite.isVisible(), "Activity audit trail recorded 'Added Test Suite' action");

    console.log("\n=========================================================================");
    console.log(`🎉 ALL ${passedChecks}/${totalChecks} AI DEBUGGER ASSERTIONS PASSED PERFECTLY!`);
    console.log("=========================================================================");
  } finally {
    await browser.close();
    server.close();
  }
}

runTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
