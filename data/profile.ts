// Home hero role line (bold "Full-Stack"). Matches data/experience.ts's
// documented title ("Full-Stack Engineer") — no "Senior" there either;
// the two are kept in step deliberately.
export const heroRole = "Full-Stack Engineer";

// Home's h1 (components/site/Hero.tsx) and the root OG card's headline — one
// string so the page and its share card can't drift apart.
export const heroHeadline = "I build production-grade streaming systems on AWS.";

// Home's "Built with" line and the root OG card (app/opengraph-image.tsx).
// Tools built with this site itself (Next.js/React/Go/etc.) aren't sourced
// dynamically the way ProjectGrid's tag filters are — there's exactly one
// "Built with" line and it describes the two repos behind akjames.dev, not
// a taxonomy that grows with content. Deliberately excludes Node.js: this
// site's own stack is Next.js + Go, no separate Node backend service (see
// SkillsCapabilities.tsx's comment on the same distinction for a personal
// skills claim, which is a different, broader claim than this one).
export const builtWith = [
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind",
  "Go",
  "GraphQL",
  "Redis",
  "PostgreSQL",
  "TimescaleDB",
  "Docker",
  "Terraform",
  "AWS",
  "CI/CD",
];


export const statement = {
  headline: "From pixels to infrastructure.",
  subheadline:
    "Full-Stack Engineer designing and delivering cloud-native products with Go, Vue, and AWS.",
};

// Scoped to Italy on purpose — a long-term Italian residence/work permit
// doesn't by itself grant automatic EU-wide work rights, so this doesn't
// claim that.
export const workAuthorization =
  "Long-term work permit in Italy — authorized to work without visa sponsorship.";

export const bio: string[] = [
  "I'm Akash Aloysius James, a Full-Stack Engineer based in Milan. For the past several years I've built cloud-native products end-to-end — from the Vue.js and TypeScript interfaces people actually touch, to the Go services and AWS infrastructure that keep everything running underneath. At Lifeed, I work on an eLearning platform used by more than 50,000 people: I own the learner PWA's frontend, built the internal admin platform on my own from domain model through to interface, and rescued a client-facing analytics dashboard that had degraded to the point of timing out.",
  "What I care about most are the parts of software users never notice: reliable systems, fast response times, and clean architecture that lets a team ship confidently without breaking things. My path here started with a Computer Science degree in Chennai and led to a Master's at Politecnico di Milano, which I worked through — building document-management and approval-workflow applications at MHS Global Impact alongside the degree. Whether I'm shaping API design in a planning session, tuning a frontend for accessibility and performance, or provisioning infrastructure as code with Terraform, I like owning problems from first idea to production. Always happy to connect with people who care about building thoughtful, well-crafted software.",
];
