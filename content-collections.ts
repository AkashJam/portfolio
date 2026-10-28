import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import GithubSlugger from "github-slugger";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { z } from "zod";

import { topics } from "./lib/topics";

// `content` is a reserved field — @content-collections/core auto-populates
// it with the raw MDX body text (everything after the frontmatter), not
// something authors write. `mdx` (below) holds the compiled component.
const base = z.object({
  title: z.string(),
  summary: z.string(),
  content: z.string(),
});

// portfolio.md §19's `Project` interface, extended with the case-study
// fields (role/focus/status) that interface didn't originally cover —
// §19 gets updated to match, same as every other spec/implementation
// reconciliation this session.
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

const projectFrontmatter = base.extend({
  slug: z.string(),
  year: z.number(),
  role: z.string(),
  focus: z.string(),
  status: z.enum(["Live", "Research", "This site"]),
  tags: z.array(z.string()),
  // One explicit order for Home and /projects (D6); lower comes first.
  order: z.number(),
  // The one-line card text and the three tags a card shows (D6, I18); `summary`
  // and the full `tags` stay for the case study. Wording is a draft until the
  // content pass (Phase 23).
  tagline: z.string(),
  cardTags: z.array(z.string()).length(3),
  links: z.object({ live: z.string().optional(), repo: z.string().optional() }).default({}),
  // One picture per project (I25), shared by the case-study header, the
  // /projects preview and the Home showcase row — so it lives on the project,
  // not on the page that draws it. `src` is a path under public/ and the file
  // is 16:9; the frame pins that ratio, so a picture of another shape is
  // cropped rather than shifting the layout. `label` is what the frame's
  // chrome bar reads — a plain description of where the screen lives, since an
  // internal tool has no address to show. A live project needs none: Home's
  // rows and the /projects index fall back to `links.live`, which is where the
  // mock's `akjames.dev/market` comes from. That fallback is
  // `project.picture ?? { label }`, so the day Market gains a `src` it needs a
  // `label` written here as well, or its frame loses the address silently.
  // Optional while Market's and Portfolio's captures wait for Phase 23, and
  // the consumers differ on what a project without one shows: the case-study
  // header draws no frame, while Home's rows and the /projects preview draw
  // the frame with an empty panel, so the rows keep their alignment.
  picture: z.object({ src: z.string(), label: z.string().optional() }).optional(),
  // Draft case studies render in `next dev` but are filtered out of
  // production builds (app/projects/{page,[project]}.tsx) — same mechanism
  // as blog's `draft` below.
  draft: z.boolean().default(false),
});

const DESCRIPTION_MAX = 155;
const DESCRIPTION_WARN = 160;

const blogFrontmatter = base.extend({
  topic: z.enum(topics),
  // A case-study slug, or absent for a post that belongs to none (I28).
  project: z.string().optional(),
  // The meta description (I29), written in the content pass: at most 155
  // characters, and the build warns over 160. Falls back to `summary`.
  description: z.string().optional(),
  // Ranks the featured three on the blog index (I30); absent for every other
  // post, which is "Latest", newest first.
  order: z.number().optional(),
  date: isoDate,
  updated: isoDate.optional(),
  tags: z.array(z.string()),
  // Draft posts render in `next dev` but are filtered out of production
  // builds (app/blog/{page,[slug]}.tsx) — lets a half-reviewed post exist
  // as a real file without going live by accident.
  draft: z.boolean().default(false),
});

// rehypeSlug assigns real `id`s to headings in the compiled output —
// extractHeadings below (blog only, for TableOfContents) uses the same
// slugger so its ids match what actually lands in the rendered HTML.
// `unified`'s Pluggable[] typing doesn't infer cleanly across a mixed
// bare-plugin/tuple-with-options array — explicit `any[]` sidesteps it
// rather than fighting the inference, a common workaround for this exact
// combination of rehype plugins.
const mdxOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rehypePlugins: [rehypeSlug, [rehypePrettyCode, { theme: "github-dark" }]] as any[],
};

/** h2 headings + slugged ids, matching rehype-slug's ids exactly (same
 * slugger) — feeds components/blog/TableOfContents.tsx (blog posts and,
 * since phase6.md Step 5, project case studies too). */
function extractHeadings(markdown: string): { id: string; text: string }[] {
  const slugger = new GithubSlugger();
  const headings: { id: string; text: string }[] = [];
  for (const line of markdown.split("\n")) {
    const match = /^##\s+(.+)$/.exec(line.trim());
    if (match) {
      const text = match[1].trim();
      headings.push({ id: slugger.slug(text), text });
    }
  }
  return headings;
}

const projects = defineCollection({
  name: "projects",
  directory: "content/projects",
  include: "**/*.mdx",
  schema: projectFrontmatter,
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document, mdxOptions);
    const readingMinutes = Math.max(1, Math.round(document.content.split(/\s+/).length / 200));
    const headings = extractHeadings(document.content);
    return { ...document, mdx, readingMinutes, headings };
  },
});

const blog = defineCollection({
  name: "blog",
  directory: "content/blog",
  include: "**/*.mdx",
  schema: blogFrontmatter,
  transform: async (document, context) => {
    if (document.description && document.description.length > DESCRIPTION_WARN) {
      console.warn(
        `[content] ${document._meta.path}: description is ${document.description.length} characters (limit ${DESCRIPTION_MAX})`,
      );
    }
    const mdx = await compileMDX(context, document, mdxOptions);
    const readingMinutes = Math.max(1, Math.round(document.content.split(/\s+/).length / 200));
    const headings = extractHeadings(document.content);
    return { ...document, mdx, readingMinutes, headings };
  },
});

export default defineConfig({
  content: [projects, blog],
});
