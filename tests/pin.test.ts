import { describe, expect, it } from "vitest";
import {
  MAX_PIN_FAILURES,
  afterWrongPin,
  deviceLabel,
  isDeviceUsable,
  pinProblem,
} from "@/lib/auth/pin";

describe("pinProblem", () => {
  it("accepts ordinary PINs of 4 to 8 digits", () => {
    for (const pin of ["2580", "40917", "731942", "90210553"]) expect(pinProblem(pin), pin).toBeNull();
  });

  it("refuses anything that is not digits", () => {
    for (const pin of ["12a4", " 1234", "12 34", "١٢٣٤", ""]) expect(pinProblem(pin), pin).not.toBeNull();
  });

  it("refuses too short and too long", () => {
    expect(pinProblem("123")).toMatch(/at least/);
    expect(pinProblem("123456789")).toMatch(/at most/);
  });

  it("refuses one repeated digit", () => {
    expect(pinProblem("0000")).toMatch(/repeating/);
    expect(pinProblem("77777")).toMatch(/repeating/);
  });

  it("refuses straight runs, up, down and through zero", () => {
    for (const pin of ["1234", "45678", "9876", "43210", "7890", "2109"]) {
      expect(pinProblem(pin), pin).toMatch(/straight run/);
    }
  });

  it("does not mistake a near-run for a run", () => {
    expect(pinProblem("1235")).toBeNull();
    expect(pinProblem("1357")).toBeNull();
  });
});

describe("trusted device state", () => {
  const now = new Date("2026-09-19T10:00:00Z");
  const later = new Date("2026-12-01T00:00:00Z");
  const base = { revokedAt: null, expiresAt: later, failedPinCount: 0 };

  it("is usable when fresh", () => {
    expect(isDeviceUsable(base, now)).toBe(true);
  });

  it("is not usable once revoked, expired or out of tries", () => {
    expect(isDeviceUsable({ ...base, revokedAt: now }, now)).toBe(false);
    expect(isDeviceUsable({ ...base, expiresAt: now }, now)).toBe(false);
    expect(isDeviceUsable({ ...base, failedPinCount: MAX_PIN_FAILURES }, now)).toBe(false);
  });

  it("counts wrong PINs and revokes on the last try", () => {
    expect(afterWrongPin(0)).toEqual({ failedPinCount: 1, revoke: false, triesLeft: MAX_PIN_FAILURES - 1 });
    expect(afterWrongPin(MAX_PIN_FAILURES - 1)).toEqual({
      failedPinCount: MAX_PIN_FAILURES,
      revoke: true,
      triesLeft: 0,
    });
  });
});

describe("deviceLabel", () => {
  it("names browser and system", () => {
    expect(
      deviceLabel("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36")
    ).toBe("Chrome on Android");
    expect(
      deviceLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 Edg/126.0")
    ).toBe("Edge on Windows");
    expect(
      deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1")
    ).toBe("Safari on iPhone or iPad");
  });

  it("falls back quietly", () => {
    expect(deviceLabel(null)).toBe("Unknown device");
    expect(deviceLabel("curl/8.0")).toBe("Unknown device");
  });
});
