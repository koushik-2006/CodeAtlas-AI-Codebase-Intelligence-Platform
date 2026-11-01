import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { chromium, Page } from "playwright";

const basePath = "/CodeAtlas-AI-Codebase-Intelligence-Platform";
const outDir = path.resolve(process.cwd(), "out");
const PORT = 3456;
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

      // Strip basePath
      let relPath = pathname.slice(basePath.length);
      if (!relPath || relPath === "/") {
        relPath = "/index.html";
      }

      let filePath = path.join(outDir, relPath);

      // Check file direct, directory/index.html, or .html extension
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
        filePath = `${filePath}.html`;
      }

      if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, "index.html"))) {
        filePath = path.join(filePath, "index.html");
      }

      // SPA 404 fallback
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

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/docs",
  "/features",
  "/quickstart",
  "/demo",
  "/contact",
  "/privacy",
  "/terms",
];

const APP_ROUTES = [
  "/dashboard",
  "/workspaces",
  "/workspaces/ws_team_demo",
  "/workspaces/ws_default",
  "/workspaces/workspace-1",
  "/repositories",
  "/repositories/sample-project",
  "/repositories/my-project",
  "/repositories/ecommerce-platform",
  "/repositories/auth-service",
  "/repositories/fastapi-backend",
  "/repositories/shared-core-lib",
  "/repositories/payment-service",
  "/multi-repo",
  "/agents",
  "/visual-explorer",
  "/visual-code-explorer",
  "/assistant",
  "/debug",
  "/refactoring",
  "/architecture",
  "/change-impact",
  "/impact",
  "/code-review",
  "/activity",
  "/system-health",
  "/operations",
  "/settings",
  "/onboarding",
  "/city-map",
];

interface RouteResult {
  route: string;
  status: number | string;
  hasHeading: boolean;
  uncaughtErrors: string[];
  consoleErrors: string[];
  failedRequests: string[];
  clientCrash: boolean;
  passed: boolean;
}

async function runSmokeTests() {
  console.log("=========================================================================");
  console.log("🧪 CodeAtlas Route Smoke Test (Playwright)");
  console.log(`Serving: ${outDir}`);
  console.log(`Base URL: ${host}${basePath}`);
  console.log("=========================================================================\n");

  if (!fs.existsSync(outDir)) {
    console.error("❌ 'out' directory does not exist! Run 'npm run build:pages' first.");
    process.exit(1);
  }

  const server = createStaticServer();
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`  ✔ Static test server listening on port ${PORT}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const results: RouteResult[] = [];

  // Helper to test a single route
  async function testRoute(route: string): Promise<RouteResult> {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    const onPageError = (err: Error) => {
      pageErrors.push(err.message || String(err));
    };

    const onConsole = (msg: any) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Ignore expected/benign network mock warnings or favicon 404
        if (!text.includes("favicon") && !text.includes("Failed to load resource: the server responded with a status of 404")) {
          consoleErrors.push(text);
        }
      }
    };

    const onRequestFailed = (req: any) => {
      const url = req.url();
      if (!url.includes("favicon.ico")) {
        failedRequests.push(`${req.method()} ${url} (${req.failure()?.errorText || "failed"})`);
      }
    };

    page.on("pageerror", onPageError);
    page.on("console", onConsole);
    page.on("requestfailed", onRequestFailed);

    let status: number | string = "ERR";
    let hasHeading = false;
    let clientCrash = false;

    try {
      const fullUrl = `${host}${basePath}${route === "/" ? "/" : `${route}/`}`;
      const response = await page.goto(fullUrl, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      status = response?.status() ?? "NO_RES";

      // Wait 600ms for React hydration and effects
      await page.waitForTimeout(600);

      // Check for client-side crash error banner
      clientCrash = await page.evaluate(() => {
        const text = document.body ? document.body.innerText : "";
        return (
          text.includes("Application error: a client-side exception has occurred") ||
          text.includes("Unhandled Runtime Error")
        );
      });

      // Check if main heading or reasonable content rendered
      hasHeading = await page.evaluate(() => {
        const heading = document.querySelector("h1, h2, h3, [role='heading'], nav, header");
        return Boolean(heading && (heading.textContent || "").trim().length > 0);
      });
    } catch (e: any) {
      pageErrors.push(e.message || String(e));
    } finally {
      page.off("pageerror", onPageError);
      page.off("console", onConsole);
      page.off("requestfailed", onRequestFailed);
    }

    const passed =
      !clientCrash &&
      pageErrors.length === 0 &&
      (status === 200 || status === 304) &&
      hasHeading;

    return {
      route,
      status,
      hasHeading,
      uncaughtErrors: pageErrors,
      consoleErrors,
      failedRequests,
      clientCrash,
      passed,
    };
  }

  try {
    // 1. Visit Public Routes
    console.log("Checking Public Routes...");
    for (const route of PUBLIC_ROUTES) {
      process.stdout.write(`  Testing ${route} ... `);
      const res = await testRoute(route);
      results.push(res);
      console.log(res.passed ? "✔ PASS" : "❌ FAIL");
      if (!res.passed) {
        if (res.clientCrash) console.log("    💥 Client-side exception banner detected");
        res.uncaughtErrors.forEach((e) => console.log(`    ❗ Uncaught: ${e}`));
      }
    }

    // 2. Sign in as Demo User
    console.log("\nSigning in as Demo User...");
    const loginUrl = `${host}${basePath}/login/`;
    await page.goto(loginUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Set demo session in localStorage and sessionStorage
    await page.evaluate(() => {
      try {
        localStorage.setItem("codeatlas_active_demo_session", "true");
        localStorage.removeItem("codeatlas_demo_active_user");
        localStorage.setItem("codeatlas-auth-user", JSON.stringify({
          id: "usr_demo",
          name: "Demo User",
          email: "demo@codeatlas.dev",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
          role: "Lead Systems Architect",
          provider: "demo",
        }));
        (window as any).__CODEATLAS_DEMO_MODE = true;
      } catch {}
    });

    console.log("  ✔ Demo session seeded in browser context\n");

    // 3. Visit All App Routes
    console.log("Checking Authenticated App Routes...");
    for (const route of APP_ROUTES) {
      process.stdout.write(`  Testing ${route} ... `);
      const res = await testRoute(route);
      results.push(res);
      console.log(res.passed ? "✔ PASS" : "❌ FAIL");
      if (!res.passed) {
        if (res.clientCrash) console.log("    💥 Client-side exception banner detected");
        res.uncaughtErrors.forEach((e) => console.log(`    ❗ Uncaught: ${e}`));
        res.consoleErrors.forEach((e) => console.log(`    ⚠️  Console: ${e}`));
      }
    }

    // Print summary table
    console.log("\n=========================================================================");
    console.log("📋 SMOKE TEST RESULTS SUMMARY TABLE");
    console.log("=========================================================================\n");

    const header = `| ${"Route".padEnd(35)} | ${"HTTP".padEnd(5)} | ${"Heading".padEnd(7)} | ${"Crash".padEnd(6)} | ${"Errors".padEnd(6)} | ${"Status".padEnd(6)} |`;
    const separator = `|${"-".repeat(37)}|${"-".repeat(7)}|${"-".repeat(9)}|${"-".repeat(8)}|${"-".repeat(8)}|${"-".repeat(8)}|`;

    console.log(header);
    console.log(separator);

    for (const r of results) {
      const line = `| ${r.route.padEnd(35)} | ${String(r.status).padEnd(5)} | ${String(r.hasHeading).padEnd(7)} | ${(r.clientCrash ? "YES" : "no").padEnd(6)} | ${String(r.uncaughtErrors.length).padEnd(6)} | ${(r.passed ? "PASS" : "FAIL").padEnd(6)} |`;
      console.log(line);
    }

    const failedCount = results.filter((r) => !r.passed).length;
    const totalCount = results.length;

    console.log("\n=========================================================================");
    if (failedCount === 0) {
      console.log(`🎉 ALL ${totalCount} ROUTES PASSED SMOKE TEST CLEANLY!`);
      console.log("=========================================================================\n");
    } else {
      console.log(`❌ ${failedCount} OF ${totalCount} ROUTES FAILED SMOKE TEST.`);
      console.log("=========================================================================\n");
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

runSmokeTests().catch((err) => {
  console.error("Fatal smoke test error:", err);
  process.exit(1);
});

