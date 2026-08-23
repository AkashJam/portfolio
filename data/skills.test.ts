import { describe, expect, it } from "vitest";

import { sortSkills, type Skill } from "@/data/skills";

function skill(name: string, level: Skill["level"], order?: number): Skill {
  return { name, category: "framework", domain: "frontend", level, order };
}

describe("sortSkills", () => {
  it("sorts by level descending when no order is given", () => {
    const sorted = sortSkills([skill("A", 2), skill("B", 5), skill("C", 3)]);
    expect(sorted.map((s) => s.name)).toEqual(["B", "C", "A"]);
  });

  it("uses explicit order in place of level for items that set it", () => {
    const sorted = sortSkills([skill("A", 5, 1), skill("B", 1, 2), skill("C", 3)]);
    // Sort key is `order ?? level`, descending: A→1, B→2, C→3 (no order, so
    // its level of 3 is used) — C's key legitimately outranks both, despite
    // A's raw level (5) being the highest, because A opted into order=1.
    expect(sorted.map((s) => s.name)).toEqual(["C", "B", "A"]);
  });

  it("does not mutate the input array", () => {
    const input = [skill("A", 1), skill("B", 5)];
    const sorted = sortSkills(input);
    expect(input.map((s) => s.name)).toEqual(["A", "B"]);
    expect(sorted).not.toBe(input);
  });
});
