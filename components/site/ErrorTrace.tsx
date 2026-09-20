/**
 * Error pages' ambient waveform (portfolio.md §15 Phase 6 step 4/5) —
 * replaces Glow + GlowBar together with one line that also does semantic
 * work: flatlined for 404, broken for 500. Same motif as the hero pulse.
 * Sits in the "seam" between the numeral and the message, spanning the
 * full band width rather than running behind the centred text.
 */
export function ErrorTrace({ variant }: { variant: "flat" | "broken" }) {
  const points =
    variant === "flat"
      ? "0,30 600,30"
      : "0,30 168,30 184,7 200,53 216,30 288,30 302,17 316,43 330,30 600,30";
  const color = variant === "flat" ? "var(--brand-hover)" : "var(--market-down)";

  return (
    <div
      aria-hidden="true"
      className="absolute top-1/2 left-1/2 w-screen -translate-x-1/2 -translate-y-1/2 opacity-50 [mask-image:linear-gradient(90deg,transparent,#000_20%,#000_80%,transparent)]"
    >
      <svg viewBox="0 0 600 60" preserveAspectRatio="none" className="block h-auto w-full">
        <polyline fill="none" stroke={color} strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={points} />
        <polyline
          className="error-trace-run"
          fill="none"
          stroke={color}
          style={{ color } as React.CSSProperties}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={100}
          points={points}
        />
      </svg>
    </div>
  );
}
