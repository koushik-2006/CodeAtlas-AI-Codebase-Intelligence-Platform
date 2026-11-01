import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === "true" || process.env.GITHUB_PAGES === "true";
const defaultRepo = "koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform";
const repoEnv = process.env.GITHUB_REPOSITORY || process.env.GITHUB_PAGES_REPO || (isStaticExport ? defaultRepo : "");
const repoName = repoEnv.includes("/") ? repoEnv.split("/")[1] : repoEnv;
const basePath = isStaticExport && repoName && !process.env.CUSTOM_DOMAIN ? `/${repoName}` : "";

const nextConfig = {
  ...(isStaticExport ? { output: "export", trailingSlash: true } : {}),
  basePath: basePath || undefined,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "firebase/app": path.resolve(__dirname, "frontend/node_modules/firebase/app"),
      "firebase/auth": path.resolve(__dirname, "frontend/node_modules/firebase/auth"),
      "firebase/app-check": path.resolve(__dirname, "frontend/node_modules/firebase/app-check"),
      "firebase/ai": path.resolve(__dirname, "frontend/node_modules/firebase/ai"),
      "firebase": path.resolve(__dirname, "frontend/node_modules/firebase"),
    };
    config.resolve.modules = [
      path.resolve(__dirname, "frontend/node_modules"),
      path.resolve(__dirname, "node_modules"),
      "node_modules",
      ...(config.resolve.modules || []),
    ];
    return config;
  },
  ...(!isStaticExport
    ? {
        async rewrites() {
          const backendUrl = process.env.FASTAPI_BACKEND_URL || "http://localhost:8000";
          return [
            {
              source: "/api/v1/:path*",
              destination: `${backendUrl}/api/v1/:path*`,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;

