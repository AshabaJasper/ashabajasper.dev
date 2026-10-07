"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setupToken } from "@/lib/env";
import { audit } from "@/actions/safe-action";
import { SETUP_TOKEN_MIN_LENGTH, setupSchema } from "@/lib/validators/setup";

/**
 * First run: create the single owner. There is no session yet, so this does
 * not use action(). It is guarded three ways: SETUP_TOKEN must be set and
 * match (timing-safe), it refuses once any user exists, and it stops after
 * five wrong tokens in 15 minutes (counted in LoginAttempt as "setup").
 */

const SETUP_ATTEMPT_KEY = "setup";
const MAX_FAILED = 5;
const WINDOW_MS = 15 * 60 * 1000;

export interface SetupState {
  error: string | null;
  fieldErrors: Record<string, string[] | undefined>;
  /** True once the owner exists. The client then loads /login (see actions/auth.ts for why there is no redirect). */
  done?: boolean;
}

function tokensMatch(given: string, expected: string): boolean {
  // Hash both so the comparison is constant time whatever the lengths.
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

class SetupClosed extends Error {}

export async function completeSetup(_prev: SetupState, formData: FormData): Promise<SetupState> {
  if ((await prisma.user.count()) > 0) {
    return { error: "Setup is already complete. Sign in instead.", fieldErrors: {} };
  }

  const expected = setupToken();
  if (!expected) {
    return { error: "Setup is switched off: SETUP_TOKEN is not set on the server.", fieldErrors: {} };
  }
  if (expected.length < SETUP_TOKEN_MIN_LENGTH) {
    return {
      error: `Setup is switched off: SETUP_TOKEN must be at least ${SETUP_TOKEN_MIN_LENGTH} characters. Generate one with openssl rand -hex 24.`,
      fieldErrors: {},
    };
  }

  const since = new Date(Date.now() - WINDOW_MS);
  const tooMany = { error: "Too many wrong setup tokens. Wait 15 minutes and try again.", fieldErrors: {} };
  const recentFailures = () =>
    prisma.loginAttempt.count({ where: { email: SETUP_ATTEMPT_KEY, success: false, createdAt: { gte: since } } });
  if ((await recentFailures()) >= MAX_FAILED) return tooMany;

  const parsed = setupSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>,
    };
  }

  // Count this try as a failure before comparing, then read the count back.
  // Parallel guesses each see the rows committed before them, so at most
  // MAX_FAILED of them in a window ever reach the comparison.
  const attempt = await prisma.loginAttempt.create({
    data: { email: SETUP_ATTEMPT_KEY, success: false },
    select: { id: true },
  });
  if ((await recentFailures()) > MAX_FAILED) return tooMany;

  if (!tokensMatch(parsed.data.token, expected)) {
    return { error: "That setup token is not right.", fieldErrors: { token: ["That setup token is not right"] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  let userId: string;
  try {
    userId = await prisma.$transaction(
      async (tx) => {
        if ((await tx.user.count()) > 0) throw new SetupClosed();
        const user = await tx.user.create({
          data: { email: parsed.data.email.toLowerCase(), name: parsed.data.name, passwordHash },
          select: { id: true },
        });
        return user.id;
      },
      { isolationLevel: "Serializable" },
    );
  } catch (err) {
    if (err instanceof SetupClosed) return { error: "Setup is already complete. Sign in instead.", fieldErrors: {} };
    console.error("[setup] creating the owner failed:", err instanceof Error ? err.name : "unknown error");
    return { error: "The owner could not be created. Nothing was saved; try again.", fieldErrors: {} };
  }

  await prisma.loginAttempt.update({ where: { id: attempt.id }, data: { success: true } });
  await audit(userId, "auth.setup", "User", userId);
  return { error: null, fieldErrors: {}, done: true };
}
