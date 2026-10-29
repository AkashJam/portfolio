import { sessionShort } from "@/lib/ledger";

/**
 * The record's count line (Phase 16 step 2, decisions 4 and 5; reworded in plain
 * terms by Phase 21 step 4, I38): how many unusual moves, over how many sessions the
 * check has actually run, and how often a company moving normally would make one.
 * Both legs are stated, with their dates, and no rate is claimed beyond them. The
 * sessions are those since the check went live, not the longer chart: the bars were
 * seeded from 1 July, but nothing before `judgedFrom` was ever tested.
 */

/** Share of sessions a normal series passes 2.5σ on (two-sided): 1.24%. */
export const TRIP_RATE = 0.0124;

export interface Cadence {
  /** The counts and the usual rate, as a sentence. */
  text: string;
  /** What a normal series would produce over these sessions; null before any session is checked. */
  expected: number | null;
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

export function cadence({
  eventCount,
  sessionsJudged,
  judgedFrom,
}: {
  eventCount: number;
  sessionsJudged: number;
  judgedFrom: string;
}): Cadence {
  if (sessionsJudged <= 0) {
    return { text: `No session has been checked yet; checking starts from ${sessionShort(judgedFrom)}.`, expected: null };
  }
  const once = Math.floor(1 / TRIP_RATE);
  const counted =
    eventCount === 0
      ? `Nothing unusual in the ${plural(sessionsJudged, "session", "sessions")} checked since ${sessionShort(judgedFrom)}.`
      : `${plural(eventCount, "unusual move", "unusual moves")} in the ${plural(sessionsJudged, "session", "sessions")} checked since ${sessionShort(judgedFrom)}.`;
  return {
    text: `${counted} A company moving normally makes one about once every ${once} sessions.`,
    expected: sessionsJudged * TRIP_RATE,
  };
}
