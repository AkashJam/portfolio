import { BrandIcon } from "@/components/site/BrandIcon";

/**
 * Decorative icon banner below Home's hero (portfolio.md §17/§18, mockups/v2
 * design refresh) — replaces both the old word-cloud marquee and the
 * clickable tech-icon grid. Purely decorative (aria-hidden): what actually
 * built this site, not an interactive skill index — that's `data/skills.ts`,
 * kept for when `/blog` tag-filtering exists to link into (Days 10-12).
 *
 * Exact 14-item order matches mockups/v2/home.html's committed list
 * (design-pass/CHANGES.md "v4") — a curated "built with" set, distinct from
 * data/skills.ts's broader résumé taxonomy.
 */
const ITEMS: { name: string; icon: string }[] = [
  { name: "TypeScript", icon: "siTypescript" },
  { name: "React", icon: "siReact" },
  { name: "Next.js", icon: "siNextdotjs" },
  { name: "Tailwind", icon: "siTailwindcss" },
  { name: "Go", icon: "siGo" },
  { name: "Node.js", icon: "siNodedotjs" },
  { name: "GraphQL", icon: "siGraphql" },
  { name: "Redis", icon: "siRedis" },
  { name: "PostgreSQL", icon: "siPostgresql" },
  { name: "TimescaleDB", icon: "siTimescale" },
  { name: "Docker", icon: "siDocker" },
  { name: "Terraform", icon: "siTerraform" },
  { name: "AWS", icon: "aws" },
  { name: "CI/CD", icon: "siGithubactions" },
];

export function TechBanner() {
  const track = [...ITEMS, ...ITEMS];

  return (
    <div
      aria-hidden="true"
      className="group relative overflow-hidden border-y border-hairline bg-panel py-5 [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]"
    >
      <div
        className="marquee-track flex w-max gap-10 group-hover:[animation-play-state:paused]"
        style={{ animationDuration: "46s" }}
      >
        {track.map((item, i) => (
          <div key={i} className="flex min-w-16 flex-col items-center gap-2.5">
            <span className="flex size-11 items-center justify-center rounded-xl border border-hairline bg-panel-2 text-text">
              <BrandIcon icon={item.icon} className="size-6" />
            </span>
            <span className="font-mono text-[11px] text-text-muted">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
