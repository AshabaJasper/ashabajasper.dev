/**
 * A short, safe summary of an audit row's meta for the audit page. Keys that
 * could hold a secret are never shown, even if one were logged by mistake.
 * Pure.
 */

const SECRET_KEY = /pass|pin|token|secret|hash|cookie|key|body|email/i;

export function summarizeMeta(meta: unknown, maxChars = 120): string {
  if (meta === null || meta === undefined || typeof meta !== "object" || Array.isArray(meta)) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
    if (SECRET_KEY.test(key)) continue;
    if (value === null || value === undefined) continue;
    const shown =
      typeof value === "string" || typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : Array.isArray(value)
          ? `${value.length} items`
          : "...";
    parts.push(`${key}: ${shown.length > 40 ? `${shown.slice(0, 39)}...` : shown}`);
  }
  const text = parts.join(", ");
  return text.length > maxChars ? `${text.slice(0, maxChars - 3)}...` : text;
}
