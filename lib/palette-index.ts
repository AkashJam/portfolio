import type { PaletteEntry, PaletteIndex } from "@/lib/nav";
import type { AtlasRow, Sensor } from "@/lib/market-schemas";
import { sensorHref } from "@/lib/sensor-title";

// The ⌘K palette's index and its search rules (phase19.md step 4, M24), pure so they
// are testable without a browser or the content build.

interface Document {
  title: string;
  tags: string[];
  draft: boolean;
}

export interface ProjectDoc extends Document {
  slug: string;
}

export interface PostDoc extends Document {
  /** `_meta.path`: the post's address under /blog. */
  path: string;
  /** YYYY-MM-DD: the palette lists posts newest first, as /blog does. */
  date: string;
}

/** Drafts render in `next dev` and are left out of a production build, as everywhere else. */
export function buildPaletteIndex({
  projects,
  posts,
  sensors,
  atlasRows,
  includeDrafts,
}: {
  projects: ProjectDoc[];
  posts: PostDoc[];
  sensors: Sensor[] | null;
  atlasRows: AtlasRow[] | null;
  includeDrafts: boolean;
}): PaletteIndex {
  const shown = <T extends Document>(docs: T[]) => docs.filter((d) => includeDrafts || !d.draft);
  return {
    projects: shown(projects).map((p) => ({
      href: `/projects/${p.slug}`,
      label: p.title,
      sub: p.tags.join(" · "),
      keywords: p.tags,
    })),
    posts: shown(posts)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((p) => ({
        href: `/blog/${p.path}`,
        label: p.title,
        sub: p.tags.join(" · "),
        keywords: p.tags,
      })),
    // The eighteen sensors, in the ticker's fixed order: a company, or a global theme.
    companies: (sensors ?? []).map((s) => {
      const sub = s.country ? `${s.country} · ${s.name}` : (s.theme ?? s.name);
      return { href: sensorHref(s), label: s.symbol, sub, keywords: [] };
    }),
    // Each city page joins as it ships: the ticker says which cities have one.
    cities: (atlasRows ?? [])
      .filter((r) => r.hasCityPage)
      .map((r) => ({ href: `/atlas/${r.slug}`, label: r.city, sub: r.country, keywords: [] })),
  };
}

/**
 * cmdk's `filter`: every word of the query appears, as a substring, in the row's text
 * or keywords. Not cmdk's fuzzy score: "redis" must find the posts that say Redis,
 * not whatever contains r, e, d, i, s in order.
 */
export function paletteFilter(value: string, search: string, keywords?: string[]): number {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;
  const haystack = [value, ...(keywords ?? [])].join(" ").toLowerCase();
  return words.every((w) => haystack.includes(w)) ? 1 : 0;
}

export interface Segment {
  text: string;
  mark: boolean;
}

/** The text cut at every occurrence of a query word, the occurrences marked. */
export function splitMatch(text: string, query: string): Segment[] {
  const words = [...new Set(query.toLowerCase().split(/\s+/).filter(Boolean))].sort((a, b) => b.length - a.length);
  if (words.length === 0) return [{ text, mark: false }];
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text
    .split(pattern)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, mark: words.includes(part.toLowerCase()) }));
}

/** The empty state's last line, counted from the index. */
export function hintLine(index: Pick<PaletteIndex, "posts" | "companies" | "cities">): string {
  return `Type to search ${index.posts.length} posts, ${index.companies.length} companies and ${index.cities.length} cities`;
}

export type { PaletteEntry };
