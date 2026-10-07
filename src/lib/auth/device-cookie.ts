import { cookies } from "next/headers";
import { DEVICE_COOKIE, DEVICE_TRUST_SECONDS } from "./pin";

/**
 * The trusted-device cookie. httpOnly so page scripts can never read the
 * token, and scoped to the whole site because /login reads it and the sign-in
 * action uses it. It is not a session: on its own it opens nothing, it only
 * lets this browser offer the PIN screen.
 */

export async function readDeviceToken(): Promise<string | null> {
  return (await cookies()).get(DEVICE_COOKIE)?.value ?? null;
}

export async function writeDeviceToken(token: string) {
  (await cookies()).set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_TRUST_SECONDS,
  });
}

export async function clearDeviceToken() {
  (await cookies()).delete(DEVICE_COOKIE);
}
