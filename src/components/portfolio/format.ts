/** "7 October 2026" from a YYYY-MM-DD string, read as a calendar date (no time zone drift). */
export function formatDate(iso: string, month: "long" | "short" = "long"): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month, year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
