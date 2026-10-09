import { ImageResponse } from "next/og";

import { builtWith, heroHeadline, heroRole } from "@/data/profile";
import { OG_SIZE, OgCard, loadOgFonts } from "@/lib/og";

// The site-wide share card (phase7.md Step 2), inherited by
// every route without a card of its own. Replaces the hand-made PNG that
// predated Phase 6: the headline is the work, not the name, and the retired
// "live signal" waveform is gone, matching the live home hero.
// Same string as lib/metadata.ts ROOT_CARD.alt, which names this card on
// routes whose own openGraph block would otherwise drop it.
export const alt = `Akash James, ${heroRole} in Milan. ${heroHeadline}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow={`Akash James · ${heroRole} · Milan`}
        headline={heroHeadline}
        footer={builtWith.join(" · ")}
      />
    ),
    { ...size, fonts: await loadOgFonts() }
  );
}
