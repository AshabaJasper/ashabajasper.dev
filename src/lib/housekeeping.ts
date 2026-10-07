import "server-only";
import { prisma } from "@/lib/prisma";

/** Sender fingerprints are kept this long, then cleared. */
export const IP_HASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** Run at most once an hour per process; it runs after form submissions. */
const MIN_INTERVAL_MS = 60 * 60 * 1000;
let lastRun = 0;

/**
 * Clear the IP hash on contact messages and comments older than 30 days.
 * Best effort: errors are logged and never thrown.
 */
export async function clearOldIpHashes(now: Date = new Date(), force = false): Promise<{ messages: number; comments: number } | null> {
  if (!force && now.getTime() - lastRun < MIN_INTERVAL_MS) return null;
  lastRun = now.getTime();
  const before = new Date(now.getTime() - IP_HASH_RETENTION_MS);
  try {
    const [messages, comments] = await Promise.all([
      prisma.contactMessage.updateMany({
        where: { ipHash: { not: null }, createdAt: { lt: before } },
        data: { ipHash: null },
      }),
      prisma.comment.updateMany({
        where: { ipHash: { not: null }, createdAt: { lt: before } },
        data: { ipHash: null },
      }),
    ]);
    return { messages: messages.count, comments: comments.count };
  } catch (err) {
    console.error("[housekeeping] clearing old IP hashes failed:", err instanceof Error ? err.name : "unknown error");
    return null;
  }
}
