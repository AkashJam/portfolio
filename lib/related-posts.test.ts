import { describe, expect, it } from "vitest";

import { neighbours, relatedPosts, type PostLike } from "@/lib/related-posts";

const post = (slug: string, date: string, tags: string[] = [], project?: string): PostLike => ({ slug, date, tags, project });

describe("relatedPosts", () => {
  const a = post("a", "2026-09-01", ["Go"], "ticker");
  const b = post("b", "2026-08-01", [], "ticker");
  const c = post("c", "2026-08-20", [], "ticker");
  const d = post("d", "2026-08-10", [], "ticker");
  const e = post("e", "2026-07-01", ["Go"]);

  it("takes the same project first, newest first, never the post itself", () => {
    expect(relatedPosts(a, [a, b, c, d, e]).map((p) => p.slug)).toEqual(["c", "d", "b"]);
  });

  it("stops at three even when more share the project", () => {
    expect(relatedPosts(a, [a, b, c, d]).map((p) => p.slug)).toHaveLength(3);
  });

  it("tops up from shared tags when the project gives fewer than three", () => {
    const only = post("only", "2026-09-05", ["Go", "Redis"], "micro");
    const mate = post("mate", "2026-06-01", [], "micro");
    const tagged = post("tagged", "2026-07-01", ["Go"]);
    const more = post("more", "2026-05-01", ["Go", "Redis"]);
    expect(relatedPosts(only, [only, mate, tagged, more]).map((p) => p.slug)).toEqual(["mate", "more", "tagged"]);
  });

  it("breaks a tie on shared tags by newest", () => {
    const base = post("base", "2026-09-05", ["Go"]);
    const older = post("older", "2026-06-01", ["Go"]);
    const newer = post("newer", "2026-07-01", ["Go"]);
    expect(relatedPosts(base, [base, older, newer]).map((p) => p.slug)).toEqual(["newer", "older"]);
  });

  it("has none for a post with no project and no shared tag", () => {
    const lone = post("lone", "2026-09-05", ["Solo"]);
    expect(relatedPosts(lone, [lone, a, b])).toEqual([]);
  });

  it("treats an unknown project as no project", () => {
    const ghost = post("ghost", "2026-09-05", ["Go"], "no-such-project");
    expect(relatedPosts(ghost, [ghost, a, b]).map((p) => p.slug)).toEqual(["a"]);
  });
});

describe("neighbours", () => {
  const oldest = post("oldest", "2026-06-01");
  const middle = post("middle", "2026-07-01");
  const newest = post("newest", "2026-08-01");
  const all = [newest, oldest, middle];

  it("is the post before and the post after it by date, across projects", () => {
    expect(neighbours(middle, all)).toEqual({ previous: oldest, next: newest });
  });

  it("has no previous for the oldest and no next for the newest", () => {
    expect(neighbours(oldest, all)).toEqual({ previous: null, next: middle });
    expect(neighbours(newest, all)).toEqual({ previous: middle, next: null });
  });

  it("orders posts on the same day by slug, so the order is stable", () => {
    const x = post("x", "2026-07-01");
    const y = post("y", "2026-07-01");
    expect(neighbours(x, [y, x]).next).toBe(y);
    expect(neighbours(y, [y, x]).previous).toBe(x);
  });
});
