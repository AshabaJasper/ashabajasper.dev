/**
 * Date formatting for the admin, always in the site time zone so the server
 * render and the owner's reading agree. Pure.
 */

const TIME_ZONE = "Africa/Kampala";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: TIME_ZONE });
const shortDateYear = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});
const timeOnly = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });

/** "7 Oct 2026, 14:05". */
export function formatDateTime(value: Date): string {
  return dateTime.format(value);
}

/** Compact list date: the time today, "7 Oct" this year, "7 Oct 2025" before. */
export function formatListDate(value: Date, now: Date): string {
  const day = (d: Date) => shortDateYear.format(d);
  if (day(value) === day(now)) return timeOnly.format(value);
  const sameYear = value.toLocaleString("en-GB", { year: "numeric", timeZone: TIME_ZONE }) ===
    now.toLocaleString("en-GB", { year: "numeric", timeZone: TIME_ZONE });
  return sameYear ? shortDate.format(value) : shortDateYear.format(value);
}
