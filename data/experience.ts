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
  /** "Key Decisions" — arrived from the user as a list, not a paragraph. */
  decisions: string[];
}

// Most-recent-first, author-controlled order (no sort logic — only 2
// entries, not worth the machinery `sortSkills` earns for a larger list).
export const experience: ExperienceEntry[] = [
  {
    company: "Lifeed",
    role: "Full-Stack Engineer",
    location: "Milan, Italy",
    start: "October 2023",
    summary:
      "Full-Stack Engineer on a Go + Vue/TypeScript eLearning platform serving 50,000+ learners — responsible for the learner PWA's frontend, and for the internal admin platform end-to-end, from domain model and interface design through to implementation.",
    responsibilities: [
      "Owned the learner-facing Vue/TypeScript PWA and the Go Backend-for-Frontend in front of it — the single trust boundary between the browser and the platform's internal services.",
      "Designed and maintained that BFF: aggregating a request across roughly eight internal services, verifying auth per request, and owning the session and token lifecycle so no credential ever reached the client.",
      "Led frontend development of the progressive web app (Vue, Quasar, GraphQL, Strapi CMS), including push notifications and reusable content.",
      "Independently built and operated an internal admin platform giving Customer Success self-serve tooling for previously manual operations.",
      "Worked across cloud infrastructure on AWS — EC2, RDS, ALB, and Docker.",
      "Owned observability, testing, and CI/CD across the stack (Prometheus, Grafana, Go testing, Jest, Vitest, GitLab).",
      "Partnered with Product, Design, Content, and Customer Success to turn requirements into shipped features.",
      "Managed third-party integrations — Intercom, Typeform, Wistia — and localization workflows via Ditto and Figma.",
      "Reviewed PRs, set coding standards, and contributed to architecture and roadmap decisions in technical planning.",
    ],
    achievements: [
      "Rescued a client-facing analytics dashboard that had stopped loading — main queries had drifted to roughly five minutes against a 60-second timeout. Query preloading, splitting the data fetch so rendering no longer waited on the slowest result, and a cache-warming job brought p95 load time to around 30 seconds.",
      "Held 99.9% uptime by introducing Prometheus and Grafana monitoring across the platform.",
      "Made a real Postgres the merge gate for anything touching the data layer, with test coverage aimed at the functionality where failure is costly rather than spread evenly to hit a percentage.",
      "Improved user retention and course completion by 12% through a rebuilt Intercom workflow with event tracking and email notifications.",
      "Built the learner-facing frontend to WCAG 2.1 AA standards through semantic HTML and dynamic ARIA attributes.",
      "Shipped an internal admin platform from scratch, automating operations that were previously manual.",
      "Took engineers off the critical path for copy changes — localized text moved from per-locale database rows, which required an engineer and a content creator working together, into Ditto connected to Figma frames, with a BFF-side script fetching and caching the published result.",
      "Migrated the platform's data hosting from the US to the EU, auditing every integration and workflow along the way — the audit is what surfaced the idle event-tracking capability that became the retention work.",
    ],
    decisions: [
      "Build an internal admin platform in-house rather than patch manual processes — traded upfront effort for lasting operational flexibility and self-serve tooling for non-engineers.",
      "Warm the analytics cache on a schedule rather than scale the database — the root cause was a subquery cache whose invalidation cascaded through every query layered above it, so the fix moved the expensive recomputation off the user's request instead of buying hardware to absorb it.",
      "Invest early in observability (Prometheus + Grafana) — made reliability measurable and turned 99.9% uptime into a defended target rather than a hope.",
      "Use the tool already paid for rather than buy another — the support platform already in the stack had event tracking and workflow automation sitting unused, which turned a procurement question into a configuration one.",
      "Adopt Quasar + Strapi CMS + GraphQL for the learning experience — decoupled content from code so non-technical teams could author dynamic material.",
      "Test against a real database rather than mocks where correctness lives in the schema — a mocked database validates your assumptions, and the bugs worth catching are the ones where those assumptions are wrong.",
      "Establish shared coding standards and drive API architecture in planning — prioritized long-term consistency and maintainability over short-term speed.",
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
      "Developed Angular applications and responsive interfaces for document management and approval workflows.",
      "Built and maintained .NET Core REST APIs powering those workflows.",
      "Optimized MySQL schemas and queries to improve backend performance.",
      "Created reusable UI components, data-visualization interfaces, animations, and responsive layouts.",
      "Maintained frontend performance, accessibility, and cross-browser compatibility.",
      "Delivered Android applications from the existing web codebase using Cordova.",
      "Contributed to AWS deployments and Jenkins CI/CD pipelines.",
    ],
    achievements: [
      "Shipped document management and approval-workflow applications end-to-end, across Angular frontends and .NET Core APIs.",
      "Improved backend performance by restructuring MySQL schemas and queries.",
      "Extended the product to Android without a separate native codebase by integrating Cordova.",
      "Built a library of reusable components and data-visualization interfaces that accelerated UI development.",
      "Broadened reach by improving accessibility and cross-browser compatibility across the frontend.",
      "Helped automate releases by contributing to Jenkins CI/CD on AWS.",
    ],
    decisions: [
      "Extend to mobile with Cordova instead of a native rebuild — reused the existing web codebase to ship Android quickly, with a single codebase to maintain.",
      "Optimize MySQL at the schema level, not just the query level — addressed performance at its source rather than patching slow queries one by one.",
      "Invest in a shared component library — traded a little upfront effort for UI consistency and faster feature delivery.",
      "Contribute to CI/CD automation — favored a repeatable Jenkins pipeline over manual, error-prone deployments.",
    ],
  },
];
