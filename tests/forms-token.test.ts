import { describe, expect, it } from "vitest";
import {
  FORM_TOKEN_MAX_AGE_MS,
  FORM_TOKEN_MIN_AGE_MS,
  issueFormToken,
  verifyFormToken,
} from "@/lib/forms/form-token";

const SECRET = "test-secret-for-form-tokens";
const T0 = 1_791_000_000_000;

describe("form tokens", () => {
  it("look like <issuedAtMs>.<base64url>", () => {
    expect(issueFormToken(SECRET, T0)).toMatch(/^1791000000000\.[A-Za-z0-9_-]{43}$/);
  });

  it("are accepted between 3 seconds and 2 hours", () => {
    const token = issueFormToken(SECRET, T0);
    expect(verifyFormToken(token, SECRET, T0 + FORM_TOKEN_MIN_AGE_MS)).toEqual({ ok: true, ageMs: 3000 });
    expect(verifyFormToken(token, SECRET, T0 + 60_000).ok).toBe(true);
    expect(verifyFormToken(token, SECRET, T0 + FORM_TOKEN_MAX_AGE_MS).ok).toBe(true);
  });

  it("are refused when too fast or too old", () => {
    const token = issueFormToken(SECRET, T0);
    expect(verifyFormToken(token, SECRET, T0)).toEqual({ ok: false, reason: "too-fast" });
    expect(verifyFormToken(token, SECRET, T0 + FORM_TOKEN_MIN_AGE_MS - 1)).toEqual({ ok: false, reason: "too-fast" });
    expect(verifyFormToken(token, SECRET, T0 + FORM_TOKEN_MAX_AGE_MS + 1)).toEqual({ ok: false, reason: "expired" });
  });

  it("are refused when signed with another secret or tampered with", () => {
    const token = issueFormToken(SECRET, T0);
    expect(verifyFormToken(token, "another-secret", T0 + 10_000)).toEqual({ ok: false, reason: "bad-signature" });
    // Moving the issue time back to skip the wait breaks the signature.
    const [, sig] = token.split(".");
    expect(verifyFormToken(`${T0 - 10_000}.${sig}`, SECRET, T0 + 1000)).toEqual({ ok: false, reason: "bad-signature" });
    const flipped = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
    expect(verifyFormToken(flipped, SECRET, T0 + 10_000)).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("refuses malformed input without throwing", () => {
    for (const bad of ["", "abc", "123.", ".abc", "12.34.56", `${T0}.short`, `-5.${"a".repeat(43)}`, `${T0}.${"a".repeat(44)}`]) {
      expect(verifyFormToken(bad, SECRET, T0 + 10_000), bad).toEqual({ ok: false, reason: "malformed" });
    }
  });
});
