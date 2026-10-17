import type { Sensor } from "@/lib/market-schemas";

/**
 * How `/market/[sensor]` and its price page name a sensor (portfolio.md §15 Phase 14 step 8): the
 * place first and the symbol after, the way the Prices table and the ⌘K palette
 * already do. Pure, so the wording is testable without a browser.
 */
export interface SensorTitle {
  /** `Japan` · `Semiconductors`: a country sensor's country, a global one's theme. */
  place: string;
  /** `Japan · MUFG`: the h1, the breadcrumb's last item and the page title. */
  heading: string;
  /** `Mitsubishi UFJ Financial Group · country sensor`, plus the sensor's note if it has one. */
  sub: string;
}

export function sensorTitle(sensor: Sensor): SensorTitle {
  const place = sensor.country ?? sensor.theme ?? sensor.name;
  const kind = sensor.group === "country" ? "country sensor" : "global sensor";
  return {
    place,
    heading: `${place} · ${sensor.symbol}`,
    sub: [sensor.name, kind, sensor.note].filter(Boolean).join(" · "),
  };
}

/** A sensor by symbol or country slug, in any case: `MUFG`, `mufg` and `japan` are one sensor. */
export function findSensor(sensors: Sensor[] | null, name: string): Sensor | null {
  const n = name.toLowerCase();
  return sensors?.find((s) => s.symbol.toLowerCase() === n || s.slug?.toLowerCase() === n) ?? null;
}

/** The sensor's record page: the country's slug, or a global name's symbol (Phase 16 step 2). */
export function sensorHref(sensor: Sensor): string {
  return `/market/${sensor.slug ?? sensor.symbol}`;
}

/** The candlestick page, which sits beneath the record. */
export function sensorPriceHref(sensor: Sensor): string {
  return `${sensorHref(sensor)}/price`;
}

/** The simulator's symbols: served on a page in dev and CI, where the ticker has them, and nowhere else. */
export function isSimulated(symbol: string): boolean {
  return symbol.startsWith("SIM:");
}
