interface Capability {
  category: string;
  tags: string[];
  summary: string;
}

// mockups/v2/about.html's editorial capabilities block, verbatim — except
// the Data row's "Prisma" tag/mention, dropped: this project has no ORM
// anywhere (the Go backend reads Postgres directly via pgx), so keeping it
// would name a technology that isn't actually used.
const CAPABILITIES: Capability[] = [
  {
    category: "Frontend",
    tags: ["TypeScript", "React", "Next.js", "Tailwind"],
    summary: "Type-safe React with RSC and design systems, held to Core Web Vitals budgets.",
  },
  {
    category: "Backend",
    tags: ["Go", "Node.js", "GraphQL", "SSE / WebSockets"],
    summary: "Streaming Go and Node services — SSE fan-out, GraphQL, and clean store seams.",
  },
  {
    category: "Infra",
    tags: ["AWS", "Terraform", "Docker", "CI/CD"],
    summary: "Keyless CI/CD to AWS, all of it in Terraform, single-box Docker Compose.",
  },
  {
    category: "Data",
    tags: ["TimescaleDB", "PostgreSQL", "Redis"],
    summary: "Time-series at scale — Timescale hypertables, Redis coordination, typed Postgres access via pgx.",
  },
];

/** About's "Skills & Capabilities" editorial block (portfolio.md §18, mockups/v2 design refresh). */
export function SkillsCapabilities() {
  return (
    <div className="rounded-2xl border border-hairline bg-panel/70 p-6 backdrop-blur-sm sm:p-8">
      <div className="flex flex-col divide-y divide-hairline">
        {CAPABILITIES.map((cap) => (
          <div key={cap.category} className="grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[150px_1fr] sm:gap-6">
            <h3 className="font-mono text-xs tracking-[0.2em] text-brand-hover uppercase">
              {cap.category}
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {cap.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-hairline bg-panel-2 px-2.5 py-1 text-xs text-text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="max-w-[60ch] text-sm text-read">{cap.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
