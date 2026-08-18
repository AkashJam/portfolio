import Link from "next/link";

import { navLinks } from "@/lib/nav";

// TODO: confirm real LinkedIn URL and public contact email before Days 3-4
// (the git remotes already confirm the GitHub handle below).
const GITHUB_URL = "https://github.com/AkashJam";
const LINKEDIN_URL = "https://linkedin.com/in/TODO";
const CONTACT_EMAIL = "hello@akjames.dev";
const RESUME_HREF = "/resume.pdf";

export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-text-muted sm:flex-row sm:items-start sm:justify-between">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-text">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <a href={RESUME_HREF} className="hover:text-text">
            Résumé
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-text"
          >
            GitHub
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-text"
          >
            LinkedIn
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-text">
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
