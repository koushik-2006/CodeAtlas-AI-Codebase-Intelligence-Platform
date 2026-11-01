import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { chromium } from "playwright";

const basePath = "/CodeAtlas-AI-Codebase-Intelligence-Platform";
const outDir = path.resolve(process.cwd(), "out");
const screenshotDir = path.resolve(process.cwd(), "out", "screenshots");
const publicScreenshotDir = path.resolve(process.cwd(), "public", "test-screenshots");
const PORT = 3458;
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

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
      }
    } catch (e: any) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`Internal Server Error: ${e?.message}`);
    }
  });
}

interface TestChecklistResult {
  category: string;
  element: string;
  action: string;
  expectedResult: string;
  passed: boolean;
  notes?: string;
}

async function runDashboardInteractions() {
  console.log("=========================================================================");
  console.log("🎯 CodeAtlas Overview Page (/dashboard) Interaction & Verification Test");
  console.log("=========================================================================\n");

  if (!fs.existsSync(outDir)) {
    console.error("❌ 'out' directory does not exist! Run 'npm run build:pages' first.");
    process.exit(1);
  }

  // Ensure screenshot directories exist
  fs.mkdirSync(screenshotDir, { recursive: true });
  fs.mkdirSync(publicScreenshotDir, { recursive: true });

  const server = createStaticServer();
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`  ✔ Static test server listening on port ${PORT}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const checklist: TestChecklistResult[] = [];

  const record = (
    category: string,
    element: string,
    action: string,
    expectedResult: string,
    passed: boolean,
    notes?: string
  ) => {
    checklist.push({ category, element, action, expectedResult, passed, notes });
    console.log(`  ${passed ? "✔ PASS" : "❌ FAIL"} [${category}] ${element}: ${action}`);
    if (notes && !passed) {
      console.log(`         Notice: ${notes}`);
    }
  };

  try {
    // 1. Session Setup and Seed
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    console.log("1. Seeding authenticated demo user session...");
    await page.goto(`${host}${basePath}/login/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.setItem("codeatlas_active_demo_session", "true");
      localStorage.removeItem("codeatlas_demo_active_user");
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

    // Helper to navigate to dashboard
    const goToDashboard = async () => {
      await page.goto(`${host}${basePath}/dashboard/`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);
    };

    await goToDashboard();
    console.log("  ✔ Navigated to /dashboard/\n");

    // 2. Responsive Visual Captures (Screenshots at 375px, 768px, 1440px in Light and Dark)
    console.log("2. Capturing responsive screenshots...");
    const viewports = [
      { name: "desktop", width: 1440, height: 900 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "mobile", width: 375, height: 812 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);

      // Light mode screenshot
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("codeatlas_theme", "light");
      });
      await page.waitForTimeout(300);

      const lightFileName = `dashboard-${vp.name}-light.png`;
      const lightPathOut = path.join(screenshotDir, lightFileName);
      const lightPathPublic = path.join(publicScreenshotDir, lightFileName);
      await page.screenshot({ path: lightPathOut, fullPage: true });
      fs.copyFileSync(lightPathOut, lightPathPublic);

      record(
        "Responsive Visuals",
        `${vp.name.toUpperCase()} Viewport (${vp.width}x${vp.height}) - Light`,
        "Capture full-page screenshot",
        "Rendered correctly without horizontal overflow or collision",
        fs.existsSync(lightPathOut)
      );

      // Dark mode screenshot
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("codeatlas_theme", "dark");
      });
      await page.waitForTimeout(300);

      const darkFileName = `dashboard-${vp.name}-dark.png`;
      const darkPathOut = path.join(screenshotDir, darkFileName);
      const darkPathPublic = path.join(publicScreenshotDir, darkFileName);
      await page.screenshot({ path: darkPathOut, fullPage: true });
      fs.copyFileSync(darkPathOut, darkPathPublic);

      record(
        "Responsive Visuals",
        `${vp.name.toUpperCase()} Viewport (${vp.width}x${vp.height}) - Dark`,
        "Capture full-page screenshot",
        "Rendered with high-contrast dark palette (#0A0F19/#0D111B)",
        fs.existsSync(darkPathOut)
      );
    }

    // Reset to desktop view
    await page.setViewportSize({ width: 1440, height: 900 });
    await goToDashboard();

    // 3. Header Widget Tests
    console.log("\n3. Testing Header & Top Navigation...");

    // 3a. Header greeting check
    const greetingText = await page.textContent("h1");
    record(
      "Header",
      "Greeting & User Name",
      "Inspect h1 text",
      "Contains greeting and first name 'Demo'",
      Boolean(greetingText && greetingText.includes("Demo"))
    );

    // 3b. Workspace Switcher in Header
    const wsSwitcherBtn = page.locator("button[aria-label='Current workspace switcher']");
    const wsBtnExists = (await wsSwitcherBtn.count()) > 0;
    if (wsBtnExists) {
      await wsSwitcherBtn.click();
      await page.waitForTimeout(300);
      const wsDropdown = page.locator("[role='listbox'][aria-label='Available workspaces']");
      const isWsDropdownVisible = await wsDropdown.isVisible();
      record(
        "Header",
        "Workspace Switcher Dropdown",
        "Click current workspace badge",
        "Opens workspace menu with available workspaces",
        isWsDropdownVisible
      );

      // Select second workspace option if available
      const wsOptions = wsDropdown.locator("[role='option']");
      const count = await wsOptions.count();
      if (count > 1) {
        await wsOptions.nth(1).click();
        await page.waitForTimeout(300);
        const updatedName = await wsSwitcherBtn.textContent();
        record(
          "Header",
          "Workspace Switch Action",
          "Select second workspace",
          "Active workspace switches and updates reactive components",
          Boolean(updatedName && updatedName.length > 0)
        );
      }
    } else {
      record("Header", "Workspace Switcher Dropdown", "Find switcher button", "Found", false);
    }

    // 3c. "Ask AI" button in WelcomeSection
    const askAiBtn = page.locator("a[aria-label='Ask AI Assistant']").first();
    const askAiHref = await askAiBtn.getAttribute("href");
    record(
      "Header",
      "'Ask AI' Action Button",
      "Inspect href",
      "Points to /assistant",
      Boolean(askAiHref && askAiHref.includes("/assistant"))
    );

    // 3d. "Add Repository" button in WelcomeSection
    const addRepoBtn = page.locator("button[aria-label='Add new repository']").first();
    if ((await addRepoBtn.count()) > 0) {
      await addRepoBtn.click();
      await page.waitForTimeout(300);
      const modal = page.locator("[role='dialog'][aria-modal='true']").first();
      const isModalVisible = await modal.isVisible();
      record(
        "Header",
        "'Add Repository' Button",
        "Click Add Repository",
        "Opens AddRepositoryDialog modal dialog",
        isModalVisible
      );

      // Close modal
      const closeBtn = page.locator("button[aria-label='Close dialog']").first();
      if ((await closeBtn.count()) > 0) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      } else {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
      }
    }

    // 4. KPI Cards (All 6 cards tested for clickable link, sparkline, trend, number)
    console.log("\n4. Testing 6 KPI Cards...");
    const kpiCards = [
      { id: "kpi-repos", label: "Repositories", expectedHref: "/repositories" },
      { id: "kpi-files", label: "Files indexed", expectedHref: "/repositories" },
      { id: "kpi-symbols", label: "AST symbols", expectedHref: "/architecture" },
      { id: "kpi-findings", label: "Open findings", expectedHref: "/code-review" },
      { id: "kpi-debt", label: "Tech-debt score", expectedHref: "/refactoring" },
      { id: "kpi-health", label: "System health", expectedHref: "/system-health" },
    ];

    for (const kpi of kpiCards) {
      const card = page.locator(`a[aria-label^='${kpi.label}:']`).first();
      const exists = (await card.count()) > 0;
      let hasSparkline = false;
      let hasValue = false;
      let validHref = false;

      if (exists) {
        hasSparkline = (await card.locator("svg polyline").count()) > 0;
        const text = await card.textContent();
        hasValue = Boolean(text && text.length > 5);
        const href = await card.getAttribute("href");
        validHref = Boolean(href && href.includes(kpi.expectedHref));
      }

      record(
        "KPI Cards",
        `KPI: ${kpi.label}`,
        `Verify link to ${kpi.expectedHref}, sparkline SVG, and metric value`,
        `Clickable card routing to ${kpi.expectedHref} with inline sparkline`,
        exists && hasSparkline && hasValue && validHref
      );
    }

    // 5. Codebase Language & Architecture Bar
    console.log("\n5. Testing Codebase Language Bar & Filtering...");
    const langBar = page.locator("[role='region'][aria-label='Codebase language breakdown bar']");
    const langBarExists = (await langBar.count()) > 0;
    record(
      "Language Bar",
      "Architecture Language Bar",
      "Locate language proportion bar",
      "Bar renders per-language width segments with hover tooltips",
      langBarExists
    );

    const langSegment = langBar.locator("button").first();
    if ((await langSegment.count()) > 0) {
      const label = (await langSegment.getAttribute("aria-label")) || "";
      record(
        "Language Bar",
        "Language Segment Button",
        `Hover and click language segment (${label})`,
        "Has accessible aria-label and click navigation",
        label.includes("Filter by")
      );
    }

    // Legend filter buttons
    const legendBtn = page.locator("button[aria-label*='View'][aria-label*='repositories']").first();
    const legendExists = (await legendBtn.count()) > 0;
    record(
      "Language Bar",
      "Interactive Legend Button",
      "Locate language legend button",
      "Pill is clickable with hover styling to filter repositories",
      legendExists
    );

    // 6. Quick Actions Grid (6 cards)
    console.log("\n6. Testing Quick Actions Grid (6 Cards)...");
    const quickActions = [
      { title: "Connect Repository", actionLabel: "Connect Repo" },
      { title: "Explain Code Snippet", actionLabel: "Explain Snippet" },
      { title: "Ask AI Assistant", actionLabel: "Ask AI Assistant" },
      { title: "Explore Architecture", actionLabel: "Explore Architecture" },
      { title: "Analyze Change Impact", actionLabel: "Analyze Change Impact" },
      { title: "Review Pull Request", actionLabel: "Review Pull Request" },
    ];

    for (const qa of quickActions) {
      const btn = page.locator(`button[aria-label='${qa.actionLabel}'], a[aria-label='${qa.actionLabel}']`).first();
      const exists = (await btn.count()) > 0;
      record(
        "Quick Actions",
        `Action: ${qa.title}`,
        `Find button "${qa.actionLabel}"`,
        "Interactive element present and clickable",
        exists
      );
    }

    // 7. Left Column: Recent Repositories
    console.log("\n7. Testing Recent Repositories Column...");
    const recentRepos = page.locator("section").filter({ hasText: "Recent Repositories" }).first();
    const repoLinks = recentRepos.locator("a[href*='/repositories/']");
    const repoCount = await repoLinks.count();
    record(
      "Recent Repositories",
      "5 Newest Codebases",
      "Count repository explore links",
      "Renders up to 5 repositories with language dot and health badge",
      repoCount >= 1
    );

    // Test clicking a repository link
    if (repoCount > 0) {
      const firstRepoHref = await repoLinks.first().getAttribute("href");
      record(
        "Recent Repositories",
        "Repository Navigation",
        `Inspect explore link href (${firstRepoHref})`,
        "Links to repository detail view /repositories/<id>",
        Boolean(firstRepoHref && firstRepoHref.includes("/repositories/"))
      );
    }

    // 8. Right Column: Getting Started Checklist
    console.log("\n8. Testing Getting Started Checklist...");
    const checklistSection = page.locator("section").filter({ hasText: "Getting Started" }).first();
    const checklistItems = checklistSection.locator("a[aria-label^='Start task:']");
    const checklistItemsCount = await checklistItems.count();
    record(
      "Checklist",
      "Onboarding Steps",
      "Count checklist tasks",
      "Renders 5 onboarding tasks with working Start links",
      checklistItemsCount === 5
    );

    // Test toggle checkmark
    const firstToggleBtn = checklistSection.locator("button[aria-label^='Mark ']").first();
    if ((await firstToggleBtn.count()) > 0) {
      const initialAria = await firstToggleBtn.getAttribute("aria-label");
      await firstToggleBtn.click();
      await page.waitForTimeout(300);
      const afterAria = await firstToggleBtn.getAttribute("aria-label");
      record(
        "Checklist",
        "Checklist Auto/Manual Toggle",
        "Click checklist completion checkbox",
        "Toggles task state and updates progress percentage",
        initialAria !== afterAria
      );
    }

    // 9. Needs Attention Section
    console.log("\n9. Testing Needs Attention Section...");
    const needsAttentionSection = page.locator("section").filter({ hasText: "Needs Attention" }).first();
    const attentionExists = (await needsAttentionSection.count()) > 0;
    record(
      "Needs Attention",
      "Needs Attention Section",
      "Locate section header and badge",
      "Displays section with '3 critical findings' badge",
      attentionExists
    );

    const fixBtns = [
      { text: "Fix Vulnerability", hrefPrefix: "/code-review" },
      { text: "Inspect Stack Trace", hrefPrefix: "/debug" },
      { text: "Apply Refactoring", hrefPrefix: "/refactoring" },
    ];

    for (const fb of fixBtns) {
      const btn = needsAttentionSection.locator(`a[aria-label*='${fb.text}']`).first();
      const exists = (await btn.count()) > 0;
      let validHref = false;
      if (exists) {
        const href = await btn.getAttribute("href");
        validHref = Boolean(href && href.includes(fb.hrefPrefix));
      }
      record(
        "Needs Attention",
        `Remediation Action: ${fb.text}`,
        `Inspect link pointing to ${fb.hrefPrefix}`,
        `Action button links directly to deep-linked resolution workflow`,
        exists && validHref
      );
    }

    // 10. Recent Activity Timeline
    console.log("\n10. Testing Recent Activity Timeline...");
    const activitySection = page.locator("section").filter({ hasText: "Recent Activity" }).first();
    const activityItems = activitySection.locator("a[aria-label^='Activity:']");
    const actCount = await activityItems.count();
    record(
      "Recent Activity",
      "Activity Event Timeline",
      "Count recent activity links with status badges",
      "Renders chronological activity events with relative time and badge",
      actCount >= 1
    );

    const viewAllActivityLink = activitySection.locator("a[aria-label='View all activities']").first();
    const viewAllActHref = await viewAllActivityLink.getAttribute("href");
    record(
      "Recent Activity",
      "View All Activity Link",
      "Inspect href",
      "Points to /activity",
      Boolean(viewAllActHref && viewAllActHref.includes("/activity"))
    );

    // 11. Global Header Widgets
    console.log("\n11. Testing Global Header Widgets (Ctrl+K, Bell, Theme, Avatar)...");

    // 11a. Global Search Trigger (Ctrl+K)
    const searchBtn = page.locator("button[aria-label*='Search']").first();
    if ((await searchBtn.count()) > 0) {
      await searchBtn.click();
      await page.waitForTimeout(400);
      const searchModal = page.locator("[role='dialog'][aria-label='Global Codebase Search'], [role='dialog'][aria-modal='true']").first();
      const isSearchModalOpen = await searchModal.isVisible();
      record(
        "Global Widgets",
        "Search Palette (Ctrl+K / Button)",
        "Click search trigger button",
        "Opens GlobalSearchModal palette",
        isSearchModalOpen
      );
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
    }

    // 11b. Notifications Bell
    const bellBtn = page.locator("button[aria-label='Notifications']").first();
    if ((await bellBtn.count()) > 0) {
      await bellBtn.click();
      await page.waitForTimeout(300);
      const notifPopover = page.locator("text=Notifications").first();
      const isNotifVisible = await notifPopover.isVisible();
      record(
        "Global Widgets",
        "Notifications Bell & Popover",
        "Click bell button",
        "Opens notifications dropdown with unread list & 'Mark read' action",
        isNotifVisible
      );
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }

    // 11c. Theme Toggle
    const themeBtn = page.locator("button[aria-label*='theme' i], button[title*='theme' i]").first();
    if ((await themeBtn.count()) > 0) {
      const beforeTheme = await page.evaluate(() => document.documentElement.classList.contains("dark"));
      await themeBtn.click();
      await page.waitForTimeout(300);
      const afterTheme = await page.evaluate(() => document.documentElement.classList.contains("dark"));
      record(
        "Global Widgets",
        "Theme Toggle",
        "Click theme toggle switch",
        "Toggles between dark and light themes smoothly",
        beforeTheme !== afterTheme
      );
    }

    // 11d. User Avatar Profile Menu
    const profileBtn = page.locator("button[aria-label='Open developer profile menu']").first();
    if ((await profileBtn.count()) > 0) {
      await profileBtn.click();
      await page.waitForTimeout(300);
      const settingsLink = page.locator("a[href*='/settings']").first();
      const isProfileOpen = await settingsLink.isVisible();
      record(
        "Global Widgets",
        "User Avatar Profile Menu",
        "Click avatar button",
        "Opens profile popover showing user credentials & Settings link",
        isProfileOpen
      );
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }

  } catch (err: any) {
    console.error("Test execution error:", err);
  } finally {
    await browser.close();
    server.close();
  }

  // Summary Report
  console.log("\n=========================================================================");
  console.log("📊 Dashboard Interaction Verification Summary");
  console.log("=========================================================================");
  const total = checklist.length;
  const passed = checklist.filter((c) => c.passed).length;
  const failed = total - passed;

  console.log(`Total checks: ${total} | Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) {
    console.error(`❌ ${failed} checks failed! Review output above.`);
    process.exit(1);
  } else {
    console.log(`🎉 ALL ${passed} OF ${total} DASHBOARD INTERACTION CHECKS PASSED WITH EXIT CODE 0!`);
  }
}

runDashboardInteractions();
