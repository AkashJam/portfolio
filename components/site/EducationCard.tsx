import type { EducationEntry } from "@/data/education";

/**
 * The date/location line lives in Timeline's `when` column now, not here
 * — see the matching note on ExperienceCard. Styled as the same `.role`
 * card, without the Responsibilities/Achievements split.
 */
export function EducationCard({ entry }: { entry: EducationEntry }) {
  return (
    <article className="rounded-[18px] border border-hairline bg-panel p-7">
      <h3 className="text-lg font-medium text-text">{entry.degree}</h3>
      <p className="mt-1 text-sm text-text-muted">{entry.institution}</p>
    </article>
  );
}
