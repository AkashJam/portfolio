"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The blog index's search and topic chips (phase18.md I30, I6; `site-review/blog-index.html`).
 * The cards are server-rendered and arrive as `children`, so every post link is in the page's
 * HTML (M10); this only hides cards, by the `hidden` attribute, so what is left keeps its place
 * and nothing is ever reordered. A section whose cards are all hidden hides its heading too.
 * The state is `?q=` (title, summary and tags) and `?tag=` (a topic), read once on mount and
 * written back with `replaceState`, as the Atlas does, so the page stays static (ISR) and a
 * copied address reproduces the view. Without script the full list shows.
 */
export function BlogFilter({
  topics,
  total,
  children,
}: {
  topics: string[];
  total: number;
  children: React.ReactNode;
}) {
  const [query, setQuery] = React.useState("");
  const [topic, setTopic] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);
  const [shown, setShown] = React.useState(total);
  const root = React.useRef<HTMLDivElement>(null);

  // The address is read once, on mount. An unknown topic is ignored.
  React.useEffect(() => {
    const read = () => {
      const params = new URLSearchParams(window.location.search);
      const tag = params.get("tag");
      setQuery(params.get("q") ?? "");
      setTopic(tag && topics.includes(tag) ? tag : null);
      setReady(true);
    };
    read();
  }, [topics]);

  // Hide, never reorder: toggle `hidden` on the server-rendered cards and their sections' headings.
  React.useEffect(() => {
    if (!ready || !root.current) return;
    const needle = query.trim().toLowerCase();
    let visible = 0;
    for (const card of root.current.querySelectorAll<HTMLElement>("[data-post]")) {
      const match =
        (!topic || card.dataset.topic === topic) && (!needle || (card.dataset.text ?? "").includes(needle));
      card.hidden = !match;
      if (match) visible++;
    }
    for (const section of root.current.querySelectorAll<HTMLElement>("[data-section]")) {
      section.hidden = !section.querySelector("[data-post]:not([hidden])");
    }
    setShown(visible);

    const params = new URLSearchParams();
    if (needle) params.set("q", query.trim());
    if (topic) params.set("tag", topic);
    const search = params.size ? `?${params}` : "";
    if (search !== window.location.search) {
      window.history.replaceState(null, "", `${window.location.pathname}${search}${window.location.hash}`);
    }
  }, [query, topic, ready]);

  const clear = () => {
    setQuery("");
    setTopic(null);
  };

  return (
    <div ref={root}>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-8 max-w-130">
        <label className="flex items-center gap-2.5 rounded-xl border border-hairline bg-panel px-3.5 text-text-muted focus-within:border-brand-hover">
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <input
            type="search"
            aria-label="Search posts"
            placeholder={`Search ${total} posts by title, summary or tag`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-text-muted"
          />
        </label>
      </form>

      <nav aria-label="Topics" className="mt-3.5 flex flex-wrap gap-2">
        {[null, ...topics].map((t) => (
          <button
            key={t ?? "all"}
            type="button"
            aria-pressed={topic === t}
            onClick={() => setTopic(t)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-small transition-colors",
              topic === t
                ? "border-brand-hover bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] text-text"
                : "border-hairline text-text-muted hover:text-text",
            )}
          >
            {t ?? "All"}
          </button>
        ))}
      </nav>

      <p role="status" className={cn("mt-8 text-small text-text-muted", shown > 0 && "sr-only")}>
        {shown === 0 ? (
          <>
            No posts match.{" "}
            <button type="button" onClick={clear} className="text-brand-hover underline underline-offset-3">
              Clear
            </button>
          </>
        ) : (
          `${shown} of ${total} posts`
        )}
      </p>

      {children}
    </div>
  );
}
