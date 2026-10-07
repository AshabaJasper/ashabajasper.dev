/**
 * Browser helpers for the two public forms (portfolio contact, blog comments).
 * Plain fetch, no server imports, safe in client components. The server side
 * of this contract is documented in docs/API.md.
 */

export type PublicFormEndpoint = "/api/contact" | "/api/comments";

export type SubmitResult =
  | { ok: true }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string[] | undefined> };

const NETWORK_ERROR = "We could not reach the server. Check your connection and try again.";
const TIMEOUT_ERROR = "The server took too long to answer. Your message is still here; try again.";
const GENERIC_ERROR = "Something went wrong on our side. Your message is still here; try again in a moment.";
export const FORM_TOKEN_READY_MS = 3_500;
export const FORM_TOKEN_REFRESH_MS = 110 * 60 * 1000;

/**
 * A short-lived signed token that proves the form was opened a few seconds
 * before it was sent. Fetched on first focus, because pages are cached.
 */
export async function fetchFormToken(signal?: AbortSignal, timeoutMs = 15_000): Promise<string | null> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  try {
    const res = await fetch("/api/form-token", { cache: "no-store", signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: unknown };
    return typeof data.token === "string" ? data.token : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export async function submitPublicForm(
  endpoint: PublicFormEndpoint,
  payload: Record<string, unknown>,
  timeoutMs = 15_000,
): Promise<SubmitResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    let data: { ok?: unknown; error?: unknown; fieldErrors?: unknown } = {};
    try {
      data = await res.json();
    } catch {
      // Non-JSON error page from a proxy: fall through to the generic message.
    }
    if (res.ok && data.ok === true) return { ok: true };
    return {
      ok: false,
      status: res.status,
      error: typeof data.error === "string" ? data.error : GENERIC_ERROR,
      fieldErrors:
        data.fieldErrors && typeof data.fieldErrors === "object"
          ? (data.fieldErrors as Record<string, string[] | undefined>)
          : undefined,
    };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    return { ok: false, status: 0, error: aborted ? TIMEOUT_ERROR : NETWORK_ERROR };
  } finally {
    clearTimeout(timer);
  }
}
