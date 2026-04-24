export type Achievement = {
  name: string;
  year: string;
  desc: string;
};

export type Role = {
  dateRange: string;
  company: string;
  titleSuffix?: string;
  title: string;
  context?: string;
  achievements?: Achievement[];
  compact?: boolean;
};

export type Project = {
  label: string;
  live?: boolean;
  title: string;
  sub: string;
  url: string;
  urlLabel: string;
  date: string;
  desc: string;
  tags: string[];
};

export type Note = {
  /** ISO date string: "YYYY-MM-DD". Used for sort; displayed via formatNoteDate. */
  date: string;
  slug?: string;
  title: string;
  body: string;
};

const monthYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatNoteDate(iso: string): string {
  return monthYearFormatter.format(new Date(`${iso}T00:00:00Z`));
}

export type Site = {
  name: string;
  location: string;
  role: string;
  company: string;
  email: string;
  linkedin: string;
  github: string;
  githubLabel: string;
  x: string;
  xLabel: string;
  about: string[];
  experience: Role[];
  projects: Project[];
  notes: Note[];
};

export const site: Site = {
  name: "Juan Figuera",
  location: "New York, NY",
  role: "Product Director",
  company: "American Express Digital Labs",
  email: "juanfiguera@gmail.com",
  linkedin: "https://linkedin.com/in/juanfiguera",
  github: "https://github.com/juanfiguera",
  githubLabel: "juanfiguera",
  x: "https://x.com/juanbfiguera",
  xLabel: "@juanbfiguera",

  about: [
    "Electrical engineer by training, product leader by trade, repeat founder by habit.",
    "The question I keep coming back to lately: how an agent gets authority to act on someone's behalf, and how that authority stays scoped, logged, and revocable. Most agent demos end with an API key and hope. That's the gap APOA is trying to close, as an open-source layer on top of MCP.",
  ],

  experience: [
    {
      dateRange: "2019 → Now",
      company: "American Express Digital Labs",
      title: "Director, Product Management",
      context:
        "Leading AI personalization and membership products inside the Amex mobile app. Built and mentored a team of product managers across membership and AI initiatives.",
      achievements: [
        {
          name: "Dining & Hotel Recommendations",
          year: "2024 →",
          desc: "AI-powered personalization built from spend patterns, location signals, and explicit preferences. Dining inventory from <em>Resy</em>, hotels from <em>Amex Travel</em>. Available in the Amex Mobile App.",
        },
        {
          name: "Carbon Emissions Tracker",
          year: "2022–2023",
          desc: "Data-driven sustainability feature tied to actual transaction data rather than estimates. 7,300+ tons of CO₂ abated over the program's first two years.",
        },
        {
          name: "Amex Token Service",
          year: "2019–2021",
          desc: "Scaled payment tokenization infrastructure from $100M to $1.1B in annual transaction volume through feature development, API optimization, and merchant adoption.",
        },
      ],
    },
    {
      dateRange: "2015–2025",
      company: "HarvestYield",
      titleSuffix: "Acquired",
      title: "Co-founder & CTO",
      context:
        "B2B agricultural fleet management platform. Built and scaled from zero to acquisition over ten years. Most of what I know about running a real business came from here.",
      achievements: [
        {
          name: "Scale",
          year: "2015–2025",
          desc: "Grew to 1,700+ monthly users and $15M+ in transactions before the acquisition.",
        },
        {
          name: "Technical leadership",
          year: "2015–2025",
          desc: "Recruited and managed the engineering team. Owned full product lifecycle on Ruby on Rails, Swift, PostgreSQL, and AWS.",
        },
      ],
    },
    {
      dateRange: "2013–2015",
      company: "Daily Burn",
      title: "Software Engineer",
      context:
        "Built the fitness recommendation engine that increased user engagement by 25%. Optimized backend API performance by 20%.",
      compact: true,
    },
    {
      dateRange: "2011–2013",
      company: "Deutsche Bank",
      title: "Associate Business Analyst",
      context:
        "Architected incident management platform for 24/7 monitoring of high-frequency trading systems. Wrote business requirements and UX flows for financial products.",
      compact: true,
    },
  ],

  projects: [
    {
      label: "Open source",
      live: true,
      title: "APOA",
      sub: "Agentic Power of Attorney",
      url: "https://agenticpoa.com",
      urlLabel: "agenticpoa.com",
      date: "2026 →",
      desc: "Open-source authorization for AI agents, modeled on power of attorney. Works for services with APIs (OAuth under the hood) and services without (browser-based credential injection where the AI never sees the credentials). TypeScript and Python SDKs shipped, plus MCP and A2A packages.",
      tags: ["Open Source", "AI Agents"],
    },
    {
      label: "PSA",
      live: true,
      title: "Ship Responsibly",
      sub: "A PSA for the vibecoding era",
      url: "https://shipresponsibly.com",
      urlLabel: "shipresponsibly.com",
      date: "2026 →",
      desc: "A satirical public health campaign about the risks of shipping vibecoded software. Five levels of responsibility, from renaming vacation photos to medical software built over a long weekend. Includes a playbook with real guidelines for shipping safer code.",
      tags: ["Satire", "Playbook"],
    },
    {
      label: "Weekend build",
      live: true,
      title: "Silicon Fighter",
      sub: "Street Fighter, but for CEOs",
      url: "https://siliconfighter.com",
      urlLabel: "siliconfighter.com",
      date: "2025",
      desc: "A fun take on the iconic Street Fighter game I grew up with, starring tech CEOs instead of Ryu and Ken. Built over Thanksgiving weekend with Claude Code, Cursor, and Nano Banana Pro.",
      tags: ["Pixel art", "Gaming"],
    },
  ],

  notes: [
    {
      date: "2026-04-15",
      slug: "what-apoa-adds-to-mcp",
      title: "What APOA adds to MCP",
      body: "The piece I keep adding to MCP is capability attenuation: every time an agent delegates to another agent, the new permissions can only be narrower than the parent's. Never wider. The protocol enforces it at signing, and cascade revocation means pulling one token breaks the chain below it. Around that: OAuth for APIs, browser-based credential injection for the long tail that doesn't have one, natural-language soft rules logged next to hard rules the protocol refuses outright, per-action audit. None of it is novel alone. The question is whether it's the right default for agents acting on behalf of people.",
    },
    {
      date: "2026-04-22",
      slug: "claude-design-is-fire",
      title: "Claude Design is 🔥🔥🔥",
      body: "Always liked UI/UX design, and love working in Figma. Tried Claude Design recently and was so impressed with the quality of the output: multiple design directions, high-definition mockups. Makes me wonder how design will evolve over the next 12 months.",
    },
  ],
};

/**
 * Wraps product/entity names in plain <em>. Does NOT apply vermilion —
 * the vermilion accent is reserved for exactly two tokens in the page
 * (hero "authority" and contact "AI agents"). Callers render this HTML
 * via `dangerouslySetInnerHTML`.
 */
export function markEm(str: string): string {
  return str
    .replace(/HarvestYield/g, "<em>HarvestYield</em>")
    .replace(/APOA/g, '<em class="shu">APOA</em>')
    .replace(/MCP/g, "<em>MCP</em>")
    .replace(/American Express Digital Labs/g, "<em>American Express Digital Labs</em>");
}

/** Emphasizes numeric highlights (dollar amounts, user counts, CO₂). */
export function highlight(str: string): string {
  return str
    .replace(/(\$[\d.,]+[MBK]\+?)/g, "<em>$1</em>")
    .replace(/(\d[\d,]*\+? (?:tons|monthly users))/g, "<em>$1</em>")
    .replace(/(CO₂)/g, "<em>$1</em>")
    .replace(/APOA/g, "<em>APOA</em>");
}
