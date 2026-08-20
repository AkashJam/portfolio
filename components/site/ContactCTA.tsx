import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL } from "@/lib/contact";

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
      <div className="flex gap-6 text-xs tracking-[0.2em] text-text-muted uppercase">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:text-text focus-visible:text-text focus-visible:outline-none"
        >
          GitHub
        </a>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:text-text focus-visible:text-text focus-visible:outline-none"
        >
          LinkedIn
        </a>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="hover:text-text focus-visible:text-text focus-visible:outline-none"
        >
          Email
        </a>
      </div>
    </div>
  );
}
