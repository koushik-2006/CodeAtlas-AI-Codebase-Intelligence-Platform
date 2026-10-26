import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://codeatlas.dev";
  const now = new Date();

  const publicRoutes = [
    { path: "", changeFrequency: "daily" as const, priority: 1.0 },
    { path: "/features", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/demo", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/docs", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/quickstart", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/login", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.4 },
    { path: "/terms", changeFrequency: "monthly" as const, priority: 0.4 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
