interface Capability {
  category: string;
  tags: string[];
  summary: string;
}

// Originally mockups/v2/about.html's editorial block verbatim; since rewritten
// to match data/experience.ts rather than the mockup. Every tag here is
// something with production or shipped-project evidence behind it — the
// previous version claimed Node.js services (none exist: the backends are Go
// and, earlier, .NET), WebSockets (Ticker deliberately uses SSE instead),
// Core Web Vitals budgets (Lighthouse CI isn't wired into CI) and time-series
// "at scale" (one t4g.small against a simulated source), while omitting Vue —
// three years and three products of it.
const CAPABILITIES: Capability[] = [
  {
    category: "Frontend",
    tags: ["Vue", "TypeScript", "Quasar", "React / Next.js", "Tailwind"],
    summary:
      "Vue and TypeScript across three production apps, one an installable PWA; React with Server Components on this site.",
  },
  {
    category: "Backend",
    tags: ["Go", "REST", "GraphQL", "SSE"],
    summary:
      "Go services, and a Backend-for-Frontend aggregating a fleet of internal APIs behind one auth boundary.",
  },
  {
    category: "Infra",
    tags: ["AWS", "Terraform", "Docker", "CI/CD"],
    summary:
      "EC2 and RDS at work; Terraform and keyless OIDC deploys onto single-box Docker Compose here.",
  },
  {
    category: "Data",
    tags: ["PostgreSQL", "Redis", "TimescaleDB"],
    summary:
      "Invariants enforced in the schema, Redis for coordination and caching, Timescale hypertables for candles.",
  },
  {
    category: "Reliability",
    tags: ["Integration testing", "Playwright", "Prometheus", "Grafana"],
    summary:
      "A real database as the merge gate, browser and contract tests in CI, and monitoring that made uptime a defended target.",
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
