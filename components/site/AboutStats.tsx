interface Stat {
  value: string;
  label: string;
}

// Every figure here is already stated in data/experience.ts's Lifeed
// entry (portfolio.md §15 Phase 6 step 4) — this just extracts the
// headline numbers into a scannable row rather than leaving them buried
// in prose.
const STATS: Stat[] = [
  { value: "50,000+", label: "learners on the platform" },
  { value: "99.9%", label: "uptime, held with Prometheus and Grafana" },
  { value: "~8", label: "internal services behind one BFF" },
  { value: "5m→30s", label: "p95 on the rescued dashboard" },
  { value: "+12%", label: "retention and course completion" },
];

export function AboutStats() {
  return (
    <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-3 lg:grid-cols-5">
      {STATS.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-0.5">
          <b className="font-mono text-xl font-semibold text-text tabular-nums md:text-2xl">
            {stat.value}
          </b>
          <span className="text-[12.5px] leading-snug text-text-muted">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
