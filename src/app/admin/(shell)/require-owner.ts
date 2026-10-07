import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/**
 * The signed-in owner's id, or a redirect to /login. Every page in (shell)
 * calls this itself instead of trusting the layout alone: on a client-side
 * navigation Next.js may render just the page segment without running the
 * shared layout again, so a layout check by itself is not a guard. The
 * middleware is a third, earlier gate. getSession is cached per request, so
 * the repeated checks cost one session read.
 */
export async function requireOwnerId(): Promise<string> {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  return userId;
}
