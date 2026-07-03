import type { MetadataRoute } from "next";

// Required for `output: "export"` in this Next.js build.
export const dynamic = "force-static";

const SITE_URL = "https://www.juanfiguera.com";

// AI/LLM crawlers we explicitly welcome. Listing them by name is a signal of
// intent even though the wildcard rule already allows them: this is a site
// about agents, so agents are the audience.
const aiAgents = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "CCBot",
  "Applebot-Extended",
  "Bytespider",
  "cohere-ai",
  "Meta-ExternalAgent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: aiAgents, allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
