import {
  ChartNoAxesColumn,
  FileText,
  Globe,
  House,
  LayoutGrid,
  User,
  type LucideIcon,
} from "lucide-react";

import type { NavIconKey } from "@/lib/nav";

const ICONS: Record<NavIconKey, LucideIcon> = {
  home: House,
  projects: LayoutGrid,
  blog: FileText,
  about: User,
  market: ChartNoAxesColumn,
  atlas: Globe,
};

/** The icon for a nav item, as drawn in shell-v2/command-palette-drawer.html. Decorative: the label is the name. */
export function NavIcon({
  icon,
  className,
}: {
  icon: NavIconKey;
  className?: string;
}) {
  const Icon = ICONS[icon];
  return <Icon aria-hidden="true" className={className ?? "size-4"} />;
}
