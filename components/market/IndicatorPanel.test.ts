import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { IndicatorPanel } from "@/components/market/IndicatorPanel";

// Phase 14 step 8: the RSI panel is in the server's HTML. Under ResponsiveContainer it
// rendered nothing until hydration; as plain SVG in a fixed box it is in the first paint.

const rsi = Array.from({ length: 30 }, (_, i) => ({
  time: new Date(Date.UTC(2026, 9, 1 + i)).toISOString(),
  value: 40 + (i % 7) * 4,
}));

describe("IndicatorPanel", () => {
  it("renders its line in the server HTML, with a stretched viewBox", () => {
    const html = renderToString(
      createElement(IndicatorPanel, { indicators: { symbol: "MUFG", interval: "1h", series: { rsi }, cached: false } }),
    );
    expect(html).toContain('aria-label="RSI(14)"');
    expect(html).toMatch(/<svg[^>]*viewBox="0 0 900 160"/);
    expect(html).toContain('preserveAspectRatio="none"');
    expect(html).toMatch(/<path d="M0 /);
  });

  it("says so when there is not enough history", () => {
    expect(renderToString(createElement(IndicatorPanel, { indicators: null }))).toContain("RSI unavailable");
  });

  // Phase 18 step 4, M18: the message says what is missing.
  it("counts the bars a short view has and the bars RSI needs", () => {
    const html = renderToString(createElement(IndicatorPanel, { indicators: null, bars: 9 }));
    expect(html).toContain("RSI(14) needs 15 bars; this view has 9.");
  });

  it("does not blame the history when there are enough bars and no answer", () => {
    const html = renderToString(createElement(IndicatorPanel, { indicators: null, bars: 37 }));
    expect(html).toContain("RSI unavailable right now.");
    expect(html).not.toContain("needs");
  });
});
