interface Capability {
  category: string;
  tags: string[];
  summary: string;
}

// Every tag here is something with production or shipped-project evidence
// behind it — the previous (superseded v2) mock claimed Node.js services
// (none exist: the backends are Go and, earlier, .NET Core), WebSockets
// (Ticker deliberately uses SSE instead), Core Web Vitals budgets
// (Lighthouse CI isn't wired into CI) and time-series "at scale" (one
// t4g.small against a simulated source), while omitting Vue — three years
// and three products of it. Node.js is the one deliberate exception:
// listed for its job-posting relevance rather than shipped-project
// evidence — every other tag here still is evidenced.
//
// Four rows (portfolio.md §15 Phase 6 acceptance criteria), not five —
// Reliability's content (Playwright, Prometheus, Grafana) folds into
// Infra's summary rather than getting its own row.
const CAPABILITIES: Capability[] = [
  {
    category: "Frontend",
    tags: ["TypeScript", "Vue", "Quasar", "React", "Next.js", "Tailwind"],
    summary:
      "Accessible product interfaces held to WCAG 2.1 AA — Vue and Quasar on the learning platform, React and RSC on this site.",
  },
  {
    category: "Backend",
    tags: ["Go", "Node.js", "GraphQL", "SSE", ".NET Core"],
    summary:
      "Streaming Go services with SSE fan-out to the browser, and GraphQL where content had to decouple from code.",
  },
  {
    category: "Infra",
    tags: ["AWS", "Terraform", "Docker", "CI/CD", "Prometheus", "Grafana"],
    summary:
      "Keyless CI/CD to AWS over OIDC, the whole estate in Terraform, one box running Docker Compose and watched by Prometheus.",
  },
  {
    category: "Data",
    tags: ["PostgreSQL", "TimescaleDB", "Redis", "MySQL"],
    summary:
      "Time-series at scale — Timescale hypertables for candles, Redis for caching and leader leases, and relational schemas tuned when queries drifted.",
  },
];

// Column geometry (190px label / content) matches Experience's timeline
// directly above it (components/site/Timeline.tsx) so the two sections
// share one right-aligned spine, rather than a card of its own.
export function SkillsCapabilities() {
  return (
    <div className="mt-6">
      {CAPABILITIES.map((cap, i) => (
        <div
          key={cap.category}
          className={
            i === 0
              ? "grid grid-cols-1 gap-2.5 py-1.5 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-x-8 lg:gap-y-0 lg:py-0"
              : "grid grid-cols-1 gap-2.5 border-t border-hairline py-5 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-x-8 lg:gap-y-0"
          }
        >
          <h3 className="font-mono text-xs leading-normal tracking-[0.14em] text-brand-hover uppercase lg:text-right lg:leading-[1.9]">
            {cap.category}
          </h3>
          <div className="flex max-w-[64ch] flex-col gap-2.5">
            <div className="flex flex-wrap gap-[7px]">
              {cap.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-hairline bg-panel-2 px-2.5 py-1 text-xs text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-pretty text-sm text-text-muted">{cap.summary}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
