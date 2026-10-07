/**
 * Client-side wrapper for admin server actions. The action itself never
 * throws (src/actions/safe-action.ts turns errors into results), but the call
 * can still reject when the network drops or the deployment changed under an
 * open tab. Without this, that rejection escapes the transition and nothing
 * tells the owner what happened. Pure and safe in client components.
 */

export type ClientActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export const ACTION_NETWORK_ERROR =
  "The admin could not be reached. Check your connection, then try again. Nothing was changed.";

export async function callAction<T>(run: () => Promise<ClientActionResult<T>>): Promise<ClientActionResult<T>> {
  try {
    return await run();
  } catch {
    return { ok: false, error: ACTION_NETWORK_ERROR };
  }
}
