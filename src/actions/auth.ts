"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTrustedDevice, deviceTriesLeft, getUsableDevice } from "@/lib/auth/devices";
import { clearDeviceToken, readDeviceToken, writeDeviceToken } from "@/lib/auth/device-cookie";

/**
 * Sign-in for the admin. These cannot go through action(): there is no
 * session yet. The credentials provider in src/lib/auth.ts counts failed tries
 * and pauses sign-in after five in 15 minutes.
 *
 * No redirect() in these actions: Next.js pre-renders an action redirect by
 * fetching its own internal origin (localhost) without the original Host
 * header, so the host router serves the portfolio instead of the admin. The
 * client loads `redirectTo` itself.
 */

export interface SignInState {
  error: string | null;
  redirectTo?: string;
}

export async function authenticate(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim().slice(0, 254);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  if (!email || !password) return { error: "Enter your email and password." };

  try {
    await signIn("credentials", {
      email,
      password,
      remember: formData.get("remember") === "on" ? "true" : "false",
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "That email and password did not match. After five tries in 15 minutes, sign-in pauses for a while.",
      };
    }
    throw error;
  }

  // The password was right. With a PIN set and the box ticked, trust this
  // browser so it is offered the PIN screen next time.
  if (formData.get("trustDevice") === "on") {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, pinHash: true } });
    if (user?.pinHash) {
      const existing = await getUsableDevice(await readDeviceToken());
      if (!existing || existing.userId !== user.id) {
        const { token } = await createTrustedDevice(user.id, (await headers()).get("user-agent"));
        await writeDeviceToken(token);
      }
    }
  }
  return { error: null, redirectTo: "/inbox" };
}

/** Unlock with the PIN on a trusted device. Never accepted without the device cookie. */
export async function unlockWithPin(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const device = await readDeviceToken();
  if (!device) return { error: null, redirectTo: "/login" };
  try {
    await signIn("pin", { pin: String(formData.get("pin") ?? "").slice(0, 32), device, redirect: false });
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    const triesLeft = await deviceTriesLeft(device);
    if (triesLeft <= 0) {
      // Out of tries, revoked or expired: this browser goes back to the password.
      await clearDeviceToken();
      return { error: null, redirectTo: "/login?locked=1" };
    }
    return {
      error:
        triesLeft === 1
          ? "That PIN did not match. One try left before this device needs your password."
          : `That PIN did not match. ${triesLeft} tries left.`,
    };
  }
  return { error: null, redirectTo: "/inbox" };
}

/** Ends the session; the client then loads /login. */
export async function signOutAction(): Promise<void> {
  // The device stays trusted on purpose, so the PIN screen greets you next time.
  await signOut({ redirect: false });
}
