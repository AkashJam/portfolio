/**
 * Feed staleness (portfolio.md §13 "honest degradation") — the pure half,
 * no React, so the threshold logic is testable without a browser.
 *
 * Two clocks, one threshold:
 * - `lastEventAt` moves on *any* SSE event, heartbeats included. It proves
 *   the connection is alive, and is the only thing the stale decision reads
 *   — a quiet symbol behind a healthy connection still gets heartbeats, so
 *   it is never flagged.
 * - `lastQuoteAt` moves on quotes only and drives the copy ("last tick 43s
 *   ago"), because that is the age of the number actually on screen.
 */

// Two of ticker's heartbeat intervals (ticker/internal/sse/hub.go's
// `heartbeatInterval`, 15s). One late heartbeat is jitter; two missed
// means the connection is gone. Change both together.
export const STALE_AFTER_MS = 30_000;

export interface FeedStatus {
  stale: boolean;
  /** Milliseconds since the last quote, or null if none is known yet. */
  sinceQuoteMs: number | null;
}

export function feedStatus(now: number, lastEventAt: number, lastQuoteAt: number | null): FeedStatus {
  return {
    stale: now - lastEventAt >= STALE_AFTER_MS,
    sinceQuoteMs: lastQuoteAt === null ? null : Math.max(0, now - lastQuoteAt),
  };
}

/** `43s` · `4m` · `2h` · `3d` — floored, never rounded up past the truth. */
export function formatAge(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/**
 * Mutable, deliberately not React state: SSE handlers write it on every
 * event, and only the small status pill reads it on its own 1s clock — so
 * the heavy owners (HeroLiveBand's chart, SymbolCardGrid) never re-render
 * because time passed.
 */
export class FeedTracker {
  lastEventAt: number;
  lastQuoteAt: number | null;

  /**
   * `seedQuoteAt` is the SSR snapshot's `updatedAt`, so a feed that is dead
   * from first load reports the real age of the rendered number. The event
   * clock starts at construction: a page gets the full threshold to connect
   * before it is called stale.
   */
  constructor(seedQuoteAt?: string | null, now: number = Date.now()) {
    this.lastEventAt = now;
    const seeded = seedQuoteAt ? Date.parse(seedQuoteAt) : NaN;
    this.lastQuoteAt = Number.isNaN(seeded) ? null : seeded;
  }

  noteEvent(now: number = Date.now()) {
    this.lastEventAt = now;
  }

  // Client receipt time, not `quote.time`: a server/client clock skew would
  // otherwise show up directly in the "ago" copy.
  noteQuote(now: number = Date.now()) {
    this.lastEventAt = now;
    this.lastQuoteAt = now;
  }

  status(now: number = Date.now()): FeedStatus {
    return feedStatus(now, this.lastEventAt, this.lastQuoteAt);
  }
}

/** Newest `updatedAt` among snapshots — the seed for a multi-symbol owner. */
export function newestTimestamp(values: (string | null | undefined)[]): string | null {
  let best: string | null = null;
  let bestMs = -Infinity;
  for (const v of values) {
    const ms = v ? Date.parse(v) : NaN;
    if (!Number.isNaN(ms) && ms > bestMs) {
      bestMs = ms;
      best = v!;
    }
  }
  return best;
}
