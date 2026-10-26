import { ChevronDown } from "lucide-react";

/**
 * The phone's contents (phase18.md I8; `site-review/case-study.html`): below 1024px the
 * sticky rail is gone, so the page's headings sit in a closed "On this page" disclosure
 * under the header, not stuck to anything. Plain `<details>` and anchor links, so it is
 * server-rendered and works without script. It is a disclosure, not a `nav`: the rail keeps
 * that landmark, and a page never has two of the same name.
 */
export function ContentsDisclosure({ headings }: { headings: { id: string; text: string }[] }) {
  if (headings.length === 0) return null;
  return (
    <details className="group mt-6 rounded-xl border border-hairline bg-panel lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-small text-text [&::-webkit-details-marker]:hidden">
        On this page
        <ChevronDown aria-hidden="true" className="size-4 text-text-muted transition-transform group-open:rotate-180" />
      </summary>
      <ol className="m-0 list-none px-4 pb-3.5">
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="block py-1.5 text-small text-read hover:text-text">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
