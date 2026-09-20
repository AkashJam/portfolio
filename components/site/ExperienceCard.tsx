import type { ExperienceEntry } from "@/data/experience";

/**
 * The date/location line lives in Timeline's `when` column now, not here
 * — portfolio.md §15 Phase 6 step 4 moves it out of the card so the card
 * itself is just title, summary and content.
 */
export function ExperienceCard({ entry }: { entry: ExperienceEntry }) {
  return (
    <article className="rounded-[18px] border border-hairline bg-panel p-7">
      <h3 className="text-lg font-medium text-text">
        {entry.role} · {entry.company}
      </h3>
      <p className="mt-2 mb-6 max-w-[60ch] text-sm text-text-muted">{entry.summary}</p>

      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        <div>
          <h4 className="mb-3 text-xs tracking-[0.2em] text-text-muted uppercase">
            Responsibilities
          </h4>
          <ul className="space-y-2 text-sm">
            {entry.responsibilities.map((item, i) => (
              <li
                key={i}
                className="relative pl-4 text-read before:absolute before:left-0 before:text-brand before:content-['–']"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs tracking-[0.2em] text-text-muted uppercase">
            Achievements
          </h4>
          <ul className="space-y-2 text-sm">
            {entry.achievements.map((item, i) => (
              <li
                key={i}
                className="relative pl-4 text-read before:absolute before:top-0.5 before:left-0 before:text-[11px] before:text-market-up before:content-['✦']"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <h4 className="mb-3 text-xs tracking-[0.2em] text-text-muted uppercase">
          Key Decisions
        </h4>
        <ul className="space-y-2 text-sm">
          {entry.decisions.map((item, i) => (
            <li
              key={i}
              className="relative pl-5 text-read before:absolute before:left-0 before:text-brand before:content-['→']"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
