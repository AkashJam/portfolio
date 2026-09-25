import { describe, expect, it } from "vitest";

import { experience } from "@/data/experience";
import { PERSON_ID, blogPostingLd, personLd, serializeJsonLd } from "@/lib/json-ld";

describe("serializeJsonLd", () => {
  it("cannot be closed early by a string containing </script>", () => {
    const out = serializeJsonLd({ headline: "a </script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).headline).toBe("a </script><script>alert(1)</script>");
  });
});

describe("personLd", () => {
  it("names the current employer — the entry with no end date", () => {
    const current = experience.find((e) => !e.end)!;
    expect(personLd().worksFor).toEqual({ "@type": "Organization", name: current.company });
    // Guards the premise: the data really does contain a past role too.
    expect(experience.some((e) => e.end && e.company !== current.company)).toBe(true);
  });

  it("carries the site-wide @id every author reference points at", () => {
    expect(personLd()["@id"]).toBe(PERSON_ID);
  });
});

describe("blogPostingLd", () => {
  const post = {
    _meta: { path: "a-post" },
    title: "A post",
    summary: "Summary",
    date: "2026-07-02",
    tags: ["Go"],
    category: "Performance",
  } as unknown as Parameters<typeof blogPostingLd>[0];

  it("falls back to the publish date when there is no update", () => {
    expect(blogPostingLd(post).dateModified).toBe("2026-07-02");
    expect(blogPostingLd({ ...post, updated: "2026-08-01" }).dateModified).toBe("2026-08-01");
  });

  it("points author at the Person by @id, and image at the post's own card", () => {
    const ld = blogPostingLd(post);
    expect(ld.author).toMatchObject({ "@id": PERSON_ID, name: "Akash James" });
    expect(String(ld.image)).toMatch(/\/blog\/a-post\/opengraph-image\/card$/);
  });
});
