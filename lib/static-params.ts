import type { AtlasResponse, Sensor } from "@/lib/market-schemas";
import { sensorHref } from "@/lib/sensor-title";

/**
 * What the dynamic market and atlas routes prerender, and what the sitemap
 * lists (phase18.md step 3, M21 and M25). Each takes what the ticker client
 * returns, so a build that cannot reach the ticker (null) gives nothing and the
 * route's `revalidate` caches each page on its first request instead.
 */

/** `/atlas/[city]`: the cities that have a page, by slug. */
export function cityParams(atlas: AtlasResponse | null): { city: string }[] {
  return (atlas?.rows ?? []).filter((r) => r.hasCityPage).map((r) => ({ city: r.slug }));
}

/** `/market/[sensor]`: a record for each of the eighteen, by the country's slug or a global name's symbol. */
export function recordParams(sensors: Sensor[] | null): { sensor: string }[] {
  return (sensors ?? []).map((s) => ({ sensor: s.slug ?? s.symbol }));
}

/** The record pages' paths, as the sitemap lists them. */
export function recordPaths(sensors: Sensor[] | null): string[] {
  return (sensors ?? []).map(sensorHref);
}
