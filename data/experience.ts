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
    role: "Full-Stack Software Engineer",
    location: "Milan, Italy",
    start: "October 2023",
    summary:
      "Sole engineer owning a Go + Vue/TypeScript eLearning platform end-to-end — from user-facing PWA to backend services and the AWS/Kubernetes infrastructure beneath it — serving 50,000+ learners.",
    responsibilities: [
      "Owned the full-stack eLearning platform end-to-end: Go REST APIs, a Vue.js/TypeScript PWA, PostgreSQL, and AWS.",
      "Designed and maintained the backend — REST APIs, background workers, and authentication/authorization systems.",
      "Led frontend development of the progressive web app (Vue, Quasar, GraphQL, Strapi CMS), including push notifications and reusable content.",
      "Independently built and operated an internal admin platform giving Customer Success self-serve tooling for previously manual operations.",
      "Ran cloud infrastructure on AWS EKS, EC2, RDS, ALB, Docker, and Kubernetes.",
      "Owned observability, testing, and CI/CD across the stack (Prometheus, Grafana, Go testing, Jest, Vitest, GitLab).",
      "Partnered with Product, Design, Content, and Customer Success to turn requirements into shipped features.",
      "Managed third-party integrations — Intercom, Typeform, Wistia — and localization workflows via Ditto and Figma.",
      "Reviewed PRs, set coding standards, and contributed to architecture and roadmap decisions in technical planning.",
    ],
    achievements: [
      "Cut dashboard API response time 40% (5s → 3s) by redesigning the Redis caching layer and eliminating N+1 queries.",
      "Held 99% uptime by introducing Prometheus and Grafana monitoring across the platform.",
      "Reached 90% automated test coverage, raising release confidence across backend and frontend.",
      "Improved user retention and course completion by 12% through a rebuilt Intercom workflow with event tracking and email notifications.",
      "Lifted Lighthouse performance 63 → 81 and cut LCP by 30% via code splitting and lazy loading.",
      "Achieved WCAG 2.1 AA accessibility compliance through semantic HTML and dynamic ARIA attributes.",
      "Shipped an internal admin platform from scratch, automating operations that were previously manual.",
      "Migrated legacy Vue applications and introduced a design system to modernize the product's visuals.",
    ],
    decisions: [
      "Build an internal admin platform in-house rather than patch manual processes — traded upfront effort for lasting operational flexibility and self-serve tooling for non-engineers.",
      "Redesign caching with a stale-while-revalidate strategy instead of simply scaling the database — cut latency while reducing load, addressing the root cause (N+1 reads) rather than the symptom.",
      "Invest early in observability (Prometheus + Grafana) — made reliability measurable and turned 99% uptime into a defended target rather than a hope.",
      "Adopt Quasar + Strapi CMS + GraphQL for the learning experience — decoupled content from code so non-technical teams could author dynamic material.",
      "Make testing and CI/CD a standard, not an afterthought — pushed coverage to 90% so a small team could ship quickly without regressions.",
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
