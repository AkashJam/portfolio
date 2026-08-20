import type { ExperienceEntry } from "@/data/experience";

export function ExperienceCard({ entry }: { entry: ExperienceEntry }) {
  const range = `${entry.start} — ${entry.end ?? "Present"}`;
  const meta = entry.location ? `${entry.location} · ${range}` : range;

  return (
    <article className="rounded-2xl border border-hairline bg-panel/70 p-6 backdrop-blur-sm sm:p-8">
      <header className="mb-2 flex flex-col gap-1">
        <p className="font-mono text-sm text-simulated">{meta}</p>
        <h3 className="text-lg font-medium text-text">
          {entry.role} · {entry.company}
        </h3>
      </header>
      <p className="mb-6 max-w-[60ch] text-sm text-text-muted">{entry.summary}</p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h4 className="mb-3 text-xs tracking-[0.2em] text-text-faint uppercase">
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
          <h4 className="mb-3 text-xs tracking-[0.2em] text-text-faint uppercase">
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
        <h4 className="mb-3 text-xs tracking-[0.2em] text-text-faint uppercase">
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
