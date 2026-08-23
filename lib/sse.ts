"use client";

import {
  candleEventSchema,
  heartbeatEventSchema,
  quoteEventSchema,
  type CandleEvent,
  type HeartbeatEvent,
  type QuoteEvent,
} from "@/lib/market-schemas";

const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export interface StreamHandlers {
  onQuote?: (event: QuoteEvent) => void;
  onCandle?: (event: CandleEvent) => void;
  onHeartbeat?: (event: HeartbeatEvent) => void;
}

/**
 * Browser EventSource wrapper around the same-origin SSE proxy
 * (app/api/stream/route.ts → portfolio.md §9.2). The browser's native
 * EventSource retry is fixed-delay and server-controlled; this adds actual
 * exponential backoff (§13's "honest degradation" for the live surfaces),
 * resetting to the base delay on every successful reconnect. Returns a
 * cleanup function — call it on unmount.
 */
export function subscribeToStream(symbols: string[], handlers: StreamHandlers): () => void {
  let source: EventSource | null = null;
  let reconnectDelay = BASE_RECONNECT_DELAY_MS;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  function connect() {
    if (stopped || symbols.length === 0) return;

    const query = new URLSearchParams({ symbols: symbols.join(",") });
    source = new EventSource(`/api/stream?${query}`);

    source.addEventListener("open", () => {
      reconnectDelay = BASE_RECONNECT_DELAY_MS;
    });

    source.addEventListener("quote", (event) => {
      const parsed = quoteEventSchema.safeParse(JSON.parse((event as MessageEvent).data));
      if (parsed.success) handlers.onQuote?.(parsed.data);
    });

    source.addEventListener("candle", (event) => {
      const parsed = candleEventSchema.safeParse(JSON.parse((event as MessageEvent).data));
      if (parsed.success) handlers.onCandle?.(parsed.data);
    });

    source.addEventListener("heartbeat", (event) => {
      const parsed = heartbeatEventSchema.safeParse(JSON.parse((event as MessageEvent).data));
      if (parsed.success) handlers.onHeartbeat?.(parsed.data);
    });

    source.addEventListener("error", () => {
      source?.close();
      if (stopped) return;
      reconnectTimer = setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
    });
  }

  connect();

  return () => {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    source?.close();
  };
}
