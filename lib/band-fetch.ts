import { openWindow, sessionWindow, shapeClosed, shapeOpen, type BandMode, type BandSeries } from "@/lib/band-series";
import { getCandles } from "@/lib/ticker-client";

const DAY = 86_400_000;

/**
 * One sensor's band line, read from the ticker (portfolio.md §15 Phase 14 step 9).
 * Server-side only, for the home page and for the picker's route. Both reads are
 * bounded with `from`, because the ticker answers the oldest 1000 bars first.
 * `asOf` is the sensor's snapshot vintage, which says which session "last" is.
 */
export async function fetchBandSeries(
  symbol: string,
  mode: BandMode,
  asOf: string | null,
  opts?: { now?: Date; revalidateSeconds?: number },
): Promise<BandSeries | null> {
  const now = opts?.now ?? new Date();
  const revalidateSeconds = opts?.revalidateSeconds;
  // Daily closes, 45 days back: about 30 sessions, so twenty exist even around holidays.
  const dailyRead = getCandles(symbol, "1d", { from: new Date(now.getTime() - 45 * DAY), revalidateSeconds });

  if (mode === "open") {
    const [intraday, daily] = await Promise.all([
      getCandles(symbol, "1m", { ...openWindow(now), revalidateSeconds }),
      dailyRead,
    ]);
    return shapeOpen(intraday?.candles ?? [], daily?.candles ?? []);
  }

  const [session, daily] = await Promise.all([
    asOf ? getCandles(symbol, "1m", { ...sessionWindow(asOf), revalidateSeconds }) : Promise.resolve(null),
    dailyRead,
  ]);
  return shapeClosed(session?.candles ?? [], daily?.candles ?? []);
}
