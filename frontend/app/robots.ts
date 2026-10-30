import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://koushik-2006.github.io/CodeAtlas-AI-Codebase-Intelligence-Platform";

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/features",
        "/demo",
        "/docs",
        "/quickstart",
        "/login",
        "/privacy",
        "/terms",
        "/contact",
      ],
      disallow: [
        "/dashboard",
        "/repositories",
        "/repositories/*",
        "/architecture",
        "/code-review",
        "/assistant",
        "/visual-explorer",
        "/visual-code-explorer",
        "/impact",
        "/change-impact",
        "/settings",
        "/activity",
        "/onboarding",
        "/api/*",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
