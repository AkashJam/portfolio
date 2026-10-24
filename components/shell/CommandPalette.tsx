"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { NavIcon } from "@/components/shell/NavIcon";
import { atlasMapItem, navItems, type PaletteEntry, type PaletteIndex } from "@/lib/nav";
import { hintLine, paletteFilter, splitMatch } from "@/lib/palette-index";
import { CONTACT_EMAIL, RESUME_HREF } from "@/lib/contact";

const COPIED_MS = 2000;
// The route sits on the right of a row; below 768px there is no room for it.
const ROUTE = "font-mono tracking-normal max-md:hidden";

/** Text with the query's words marked: the reason a row matched, shown on the row. */
function Marked({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitMatch(text, query).map((seg, i) =>
        seg.mark ? (
          <mark key={i} className="bg-transparent font-medium text-text underline decoration-brand-hover underline-offset-3">
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        ),
      )}
    </>
  );
}

/** A case study or a post: its title over its tags, the matched words marked. */
function DocRow({ entry, query, route, go }: { entry: PaletteEntry; query: string; route: boolean; go: (href: string) => void }) {
  return (
    <CommandItem value={`${entry.label} ${entry.sub} ${entry.href}`} keywords={entry.keywords} onSelect={() => go(entry.href)}>
      <span className="flex min-w-0 flex-col">
        <span className="line-clamp-2 whitespace-normal">
          <Marked text={entry.label} query={query} />
        </span>
        <span className="truncate text-meta text-text-muted">
          <Marked text={entry.sub} query={query} />
        </span>
      </span>
      {route && <CommandShortcut className={ROUTE}>{entry.href}</CommandShortcut>}
    </CommandItem>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [index, setIndex] = React.useState<PaletteIndex | null>(null);
  const [search, setSearch] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const fetched = React.useRef(false);
  const copiedTimer = React.useRef<number | undefined>(undefined);

  // The one index (M24), fetched the first time the palette opens and not before: no
  // page carries it, and a visitor who never opens the palette never asks for it. See
  // app/api/palette-index/route.ts for why it is not fetched from the layout.
  React.useEffect(() => {
    if (!open || fetched.current) return;
    fetched.current = true;
    fetch("/api/palette-index")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: PaletteIndex | null) => body && setIndex(body))
      .catch(() => {});
  }, [open]);

  React.useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  // A closed palette forgets its query: it opens on the empty state every time.
  const change = React.useCallback(
    (next: boolean) => {
      if (!next) setSearch("");
      onOpenChange(next);
    },
    [onOpenChange],
  );

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        change(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, change]);

  function go(href: string) {
    router.push(href);
    change(false);
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
  }

  const query = search.trim();
  const searching = query !== "";

  return (
    <CommandDialog open={open} onOpenChange={change} commandProps={{ filter: paletteFilter }}>
      <CommandInput value={search} onValueChange={setSearch} placeholder="Search projects, posts, companies, cities…" />
      {copied && (
        <div
          role="status"
          className="pointer-events-none absolute top-2 right-4 z-10 inline-flex items-center gap-2 rounded-[10px] border border-hairline bg-panel-2 px-3.5 py-2 text-small text-text"
        >
          <Check aria-hidden="true" className="size-[15px] text-market-up" />
          Copied
        </div>
      )}
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {[...navItems, atlasMapItem].map((link) => (
            <CommandItem key={link.href} value={`${link.label} ${link.href}`} onSelect={() => go(link.href)}>
              <span className="flex items-center gap-2">
                <NavIcon icon={link.icon} />
                {link.label}
              </span>
              <CommandShortcut className={ROUTE}>{link.href}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        {index && index.projects.length > 0 && (
          <CommandGroup heading="Projects">
            {index.projects.map((p) => (
              <DocRow key={p.href} entry={p} query={query} route go={go} />
            ))}
          </CommandGroup>
        )}
        {/* Posts, companies and cities appear once there is a query, so the empty list
            fits without scrolling; the hint below says what typing reaches. */}
        {searching && index && index.posts.length > 0 && (
          <CommandGroup heading="Posts">
            {index.posts.map((p) => (
              <DocRow key={p.href} entry={p} query={query} route={false} go={go} />
            ))}
          </CommandGroup>
        )}
        {searching && index && index.companies.length > 0 && (
          <CommandGroup heading="Companies">
            {index.companies.map((c) => (
              <CommandItem key={c.href} value={`${c.label} ${c.sub}`} onSelect={() => go(c.href)}>
                <span className="font-mono text-text">{c.label}</span>
                <span className="min-w-0 truncate text-meta text-text-muted">
                  <Marked text={c.sub} query={query} />
                </span>
                <CommandShortcut className={ROUTE}>{c.href}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {searching && index && index.cities.length > 0 && (
          <CommandGroup heading="Cities">
            {index.cities.map((c) => (
              <CommandItem key={c.href} value={`${c.label} ${c.sub}`} onSelect={() => go(c.href)}>
                <span>
                  <Marked text={c.label} query={query} />
                </span>
                <span className="text-meta text-text-muted">
                  <Marked text={c.sub} query={query} />
                </span>
                <CommandShortcut className={ROUTE}>{c.href}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Actions">
          <CommandItem value="Copy email address" onSelect={() => void copyEmail()}>
            <Copy />
            <span className="flex min-w-0 flex-col">
              <span>Copy email address</span>
              <span className="truncate text-meta text-text-muted">{CONTACT_EMAIL}</span>
            </span>
          </CommandItem>
          <CommandItem
            value="Download résumé"
            onSelect={() => {
              window.open(RESUME_HREF, "_blank");
              change(false);
            }}
          >
            <Download />
            Download résumé
          </CommandItem>
        </CommandGroup>
      </CommandList>
      {!searching && index && (
        <p className="border-t border-hairline px-4 py-2.5 text-meta text-text-muted">{hintLine(index)}</p>
      )}
    </CommandDialog>
  );
}
