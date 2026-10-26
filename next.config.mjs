/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === "true" || process.env.GITHUB_PAGES === "true";
const repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split("/")[1] : "";
const basePath = isStaticExport && repoName && !process.env.CUSTOM_DOMAIN ? `/${repoName}` : "";

const nextConfig = {
  ...(isStaticExport ? { output: "export", trailingSlash: true } : {}),
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;

