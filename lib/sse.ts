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

/** Exponential backoff step, extracted as a pure function so it's testable
 * without a real EventSource (§21 "SSE reconnect/backoff state machine"). */
export function nextReconnectDelay(currentDelayMs: number): number {
  return Math.min(currentDelayMs * 2, MAX_RECONNECT_DELAY_MS);
}

export interface StreamHandlers {
  onQuote?: (event: QuoteEvent) => void;
  onCandle?: (event: CandleEvent) => void;
  /** Every live surface passes this to its FeedTracker (lib/feed-freshness.ts):
   * a heartbeat proves the connection is alive even when no symbol moves. */
  onHeartbeat?: (event: HeartbeatEvent) => void;
}

/** One connection and everyone listening to it. */
interface Shared {
  listeners: Set<StreamHandlers>;
  close: () => void;
}

/** Open connections by symbol set. Two surfaces watching the same symbols (the
 * price page's header and its chart) share one: a second `EventSource` for the
 * same symbol doubled that page's proxy streams and hub clients (phase18.md
 * step 4, M19). Different sets stay separate connections: sharing per symbol
 * across them would mean one stream per symbol, eighteen on /market. */
const open = new Map<string, Shared>();

/** The key two subscriptions to the same symbols share, whatever their order. */
export function streamKey(symbols: string[]): string {
  return [...symbols].sort().join(",");
}

/**
 * Browser EventSource wrapper around the same-origin SSE proxy
 * (app/api/stream/route.ts → portfolio.md §9.2). The browser's native
 * EventSource retry is fixed-delay and server-controlled; this adds actual
 * exponential backoff (§13's "honest degradation" for the live surfaces),
 * resetting to the base delay on every successful reconnect. Subscribers to the
 * same symbols share one connection, closed when the last one leaves. Returns a
 * cleanup function — call it on unmount.
 */
export function subscribeToStream(symbols: string[], handlers: StreamHandlers): () => void {
  if (symbols.length === 0) return () => {};
  const key = streamKey(symbols);
  let shared = open.get(key);
  if (!shared) {
    shared = connectShared(key, symbols);
    open.set(key, shared);
  }
  const entry = shared;
  entry.listeners.add(handlers);

  return () => {
    entry.listeners.delete(handlers);
    if (entry.listeners.size === 0) {
      entry.close();
      if (open.get(key) === entry) open.delete(key);
    }
  };
}

function connectShared(key: string, symbols: string[]): Shared {
  const listeners = new Set<StreamHandlers>();
  let source: EventSource | null = null;
  let reconnectDelay = BASE_RECONNECT_DELAY_MS;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  /** A malformed frame is dropped, as before; one subscriber's throw must not starve the rest. */
  function emit<K extends keyof StreamHandlers>(name: K, event: Parameters<NonNullable<StreamHandlers[K]>>[0]) {
    for (const l of [...listeners]) {
      try {
        (l[name] as ((e: typeof event) => void) | undefined)?.(event);
      } catch (error) {
        console.error(`sse: ${String(name)} handler for ${key} threw`, error);
      }
    }
  }

  function connect() {
    if (stopped) return;

    const query = new URLSearchParams({ symbols: symbols.join(",") });
    source = new EventSource(`/api/stream?${query}`);

    source.addEventListener("open", () => {
      reconnectDelay = BASE_RECONNECT_DELAY_MS;
    });

    source.addEventListener("quote", (event) => {
      const parsed = quoteEventSchema.safeParse(JSON.parse((event as MessageEvent).data));
      if (parsed.success) emit("onQuote", parsed.data);
    });

    source.addEventListener("candle", (event) => {
      const parsed = candleEventSchema.safeParse(JSON.parse((event as MessageEvent).data));
      if (parsed.success) emit("onCandle", parsed.data);
    });

    source.addEventListener("heartbeat", (event) => {
      const parsed = heartbeatEventSchema.safeParse(JSON.parse((event as MessageEvent).data));
      if (parsed.success) emit("onHeartbeat", parsed.data);
    });

    source.addEventListener("error", () => {
      source?.close();
      if (stopped) return;
      reconnectTimer = setTimeout(connect, reconnectDelay);
      reconnectDelay = nextReconnectDelay(reconnectDelay);
    });
  }

  connect();

  return {
    listeners,
    close: () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      source?.close();
    },
  };
}
