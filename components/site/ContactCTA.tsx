import { CONTACT_EMAIL } from "@/lib/contact";

// GitHub/LinkedIn dropped from here (portfolio.md §15 Phase 6 step 6) — the
// footer already carries them on every page; repeating them here was the
// only duplicate of Footer's own links anywhere in the app.
export function ContactCTA() {
  return (
    <div className="flex flex-col items-center gap-6 py-24 text-center">
      <h2 className="text-[clamp(32px,5vw,58px)] leading-none font-light text-text">
        Let&apos;s build something.
      </h2>
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="rounded-full border border-hairline px-5 py-2 font-mono text-sm text-text transition-colors hover:border-brand hover:text-brand focus-visible:border-brand focus-visible:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        {CONTACT_EMAIL}
      </a>
    </div>
  );
}
