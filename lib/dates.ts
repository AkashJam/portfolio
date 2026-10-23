/**
 * The one date format of the site (phase18.md step 6, M30): "1 Sep 2026", and "21 Oct" where the
 * year is implied. Built by hand, not with `Intl`: en-GB spells September "Sept" on some runtimes
 * and "Sep" on others, so the server and the browser would print different dates and the page would
 * not hydrate. A date is read in UTC, so a build machine's zone cannot move it.
 */
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

interface Day {
  year: number;
  month: number;
  day: number;
}

/** A `YYYY-MM-DD` date (a calendar day) or an ISO timestamp (an instant, read in UTC). */
function parse(date: string): Day {
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (plain) return { year: Number(plain[1]), month: Number(plain[2]), day: Number(plain[3]) };
  const at = new Date(date);
  if (Number.isNaN(at.getTime())) throw new Error(`dates: not a date: ${date}`);
  return { year: at.getUTCFullYear(), month: at.getUTCMonth() + 1, day: at.getUTCDate() };
}

/** `21 Oct`. */
export function dayMonth(date: string): string {
  const { month, day } = parse(date);
  return `${day} ${MONTHS[month - 1]}`;
}

/** `1 Sep 2026`. */
export function dayMonthYear(date: string): string {
  const { year } = parse(date);
  return `${dayMonth(date)} ${year}`;
}
