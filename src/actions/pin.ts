"use server";

import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { action, audit } from "@/actions/safe-action";
import { removePinSchema, revokeDeviceSchema, setPinSchema } from "@/lib/validators/pin";
import { clearPin, createTrustedDevice, getUsableDevice, revokeDevice, setPin } from "@/lib/auth/devices";
import { clearDeviceToken, readDeviceToken, writeDeviceToken } from "@/lib/auth/device-cookie";
import { revalidateAdmin } from "@/lib/revalidate";

/**
 * Set or change the sign-in PIN. Needs the password, because a PIN is a second
 * way in. The browser it is set from becomes a trusted device; every other
 * device goes back to the password once, so a changed PIN shuts the old one out.
 */
export const setSignInPin = action(setPinSchema, async (input, userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) throw new Error("User not found");
  if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    return { saved: false as const, reason: "That password is not right." };
  }

  await setPin(userId, input.pin);
  const { token } = await createTrustedDevice(userId, (await headers()).get("user-agent"));
  await writeDeviceToken(token);

  await audit(userId, "security.pin.set", "User", userId);
  revalidateAdmin();
  return { saved: true as const, reason: "" };
});

export const removeSignInPin = action(removePinSchema, async (_input, userId) => {
  await clearPin(userId);
  await clearDeviceToken();
  await audit(userId, "security.pin.remove", "User", userId);
  revalidateAdmin();
  return { removed: true };
});

export const revokeTrustedDevice = action(revokeDeviceSchema, async (input, userId) => {
  const current = await getUsableDevice(await readDeviceToken());
  const revoked = await revokeDevice(userId, input.deviceId);
  if (revoked && current?.id === input.deviceId) await clearDeviceToken();
  if (revoked) await audit(userId, "security.device.revoke", "TrustedDevice", input.deviceId);
  revalidateAdmin();
  return { revoked };
});
