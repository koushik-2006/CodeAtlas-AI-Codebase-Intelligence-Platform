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

