import type { EducationEntry } from "@/data/education";

export function EducationCard({ entry }: { entry: EducationEntry }) {
  const range = `${entry.start} — ${entry.end ?? "Present"}`;
  const meta = entry.location ? `${entry.location} · ${range}` : range;

  return (
    <article className="rounded-2xl border border-hairline bg-panel/70 p-6 backdrop-blur-sm sm:p-8">
      <p className="font-mono text-sm text-simulated">{meta}</p>
      <h3 className="mt-1 text-lg font-medium text-text">{entry.degree}</h3>
      <p className="mt-1 text-sm text-text-muted">{entry.institution}</p>
    </article>
  );
}
