import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import GithubSlugger from "github-slugger";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { z } from "zod";

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
  featured: z.boolean().default(false),
  links: z.object({ live: z.string().optional(), repo: z.string().optional() }).default({}),
  // Draft case studies render in `next dev` but are filtered out of
  // production builds (app/projects/{page,[project]}.tsx) — same mechanism
  // as blog's `draft` below.
  draft: z.boolean().default(false),
});

const blogFrontmatter = base.extend({
  category: z.string(),
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
 * slugger) — feeds components/blog/TableOfContents.tsx. */
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
    return { ...document, mdx, readingMinutes };
  },
});

const blog = defineCollection({
  name: "blog",
  directory: "content/blog",
  include: "**/*.mdx",
  schema: blogFrontmatter,
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document, mdxOptions);
    const readingMinutes = Math.max(1, Math.round(document.content.split(/\s+/).length / 200));
    const headings = extractHeadings(document.content);
    return { ...document, mdx, readingMinutes, headings };
  },
});

export default defineConfig({
  content: [projects, blog],
});
