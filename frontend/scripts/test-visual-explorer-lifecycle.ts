import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { chromium, Page } from "playwright";

const basePath = "/CodeAtlas-AI-Codebase-Intelligence-Platform";
const outDir = path.resolve(__dirname, "../out");
const PORT = 3594;
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
  console.log("🧪 VISUAL CODE EXPLORER PLAYWRIGHT END-TO-END LIFECYCLE TEST");
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
    // 1. Initial Navigation & Auth Session Setup
    console.log("\n--- STEP 1: INITIAL NAVIGATION & AUTH SETUP ---");
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

    await page.goto(`${host}${basePath}/visual-explorer/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    assert(!bodyText.includes("Application error") && !bodyText.includes("client-side exception"), "Page loads without client-side exception crash");
    assert(bodyText.includes("Visual Code Explorer"), "Visual Code Explorer header is rendered");

    // Check tabs exist
    const tabs = page.locator("[role='tab']");
    const tabCount = await tabs.count();
    assert(tabCount >= 4, `At least 4 primary navigation tabs rendered (found ${tabCount})`);

    // 2. Paste Buggy Sample
    console.log("\n--- STEP 2: PASTE BUGGY SAMPLE ---");
    const buggyBtn = page.locator("button:has-text('Buggy Code')");
    await buggyBtn.click();
    await page.waitForTimeout(400);

    const editorValue = await page.locator("textarea[aria-label='Source code editor']").inputValue();
    assert(editorValue.includes("calculateUserDiscounts"), "Editor buffer loaded calculateUserDiscounts");
    assert(editorValue.includes("cart.items.length"), "Buggy loop index condition is present in buffer");

    // 3. Quick Offline Analysis Widget is visible
    console.log("\n--- STEP 3: QUICK OFFLINE ANALYSIS PANEL ---");
    const quickPanel = page.locator("text=Client-Side Quick Analysis");
    assert((await quickPanel.count()) > 0, "Client-side Quick Analysis offline panel is rendered");

    const locText = await page.evaluate(() => document.body.innerText);
    assert(locText.includes("LOC"), "LOC metrics computed without network");

    // 4. Find Bugs Mode & Markers
    console.log("\n--- STEP 4: FIND BUGS MODE & RED LINE MARKERS ---");
    const findBugsBtn = page.locator("button:has-text('Find bugs'):not(:has-text('Buggy Code'))");
    await findBugsBtn.click();
    await page.waitForTimeout(2000);

    // Check that Bug & Security Audit result appeared
    const auditHeader = page.locator("text=Bug & Security Audit");
    assert((await auditHeader.count()) > 0, "Bug & Security Audit section is displayed");

    const fullText = await page.evaluate(() => document.body.innerText);
    console.log("  >>> Document snippet:", fullText.slice(fullText.indexOf("Bug & Security Audit"), fullText.indexOf("Bug & Security Audit") + 400));

    // Check inline bug notice banner
    const bugNotice = page.locator("text=/Inline Bug Markers/");
    assert((await bugNotice.count()) > 0, "Inline bug markers banner is visible");

    // 5. Apply Fix Updates Editor
    console.log("\n--- STEP 5: APPLY FIX BUTTON UPDATES EDITOR BUFFER ---");
    const applyFixBtn = page.locator("button:has-text('Apply Fix')").first();
    assert((await applyFixBtn.count()) > 0, "Apply Fix button is visible");
    await applyFixBtn.click();
    await page.waitForTimeout(500);

    const updatedEditorValue = await page.locator("textarea[aria-label='Source code editor']").inputValue();
    assert(
      updatedEditorValue.includes("Math.max(0,") || updatedEditorValue.includes("cart.user?."),
      "Editor buffer was updated with safe fixed code"
    );

    // 6. Optimize Mode & Before/After Diff
    console.log("\n--- STEP 6: OPTIMIZE MODE & DIFF VIEW ---");
    const optimizeBtn = page.locator("button:has-text('Optimize'):not(:has-text('Optimization'))");
    await optimizeBtn.click();
    await page.waitForTimeout(1000);

    const diffViewer = page.locator("text=Optimization Diff: Before vs After");
    assert((await diffViewer.count()) > 0, "Optimization before vs after diff viewer is visible");

    // 7. Visualize Tab & Flowchart
    console.log("\n--- STEP 7: VISUALIZE TAB & FLOWCHART ---");
    const visualizeTab = page.locator("button[role='tab']:has-text('Visualize')");
    await visualizeTab.click();
    await page.waitForTimeout(1000);

    const flowchartHeading = page.locator("text=Control Flow Graph");
    assert((await flowchartHeading.count()) > 0, "Control Flow Graph subtab is active");

    const mermaidContainer = page.locator("text=Visual Diagram (Mermaid)");
    assert((await mermaidContainer.count()) > 0, "Mermaid Diagram container is mounted");

    // Check SVG or PNG download buttons
    const svgExport = page.locator("button:has-text('SVG')");
    assert((await svgExport.count()) > 0, "SVG export button is present");

    // 8. Step-Through Execution Trace Player
    console.log("\n--- STEP 8: STEP-THROUGH EXECUTION TRACE PLAYER ---");
    const stepThroughTab = page.locator("button[role='tab']:has-text('Step-Through Trace')");
    await stepThroughTab.click();
    await page.waitForTimeout(500);

    const playerTitle = page.locator("text=Interactive Step-Through Trace");
    assert((await playerTitle.count()) > 0, "Interactive Step-Through Trace Player is mounted");

    const variablesHeader = page.locator("text=Variables in Scope");
    assert((await variablesHeader.count()) > 0, "Reactive Variables in Scope table is visible");

    // Click Next step
    const nextBtn = page.locator("button[title='Next step']");
    await nextBtn.click();
    await page.waitForTimeout(300);

    const stepLabel = await page.locator("text=Step 2 of").count();
    assert(stepLabel > 0, "Advanced to Step 2 in trace player");

    // 9. Code City Tab (2.5D Isometric)
    console.log("\n--- STEP 9: CODE CITY 2.5D ISOMETRIC VIEW ---");
    const cityTab = page.locator("button[role='tab']:has-text('Code City')");
    await cityTab.click();
    await page.waitForTimeout(1000);

    const cityHeader = page.locator("text=Repository Code City (2.5D Isometric)");
    assert((await cityHeader.count()) > 0, "Code City header is rendered");

    const svgCanvas = page.locator("svg");
    assert((await svgCanvas.count()) > 0, "Isometric SVG Canvas is rendered");

    // Click a building
    const buildingNode = page.locator("g.cursor-pointer").first();
    if ((await buildingNode.count()) > 0) {
      await buildingNode.click();
      await page.waitForTimeout(500);

      const sidePanel = page.locator("text=File Path:");
      assert((await sidePanel.count()) > 0, "Clicking building opened side detail panel");

      const explainInCodeLensBtn = page.locator("button:has-text('Explain in CodeLens')");
      assert((await explainInCodeLensBtn.count()) > 0, "'Explain in CodeLens' button is present");
    }

    // 10. Workflow Trace Tab
    console.log("\n--- STEP 10: WORKFLOW TRACE CALL CHAIN ---");
    const workflowTab = page.locator("button[role='tab']:has-text('Workflow Trace')");
    await workflowTab.click();
    await page.waitForTimeout(1000);

    const workflowHeader = page.locator("text=End-to-End Workflow Call Chain Trace");
    assert((await workflowHeader.count()) > 0, "Workflow Call Chain Trace is rendered");

    const explainFlowBtn = page.locator("button:has-text('Explain This Flow')");
    assert((await explainFlowBtn.count()) > 0, "'Explain This Flow' button is present");
    await explainFlowBtn.click();
    await page.waitForTimeout(1000);

    const narrationPanel = page.locator("text=AI Workflow Narration & Architectural Walkthrough");
    assert((await narrationPanel.count()) > 0, "Workflow narration is rendered");

    // 11. History Drawer & Persistence across Reload
    console.log("\n--- STEP 11: HISTORY DRAWER & PERSISTENCE ---");
    const historyBtn = page.locator("button:has-text('Analysis History')");
    await historyBtn.click();
    await page.waitForTimeout(500);

    const historyTitle = page.locator("h3:has-text('Analysis History')");
    assert((await historyTitle.count()) > 0, "Analysis History drawer opened");

    // Reload page and check persistence
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const historyBtnAfterReload = page.locator("button:has-text('Analysis History')");
    await historyBtnAfterReload.click();
    await page.waitForTimeout(500);

    const cachedRecords = page.locator("text=cached records");
    assert((await cachedRecords.count()) > 0, "History persisted in store after page reload");

    // 12. Aliases Routes Verification (/visual-code-explorer & /city-map)
    console.log("\n--- STEP 12: ALIAS ROUTES INTEGRITY ---");
    await page.goto(`${host}${basePath}/visual-code-explorer/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const aliasBody = await page.evaluate(() => document.body.innerText);
    assert(aliasBody.includes("Visual Code Explorer"), "/visual-code-explorer renders Visual Code Explorer");

    await page.goto(`${host}${basePath}/city-map/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const cityMapBody = await page.evaluate(() => document.body.innerText);
    assert(cityMapBody.includes("Repository Code City (2.5D Isometric)"), "/city-map cleanly opens Code City view without 404");

    // 13. Zero Uncaught Browser Exceptions
    console.log("\n--- STEP 13: CONSOLE / RUNTIME ERRORS CHECK ---");
    assert(uncaughtErrors.length === 0, `Zero uncaught client exceptions (found ${uncaughtErrors.length})`);

    console.log("\n=========================================================================");
    console.log(`🎉 ALL ${passedChecks}/${totalChecks} TESTS PASSED CLEANLY!`);
    console.log("=========================================================================\n");
  } finally {
    await browser.close();
    server.close();
  }
}

runTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
