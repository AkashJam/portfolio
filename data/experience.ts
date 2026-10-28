export interface ExperienceEntry {
  company: string;
  role: string;
  location?: string;
  start: string;
  /** Omit to render "Present". */
  end?: string;
  summary: string;
  responsibilities: string[];
  achievements: string[];
  /** "Key decisions" — a list, not a paragraph. */
  decisions: string[];
}

// Most-recent-first, author-controlled order (no sort logic — only 2
// entries, not worth the machinery `sortSkills` earns for a larger list).
// The bullets are the wording agreed at the About mock (phase18.md D7, trimmed 41 → 16);
// they are provisional until Phase 23's content pass (portfolio-discrepancies.md F1).
export const experience: ExperienceEntry[] = [
  {
    company: "Lifeed",
    role: "Full-Stack Engineer",
    location: "Milan, Italy",
    start: "October 2023",
    summary:
      "Full-Stack Engineer on a Go + Vue/TypeScript eLearning platform serving 50,000+ learners — responsible for the learner PWA's frontend, and for the internal admin platform end-to-end, from domain model and interface design through to implementation.",
    responsibilities: [
      "Own the learner PWA (Vue, Quasar, GraphQL, Strapi) and the Go BFF in front of it, which aggregates about eight internal services, checks auth on every request and keeps every credential out of the browser.",
      "Built a new internal admin platform to replace the old tool, with more services and new features such as user invitations and registration validation, and run it end to end for Customer Success.",
      "Own observability, testing and CI/CD across the stack on AWS (Prometheus, Grafana, Go tests, Vitest, GitLab).",
      "Review PRs, set coding standards, and take part in architecture and roadmap planning.",
    ],
    achievements: [
      "Rescued a client analytics dashboard that had stopped loading: p95 went from about five minutes to about 30 seconds.",
      "Held 99.9% uptime after introducing Prometheus and Grafana.",
      "Took engineers off copy changes by moving localized text into Ditto, connected to Figma.",
      "Built the learner frontend to WCAG 2.1 AA.",
    ],
    decisions: [
      "Warm the cache on a schedule rather than scale the database, since the cost was a cascading invalidation, not missing hardware.",
      "Treat the US→EU hosting migration as an audit of every integration. It turned up event tracking already paid for in the support platform, and rebuilding the Intercom workflow on it was followed by a 12% rise in retention and course completion.",
      "Rebuild the admin tool on a new domain model rather than extend the old one.",
    ],
  },
  {
    company: "MHS Global Impact",
    role: "Junior Full-Stack Developer",
    start: "February 2021",
    end: "June 2022",
    summary:
      "Early-career full-stack role building document management and approval-workflow applications across web and mobile, using Angular and .NET Core on a MySQL backend.",
    responsibilities: [
      "Built Angular apps and .NET Core REST APIs for document management and approval workflows, on MySQL.",
      "Contributed to AWS deployments and Jenkins CI/CD.",
    ],
    achievements: [
      "Completed the product's Android support from the existing web codebase with Cordova.",
      "Built a shared component library that sped up UI work.",
    ],
    decisions: [
      "Fix MySQL performance at the schema level rather than one query at a time.",
    ],
  },
];

/**
 * The headline figures of Home's three stats and /about's row (phase18.md D4, D7), typed
 * once, here, next to the roles they come from. `label` is Home's short word under the
 * figure; `about` is the fuller line under it on /about. "4+ yrs" is not among them:
 * `fullStackYears` sums it from the role dates below, so it cannot drift from them.
 */
export const proofFigures = [
  { value: "50,000+", label: "learners", about: "learners on the platform" },
  { value: "99.9%", label: "uptime", about: "uptime, held with Prometheus and Grafana" },
  { value: "5m\u219230s", label: "dashboard rescue", about: "p95 on the rescued dashboard" },
] as const;

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;

/** "October 2023" as a month count; throws on anything else, so a typo fails the build. */
function monthIndex(date: string): number {
  const [name, year] = date.toLowerCase().split(" ");
  const month = MONTHS.indexOf(name as (typeof MONTHS)[number]);
  if (month < 0 || !/^\d{4}$/.test(year ?? "")) throw new Error(`experience: cannot read "${date}"`);
  return Number(year) * 12 + month;
}

/** Whole months worked across the roles; a role with no end runs to `now`. */
export function monthsWorked(entries: Pick<ExperienceEntry, "start" | "end">[], now: Date): number {
  const nowIndex = now.getUTCFullYear() * 12 + now.getUTCMonth();
  return entries.reduce((sum, e) => sum + Math.max(0, (e.end ? monthIndex(e.end) : nowIndex) - monthIndex(e.start)), 0);
}

/** `4+`: whole years, never rounded up. */
export function fullStackYears(now: Date = new Date()): string {
  return `${Math.floor(monthsWorked(experience, now) / 12)}+`;
}
