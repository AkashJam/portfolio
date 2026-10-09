import { expect, test, type Page } from "@playwright/test";

// phase7.md Step 3 — the structure behind the Rich Results
// gate, checked locally. Google's Rich Results Test itself is a web tool this
// can't drive; this proves every page carries parseable JSON-LD of the right
// types, and that posts and case studies credit the same Person the profile
// defines. Needs no ticker. Paths, not origins, as in metadata.spec.ts.

type Node = Record<string, unknown> & { "@type"?: string | string[]; "@id"?: string };

async function ldNodes(page: Page): Promise<Node[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  // A parse failure here is itself the bug this guards against.
  const parsed = blocks.map((b) => JSON.parse(b) as Node & { "@graph"?: Node[] });
  return parsed.flatMap((p) => p["@graph"] ?? [p]);
}

const pathOf = (url: string) => new URL(url).pathname;
const byType = (nodes: Node[], type: string) => nodes.find((n) => n["@type"] === type);

test("/ carries WebSite and the Person", async ({ page }) => {
  await page.goto("/");
  const nodes = await ldNodes(page);
  expect(byType(nodes, "WebSite")).toBeTruthy();
  const person = byType(nodes, "Person")!;
  expect(person).toBeTruthy();
  expect(pathOf(person["@id"]!)).toBe("/");
  expect(new URL(person["@id"]!).hash).toBe("#person");
});

test("/about is a ProfilePage whose mainEntity is the same Person", async ({ page }) => {
  await page.goto("/");
  const homePerson = byType(await ldNodes(page), "Person")!;
  await page.goto("/about");
  const profile = byType(await ldNodes(page), "ProfilePage")!;
  expect(profile).toBeTruthy();
  const person = profile.mainEntity as Node;
  expect(person["@type"]).toBe("Person");
  expect(person["@id"]).toBe(homePerson["@id"]);
  expect(person.name).toBe("Akash James");
});

for (const { path, type } of [
  { path: "/blog/cache-invalidation", type: "BlogPosting" },
  { path: "/projects/market-ticker", type: "Article" },
]) {
  test(`${path} is a ${type} credited to the Person, with its own card`, async ({ page }) => {
    await page.goto("/about");
    const personId = ((byType(await ldNodes(page), "ProfilePage")!.mainEntity as Node)["@id"])!;
    await page.goto(path);
    const node = byType(await ldNodes(page), type)!;
    expect(node, `${type} on ${path}`).toBeTruthy();
    expect((node.author as Node)["@id"]).toBe(personId);
    // Named on the page itself: Google reads author.name without following @id.
    expect((node.author as Node).name).toBe("Akash James");
    expect(pathOf(node.url as string)).toBe(path);
    expect(pathOf(node.image as string)).toBe(`${path}/opengraph-image/card`);
    expect(node.headline).toBeTruthy();
  });
}
