import type { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/projects";
import { services } from "@/lib/services";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!siteUrl) return [];

  const projects = await getPublishedProjects(100);
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    ...services.map((service) => ({
      url: `${siteUrl}/services/${service.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...projects.map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      ...(project.published_at ? { lastModified: new Date(project.published_at) } : {}),
    })),
  ];
}
