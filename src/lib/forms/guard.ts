/**
 * Cheap request checks that run before any parsing: the Origin header must be
 * the site's own origin, and the body must stay under the size limit.
 * Edge safe and free of Node imports.
 */

/** 16 KB, the documented limit for both public forms. */
export const MAX_FORM_BODY_BYTES = 16 * 1024;

/**
 * Browsers send Origin on every cross-site and same-site POST from fetch.
 * A missing or different origin is refused.
 */
export function originAllowed(headers: Headers, expectedOrigin: string): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  return origin.trim().toLowerCase().replace(/\/+$/, "") === expectedOrigin.toLowerCase();
}

export type BodyRead = { ok: true; text: string } | { ok: false; reason: "too-large" };

/**
 * Read the body as text, giving up as soon as it passes `maxBytes`. A declared
 * Content-Length over the limit is refused without reading anything.
 */
export async function readLimitedBody(req: Request, maxBytes: number = MAX_FORM_BODY_BYTES): Promise<BodyRead> {
  const declared = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, reason: "too-large" };
  if (!req.body) return { ok: true, text: "" };

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { ok: false, reason: "too-large" };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder().decode(bytes) };
}
