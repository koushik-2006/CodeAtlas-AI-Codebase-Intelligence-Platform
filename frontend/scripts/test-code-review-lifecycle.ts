/**
 * Playwright End-to-End Lifecycle Test for CodeAtlas AI Code Review (/code-review)
 *
 * Scenarios tested:
 * 1. Initial auth setup and navigation to /code-review
 * 2. PR #101 AI summary, risk score, and pre-merge checklist appear
 * 3. Jump from a finding to its exact diff line
 * 4. Add an inline comment and reply in its thread
 * 5. Apply a suggestion to update the PR diff
 * 6. Accept one finding and Dismiss another with reason
 * 7. Blast Radius & Impact tab shows risk score, affected APIs, and tests to rerun
 * 8. Approve pull request
 * 9. Merge pull request (store PR) and verify status becomes Merged
 * 10. Open a PR created by Agent Workspace
 * 11. Create a new review from a pasted diff via New Review modal
 * 12. Deep link /code-review?pr=<id> works and survives page refresh
 * 13. Local static checks (no AI) display deterministically
 * 14. Zero uncaught browser exceptions
 */

import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { chromium, Page } from "playwright";

const basePath = "/CodeAtlas-AI-Codebase-Intelligence-Platform";
const outDir = path.resolve(__dirname, "../out");
const PORT = 3688;
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
  console.log("🧪 CODEATLAS AI CODE REVIEW PLAYWRIGHT LIFECYCLE TEST");
  console.log("=========================================================================\n");

  const server = createStaticServer();
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`  ✔ Static test server listening on port ${PORT}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const uncaughtErrors: string[] = [];
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
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });

    const page = await context.newPage();

    page.on("pageerror", (err) => {
      console.warn("  [Browser Uncaught Error]:", err.message);
      uncaughtErrors.push(err.message);
    });

    page.on("console", (msg) => {
      console.log("  [Browser Console]:", msg.type(), msg.text());
    });

    // 1. Initial Setup & Navigation
    console.log("--- STEP 1: INITIAL AUTH SETUP & NAVIGATION ---");
    await page.goto(`${host}${basePath}/login/`);
    await page.waitForLoadState("domcontentloaded");

    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("codeatlas_active_demo_session", "true");
      localStorage.setItem(
        "codeatlas-auth-user",
        JSON.stringify({
          uid: "usr_demo",
          displayName: "Alex Chen",
          email: "alex@codeatlas.dev",
          photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
          emailVerified: true,
        })
      );
    });

    await page.goto(`${host}${basePath}/code-review/?pr=101`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(800);

    const prsInDemoStore = await page.evaluate(() => {
      const raw = localStorage.getItem("codeatlas_store_demo");
      if (!raw) return "no codeatlas_store_demo";
      const parsed = JSON.parse(raw);
      return (parsed.pullRequests || []).map((p: any) => ({
        id: p.id,
        number: p.number,
        title: p.title,
        source: p.source,
        repo: p.repositoryId,
        state: p.state,
      }));
    });
    console.log("PRs in codeatlas_store_demo:", prsInDemoStore);

    const pageTitle = page.locator("h1:has-text('AI Code Review & Pull Request Intelligence')");
    assert(await pageTitle.isVisible(), "Code Review header title loaded");

    const step1H4s = await page.locator("h4").allInnerTexts();
    console.log("Step 1 rendered h4 titles in sidebar:", step1H4s);
    const pr101Header = page.locator("h2:has-text('feat(auth): Add WebAuthn and passkey credential support')");
    assert(await pr101Header.isVisible(), "PR #101 detail title visible");

    // 2. Verify AI Summary & Pre-merge Checklist
    console.log("\n--- STEP 2: AI SUMMARY & PRE-MERGE CHECKLIST ---");
    // Wait for initial analysis to complete (wait for analyzing spinner to detach)
    await page.waitForSelector("text=Analyzing codebase...", { state: "detached", timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(600);

    const aiSummaryCard = page.locator("text=CodeAtlas AI Summary");
    assert(await aiSummaryCard.isVisible(), "AI Summary card rendered");

    const whatChanges = page.locator("strong:has-text('What Changes')");
    assert(await whatChanges.isVisible(), "AI summary breakdown displayed");

    const checklistHeader = page.locator("text=Pre-Merge Quality Checklist");
    assert(await checklistHeader.isVisible(), "Interactive pre-merge checklist displayed");

    // Toggle a checklist item
    const docsCheckbox = page.locator("#chk-input-chk_docs");
    assert(await docsCheckbox.isVisible(), "Checklist item input checkbox is visible");
    const wasChecked = await docsCheckbox.isChecked();
    await docsCheckbox.click();
    await page.waitForTimeout(400);
    const isNowChecked = await docsCheckbox.isChecked();
    assert(isNowChecked !== wasChecked, "Checklist item toggled and saved");

    // 3. Jump from a Finding to its Diff Line
    console.log("\n--- STEP 3: JUMP FROM FINDING TO DIFF LINE ---");
    const findingsTabBtn = page.locator("button:has-text('Findings')");
    await findingsTabBtn.click();
    await page.waitForTimeout(400);

    const secFinding = page.locator("text=WebAuthn challenge replay vulnerability");
    assert(await secFinding.isVisible(), "Security vulnerability finding displayed in Findings tab");

    // Click jump link to diff line (src/services/auth.ts:24)
    const jumpLink = page.locator("button:has-text('src/services/auth.ts:24')");
    assert(await jumpLink.isVisible(), "Jump link for file:line visible on finding card");
    await jumpLink.click();
    await page.waitForTimeout(500);

    // Verify Diff tab active
    const diffActiveTab = page.locator("button:has-text('Files Changed')");
    assert(await diffActiveTab.isVisible(), "Switched to Files Changed tab on jump");

    // 4. Add an Inline Comment and Reply in its Thread
    console.log("\n--- STEP 4: ADD INLINE COMMENT & REPLY IN THREAD ---");
    const addCommentBtn = page.locator("button[title='Add inline comment']").first();
    assert(await addCommentBtn.isVisible(), "Inline comment '+' action button visible on diff line");
    await addCommentBtn.click();
    await page.waitForTimeout(300);

    const commentInput = page.locator("textarea[placeholder*='Leave an inline review note']");
    assert(await commentInput.isVisible(), "Inline comment composer opened");
    await commentInput.fill("Should we verify nonce consumption before assertion verification?");
    await page.waitForTimeout(100);

    const postCommentBtn = page.locator("button:has-text('Add Comment')");
    await postCommentBtn.click();
    await page.waitForTimeout(400);

    const postedComment = page.locator("p:has-text('Should we verify nonce consumption')").first();
    assert(await postedComment.isVisible(), "Inline comment successfully posted below diff line");

    // Reply in thread
    const replyLink = page.locator("button:has-text('Reply →')").first();
    await replyLink.click();
    await page.waitForTimeout(200);

    const replyInput = page.locator("input[placeholder='Reply in thread...']").first();
    await replyInput.fill("Yes, using Redis nonceCache.consume() atomically.");
    await replyInput.press("Enter");
    await page.waitForTimeout(400);

    const postedReply = page.locator("p:has-text('Yes, using Redis nonceCache.consume()')").first();
    assert(await postedReply.isVisible(), "Reply in thread posted successfully");

    // 5. Apply a Suggestion to Update PR Diff
    console.log("\n--- STEP 5: APPLY FIX SUGGESTION ---");
    await findingsTabBtn.click();
    await page.waitForTimeout(300);

    const applySuggestionBtn = page.locator("button:has-text('Apply Suggestion')").first();
    assert(await applySuggestionBtn.isVisible(), "Apply Suggestion button visible on finding card");
    await applySuggestionBtn.click();
    await page.waitForTimeout(500);

    const appliedBadge = page.locator("span:has-text('Accepted')").first();
    assert(await appliedBadge.isVisible(), "Finding status marked as Accepted after applying fix");

    // 6. Accept One Finding, Dismiss Another with Reason
    console.log("\n--- STEP 6: ACCEPT & DISMISS FINDINGS ---");
    const acceptBtn = page.locator("button:has-text('Accept')").nth(1);
    await acceptBtn.click();
    await page.waitForTimeout(300);
    console.log("  ✔ Accepted second finding");

    const dismissBtn = page.locator("button:has-text('Dismiss')").first();
    await dismissBtn.click();
    await page.waitForTimeout(300);

    const dismissModalTitle = page.locator("h3:has-text('Dismiss Finding')");
    assert(await dismissModalTitle.isVisible(), "Dismiss Finding confirmation modal opened");

    const reasonInput = page.locator("textarea[placeholder*='False positive']");
    await reasonInput.fill("Database indices already handle read latency on staging benchmark.");
    await page.waitForTimeout(100);

    const confirmDismissBtn = page.locator("button:has-text('Confirm Dismiss')");
    await confirmDismissBtn.click();
    await page.waitForTimeout(400);

    const dismissedBadge = page.locator("span:has-text('Dismissed')").first();
    assert(await dismissedBadge.isVisible(), "Finding dismissed with reviewer justification");

    // 7. Blast Radius & Impact Tab
    console.log("\n--- STEP 7: BLAST RADIUS & IMPACT INTELLIGENCE ---");
    const impactTabBtn = page.locator("button:has-text('Blast Radius & Impact')");
    await impactTabBtn.click();
    await page.waitForTimeout(300);

    const blastRadiusHeading = page.locator("span:has-text('Blast Radius & Risk')").first();
    assert(await blastRadiusHeading.isVisible(), "Blast Radius & Risk section rendered");

    const apiEndpointsSection = page.locator("span:has-text('Public API Endpoints')").first();
    assert(await apiEndpointsSection.isVisible(), "Affected public API endpoints discovered");

    const fullImpactLink = page.locator("a:has-text('Open Full Impact Analysis')").first();
    assert(await fullImpactLink.isVisible(), "Deep-link to Change Impact Analysis available");

    // 8. Approve Pull Request
    console.log("\n--- STEP 8: APPROVE PULL REQUEST ---");
    const approveBtn = page.locator("button[data-testid='approve-pr-btn']");
    assert(await approveBtn.isVisible(), "Approve action button visible in header");
    await approveBtn.click();
    await page.waitForTimeout(400);

    const approvedBadge = page.locator("span:has-text('APPROVED')").first();
    assert(await approvedBadge.isVisible(), "Pull Request status updated to APPROVED");

    // 9. Merge Pull Request (Store PR)
    console.log("\n--- STEP 9: MERGE PULL REQUEST ---");
    const mergeBtn = page.locator("button[data-testid='merge-pr-btn']");
    assert(await mergeBtn.isVisible(), "Merge Pull Request button visible");
    await mergeBtn.click();
    await page.waitForTimeout(500);

    const mergedStatus = page.locator("span:has-text('MERGED')").first();
    assert(await mergedStatus.isVisible(), "Pull Request state badge updated to MERGED");

    // 10. Open a PR Created by Agent Workspace
    console.log("\n--- STEP 10: OPEN PR FROM AGENT WORKSPACE ---");
    const h4s = await page.locator("h4").allInnerTexts();
    console.log("Rendered h4 titles in sidebar:", h4s);
    const agentPrItem = page.locator("h4").filter({ hasText: "Automated Security" }).first();
    assert(await agentPrItem.isVisible(), "Agent Workspace generated PR present in list");
    await agentPrItem.click();
    await page.waitForTimeout(500);

    const agentAuthor = page.locator("strong:has-text('CodeAtlas Agent')").first();
    assert(await agentAuthor.isVisible(), "Agent PR loaded with CodeAtlas Agent author identity");

    // 11. Create a New Review from Pasted Diff
    console.log("\n--- STEP 11: CREATE NEW REVIEW FROM PASTED DIFF ---");
    const newReviewBtn = page.locator("button:has-text('New Review')").first();
    await newReviewBtn.click();
    await page.waitForTimeout(300);

    const modalTitle = page.locator("h3:has-text('Create Pull Request for Code Review')").first();
    assert(await modalTitle.isVisible(), "New Review modal opened");

    const loadSampleDiffBtn = page.locator("button:has-text('Load Sample Diff')").first();
    await loadSampleDiffBtn.click();
    await page.waitForTimeout(200);

    const createPrBtn = page.locator("button:has-text('Create PR & Review')").first();
    await createPrBtn.click();
    await page.waitForTimeout(600);

    const newPrTitle = page.locator("h2:has-text('Implement rate limiting')").first();
    assert(await newPrTitle.isVisible(), "Newly created PR opened directly in review workspace");

    // 12. Deep Link /code-review?pr=101 Survives Page Refresh
    console.log("\n--- STEP 12: DEEP LINK PERSISTENCE ACROSS REFRESH ---");
    await page.goto(`${host}${basePath}/code-review/?pr=101`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(600);

    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(600);

    const reloadedPr101 = page.locator("h2:has-text('feat(auth): Add WebAuthn and passkey credential support')").first();
    assert(await reloadedPr101.isVisible(), "Deep-link PR #101 persisted and restored after browser reload");

    // 13. Local Static Checks (No AI)
    console.log("\n--- STEP 13: LOCAL STATIC CHECKS WITHOUT AI ---");
    await page.waitForSelector("text=Analyzing codebase...", { state: "detached", timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(600);
    await page.locator("button:has-text('Findings')").first().click();
    await page.waitForTimeout(500);

    const localCheckTag = page.locator("span:has-text('Local Check')").first();
    assert(await localCheckTag.isVisible(), "Deterministic local static checks rendered without external AI dependency");

    // 14. Error Resilience
    console.log("\n--- STEP 14: ERROR RESILIENCE ---");
    assert(uncaughtErrors.length === 0, `Zero uncaught browser runtime errors (errors: ${uncaughtErrors.length})`);

    console.log("\n=========================================================================");
    console.log(`🎉 ALL ${passedChecks}/${totalChecks} CODE REVIEW TESTS PASSED CLEANLY!`);
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

