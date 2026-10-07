import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { verifyPinOnDevice } from "@/lib/auth/devices";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
  remember: z.string().optional(),
});

const pinSchema = z.object({
  pin: z.string().min(1).max(32),
  device: z.string().min(1).max(200),
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

/** Compared against when the email is unknown, so timing does not reveal which emails exist. */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZBpbYlsFY3FbYl0kCiHrbUqncOCq7m";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "text" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase().trim();

        const since = new Date(Date.now() - LOCKOUT_WINDOW_MS);
        const recentFailures = await prisma.loginAttempt.count({
          where: { email, success: false, createdAt: { gte: since } },
        });
        if (recentFailures >= MAX_FAILED_ATTEMPTS) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        const passwordOk = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);

        await prisma.loginAttempt.create({ data: { email, success: Boolean(user) && passwordOk } });
        if (!user || !passwordOk) return null;

        await prisma.auditLog.create({
          data: { userId: user.id, action: "auth.login", entityType: "User", entityId: user.id },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          rememberMe: parsed.data.remember === "true",
        };
      },
    }),
    // PIN unlock. Never accepted alone: `device` is the trusted-device token,
    // read by the sign-in action from an httpOnly cookie that only a full
    // password sign-in creates. Wrong PINs are counted per device.
    Credentials({
      id: "pin",
      name: "pin",
      credentials: {
        pin: { label: "PIN", type: "password" },
        device: { label: "Device", type: "text" },
      },
      async authorize(raw) {
        const parsed = pinSchema.safeParse(raw);
        if (!parsed.success) return null;
        const result = await verifyPinOnDevice(parsed.data.device, parsed.data.pin);
        if (!result.ok) return null;
        return { ...result.user, viaPin: true };
      },
    }),
  ],
});

export const getSession = cache(() => auth());

/** The signed-in owner's id, or throws. Use at the top of every server action. */
export async function requireUserId(): Promise<string> {
  const session = await getSession();
  const id = session?.user?.id;
  if (!id) throw new Error("Not authenticated");
  return id;
}
