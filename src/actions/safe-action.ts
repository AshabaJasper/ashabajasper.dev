import "server-only";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserInputError } from "@/lib/action-error";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/**
 * Wraps a server action with authentication, Zod validation and safe errors.
 * Handlers receive validated input and the signed-in owner's id; raw error
 * messages never reach the client.
 */
export function action<S extends z.ZodTypeAny, R>(
  schema: S,
  handler: (input: z.infer<S>, userId: string) => Promise<R>,
) {
  return async (input: z.infer<S>): Promise<ActionResult<R>> => {
    let userId: string;
    try {
      userId = await requireUserId();
    } catch {
      return { ok: false, error: "You need to sign in again." };
    }
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Please check the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>,
      };
    }
    try {
      const data = await handler(parsed.data, userId);
      return { ok: true, data };
    } catch (err) {
      if (err instanceof UserInputError) return { ok: false, error: err.message };
      console.error("[action]", err instanceof Error ? err.name : "UnknownError");
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  };
}

/** Audit trail for important actions. Never throws into the caller. */
export async function audit(
  userId: string | null,
  actionName: string,
  entityType: string,
  entityId: string,
  meta?: Record<string, unknown>,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action: actionName,
        entityType,
        entityId,
        meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
      },
    });
  } catch (err) {
    console.error("[audit]", err instanceof Error ? err.name : "UnknownError");
  }
}
