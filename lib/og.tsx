import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Shared Open Graph card (phase7.md Step 2) — the one layout
 * behind app/opengraph-image.tsx and the blog-post / case-study cards.
 *
 * Satori (next/og) renders to PNG without a browser, so it cannot read CSS
 * custom properties: these are literal copies of app/globals.css's tokens,
 * the same exception PriceChart's canvas fallbacks make. globals.css stays
 * the source — lib/og.test.ts fails if any value here drifts from it.
 */
export const OG_TOKENS = {
  canvas: "#0b0d0f",
  hairline: "#1c2127",
  text: "#e6e8ea",
  "text-muted": "#8b929b",
  read: "#c7cbd1",
  brand: "#6366f1",
  "brand-hover": "#818cf8",
} as const;

export const OG_SIZE = { width: 1200, height: 630 };

const t = OG_TOKENS;

/** `#rrggbb` + alpha → `rgba()`, for the glyph's tinted border and fill. */
function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/**
 * Geist from the installed `geist` package — Satori can't read the .woff2
 * the site serves, and the package ships .ttf alongside. The root card is
 * rendered at build; the per-post and per-project cards render on their
 * first request (Next does not write metadata-image bodies for dynamic
 * segments at build), so these files must be in the standalone image too.
 */
export async function loadOgFonts() {
  // Full literal paths, not a shared directory variable: Next's file tracing
  // copies whatever a path expression could reach into the standalone
  // image, and a bare directory pulls in all 80 Geist faces.
  const [light, regular, mono] = await Promise.all([
    readFile(join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans/Geist-Light.ttf")),
    readFile(join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf")),
    readFile(join(process.cwd(), "node_modules/geist/dist/fonts/geist-mono/GeistMono-Medium.ttf")),
  ]);
  return [
    { name: "Geist", data: light, weight: 300 as const, style: "normal" as const },
    { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Geist Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

/** Headline size stepped down by length, so a ~90-character post title still
 * fits three lines without the short root headline looking undersized. */
function headlineSize(text: string): number {
  if (text.length <= 44) return 68;
  if (text.length <= 72) return 56;
  return 48;
}

/** "Sep 12, 2026" — UTC, so the build machine's zone can't shift a date. */
export function formatOgDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function OgCard({
  eyebrow,
  headline,
  summary,
  chips,
  footer,
}: {
  eyebrow: string;
  headline: string;
  summary?: string;
  chips?: string[];
  footer?: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "64px 72px",
        background: t.canvas,
        fontFamily: "Geist",
        color: t.text,
      }}
    >
      {/* The shell's identity mark (components/shell/IdentityMark.tsx),
          same path, scaled up. */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 14,
            border: `1.5px solid ${alpha(t.brand, 0.35)}`,
            background: alpha(t.brand, 0.12),
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 16 16"
            fill="none"
            stroke={t["brand-hover"]}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1.5 9.5h2l1.5 3 2-7 1.5 4.5 1-2h5" />
          </svg>
        </div>
        <div style={{ fontFamily: "Geist Mono", fontSize: 24, color: t["text-muted"] }}>
          akjames.dev
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
        <div
          style={{
            fontFamily: "Geist Mono",
            fontSize: 20,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: t["text-muted"],
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "block",
            marginTop: 22,
            fontSize: headlineSize(headline),
            fontWeight: 300,
            lineHeight: 1.08,
            maxWidth: 1000,
            lineClamp: 3,
          }}
        >
          {headline}
        </div>
        {summary && (
          <div
            style={{
              display: "block",
              marginTop: 22,
              fontSize: 26,
              lineHeight: 1.4,
              color: t.read,
              maxWidth: 980,
              lineClamp: 2,
            }}
          >
            {summary}
          </div>
        )}
      </div>

      {(chips?.length || footer) && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 40,
          paddingTop: 28,
          borderTop: `1px solid ${t.hairline}`,
          fontFamily: "Geist Mono",
          fontSize: 20,
          color: t["text-muted"],
        }}
      >
        {chips?.map((chip) => (
          <div
            key={chip}
            style={{
              display: "flex",
              padding: "6px 14px",
              borderRadius: 999,
              border: `1px solid ${t.hairline}`,
            }}
          >
            {chip}
          </div>
        ))}
        {footer && <div style={{ display: "flex" }}>{footer}</div>}
      </div>
      )}
    </div>
  );
}
