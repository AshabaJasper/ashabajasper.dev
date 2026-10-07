import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { DEVICE_TRUST_MS, MAX_PIN_FAILURES, deviceLabel, isDeviceUsable, pinProblem } from "./pin";

/**
 * Trusted devices and the sign-in PIN. Plain functions taking ids, shared by
 * the auth provider, the server actions and the dev script.
 *
 * The PIN is stored only as a bcrypt hash, and the device token only as a
 * SHA-256 hash (it is 32 random bytes, so a fast hash is the right tool, the
 * same way agent keys are stored).
 */

const PIN_BCRYPT_ROUNDS = 12;

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Trust the calling browser. Returns the raw token, which goes in the cookie and nowhere else. */
export async function createTrustedDevice(userId: string, userAgent: string | null, now = new Date()) {
  const token = randomBytes(32).toString("base64url");
  const device = await prisma.trustedDevice.create({
    data: {
      userId,
      tokenHash: hashDeviceToken(token),
      label: deviceLabel(userAgent),
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() + DEVICE_TRUST_MS),
    },
  });
  await prisma.auditLog.create({
    data: { userId, action: "security.device.trust", entityType: "TrustedDevice", entityId: device.id },
  });
  return { token, deviceId: device.id };
}

/** The device behind a cookie token, only if it may still be offered the PIN screen. */
export async function getUsableDevice(token: string | undefined | null, now = new Date()) {
  if (!token || token.length > 200) return null;
  const device = await prisma.trustedDevice.findUnique({
    where: { tokenHash: hashDeviceToken(token) },
    include: { user: { select: { id: true, email: true, name: true, pinHash: true, pinLength: true } } },
  });
  if (!device || !device.user.pinHash || !isDeviceUsable(device, now)) return null;
  return device;
}

export type PinCheck =
  | { ok: true; user: { id: string; email: string; name: string } }
  | { ok: false; locked: boolean; triesLeft: number };

/**
 * Check a PIN on a trusted device. A wrong PIN is counted atomically; the
 * last allowed miss revokes the device, after which only the password works.
 */
export async function verifyPinOnDevice(token: string, pin: string, now = new Date()): Promise<PinCheck> {
  const device = await getUsableDevice(token, now);
  if (!device) return { ok: false, locked: true, triesLeft: 0 };

  // Anything that is not plausibly a PIN still costs a try, so garbage cannot probe for free.
  const matches = pinProblem(pin) === null && (await bcrypt.compare(pin, device.user.pinHash!));

  if (!matches) {
    const updated = await prisma.trustedDevice.update({
      where: { id: device.id },
      data: { failedPinCount: { increment: 1 } },
      select: { failedPinCount: true },
    });
    const locked = updated.failedPinCount >= MAX_PIN_FAILURES;
    if (locked) {
      await prisma.trustedDevice.update({ where: { id: device.id }, data: { revokedAt: now } });
    }
    await prisma.auditLog.create({
      data: {
        userId: device.userId,
        action: locked ? "auth.pin.locked" : "auth.pin.failed",
        entityType: "TrustedDevice",
        entityId: device.id,
      },
    });
    return { ok: false, locked, triesLeft: Math.max(0, MAX_PIN_FAILURES - updated.failedPinCount) };
  }

  await prisma.trustedDevice.update({
    where: { id: device.id },
    data: { failedPinCount: 0, lastUsedAt: now, expiresAt: new Date(now.getTime() + DEVICE_TRUST_MS) },
  });
  await prisma.auditLog.create({
    data: { userId: device.userId, action: "auth.login.pin", entityType: "TrustedDevice", entityId: device.id },
  });
  const { id, email, name } = device.user;
  return { ok: true, user: { id, email, name } };
}

/** How many tries a device has left, for the message after a wrong PIN. */
export async function deviceTriesLeft(token: string | undefined | null, now = new Date()): Promise<number> {
  const device = await getUsableDevice(token, now);
  return device ? MAX_PIN_FAILURES - device.failedPinCount : 0;
}

/** Set or replace the PIN. Every device except `keepDeviceId` has to sign in with the password again. */
export async function setPin(userId: string, pin: string, keepDeviceId?: string, now = new Date()) {
  const problem = pinProblem(pin);
  if (problem) throw new Error(problem);
  const pinHash = await bcrypt.hash(pin, PIN_BCRYPT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { pinHash, pinLength: pin.length, pinSetAt: now } }),
    prisma.trustedDevice.updateMany({
      where: { userId, revokedAt: null, ...(keepDeviceId ? { NOT: { id: keepDeviceId } } : {}) },
      data: { revokedAt: now },
    }),
  ]);
}

export async function clearPin(userId: string, now = new Date()) {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { pinHash: null, pinLength: null, pinSetAt: null } }),
    prisma.trustedDevice.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } }),
  ]);
}

export async function revokeDevice(userId: string, deviceId: string, now = new Date()) {
  const result = await prisma.trustedDevice.updateMany({
    where: { id: deviceId, userId, revokedAt: null },
    data: { revokedAt: now },
  });
  return result.count > 0;
}

/** After a password change: every other browser goes back to the password. */
export async function revokeOtherDevices(userId: string, keepDeviceId: string | null, now = new Date()) {
  await prisma.trustedDevice.updateMany({
    where: { userId, revokedAt: null, ...(keepDeviceId ? { NOT: { id: keepDeviceId } } : {}) },
    data: { revokedAt: now },
  });
}

export async function listDevices(userId: string, now = new Date()) {
  return prisma.trustedDevice.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: now }, failedPinCount: { lt: MAX_PIN_FAILURES } },
    orderBy: [{ lastUsedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, label: true, lastUsedAt: true, createdAt: true, expiresAt: true },
  });
}
