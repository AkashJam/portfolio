import { Cloud } from "lucide-react";
import {
  siDocker,
  siGithubactions,
  siGo,
  siGraphql,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siReact,
  siRedis,
  siTailwindcss,
  siTerraform,
  siTimescale,
  siTypescript,
  siVuedotjs,
} from "simple-icons";

// simple-icons has no AWS mark at all (Amazon's brand guidelines exclude
// third-party redistribution of the logo) — "aws" falls back to a generic
// lucide icon instead of a brand mark.
//
// siVuedotjs has no current renderer — TechBanner is scoped to what built
// this site, and this site is Next.js. Kept because the About page's skills
// block names Vue, so a mark may be wanted here later.
const ICONS: Record<string, { path: string; title: string }> = {
  siTypescript,
  siGo,
  siReact,
  siNextdotjs,
  siVuedotjs,
  siTailwindcss,
  siDocker,
  siTerraform,
  siPostgresql,
  siRedis,
  siGraphql,
  siNodedotjs,
  siTimescale,
  siGithubactions,
};

export function BrandIcon({ icon, className }: { icon?: string; className?: string }) {
  if (icon === "aws") {
    return <Cloud aria-hidden="true" className={className} />;
  }
  const data = icon ? ICONS[icon] : undefined;
  if (!data) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      fill="currentColor"
      className={className}
    >
      <path d={data.path} />
    </svg>
  );
}
