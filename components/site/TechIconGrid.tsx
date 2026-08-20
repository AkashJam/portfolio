import Link from "next/link";

import { BrandIcon } from "@/components/site/BrandIcon";
import { skills, sortSkills } from "@/data/skills";

export function TechIconGrid() {
  const gridSkills = sortSkills(skills.filter((s) => s.inGrid));

  return (
    <div className="grid grid-cols-3 gap-3.5 md:grid-cols-6">
      {gridSkills.map((skill) => (
        <Link
          key={skill.name}
          href={`/blog?tag=${skill.domain}`}
          className="group flex flex-col items-center gap-2.5 rounded-xl border border-hairline p-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_0_24px_-8px_var(--brand)] focus-visible:-translate-y-0.5 focus-visible:border-brand focus-visible:shadow-[0_0_24px_-8px_var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <BrandIcon
            icon={skill.icon}
            className="size-6 text-text-muted transition-colors group-hover:text-brand group-focus-visible:text-brand"
          />
          <span className="text-xs text-text-muted">{skill.name}</span>
        </Link>
      ))}
    </div>
  );
}
