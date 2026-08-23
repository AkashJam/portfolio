import Link from "next/link";

interface DeeperLink {
  label: string;
  description: string;
  href: string;
}

/**
 * "Go deeper" link cards for project case studies (portfolio.md §18).
 * `href="#"` entries are deliberate placeholders — no architecture-docs or
 * ADR pages exist as real routes yet, and mockups/v2 itself never commits
 * to real destinations for these either.
 */
export function DeeperLinks({ items }: { items: DeeperLink[] }) {
  return (
    <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.label + item.description}
          href={item.href}
          className="group flex flex-col gap-1 rounded-xl border border-hairline bg-panel p-4 transition-colors hover:border-brand"
        >
          <span className="text-xs tracking-[0.15em] text-text-muted uppercase">{item.label}</span>
          <span className="text-sm text-text group-hover:text-brand-hover">
            {item.description} →
          </span>
        </Link>
      ))}
    </div>
  );
}
