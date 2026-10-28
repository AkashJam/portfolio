// What a post's footer shows after the case-study card (phase18.md I28): up to three related
// posts, then the posts before and after it. Pure, so the rules are tested without a build.

export interface PostLike {
  slug: string;
  date: string;
  tags: string[];
  project?: string;
}

// One order, oldest first: by date, and on the same day by slug, so it is stable. Newest-first is its reverse.
const chronological = (a: PostLike, b: PostLike) => (a.date === b.date ? a.slug.localeCompare(b.slug) : a.date < b.date ? -1 : 1);
const byNewest = (a: PostLike, b: PostLike) => chronological(b, a);

/**
 * Same-project posts first, newest first; if that leaves fewer than `max`, top up from the
 * posts that share a tag, most shared tags first, then newest. The post itself is never in
 * its own list, and a post with no project and no shared tag has none.
 */
export function relatedPosts<T extends PostLike>(post: T, posts: T[], max = 3): T[] {
  const others = posts.filter((p) => p.slug !== post.slug);
  const sameProject = post.project ? others.filter((p) => p.project === post.project).sort(byNewest) : [];
  const picked = sameProject.slice(0, max);
  if (picked.length >= max) return picked;

  const shared = (p: T) => p.tags.filter((tag) => post.tags.includes(tag)).length;
  const topUp = others
    .filter((p) => !picked.includes(p) && shared(p) > 0)
    .sort((a, b) => shared(b) - shared(a) || byNewest(a, b));
  return [...picked, ...topUp.slice(0, max - picked.length)];
}

/** The post before and the post after it by date, across all posts, not within a project. */
export function neighbours<T extends PostLike>(post: T, posts: T[]): { previous: T | null; next: T | null } {
  const oldestFirst = [...posts].sort(chronological);
  const i = oldestFirst.findIndex((p) => p.slug === post.slug);
  if (i < 0) return { previous: null, next: null };
  return { previous: oldestFirst[i - 1] ?? null, next: oldestFirst[i + 1] ?? null };
}
