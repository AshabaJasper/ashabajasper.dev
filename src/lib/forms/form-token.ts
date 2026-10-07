import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A signed issue time that proves a form was opened a few seconds before it
 * was sent. Format: "<issuedAtMs>.<base64url hmac>". Stateless: the server
 * keeps nothing, it only checks the signature and the age.
 */

export const FORM_TOKEN_MIN_AGE_MS = 3_000;
export const FORM_TOKEN_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function sign(issuedAt: number, secret: string): string {
  return createHmac("sha256", secret).update(`form-token:${issuedAt}`).digest("base64url");
}

export function issueFormToken(secret: string, now: number): string {
  const issuedAt = Math.floor(now);
  return `${issuedAt}.${sign(issuedAt, secret)}`;
}

export type FormTokenCheck =
  | { ok: true; ageMs: number }
  | { ok: false; reason: "malformed" | "bad-signature" | "too-fast" | "expired" };

export function verifyFormToken(token: string, secret: string, now: number): FormTokenCheck {
  const match = /^(\d{1,15})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return { ok: false, reason: "malformed" };
  const issuedAt = Number(match[1]);
  if (!Number.isSafeInteger(issuedAt)) return { ok: false, reason: "malformed" };

  const expected = Buffer.from(sign(issuedAt, secret));
  const given = Buffer.from(match[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "bad-signature" };
  }

  const ageMs = now - issuedAt;
  if (ageMs < FORM_TOKEN_MIN_AGE_MS) return { ok: false, reason: "too-fast" };
  if (ageMs > FORM_TOKEN_MAX_AGE_MS) return { ok: false, reason: "expired" };
  return { ok: true, ageMs };
}
