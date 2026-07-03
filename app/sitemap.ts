import type { MetadataRoute } from "next";
import { site } from "@/lib/content";

// Required for `output: "export"` in this Next.js build.
export const dynamic = "force-static";

const SITE_URL = "https://www.juanfiguera.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const notes = site.notes.filter((n) => n.slug);

  // Newest note date drives the home page's lastModified.
  const latest = notes.reduce(
    (acc, n) => (n.date > acc ? n.date : acc),
    "1970-01-01",
  );

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: latest,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...notes.map((n) => ({
      // trailingSlash: true in next.config.ts, so note routes end with "/".
      url: `${SITE_URL}/notes/${n.slug}/`,
      lastModified: n.date,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
