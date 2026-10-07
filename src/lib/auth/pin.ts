/**
 * PIN sign-in rules. Pure: no database, no hashing, safe to load from vitest.
 *
 * A short PIN is only safe because it is never accepted on its own. It works
 * only together with a trusted-device token, a long random secret that a
 * browser receives after a full password sign-in. Someone on the internet
 * without that token cannot even attempt a PIN, and someone holding the device
 * gets a handful of tries before the device stops being trusted.
 */

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 8;

/** Wrong PINs in a row, on one device, before that device needs the password again. */
export const MAX_PIN_FAILURES = 5;

const DAY_MS = 24 * 60 * 60 * 1000;
/** A device stays trusted this long after it was last used. */
export const DEVICE_TRUST_MS = 180 * DAY_MS;
export const DEVICE_TRUST_SECONDS = DEVICE_TRUST_MS / 1000;

export const DEVICE_COOKIE = "ajd_device";

/** Why a PIN is refused, or null when it is fine. */
export function pinProblem(pin: string): string | null {
  if (!/^\d+$/.test(pin)) return "Use digits only";
  if (pin.length < PIN_MIN_LENGTH) return `Use at least ${PIN_MIN_LENGTH} digits`;
  if (pin.length > PIN_MAX_LENGTH) return `Use at most ${PIN_MAX_LENGTH} digits`;
  if (/^(\d)\1+$/.test(pin)) return "Avoid repeating one digit";
  if (isStraightRun(pin)) return "Avoid a straight run like 1234";
  return null;
}

/** 1234, 45678, 9876, and runs that wrap through zero like 7890. */
function isStraightRun(pin: string): boolean {
  const digits = [...pin].map(Number);
  const step = (direction: 1 | -1) =>
    digits.every((d, i) => i === 0 || d === (digits[i - 1] + direction + 10) % 10);
  return step(1) || step(-1);
}

export interface DeviceState {
  revokedAt: Date | null;
  expiresAt: Date;
  failedPinCount: number;
}

/** Whether this device may still be offered the PIN screen. */
export function isDeviceUsable(device: DeviceState, now: Date): boolean {
  if (device.revokedAt) return false;
  if (device.expiresAt.getTime() <= now.getTime()) return false;
  return device.failedPinCount < MAX_PIN_FAILURES;
}

/** What one more wrong PIN does to a device. */
export function afterWrongPin(failedPinCount: number): { failedPinCount: number; revoke: boolean; triesLeft: number } {
  const next = failedPinCount + 1;
  return { failedPinCount: next, revoke: next >= MAX_PIN_FAILURES, triesLeft: Math.max(0, MAX_PIN_FAILURES - next) };
}

/** A short human label from a User-Agent string. Never trusted, only displayed. */
export function deviceLabel(userAgent: string | null | undefined): string {
  const ua = (userAgent ?? "").slice(0, 400);
  if (!ua) return "Unknown device";
  const os = /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/i.test(ua)
      ? "iPhone or iPad"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/i.test(ua)
          ? "Mac"
          : /Linux/i.test(ua)
            ? "Linux"
            : "";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "";
  const label = [browser, os].filter(Boolean).join(" on ");
  return label || "Unknown device";
}
