import { skills } from "@/data/skills";

// 5 stacked rows of huge, near-invisible scrolling text behind the Hero
// name (portfolio.md §17/§18) — chunked from the real skill/practice list
// so each row reads as a loose category grouping, matching the mockup's
// per-row texture without hardcoding copy.
const ROWS: { durationS: number; reverse: boolean }[] = [
  { durationS: 60, reverse: false },
  { durationS: 74, reverse: true },
  { durationS: 52, reverse: false },
  { durationS: 82, reverse: true },
  { durationS: 68, reverse: false },
];

function chunk<T>(list: T[], count: number): T[][] {
  const size = Math.ceil(list.length / count);
  return Array.from({ length: count }, (_, i) => list.slice(i * size, i * size + size));
}

export function TechMarquee() {
  const names = skills.map((s) => s.name);
  const rows = chunk(names, ROWS.length);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-2 overflow-hidden [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"
    >
      {rows.map((row, i) => {
        const text = `${row.join(" • ")} • `;
        return (
          <div key={i} className="overflow-hidden">
            <div
              className="tech-marquee-row flex w-max shrink-0 gap-[1ch] text-[9.5vh] leading-none font-light whitespace-nowrap text-text/[0.045]"
              style={{
                animationDuration: `${ROWS[i].durationS}s`,
                animationDirection: ROWS[i].reverse ? "reverse" : "normal",
              }}
            >
              <span>{text}</span>
              <span>{text}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
