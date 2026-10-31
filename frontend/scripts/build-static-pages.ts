import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * CodeAtlas GitHub Pages Static Export Generator
 * 
 * Safely generates the pure client-side static distribution in `out/`
 * without modifying or touching Member 2's server-side API routes or database engines.
 */

const rootDir = process.cwd();
// Use RUNNER_TEMP in CI, or local .pages_export_workspace in workspace
const tempWorkspace = process.env.RUNNER_TEMP
  ? path.join(process.env.RUNNER_TEMP, "codeatlas_pages_export")
  : path.join(rootDir, ".pages_export_workspace");
const outDir = path.join(rootDir, "out");

console.log("=========================================================================");
console.log("🚀 Starting CodeAtlas GitHub Pages Static Build Pipeline");
console.log("=========================================================================\n");

function copyRecursiveSync(src: string, dest: string, skipFilter?: (relPath: string) => boolean) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      const srcChild = path.join(src, entry);
      const destChild = path.join(dest, entry);
      if (skipFilter && skipFilter(path.relative(rootDir, srcChild))) {
        continue;
      }
      copyRecursiveSync(srcChild, destChild, skipFilter);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  // Clean previous temp workspace if any
  if (fs.existsSync(tempWorkspace)) {
    fs.rmSync(tempWorkspace, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }

  console.log("📁 Creating clean export workspace...");
  fs.mkdirSync(tempWorkspace, { recursive: true });

  const preDirs = [
    path.join(tempWorkspace, ".next"),
    path.join(tempWorkspace, ".next", "cache"),
    path.join(tempWorkspace, ".next", "server"),
    path.join(tempWorkspace, ".next", "server", "app"),
    path.join(tempWorkspace, ".next", "server", "app", "(app)"),
    path.join(tempWorkspace, ".next", "server", "app", "(app)", "onboarding"),
    path.join(tempWorkspace, ".next", "server", "app", "(app)", "dashboard"),
    path.join(tempWorkspace, ".next", "server", "app", "(app)", "settings"),
    path.join(tempWorkspace, ".next", "server", "app", "(app)", "assistant"),
    path.join(tempWorkspace, ".next", "server", "app", "(app)", "explorer"),
    path.join(tempWorkspace, ".next", "static"),
    path.join(tempWorkspace, ".next", "static", "chunks"),
    path.join(tempWorkspace, ".next", "static", "chunks", "app"),
    path.join(tempWorkspace, ".next", "static", "chunks", "app", "(app)"),
    path.join(tempWorkspace, ".next", "static", "chunks", "pages"),
    path.join(tempWorkspace, ".next", "static", "media"),
    path.join(tempWorkspace, ".next", "static", "css"),
    path.join(tempWorkspace, ".next", "server", "chunks"),
    path.join(tempWorkspace, ".next", "server", "pages"),
    path.join(tempWorkspace, ".next", "types"),
    path.join(tempWorkspace, ".next", "types", "app"),
  ];
  for (const dir of preDirs) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }

  // 1. Copy config and env files
  const filesToCopy = [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.mjs",
    ".env.local",
    ".env.production",
    ".env",
  ];

  for (const f of filesToCopy) {
    const src = path.join(rootDir, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(tempWorkspace, f));
    }
  }

  const targetNodeModules = path.join(rootDir, "node_modules");
  const normalizedNodeModules = targetNodeModules.replace(/\\/g, "/");
  const firebaseAuthPath = fs.existsSync(path.join(rootDir, "node_modules", "@firebase", "auth"))
    ? `${normalizedNodeModules}/@firebase/auth`
    : `${normalizedNodeModules}/firebase/node_modules/@firebase/auth`;

  // Adjust tsconfig.json in temp workspace so paths resolve to actual node_modules directory
  const tempTsConfigPath = path.join(tempWorkspace, "tsconfig.json");
  if (fs.existsSync(tempTsConfigPath)) {
    const rawTsConfig = fs.readFileSync(tempTsConfigPath, "utf-8");
    const updatedTsConfig = rawTsConfig.replace(/"\.\/node_modules/g, `"${normalizedNodeModules}`);
    fs.writeFileSync(tempTsConfigPath, updatedTsConfig);
  }

  // 2. Write dedicated static export next.config.mjs
  const defaultRepo = "koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform";
  const repoEnv = process.env.GITHUB_REPOSITORY || process.env.GITHUB_PAGES_REPO || defaultRepo;
  const repoName = repoEnv.includes("/") ? repoEnv.split("/")[1] : repoEnv;
  const basePath = repoName && !process.env.CUSTOM_DOMAIN && process.env.NO_BASE_PATH !== "true" ? `/${repoName}` : "";

  const staticNextConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: ${basePath ? JSON.stringify(basePath) : 'undefined'},
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  webpack: (config) => {
    config.cache = false;
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "firebase/auth": "${normalizedNodeModules}/firebase/auth",
      "firebase/app-check": "${normalizedNodeModules}/firebase/app-check",
      "firebase/ai": "${normalizedNodeModules}/firebase/ai",
      "firebase/app": "${normalizedNodeModules}/firebase/app",
      "firebase": "${normalizedNodeModules}/firebase",
      "@firebase/auth": "${firebaseAuthPath}",
      "@firebase/app": "${normalizedNodeModules}/@firebase/app",
      "@firebase/app-check": "${normalizedNodeModules}/@firebase/app-check",
      "@firebase/ai": "${normalizedNodeModules}/@firebase/ai",
      "@firebase/util": "${normalizedNodeModules}/@firebase/util",
      "@firebase/component": "${normalizedNodeModules}/@firebase/component",
      "@firebase/logger": "${normalizedNodeModules}/@firebase/logger",
    };
    config.resolve.modules = [
      "${normalizedNodeModules}",
      "node_modules",
      ...(config.resolve.modules || []),
    ];
    return config;
  },
};

export default nextConfig;
`;
  fs.writeFileSync(path.join(tempWorkspace, "next.config.mjs"), staticNextConfig.trim());

  // 3. Link node_modules via junction on Windows or symlink on POSIX
  const linkNodeModules = path.join(tempWorkspace, "node_modules");
  try {
    const symlinkType = process.platform === "win32" ? "junction" : "dir";
    fs.symlinkSync(targetNodeModules, linkNodeModules, symlinkType);
  } catch {
    try {
      const relTarget = path.relative(tempWorkspace, targetNodeModules);
      fs.symlinkSync(relTarget, linkNodeModules, process.platform === "win32" ? "junction" : "dir");
    } catch {
      console.warn("Notice: Direct node_modules symlink unavailable; relying on Webpack aliases.");
    }
  }

  // 4. Copy required directories
  const dirsToCopy = [
    "components",
    "hooks",
    "lib",
    "providers",
    "public",
    "services",
    "types",
    "config",
  ];

  console.log("📦 Copying application source and assets...");
  for (const d of dirsToCopy) {
    copyRecursiveSync(path.join(rootDir, d), path.join(tempWorkspace, d));
  }

  // 5. Copy app pages and layouts, strictly skipping /api routes
  console.log("📦 Copying page routes (excluding runtime server APIs)...");
  copyRecursiveSync(
    path.join(rootDir, "app"),
    path.join(tempWorkspace, "app"),
    (relPath) => {
      const normalized = relPath.replace(/\\/g, "/");
      // Skip app/api entirely for client static export
      if (normalized === "app/api" || normalized.startsWith("app/api/")) {
        return true;
      }
      return false;
    }
  );

  // 5b. Prune dynamic server runtime imports from root layout for clean static rendering
  const tempLayoutPath = path.join(tempWorkspace, "app", "layout.tsx");
  if (fs.existsSync(tempLayoutPath)) {
    let layoutContent = fs.readFileSync(tempLayoutPath, "utf-8");
    layoutContent = layoutContent.replace(
      /import\s+type\s*\{\s*Metadata\s*\}\s*from\s*["']next["'];?/g,
      'import type { Metadata } from "next";\nexport const dynamic = "force-static";\nexport const revalidate = false;'
    );
    // Replace network-dependent next/font/google with self-contained fallback font classes
    layoutContent = layoutContent.replace(
      /import\s*\{\s*Inter,\s*JetBrains_Mono\s*\}\s*from\s*["']next\/font\/google["'];?/g,
      'const Inter = (_opts?: any) => ({ variable: "font-sans", className: "font-sans" });\nconst JetBrains_Mono = (_opts?: any) => ({ variable: "font-mono", className: "font-mono" });'
    );
    fs.writeFileSync(tempLayoutPath, layoutContent, "utf-8");
  }

  // 6. Run Next.js static build using local binary
  console.log("⚙️  Running Next.js static export build (STATIC_EXPORT=true)...");
  const localNextCli = path.join(rootDir, "node_modules", "next", "dist", "bin", "next");
  const localNextBin = path.join(rootDir, "node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");
  const buildCmd = fs.existsSync(localNextCli)
    ? `"${process.execPath}" "${localNextCli}" build`
    : fs.existsSync(localNextBin)
    ? `"${localNextBin}" build`
    : "npx next build";

  execSync(buildCmd, {
    cwd: tempWorkspace,
    stdio: "inherit",
    shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
    env: {
      ...process.env,
      NODE_PATH: targetNodeModules,
      STATIC_EXPORT: "true",
      NEXT_PUBLIC_DEMO_MODE: "true",
      NEXT_PUBLIC_APP_URL: "https://koushik-2006.github.io/CodeAtlas-AI-Codebase-Intelligence-Platform",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });

  // 7. Copy generated out directory to root out/
  const tempOutDir = path.join(tempWorkspace, "out");
  if (fs.existsSync(tempOutDir)) {
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
    copyRecursiveSync(tempOutDir, outDir);

    // 7a. Ensure .nojekyll exists
    fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
    console.log("  ✔ Created out/.nojekyll (ensures GitHub Pages serves _next static assets)");

    // 7b. Ensure 404.html exists for SPA fallback
    const indexPath = path.join(outDir, "index.html");
    const notFoundPath = path.join(outDir, "404.html");
    if (!fs.existsSync(notFoundPath) && fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, notFoundPath);
      console.log("  ✔ Created out/404.html SPA fallback from index.html");
    }

    console.log("\n=========================================================================");
    console.log("🎉 CodeAtlas static export successful! Output generated in /out");
    console.log("=========================================================================\n");
  } else {
    throw new Error("Expected out directory was not generated by next build.");
  }
} catch (error: any) {
  console.error("\n❌ Static export failed:", error?.message || String(error));
  process.exitCode = 1;
} finally {
  // Clean up temporary export workspace
  try {
    const linkNodeModules = path.join(tempWorkspace, "node_modules");
    if (fs.existsSync(linkNodeModules)) {
      try { fs.unlinkSync(linkNodeModules); } catch {}
    }
    if (fs.existsSync(tempWorkspace)) {
      fs.rmSync(tempWorkspace, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    }
  } catch {}
}
