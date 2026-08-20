import { Cloud } from "lucide-react";
import {
  siDocker,
  siGo,
  siGraphql,
  siKubernetes,
  siNextdotjs,
  siPostgresql,
  siReact,
  siRedis,
  siTailwindcss,
  siTerraform,
  siTypescript,
  siVuedotjs,
} from "simple-icons";

// simple-icons has no AWS mark at all (Amazon's brand guidelines exclude
// third-party redistribution of the logo) — "aws" falls back to a generic
// lucide icon instead of a brand mark.
const ICONS: Record<string, { path: string; title: string }> = {
  siTypescript,
  siGo,
  siReact,
  siNextdotjs,
  siVuedotjs,
  siTailwindcss,
  siKubernetes,
  siDocker,
  siTerraform,
  siPostgresql,
  siRedis,
  siGraphql,
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
