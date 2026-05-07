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
  /** Single string for one paragraph, array for multi-paragraph notes. */
  body: string | string[];
  /** When set, the home Notes section shows this preview + "Read more →" linking to /notes/[slug]/. */
  excerpt?: string;
  /** YouTube video ID embedded near the top of the detail page. */
  youtube?: string;
  /** Resource links rendered as a structured list at the bottom of the detail page. */
  links?: { label: string; url: string; display?: string }[];
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
      date: "2026-05-06",
      slug: "system-prompt-and-vibes",
      title: "I built Agentic Power of Attorney, then let two AI agents negotiate a YC SAFE on OpenClaw to break it",
      excerpt: `I gave an AI agent access to act on my behalf a few months ago. Within ten minutes I was scared of it. Not because it did anything wrong. Because I had no way to guarantee it wouldn't. The entire trust model was a system prompt and vibes — so I built APOA to fix it.`,
      youtube: "T2Y2Tr__g_k",
      body: [
        `I gave an AI agent access to act on my behalf on a third-party platform a few months ago. Within about ten minutes I realized I was scared of it. Not because it did anything wrong. Because I had no way to guarantee it wouldn't. The entire trust model was a system prompt and vibes.`,
        `That phrase keeps rattling around in my head. <em>System prompt and vibes</em>. That's what stands between your AI agent and doing something you never authorized. A system prompt that can be jailbroken and a vague sense that it'll probably be fine. We're handing agents real credentials, real access, real authority, and constraining them with natural language and hope.`,
        `This isn't hypothetical anymore. Two weeks ago Anthropic published <a href="https://www.anthropic.com/features/project-deal"><em>Project Deal</em></a>. They gave 69 employees AI agents with real money, let them negotiate on a Slack marketplace, and 186 deals closed. No human signed off on anything. Their conclusion: "The policy frameworks for agents that transact on our behalf simply don't exist yet." And when people DO try to set boundaries with prompts? <a href="https://hai.stanford.edu/news/the-art-of-the-automated-negotiation">Stanford ran a study</a> on agent-to-agent negotiation where a buyer told their agent to stay under $500 for an iPhone. The agent spent $900 and thought it nailed it.`,
        `So I built <a href="https://agenticpoa.com/">APOA</a>. It stands for <em>Agentic Power of Attorney</em>. Think of it like a legal power of attorney, but machine-readable and cryptographically verifiable. You grant your agent a signed mandate that defines exactly what it can and can't do. The boundaries aren't in the prompt. They're in a signed token in the execution layer that the model never sees. Prompt inject all you want. Ed25519 doesn't care about feelings.`,
        `That invisibility is the point. If the LLM had to "decide" to check the constraints, a prompt injection could say "skip the check." The LLM can't bypass a gate it doesn't know about. This is the same pattern Claude Code uses (the harness enforces, not the model), the same pattern MCP uses (the server validates, not the model). APOA just makes that enforcement layer formal, user-configurable, cryptographically signed, and auditable.`,
        `To stress-test this on something with real stakes, I built it as a skill on <em>OpenClaw</em>, an open-source agent platform. My friend Praful was raising a SAFE for his startup. If you've been anywhere near a fundraise you know how it goes: 47 email threads, a week of "let me check with my partner," redlines going back and forth over a 2% discount difference. We set up two OpenClaw agents on separate machines, each on Telegram. You set your boundaries ("cap between $20M and $30M, no discount, and for the love of god keep the pro-rata rights"), the investor sets theirs, and the agents go at it in a shared group chat.`,
        `They converge in about 45 seconds. I went down a rabbit hole and ended up implementing a <em>Rubinstein alternating-offers protocol</em> (Econometrica, 1982), a game theory framework for bilateral bargaining that guarantees convergence to a unique equilibrium under time pressure. The agents make concessions where they have room and hold firm where they don't. If either agent tries to agree to something outside its signed mandate, the protocol rejects it before it ever reaches the other side.`,
        `Every offer, counteroffer, and concession is logged to a tamper-proof audit trail on <a href="https://sshsign.dev">sshsign</a>. When the agents reach agreement, both humans get private signing links in their DMs (never in the group, structural privacy), draw their signatures in the browser, and out comes an executed SAFE with the full negotiation transcript and cryptographic audit trail attached. You can see exactly what happened, why each concession was made, and verify that neither agent exceeded its authority.`,
        `The spec is intentionally simple. An APOA token specifies who the principal is, what the agent can do, what it can't do, expiration, and scope. The constraint types are generic: range, minimum, maximum, enum, required_bool. The SAFE negotiation is one schema. The same engine works for email management, vendor contracts, lease renewals, anything where an agent acts on your behalf and the stakes are real. It doesn't require platform cooperation. Any system that can verify an Ed25519 signature can participate. Peer-to-peer trust between agents and their principals, the same way a notarized power of attorney works between people.`,
        `The honest limitation: for services that don't support APOA natively (which is all of them right now), enforcement happens at the agent framework layer. It stops the LLM from going rogue. It doesn't stop a compromised framework. The audit trail and human co-sign close part of that gap. Service-side enforcement closes the rest, but that requires adoption I haven't earned yet.`,
        `This is early. The SAFE demo is two agents with well-defined numerical parameters. Real negotiations involve ambiguity, multi-party dynamics, and terms that aren't easily quantifiable. But the core principle applies anywhere an agent acts on your behalf: the boundaries should be cryptographic, not linguistic. The spec needs adversarial testing from people smarter than me. If you're working on agent infrastructure, I'd love to hear what breaks.`,
        `No blockchain. Just SSH keys and game theory.`,
      ],
      links: [
        {
          label: "APOA spec",
          url: "https://github.com/agenticpoa/apoa",
          display: "github.com/agenticpoa/apoa",
        },
        {
          label: "Negotiation protocol",
          url: "https://github.com/agenticpoa/negotiate",
          display: "github.com/agenticpoa/negotiate",
        },
        {
          label: "OpenClaw skill",
          url: "https://github.com/agenticpoa/claw-negotiate",
          display: "github.com/agenticpoa/claw-negotiate",
        },
        {
          label: "Signing + audit",
          url: "https://sshsign.dev",
          display: "sshsign.dev",
        },
      ],
    },
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
