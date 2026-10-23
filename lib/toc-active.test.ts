import { describe, expect, it } from "vitest";

import { activeHeading } from "@/lib/toc-active";

// Tops are in viewport coordinates: negative once the heading has scrolled past the top.
describe("activeHeading", () => {
  const tops = (scrollY: number) => [510, 726, 1584, 2373, 2809, 3413].map((t) => t - scrollY);

  it("is the first heading until a later one has reached the top", () => {
    expect(activeHeading(tops(0), false)).toBe(0);
    expect(activeHeading(tops(300), false)).toBe(0);
  });

  it("moves on as each heading reaches the offset", () => {
    expect(activeHeading(tops(640), false)).toBe(1); // approach at 86px
    expect(activeHeading(tops(1500), false)).toBe(2);
  });

  it("follows a jump that never put a heading in any narrow band", () => {
    // From the top straight to the middle of 'results': the observer saw nothing and stayed on 0.
    expect(activeHeading(tops(2600), false)).toBe(3);
  });

  it("marks the last heading at the foot of the page, though it cannot scroll up to the offset", () => {
    // The page is 3830 tall in a 900 window: at its end 'go-deeper' sits at 483px, below the offset.
    const end = tops(2930);
    expect(end[5]).toBeGreaterThan(100);
    expect(activeHeading(end, false)).toBe(4);
    expect(activeHeading(end, true)).toBe(5);
  });

  it("is -1 for a page with no headings", () => {
    expect(activeHeading([], false)).toBe(-1);
  });
});
