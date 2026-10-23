import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { nextReconnectDelay, streamKey, subscribeToStream } from "@/lib/sse";

describe("nextReconnectDelay", () => {
  it("doubles the delay each step", () => {
    expect(nextReconnectDelay(1000)).toBe(2000);
    expect(nextReconnectDelay(2000)).toBe(4000);
    expect(nextReconnectDelay(4000)).toBe(8000);
  });

  it("caps at 30s", () => {
    expect(nextReconnectDelay(20_000)).toBe(30_000);
    expect(nextReconnectDelay(30_000)).toBe(30_000);
    expect(nextReconnectDelay(100_000)).toBe(30_000);
  });
});

/** Just enough of EventSource: records each connection, lets a test push frames and errors. */
class FakeEventSource {
  static all: FakeEventSource[] = [];
  closed = false;
  private listeners = new Map<string, ((e: unknown) => void)[]>();
  constructor(readonly url: string) {
    FakeEventSource.all.push(this);
  }
  addEventListener(type: string, fn: (e: unknown) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]);
  }
  close() {
    this.closed = true;
  }
  emit(type: string, data?: unknown) {
    for (const fn of this.listeners.get(type) ?? []) fn({ data: JSON.stringify(data) });
  }
}

const quote = (symbol: string) => ({ symbol, price: 1, volume: 1, time: "2026-10-23T14:00:00Z" });

describe("subscribeToStream", () => {
  beforeEach(() => {
    FakeEventSource.all = [];
    vi.stubGlobal("EventSource", FakeEventSource);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("keys a set by its symbols, in any order", () => {
    expect(streamKey(["B", "A"])).toBe(streamKey(["A", "B"]));
  });

  it("opens one connection for two subscribers to the same symbol, and both hear it", () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = subscribeToStream(["AMX"], { onQuote: a });
    const offB = subscribeToStream(["AMX"], { onQuote: b });
    expect(FakeEventSource.all).toHaveLength(1);

    FakeEventSource.all[0].emit("quote", quote("AMX"));
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
    offA();
    offB();
  });

  it("keeps the connection while anyone listens and closes it with the last", () => {
    const offA = subscribeToStream(["AMX"], {});
    const offB = subscribeToStream(["AMX"], {});
    offA();
    expect(FakeEventSource.all[0].closed).toBe(false);
    offB();
    expect(FakeEventSource.all[0].closed).toBe(true);

    // A later subscriber starts a fresh connection.
    const offC = subscribeToStream(["AMX"], {});
    expect(FakeEventSource.all).toHaveLength(2);
    offC();
  });

  it("gives a different symbol set its own connection", () => {
    const offA = subscribeToStream(["AMX"], {});
    const offB = subscribeToStream(["AMX", "TLK"], {});
    expect(FakeEventSource.all).toHaveLength(2);
    offA();
    offB();
  });

  it("reconnects once for everyone after an error, with backoff", () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = subscribeToStream(["AMX"], { onQuote: a });
    const offB = subscribeToStream(["AMX"], { onQuote: b });

    FakeEventSource.all[0].emit("error");
    expect(FakeEventSource.all[0].closed).toBe(true);
    vi.advanceTimersByTime(999);
    expect(FakeEventSource.all).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeEventSource.all).toHaveLength(2);

    FakeEventSource.all[1].emit("quote", quote("AMX"));
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
    offA();
    offB();
  });

  it("does not reconnect once the last subscriber has left", () => {
    const off = subscribeToStream(["AMX"], {});
    FakeEventSource.all[0].emit("error");
    off();
    vi.advanceTimersByTime(60_000);
    expect(FakeEventSource.all).toHaveLength(1);
  });

  it("lets one subscriber's throw leave the others still hearing", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const heard = vi.fn();
    const offA = subscribeToStream(["AMX"], { onQuote: () => { throw new Error("boom"); } });
    const offB = subscribeToStream(["AMX"], { onQuote: heard });
    FakeEventSource.all[0].emit("quote", quote("AMX"));
    expect(heard).toHaveBeenCalledOnce();
    offA();
    offB();
  });

  it("opens nothing for no symbols", () => {
    subscribeToStream([], {})();
    expect(FakeEventSource.all).toHaveLength(0);
  });
});
