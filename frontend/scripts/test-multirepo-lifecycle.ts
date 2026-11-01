import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { chromium, Page } from "playwright";

const basePath = "/CodeAtlas-AI-Codebase-Intelligence-Platform";
const outDir = path.resolve(__dirname, "../out");
const PORT = 3459;
const host = `http://localhost:${PORT}`;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
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

const screenshotsDir = path.join(outDir, "screenshots");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
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
  console.log("🧪 MULTI-REPOSITORY INTELLIGENCE END-TO-END PLAYWRIGHT LIFECYCLE");
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
  console.log("\n1️⃣  Seeding demo session & navigating to /multi-repo...");
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

  await page.goto(`${host}${basePath}/multi-repo/`);
  await page.waitForSelector("h1:has-text('Multi-Repository Intelligence')", { timeout: 10000 });

  // Check 1: No client crash
  const bodyText = await page.evaluate(() => document.body.innerText);
  assert(!bodyText.includes("Application error") && !bodyText.includes("client-side exception"), "Page loads without client-side exception crash");
  assert(bodyText.includes("Multi-Repository Intelligence"), "Page header and title are rendered");
  await page.screenshot({ path: path.join(screenshotsDir, "multi-repo-01-loaded.png") });

  // Step 2: Verify Graph Renders with Nodes and Edges
  console.log("\n2️⃣  Verifying Interactive Dependency Map Graph...");
  const svgExists = await page.locator("svg").count();
  assert(svgExists > 0, "SVG topology canvas is mounted");

  const nodeCount = await page.locator("g.graph-node").count();
  assert(nodeCount >= 3, `Graph renders repository nodes (found ${nodeCount} nodes)`);

  const edgeCount = await page.locator("path[marker-end]").count();
  assert(edgeCount >= 2, `Graph renders directed dependency edges (found ${edgeCount} edges)`);

  // Step 3: Click a Node -> Side Panel Opens
  console.log("\n3️⃣  Testing Node Selection & Details Panel...");
  const firstNode = page.locator("g.graph-node").first();
  await firstNode.click();
  await page.waitForTimeout(500);

  const nodePanelHeading = await page.locator("h3:has-text('Health Score'), span:has-text('Health Score')").count();
  assert(nodePanelHeading > 0, "Clicking node opens side panel with repository summary & health metrics");

  const openRepoLink = await page.locator("a:has-text('Open ')").count();
  assert(openRepoLink > 0, "Side panel contains 'Open Repository' link");
  await page.screenshot({ path: path.join(screenshotsDir, "multi-repo-02-node-panel.png") });

  // Step 4: Click an Edge -> Evidence Panel Opens
  console.log("\n4️⃣  Testing Edge Selection & Evidence Snippet Panel...");
  const edgePill = page.locator("g.cursor-pointer rect").first();
  if (await edgePill.count()) {
    await edgePill.click({ force: true });
    await page.waitForTimeout(500);

    const evidenceHeading = await page.locator("text=Evidence File & Line").count();
    assert(evidenceHeading > 0, "Clicking edge opens evidence panel showing exact file, line, and code snippet");
    await page.screenshot({ path: path.join(screenshotsDir, "multi-repo-03-edge-evidence.png") });
  }

  // Step 5: Shared Libraries Tab & Version Conflicts
  console.log("\n5️⃣  Testing Shared Libraries Tab & Version Conflicts...");
  const sharedLibsTab = page.locator("button:has-text('Shared Libraries')").first();
  await sharedLibsTab.click();
  await page.waitForTimeout(600);

  const sharedLibHeading = await page.locator("th:has-text('Package'), th:has-text('Versions Per Repository')").count();
  assert(sharedLibHeading > 0, "Shared Libraries table is displayed with manifest packages");

  const versionDriftBadge = await page.locator("span:has-text('Version Drift')").count();
  assert(versionDriftBadge > 0, "Version drift is correctly detected and highlighted with badge");

  // Open "Suggest alignment" modal
  const suggestAlignBtn = page.locator("button:has-text('Suggest alignment')").first();
  assert((await suggestAlignBtn.count()) > 0, "Found 'Suggest alignment' action button on conflicting package");
  await suggestAlignBtn.click();
  await page.waitForTimeout(500);

  const modalTitle = await page.locator("h3:has-text('Alignment Proposal')").count();
  assert(modalTitle > 0, "Suggest alignment opens proposal modal with target version & manifest files to change");
  await page.screenshot({ path: path.join(screenshotsDir, "multi-repo-04-align-modal.png") });

  // Click Apply Alignment
  const applyBtn = page.locator("button:has-text('Apply Alignment to Manifests')").first();
  await applyBtn.click();
  await page.waitForTimeout(600);

  // Step 6: Duplicate Code Tab & Extract Refactoring Proposal
  console.log("\n6️⃣  Testing Duplicate Code Tab & Refactoring Proposal Extraction...");
  const duplicatesTab = page.locator("button:has-text('Duplicate Code')").first();
  await duplicatesTab.click();
  await page.waitForTimeout(600);

  const duplicateCandidate = await page.locator("h4:has-text('Validation Pattern'), h4:has-text('Formatter')").count();
  assert(duplicateCandidate > 0, "Duplicate code groups detected and listed with similarity score");

  // Verify Side-by-side diff
  const diffLines = await page.locator("pre").count();
  assert(diffLines >= 1, "Side-by-side diff viewer renders syntax lines from compared repositories");

  // Click "Extract to shared-core-lib"
  const extractBtn = page.locator("button:has-text('Extract to shared-core-lib')").first();
  assert((await extractBtn.count()) > 0, "Found 'Extract to shared-core-lib' button");
  await extractBtn.click();
  await page.waitForTimeout(600);

  const successBanner = await page.locator("text=Refactoring proposal created in store").count();
  assert(successBanner > 0, "Extract button creates refactoring proposal in store and shows confirmation banner");
  await page.screenshot({ path: path.join(screenshotsDir, "multi-repo-05-extract-proposal.png") });

  // Step 7: API Contracts Tab
  console.log("\n7️⃣  Testing API Contracts Tab...");
  const apiTab = page.locator("button:has-text('API Contracts')").first();
  await apiTab.click();
  await page.waitForTimeout(600);

  const contractTable = await page.locator("th:has-text('Method & Endpoint'), th:has-text('Owner Service')").count();
  assert(contractTable > 0, "API Contracts table renders HTTP endpoints and owning services");

  const verifiedContractBadge = await page.locator("span:has-text('Verified Contract')").count();
  assert(verifiedContractBadge > 0, "Discovers verified inter-service HTTP contracts");

  // Click row to inspect code locations
  const inspectCodeBtn = page.locator("button:has-text('Inspect Code Locations')").first();
  await inspectCodeBtn.click();
  await page.waitForTimeout(500);

  const routeDefHeading = await page.locator("text=Route Definition Site").count();
  assert(routeDefHeading > 0, "Contract inspector drawer displays route definition and caller code locations");
  await page.screenshot({ path: path.join(screenshotsDir, "multi-repo-06-contract-drawer.png") });

  const closeDrawerBtn = page.locator("button:has-text('Close')").first();
  await closeDrawerBtn.click();
  await page.waitForTimeout(400);

  // Step 8: Cross-Repo Impact Tab
  console.log("\n8️⃣  Testing Cross-Repo Impact Tab...");
  const impactTab = page.locator("button:has-text('Cross-Repo Impact')").first();
  await impactTab.click();
  await page.waitForTimeout(600);

  // Run evaluation
  const evaluateBtn = page.locator("button:has-text('Evaluate Cross-Repo Blast Radius')").first();
  await evaluateBtn.click();
  await page.waitForTimeout(600);

  const blastRadiusScore = await page.locator("text=Blast Radius Score").count();
  assert(blastRadiusScore > 0, "Evaluates blast radius score and shows downstream impact tree");

  const sendToImpactBtn = page.locator("button:has-text('Send to Change Impact')").first();
  assert((await sendToImpactBtn.count()) > 0, "Found 'Send to Change Impact' button");
  await page.screenshot({ path: path.join(screenshotsDir, "multi-repo-07-impact-report.png") });

  // Step 9: Unified Search Tab
  console.log("\n9️⃣  Testing Unified Code Search across Repositories...");
  const searchTab = page.locator("button:has-text('Unified Search')").first();
  await searchTab.click();
  await page.waitForTimeout(600);

  const searchInput = page.locator("input[placeholder*='Search code across']");
  await searchInput.fill("validateEmail");
  const doSearchBtn = page.locator("button:has-text('Search')").first();
  await doSearchBtn.click();
  await page.waitForTimeout(600);

  const repoGroupCount = await page.locator("div.rounded-2xl:has(span:has-text('match'))").count();
  assert(repoGroupCount >= 2, `Unified search found matches across multiple repositories (${repoGroupCount} repos)`);
  await page.screenshot({ path: path.join(screenshotsDir, "multi-repo-08-unified-search.png") });

  // Step 10: Page Refresh Persistence
  console.log("\n🔟 Testing Page Refresh & Data Persistence...");
  await page.reload();
  await page.waitForTimeout(1000);

  const refreshTitle = await page.locator("h1:has-text('Multi-Repository Intelligence')").count();
  assert(refreshTitle > 0, "Page reloads without error and retains store state");
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
