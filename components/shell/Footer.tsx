import Link from "next/link";

import { navLinks } from "@/lib/nav";
import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL, RESUME_HREF } from "@/lib/contact";

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
