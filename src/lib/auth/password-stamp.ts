import "server-only";
import { createHash } from "node:crypto";

/** An opaque version of the password hash, used to invalidate old JWT sessions. */
export function passwordStamp(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex");
}
