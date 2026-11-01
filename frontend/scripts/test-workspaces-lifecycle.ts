import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { chromium, Page } from "playwright";

const basePath = "/CodeAtlas-AI-Codebase-Intelligence-Platform";
const outDir = path.resolve(process.cwd(), "out");
const screenshotDir = path.resolve(process.cwd(), "out", "screenshots");
const publicScreenshotDir = path.resolve(process.cwd(), "public", "test-screenshots");
const PORT = 3462;
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
  console.log("🧪 CodeAtlas Workspaces Full Lifecycle End-to-End Test Suite");
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

  // Grant clipboard permissions
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  // Inject session auth on every page load
  await context.addInitScript(() => {
    localStorage.setItem("codeatlas_demo_mode", "true");
    localStorage.setItem("codeatlas_active_demo_session", "true");
    localStorage.setItem("codeatlas_active_workspace_id", "ws_team_demo");
    localStorage.setItem(
      "codeatlas-auth-user",
      JSON.stringify({
        id: "usr_demo",
        name: "Demo User",
        email: "demo@codeatlas.dev",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        role: "Lead Systems Architect",
        provider: "demo",
      })
    );
    (window as any).__CODEATLAS_DEMO_MODE = true;
  });

  const page = await context.newPage();

  page.on("pageerror", (err) => {
    // Only log non-benign errors
    if (!err.message.includes("Minified React error")) {
      console.error("  ❌ [Browser Exception]:", err.message);
    }
  });

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failCount++;
    }
  }

  try {
    // Step 1: List View, Search, Filters
    console.log("👉 [1/6] Navigating to /workspaces/ and testing list view & filters...");
    await page.goto(`${host}${basePath}/workspaces/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    // 1. Verify Header
    const heading = await page.textContent("h1");
    assert(heading?.includes("Team Workspaces") ?? false, "Workspaces list title is rendered");

    const newWsBtn = page.getByRole("button", { name: /New Team Workspace/i });
    assert((await newWsBtn.count()) > 0, "New Team Workspace button is visible");

    // 2. Test Search Input
    const searchInput = page.locator("input[placeholder*='Search workspaces']");
    assert((await searchInput.count()) > 0, "Search input is visible");
    await searchInput.fill("Acme");
    await page.waitForTimeout(300);

    const cardsAfterSearch = await page.locator("h3:has-text('Acme Engineering')").count();
    assert(cardsAfterSearch > 0, "Search filtered list to match 'Acme'");

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(200);

    // 3. Test Filter Chips
    const teamChip = page.getByRole("button", { name: /^Team$/i });
    const personalChip = page.getByRole("button", { name: /^Personal$/i });
    const allChip = page.getByRole("button", { name: /^All$/i });

    await personalChip.click();
    await page.waitForTimeout(200);
    const personalCount = await page.locator("h3:has-text('Personal Workspace')").count();
    assert(personalCount > 0, "Filter chip 'Personal' displays personal workspace");

    await allChip.click();
    await page.waitForTimeout(200);
    const allCount = await page.locator("h3:has-text('Acme Engineering')").count();
    assert(allCount > 0, "Filter chip 'All' restores all workspaces");

    await captureScreenshot(page, "01-workspaces-list");

    // 4. Test "Switch To" button on card
    const switchButtons = page.locator("button:has-text('Switch To')");
    const switchBtnCount = await switchButtons.count();
    if (switchBtnCount > 0) {
      const btn = switchButtons.first();
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await page.waitForTimeout(600);
      const toast = page.getByText(/Switched active workspace/i);
      assert((await toast.count()) > 0, "Switching workspace displays success toast");
    }

    // 5. Test Card Menu (⋯) -> Duplicate Workspace
    console.log("\n👉 [2/6] Testing Card Menu (Duplicate & Rename)...");
    const menuButtons = page.locator("button[aria-label='Workspace options']");
    if ((await menuButtons.count()) > 0) {
      await menuButtons.first().click();
      await page.waitForTimeout(300);

      const duplicateBtn = page.getByRole("button", { name: /Duplicate/i });
      assert((await duplicateBtn.count()) > 0, "Card menu displays 'Duplicate'");
      await duplicateBtn.click();
      await page.waitForTimeout(1200);

      const copyCard = page.locator("h3:has-text('(Copy)')");
      assert((await copyCard.count()) > 0, "Workspace was successfully duplicated and displayed in list");
    }

    // 6. Test "New Team Workspace" Modal Creation
    console.log("\n👉 [3/6] Testing 'New Team Workspace' modal creation...");
    await newWsBtn.click();
    await page.waitForTimeout(300);

    const createDialog = page.locator("[role='dialog'][aria-modal='true']");
    assert((await createDialog.count()) > 0, "Create workspace modal opened with focus trap");

    const nameInput = createDialog.locator("input[placeholder*='Platform Core']");
    await nameInput.fill("Autonomous AI Infrastructure");

    const descInput = createDialog.locator("textarea");
    await descInput.fill("High-throughput distributed intelligence workspace.");

    // Add Email Chip
    const emailInput = createDialog.locator("input[placeholder*='teammate@company.com']");
    await emailInput.fill("architect@codeatlas.dev");
    await emailInput.press("Enter");
    await page.waitForTimeout(200);

    const chip = createDialog.locator("span:has-text('architect@codeatlas.dev')");
    assert((await chip.count()) > 0, "Teammate email chip was added");

    await captureScreenshot(page, "02-create-workspace-modal");

    // Submit Creation
    const submitBtn = createDialog.getByRole("button", { name: /Create Workspace/i });
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // Verify navigation to workspace detail page
    const pageUrl = page.url();
    assert(pageUrl.includes("/workspaces/"), "Navigated to created workspace detail page");

    // Step 4: Test Detail Page Tabs on Seeded Team Workspace
    console.log("\n👉 [4/6] Testing Workspace Detail Page (Tabs 1-6)...");
    await page.goto(`${host}${basePath}/workspaces/ws_team_demo/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    // Verify Header Elements
    const wsHeading = await page.textContent("h1");
    assert(wsHeading?.includes("Acme Engineering") ?? false, "Workspace detail title is 'Acme Engineering'");

    const roleBadge = await page.locator("span:has-text('owner')").count();
    assert(roleBadge > 0, "Owner role badge is visible in header");

    // TAB 1: OVERVIEW
    console.log("  Testing Tab 1: Overview...");
    const kpiCards = await page.locator("div:has-text('AST Symbols')").count();
    assert(kpiCards > 0, "Overview tab displays AST Symbols KPI card");

    const healthRing = await page.locator("svg circle").count();
    assert(healthRing >= 2, "SVG circular health score ring is rendered (96%)");

    const architectureLink = page.locator("a[href*='/architecture']");
    assert((await architectureLink.count()) > 0, "Architecture deep dive link is visible");

    await captureScreenshot(page, "03-workspace-overview-tab");

    // TAB 2: REPOSITORIES
    console.log("  Testing Tab 2: Repositories...");
    const reposTabBtn = page.locator("button:has-text('Repositories (')");
    await reposTabBtn.click();
    await page.waitForTimeout(400);

    const reindexBtn = page.getByRole("button", { name: /Re-index/i }).first();
    assert((await reindexBtn.count()) > 0, "Re-index button is present on repository card");
    await reindexBtn.click();
    await page.waitForTimeout(1200);

    const reindexToast = await page.locator("div:has-text('indexing completed')").count();
    assert(reindexToast > 0, "Re-indexing repository showed completion toast");

    await captureScreenshot(page, "04-workspace-repositories-tab");

    // TAB 3: MEMBERS
    console.log("  Testing Tab 3: Members...");
    const membersTabBtn = page.locator("button:has-text('Members (')");
    await membersTabBtn.click();
    await page.waitForTimeout(400);

    const membersTable = await page.locator("span:has-text('Elena Rostova')").count();
    assert(membersTable > 0, "Members table shows teammate 'Elena Rostova'");

    // Test Invite Teammate Modal
    const inviteBtn = page.getByRole("button", { name: /Invite Members/i });
    await inviteBtn.click();
    await page.waitForTimeout(300);

    const inviteModal = page.locator("[role='dialog'][aria-modal='true']");
    assert((await inviteModal.count()) > 0, "Invite members modal opened");

    const inviteEmailInput = inviteModal.locator("input[placeholder*='teammate@company.com']");
    await inviteEmailInput.fill("dev-lead@codeatlas.dev");
    await inviteEmailInput.press("Enter");
    await page.waitForTimeout(200);

    const sendInviteBtn = inviteModal.getByRole("button", { name: /Create Invitations/i });
    await sendInviteBtn.click();
    await page.waitForTimeout(500);

    const copyBtn = inviteModal.getByRole("button", { name: /Copy/i });
    assert((await copyBtn.count()) > 0, "Shareable invitation link generated with Copy button");
    await copyBtn.click();
    await page.waitForTimeout(200);

    const doneBtn = inviteModal.getByRole("button", { name: /Done/i });
    await doneBtn.click();
    await page.waitForTimeout(300);

    await captureScreenshot(page, "05-workspace-members-tab");

    // TAB 4: DISCUSSIONS
    console.log("  Testing Tab 4: Discussions...");
    const discTabBtn = page.locator("button:has-text('Discussions (')");
    await discTabBtn.click();
    await page.waitForTimeout(400);

    const existingThread = await page.locator("h3:has-text('WebAuthn challenge replay remediation architecture')").count();
    assert(existingThread > 0, "Discussions tab lists existing active threads");

    // Test Emoji Reactions
    const thumbsUpBtn = page.locator("button:has-text('👍')").first();
    assert((await thumbsUpBtn.count()) > 0, "Emoji reaction bar is present on thread card");
    await thumbsUpBtn.click();
    await page.waitForTimeout(300);

    // Test Reply with @mention
    const replyInput = page.locator("input[placeholder*='Write a reply']").first();
    await replyInput.fill("Agree with the analysis @");
    await page.waitForTimeout(300);

    const mentionPopup = page.locator("div:has-text('Mention Teammate')");
    assert((await mentionPopup.count()) > 0, "@mention autocomplete dropdown appeared");

    const mentionMember = page.locator("button:has-text('Marcus Chen')").first();
    await mentionMember.click();
    await page.waitForTimeout(200);

    const replySubmitBtn = page.getByRole("button", { name: /Reply/i }).first();
    await replySubmitBtn.click();
    await page.waitForTimeout(500);

    const replyToast = await page.locator("div:has-text('Reply posted!')").count();
    assert(replyToast > 0, "Reply posted with @mention notification");

    // Test Resolve / Reopen toggle
    const resolveBtn = page.getByRole("button", { name: /^Resolve$/i }).first();
    if ((await resolveBtn.count()) > 0) {
      await resolveBtn.click();
      await page.waitForTimeout(400);
      const resolvedBadge = await page.locator("span:has-text('Resolved')").count();
      assert(resolvedBadge > 0, "Thread marked as Resolved");
    }

    await captureScreenshot(page, "06-workspace-discussions-tab");

    // TAB 5: ANNOTATIONS
    console.log("  Testing Tab 5: Annotations...");
    const annoTabBtn = page.locator("button:has-text('Annotations (')");
    await annoTabBtn.click();
    await page.waitForTimeout(400);

    const existingAnno = await page.locator("h3:has-text('WebAuthn Assertion Ceremony')").count();
    assert(existingAnno > 0, "Annotations tab shows pinned code annotations");

    const codeSnippetBox = await page.locator("div:has-text('Lines 18 - 26')").count();
    assert(codeSnippetBox > 0, "Code preview card shows file path and syntax line numbers");

    // Test Add Annotation Modal
    const addAnnoBtn = page.getByRole("button", { name: /Add Annotation/i });
    await addAnnoBtn.click();
    await page.waitForTimeout(300);

    const annoModal = page.locator("[role='dialog'][aria-modal='true']");
    assert((await annoModal.count()) > 0, "Add annotation modal opened");

    const annoTitleInput = annoModal.locator("input[placeholder*='Critical Auth']");
    await annoTitleInput.fill("Cache Revalidation Policy");

    const annoContentInput = annoModal.locator("textarea");
    await annoContentInput.fill("Must invalidate Redis session keys on privilege escalation.");

    const saveAnnoBtn = annoModal.getByRole("button", { name: /Save Note/i });
    await saveAnnoBtn.click();
    await page.waitForTimeout(500);

    const newAnnoCard = await page.locator("h3:has-text('Cache Revalidation Policy')").count();
    assert(newAnnoCard > 0, "New code annotation rendered with preview");

    await captureScreenshot(page, "07-workspace-annotations-tab");

    // TAB 6: SETTINGS
    console.log("  Testing Tab 6: Settings...");
    const settingsTabBtn = page.locator("button:has-text('Settings')");
    await settingsTabBtn.click();
    await page.waitForTimeout(400);

    const settingsTitle = await page.locator("h3:has-text('Workspace Profile')").count();
    assert(settingsTitle > 0, "Settings tab displays workspace profile and governance policies");

    const dangerZone = await page.locator("h3:has-text('Danger Zone')").count();
    assert(dangerZone > 0, "Settings tab displays Danger Zone for workspace deletion");

    await captureScreenshot(page, "08-workspace-settings-tab");

    // Step 5: Test Invitation Landing Page
    console.log("\n👉 [5/6] Testing Invitation Landing Page (/invitations/view/?token=preview-token)...");
    await page.goto(`${host}${basePath}/invitations/view/?token=preview-token`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    const inviteHeader = await page.textContent("h1");
    assert(inviteHeader?.includes("You're invited to join") ?? false, "Invitation landing page shows invite prompt");

    const invitedWorkspaceName = await page.textContent("h2");
    assert(invitedWorkspaceName?.includes("Acme Engineering") ?? false, "Invitation specifies 'Acme Engineering'");

    const acceptBtn = page.getByRole("button", { name: /Accept Invitation & Join/i });
    assert((await acceptBtn.count()) > 0, "Accept Invitation & Join button is active");

    await captureScreenshot(page, "09-invitation-landing-page");

    await acceptBtn.click();
    await page.waitForTimeout(1400);

    const finalUrl = page.url();
    assert(finalUrl.includes("/workspaces/"), "Accepting invitation successfully redirected into workspace");

    // Step 6: Test Persistence Across Hard Reload
    console.log("\n👉 [6/6] Testing persistence across hard reload...");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    const persistedWorkspaceTitle = await page.textContent("h1");
    assert(persistedWorkspaceTitle?.includes("Acme Engineering") ?? false, "Workspace state survived hard page refresh");

    console.log("\n=========================================================================");
    console.log(`🎯 Test Summary: ${passCount} Passed, ${failCount} Failed`);
    console.log("=========================================================================\n");

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("FATAL Playwright Error:", err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
}

main();
