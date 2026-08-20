export type SkillCategory = "language" | "framework" | "infra" | "data" | "practice";
export type SkillDomain =
  | "frontend"
  | "backend"
  | "infra"
  | "data"
  | "ai"
  | "testing"
  | "security"
  | "performance";

export interface Skill {
  name: string;
  category: SkillCategory;
  domain: SkillDomain;
  /** Self-rated, 1-5 — adjustable, not a formal certification. */
  level: 1 | 2 | 3 | 4 | 5;
  order?: number;
  /**
   * simple-icons export key (e.g. "siReact"), or omitted for concept/practice
   * entries that have no brand mark. portfolio.md §19 lists `icon` as
   * required — relaxed to optional here since forcing a fake icon string
   * onto "System Design" would be worse than just not having one.
   */
  icon?: string;
  inGrid?: boolean;
}

// Grid items: the real specialization from the bio ("Go, TypeScript, Vue.js,
// AWS, Kubernetes, PostgreSQL and Redis") plus the frameworks/tooling this
// portfolio itself is built with. Everything else is marquee-only texture.
export const skills: Skill[] = [
  { name: "TypeScript", category: "language", domain: "frontend", level: 5, icon: "siTypescript", inGrid: true },
  { name: "Go", category: "language", domain: "backend", level: 5, icon: "siGo", inGrid: true },
  { name: "React", category: "framework", domain: "frontend", level: 5, icon: "siReact", inGrid: true },
  { name: "Next.js", category: "framework", domain: "frontend", level: 5, icon: "siNextdotjs", inGrid: true },
  { name: "Vue.js", category: "framework", domain: "frontend", level: 4, icon: "siVuedotjs", inGrid: true },
  { name: "Tailwind CSS", category: "framework", domain: "frontend", level: 4, icon: "siTailwindcss", inGrid: true },
  { name: "AWS", category: "infra", domain: "infra", level: 5, icon: "aws", inGrid: true },
  { name: "Kubernetes", category: "infra", domain: "infra", level: 3, icon: "siKubernetes", inGrid: true },
  { name: "Docker", category: "infra", domain: "infra", level: 4, icon: "siDocker", inGrid: true },
  { name: "Terraform", category: "infra", domain: "infra", level: 3, icon: "siTerraform", inGrid: true },
  { name: "PostgreSQL", category: "data", domain: "data", level: 4, icon: "siPostgresql", inGrid: true },
  { name: "Redis", category: "data", domain: "data", level: 4, icon: "siRedis", inGrid: true },

  // Marquee-only texture (portfolio.md §17 hero background) — real practice
  // areas from the résumé, no brand mark needed since they never render in
  // the icon grid.
  { name: "GraphQL", category: "framework", domain: "backend", level: 4, icon: "siGraphql" },
  { name: "System Design", category: "practice", domain: "backend", level: 5 },
  { name: "API Architecture", category: "practice", domain: "backend", level: 5 },
  { name: "Caching Strategies", category: "practice", domain: "performance", level: 4 },
  { name: "Observability", category: "practice", domain: "performance", level: 4 },
  { name: "CI/CD", category: "practice", domain: "infra", level: 4 },
  { name: "Accessibility", category: "practice", domain: "frontend", level: 4 },
  { name: "Distributed Systems", category: "practice", domain: "backend", level: 4 },
  { name: "Test Automation", category: "practice", domain: "testing", level: 4 },
];

/** portfolio.md §19: "grouped by category, sorted order ?? level desc". */
export function sortSkills(list: Skill[]): Skill[] {
  return [...list].sort((a, b) => (b.order ?? b.level) - (a.order ?? a.level));
}
