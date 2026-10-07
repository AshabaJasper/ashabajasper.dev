import { createHmac } from "node:crypto";
import { isIP } from "node:net";

/**
 * Senders of public forms are told apart by an HMAC of their IP address,
 * keyed with AUTH_SECRET. The raw IP is never stored or logged, and the hash
 * is cleared after 30 days (src/lib/housekeeping.ts).
 */

/** Hex characters kept from the HMAC: 128 bits, plenty to tell senders apart. */
export const IP_HASH_LENGTH = 32;

/**
 * The client IP as the reverse proxy reports it: the first x-forwarded-for
 * value, else x-real-ip. Null when neither holds a valid IP (a local request).
 *
 * Trust assumption: the app is reachable only through Traefik (Coolify), and
 * Traefik's entry point does not trust forwarded headers from the internet
 * (its default: no `forwardedHeaders.insecure`, no `trustedIPs` beyond any
 * CDN in front). Traefik then drops whatever X-Forwarded-For a visitor sent
 * and writes the connecting address itself, so the first entry is the client.
 * If the container port were ever published directly, or Traefik were told to
 * trust everyone, a visitor could choose this value and dodge the per-sender
 * limit; the per-form global limit in submit.ts still caps the total.
 *
 * Anything that is not an IP address is ignored rather than used as a key, so
 * junk header values cannot mint unlimited rate-limit buckets.
 */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = normalizeIp(forwarded.split(",")[0]);
    if (first) return first;
  }
  return normalizeIp(headers.get("x-real-ip"));
}

/** A trimmed IPv4 or IPv6 address, or null. Brackets and an IPv4 port are dropped. */
function normalizeIp(value: string | null | undefined): string | null {
  let candidate = (value ?? "").trim().slice(0, 64);
  if (!candidate) return null;
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(candidate);
  if (bracketed) candidate = bracketed[1];
  else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(candidate)) candidate = candidate.replace(/:\d+$/, "");
  return isIP(candidate) ? candidate.toLowerCase() : null;
}

/** HMAC-SHA256 of the IP, the first 32 hex characters. Null in, null out. */
export function hashIp(ip: string | null, secret: string): string | null {
  if (!ip) return null;
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, IP_HASH_LENGTH);
}

/** The stored sender fingerprint for a request. */
export function ipHashFromHeaders(headers: Headers, secret: string): string | null {
  return hashIp(clientIp(headers), secret);
}
