import type { allBlogs, allProjects } from "content-collections";
import type { Article, BlogPosting, Graph, PersonLeaf, ProfilePage, WebSite, WithContext } from "schema-dts";

import { education } from "@/data/education";
import { experience } from "@/data/experience";
import { CAPABILITIES } from "@/components/site/SkillsCapabilities";
import { heroRole } from "@/data/profile";
import { GITHUB_URL, LINKEDIN_URL } from "@/lib/contact";
import { SITE_NAME } from "@/lib/metadata";
import { SITE_URL } from "@/lib/site";

/**
 * Structured data (portfolio.md §15 Phase 7 step 3). Types are the
 * Google-eligible forms of what the spec asked for — `ProfilePage` wraps the
 * `Person`, and case studies are `Article` (a `CreativeWork` subtype) —
 * because the Rich Results Test reports nothing for a bare `Person` or
 * `CreativeWork`. Passing it means *eligible*, not *displayed*: the real value
 * is one author entity, linked from every post and case study by `@id`.
 *
 * Every value comes from data the pages already load; nothing is invented.
 */

/** One Person for the whole site: `/` and `/about` define it, every post and
 * case study points at it as `author`, so crawlers see one entity, not many. */
export const PERSON_ID = `${SITE_URL}/#person`;
// The `@id` links the author to the Person defined on `/` and `/about`; the
// name and profile URL are repeated because a post page doesn't carry that
// node, and Google's Article parser reads `author.name` off the page itself.
const AUTHOR = { "@type": "Person", "@id": PERSON_ID, name: SITE_NAME, url: `${SITE_URL}/about` } as const;

/**
 * Serialised for a `<script>` body. `JSON.stringify` alone doesn't escape
 * `<`, so a string containing `</script>` would close the tag early — Next's
 * JSON-LD guide (docs/01-app/02-guides/json-ld.md) escapes it the same way.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

// `PersonLeaf`, not `Person`: schema-dts's `Person` also admits a bare string,
// and callers read fields (`@id`, `worksFor`) off this object.
export function personLd(): PersonLeaf {
  // The current role is the one with no end date, not simply the first entry.
  const current = experience.find((e) => !e.end);
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE_NAME,
    alternateName: "Akash Aloysius James",
    jobTitle: heroRole,
    url: SITE_URL,
    ...(current && { worksFor: { "@type": "Organization", name: current.company } }),
    alumniOf: education.map((e) => ({ "@type": "EducationalOrganization" as const, name: e.institution })),
    address: { "@type": "PostalAddress", addressLocality: "Milan", addressCountry: "IT" },
    sameAs: [GITHUB_URL, LINKEDIN_URL],
    // The personal-skills claim /about makes, not `builtWith` (this site's own
    // stack, which deliberately omits e.g. Vue and Node.js).
    knowsAbout: CAPABILITIES.flatMap((c) => c.tags),
  };
}

/** Home: the site, and the person it belongs to, as one graph. */
export function homeLd(): Graph {
  const website: WebSite = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    author: AUTHOR,
  };
  return { "@context": "https://schema.org", "@graph": [website, personLd()] };
}

export function profilePageLd(): WithContext<ProfilePage> {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE_URL}/about`,
    mainEntity: personLd(),
  };
}

type Post = (typeof allBlogs)[number];
type Project = (typeof allProjects)[number];

export function blogPostingLd(post: Post): WithContext<BlogPosting> {
  const url = `${SITE_URL}/blog/${post._meta.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: AUTHOR,
    // The post's own share card (app/blog/[slug]/opengraph-image.tsx).
    image: `${url}/opengraph-image/card`,
    keywords: post.tags,
    articleSection: post.category,
    url,
    mainEntityOfPage: url,
  };
}

/** No `datePublished`: frontmatter carries only a year, and a date invented
 * to fill it would be worse than the Rich Results warning its absence gives. */
export function caseStudyLd(project: Project): WithContext<Article> {
  const url = `${SITE_URL}/projects/${project.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: project.title,
    description: project.summary,
    author: AUTHOR,
    image: `${url}/opengraph-image/card`,
    keywords: project.tags,
    url,
    mainEntityOfPage: url,
  };
}
