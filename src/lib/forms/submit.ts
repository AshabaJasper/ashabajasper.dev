import "server-only";
import { after } from "next/server";
import type { z } from "zod";
import { authSecret } from "@/lib/env";
import { siteOrigin, type Site } from "@/lib/sites";
import { verifyFormToken } from "./form-token";
import { MAX_FORM_BODY_BYTES, originAllowed, readLimitedBody } from "./guard";
import { ipHashFromHeaders } from "./ip";
import { SlidingWindowLimiter } from "./rate-limit";

/**
 * The shared pipeline behind POST /api/contact and POST /api/comments, in the
 * order docs/API.md fixes:
 *
 *   origin 403 -> size 413 -> validation 400 -> honeypot or token: 200, nothing
 *   stored -> in-memory limits 429 (per sender, then per form) -> database
 *   counts 429 -> insert (500 when it fails) -> after the response: notify
 *   the owner and housekeeping.
 *
 * Nothing a visitor wrote is logged. Errors carry only a route tag.
 */

/** Five a minute per sender, per form, in this process. */
const PER_MINUTE = 5;
/**
 * A backstop across every sender of one form: if the per-sender key could be
 * forged (see the trust note in ip.ts), the total still stays small. A personal
 * site never sees this many genuine messages in a minute.
 */
export const GLOBAL_PER_MINUTE = 30;
const GLOBAL_KEY = "*";
const limiters = new Map<string, SlidingWindowLimiter>();

function limiterFor(key: string, limit: number): SlidingWindowLimiter {
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new SlidingWindowLimiter({ limit, windowMs: 60_000, maxKeys: 5_000 });
    limiters.set(key, limiter);
  }
  return limiter;
}

/** For tests: forget every in-memory hit. */
export function resetFormLimiters(): void {
  for (const limiter of limiters.values()) limiter.clear();
}

const USER_AGENT_MAX = 300;

export interface SenderMeta {
  ipHash: string | null;
  userAgent: string | null;
}

interface BaseFields {
  website: string;
  token: string;
}

export interface PublicFormConfig<S extends z.ZodType<BaseFields>> {
  /** Route tag for logs and the limiter, for example "contact". */
  form: string;
  /** The site whose origin may post. */
  site: Exclude<Site, "admin">;
  schema: S;
  /** Extra validation after the schema, as field errors (unknown post slug). */
  check?: (data: z.infer<S>) => Promise<Record<string, string[]> | null>;
  /** True when the sender is over the database limit. */
  overDbLimit: (ipHash: string | null, now: Date) => Promise<boolean>;
  store: (data: z.infer<S>, meta: SenderMeta) => Promise<void>;
  /** Work after the response is sent: notifications and housekeeping. */
  afterStore: (data: z.infer<S>) => Promise<void>;
  /** Injected for tests. */
  now?: () => number;
}

function json(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const OK = () => json(200, { ok: true });

const SERVER_ERROR = { ok: false, error: "Something went wrong on our side. Nothing was sent; please try again." };

/**
 * Never lets an exception escape as a framework error page: anything
 * unexpected becomes the documented 500 JSON, logged with the route tag and
 * the error's class name only, never the request body or the message text.
 */
export async function handlePublicForm<S extends z.ZodType<BaseFields>>(
  req: Request,
  config: PublicFormConfig<S>,
): Promise<Response> {
  try {
    return await runPipeline(req, config);
  } catch (err) {
    console.error(`[${config.form}] request failed:`, err instanceof Error ? err.name : "unknown error");
    return json(500, SERVER_ERROR);
  }
}

async function runPipeline<S extends z.ZodType<BaseFields>>(
  req: Request,
  config: PublicFormConfig<S>,
): Promise<Response> {
  const now = config.now ?? (() => Date.now());

  if (!originAllowed(req.headers, siteOrigin(config.site))) {
    return json(403, { ok: false, error: "This form only accepts submissions from its own page." });
  }

  const body = await readLimitedBody(req, MAX_FORM_BODY_BYTES);
  if (!body.ok) {
    return json(413, { ok: false, error: "That is too long to send. Shorten it and try again." });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(body.text);
  } catch {
    return json(400, { ok: false, error: "The form could not be read. Reload the page and try again.", fieldErrors: {} });
  }

  const parsed = config.schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = typeof issue.path[0] === "string" ? issue.path[0] : "form";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return json(400, { ok: false, error: "Please check the highlighted fields.", fieldErrors });
  }
  const data = parsed.data;

  if (config.check) {
    const extra = await config.check(data);
    if (extra) return json(400, { ok: false, error: "Please check the highlighted fields.", fieldErrors: extra });
  }

  // Bots learn nothing: a filled honeypot or a bad token looks like success.
  if (data.website !== "") return OK();
  const secret = authSecret();
  if (!verifyFormToken(data.token, secret, now()).ok) return OK();

  const ipHash = ipHashFromHeaders(req.headers, secret);
  const tooMany = { ok: false, error: "That is a lot of messages in a short time. Please wait a while and try again." };
  if (!limiterFor(config.form, PER_MINUTE).hit(ipHash ?? "unknown")) return json(429, tooMany);
  if (!limiterFor(`${config.form}:all`, GLOBAL_PER_MINUTE).hit(GLOBAL_KEY)) return json(429, tooMany);

  try {
    if (await config.overDbLimit(ipHash, new Date(now()))) return json(429, tooMany);
    const userAgent = req.headers.get("user-agent");
    await config.store(data, { ipHash, userAgent: userAgent ? userAgent.slice(0, USER_AGENT_MAX) : null });
  } catch (err) {
    console.error(`[${config.form}] storing failed:`, err instanceof Error ? err.name : "unknown error");
    return json(500, SERVER_ERROR);
  }

  // Best effort after the response: a failing notification never reaches the visitor.
  after(async () => {
    try {
      await config.afterStore(data);
    } catch (err) {
      console.error(`[${config.form}] after-store work failed:`, err instanceof Error ? err.name : "unknown error");
    }
  });
  return OK();
}
