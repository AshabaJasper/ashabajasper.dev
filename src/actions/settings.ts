"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { action, audit } from "@/actions/safe-action";
import { changePasswordSchema, signOutOthersSchema } from "@/lib/validators/settings";
import { getUsableDevice, revokeOtherDevices } from "@/lib/auth/devices";
import { readDeviceToken } from "@/lib/auth/device-cookie";
import { revalidateAdmin } from "@/lib/revalidate";

/** The trusted device this browser holds, if it belongs to the owner. */
async function currentDeviceId(userId: string): Promise<string | null> {
  const current = await getUsableDevice(await readDeviceToken());
  return current?.userId === userId ? current.id : null;
}

export const changePassword = action(changePasswordSchema, async (input, userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) throw new Error("User not found");
  if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    return { changed: false as const, reason: "Your current password is not right." };
  }
  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  // A changed password sends every other browser back to the password screen.
  await revokeOtherDevices(userId, await currentDeviceId(userId));
  await audit(userId, "security.password.change", "User", userId);
  revalidateAdmin();
  return { changed: true as const, reason: "" };
});

/**
 * Stop trusting every other browser. They lose the PIN screen at once. A
 * session already open elsewhere still runs until it expires (one day, or
 * 30 days with "remember me"), because sessions are stateless JWTs.
 */
export const signOutOtherDevices = action(signOutOthersSchema, async (_input, userId) => {
  await revokeOtherDevices(userId, await currentDeviceId(userId));
  await audit(userId, "security.devices.revoke-others", "User", userId);
  revalidateAdmin();
  return { done: true };
});
