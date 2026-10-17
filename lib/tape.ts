import type { LedgerEvent, TapeResponse, TapeSensor } from "@/lib/market-schemas";

/** The sessions of closes a sparkline needs before it draws: the sixty the trigger measures over. */
export const TAPE_WINDOW = 60;

/**
 * The z at which the tape colours a sigma and heavies a line: the trigger's
 * default threshold. The tape does not carry the threshold in force, so this
 * colouring is the default's; the ledger itself states the threshold each
 * entry fired at.
 */
export const TAPE_THRESHOLD = 2.5;

/** The tape by symbol, or an empty map when it could not be read (the columns then show dashes). */
export function tapeBySymbol(tape: TapeResponse | null): Map<string, TapeSensor> {
  return new Map((tape?.sensors ?? []).map((s) => [s.symbol, s]));
}

/** The sensors that tripped at the last close: the rows the tape tints. */
export function trippedSymbols(events: LedgerEvent[]): Set<string> {
  return new Set(events.filter((e) => e.sessionsAgo === 0).map((e) => e.symbol));
}

/** Whether a z is past the default threshold, and on which side. */
export function pastThreshold(z: number | null): "up" | "down" | null {
  if (z === null || Math.abs(z) < TAPE_THRESHOLD) return null;
  return z > 0 ? "up" : "down";
}
