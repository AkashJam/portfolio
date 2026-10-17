import { sessionShort } from "@/lib/ledger";

/**
 * The record's cadence line (Phase 16 step 2, decisions 4 and 5): how many times the
 * sensor tripped, over how many sessions the trigger has actually judged, and how many
 * a normal series would be expected to trip. Both legs are stated, with their dates,
 * and no rate is claimed beyond them. The sessions are those from the trigger's
 * go-live, not the longer chart: the bars were seeded from 1 July, but nothing before
 * `judgedFrom` was ever tested.
 */

/** Share of sessions a normal series passes 2.5σ on (two-sided): 1.24%. */
export const TRIP_RATE = 0.0124;

export interface Cadence {
  /** The counts and the expectation, as a sentence. */
  text: string;
  /** What a normal series would trip over these sessions; null before any session is judged. */
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
    return { text: `The trigger has not judged a session yet; it starts from ${sessionShort(judgedFrom)}.`, expected: null };
  }
  const expected = sessionsJudged * TRIP_RATE;
  const places = expected < 1 ? 2 : 1;
  const counted =
    eventCount === 0
      ? `Nothing has tripped in the ${plural(sessionsJudged, "session", "sessions")} judged since ${sessionShort(judgedFrom)}.`
      : `${plural(eventCount, "event", "events")} in ${plural(sessionsJudged, "session", "sessions")} judged since ${sessionShort(judgedFrom)}.`;
  return {
    text: `${counted} A normal series passes 2.5σ on 1.24% of sessions, so about ${expected.toFixed(places)} would be expected.`,
    expected,
  };
}
