import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The public form routes, called directly with crafted requests and a mocked
 * database: the order and answers of docs/API.md.
 */

const db = vi.hoisted(() => ({
  contactMessage: { count: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  comment: { count: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
}));
const afterCalls = vi.hoisted(() => [] as unknown[]);

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/notify/owner", () => ({ notifyOwner: vi.fn(async () => undefined) }));
vi.mock("@/lib/content/posts", () => ({
  getAllPosts: vi.fn(async () => [{ slug: "pin-on-a-trusted-device", title: "PIN on a trusted device" }]),
}));
vi.mock("next/server", () => ({ after: (fn: unknown) => afterCalls.push(fn) }));

const SECRET = "test-secret-for-the-api-tests";
process.env.AUTH_SECRET = SECRET;
process.env.ROOT_DOMAIN = "example.test";

const { POST: postContact } = await import("@/app/api/contact/route");
const { POST: postComment } = await import("@/app/api/comments/route");
const { GET: getToken } = await import("@/app/api/form-token/route");
const { issueFormToken } = await import("@/lib/forms/form-token");
const { resetFormLimiters } = await import("@/lib/forms/submit");

const PORTFOLIO = "https://example.test";
const BLOG = "https://blog.example.test";

let ipCounter = 0;
function freshIp() {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}

function oldToken() {
  return issueFormToken(SECRET, Date.now() - 10_000);
}

function contactBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Ada Lovelace",
    email: "Ada@Example.com",
    subject: "",
    message: "Hello, this is a test message.",
    website: "",
    token: oldToken(),
    ...overrides,
  };
}

function commentBody(overrides: Record<string, unknown> = {}) {
  return {
    postSlug: "pin-on-a-trusted-device",
    name: "Ada",
    email: "",
    body: "A thoughtful comment.",
    website: "",
    token: oldToken(),
    ...overrides,
  };
}

function request(origin: string | null, body: unknown, ip = freshIp(), raw?: string) {
  const headers = new Headers({ "content-type": "application/json", "x-forwarded-for": ip, "user-agent": "x".repeat(500) });
  if (origin) headers.set("origin", origin);
  return new Request("https://internal/api/x", { method: "POST", headers, body: raw ?? JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  afterCalls.length = 0;
  resetFormLimiters();
  db.contactMessage.count.mockResolvedValue(0);
  db.comment.count.mockResolvedValue(0);
  db.contactMessage.create.mockResolvedValue({});
  db.comment.create.mockResolvedValue({});
});

describe("GET /api/form-token", () => {
  it("issues a fresh token that is not cached", async () => {
    const res = await getToken();
    expect(res.headers.get("cache-control")).toBe("no-store");
    const data = (await res.json()) as { token: string };
    expect(data.token).toMatch(/^\d+\.[A-Za-z0-9_-]{43}$/);
  });
});

describe("POST /api/contact", () => {
  it("answers 403 for another origin, or none", async () => {
    for (const origin of ["https://evil.example", BLOG, null]) {
      const res = await postContact(request(origin, contactBody()));
      expect(res.status, String(origin)).toBe(403);
    }
    expect(db.contactMessage.create).not.toHaveBeenCalled();
  });

  it("answers 413 for a body over 16 KB", async () => {
    const res = await postContact(request(PORTFOLIO, contactBody({ message: "x".repeat(17 * 1024) })));
    expect(res.status).toBe(413);
    expect(db.contactMessage.create).not.toHaveBeenCalled();
  });

  it("answers 400 with field errors keyed like the body", async () => {
    const res = await postContact(request(PORTFOLIO, contactBody({ email: "nope", message: "short" })));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { ok: boolean; fieldErrors: Record<string, string[]> };
    expect(data.ok).toBe(false);
    expect(Object.keys(data.fieldErrors).sort()).toEqual(["email", "message"]);
  });

  it("answers 400 for JSON it cannot read", async () => {
    const res = await postContact(request(PORTFOLIO, null, freshIp(), "{not json"));
    expect(res.status).toBe(400);
  });

  it("rejects a filled honeypot without a success receipt", async () => {
    const res = await postContact(request(PORTFOLIO, contactBody({ website: "https://spam.example" })));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ ok: false });
    expect(db.contactMessage.create).not.toHaveBeenCalled();
    expect(afterCalls).toHaveLength(0);
  });

  it("rejects early, forged and expired tokens without pretending to store them", async () => {
    for (const token of [issueFormToken(SECRET, Date.now()), issueFormToken("wrong-secret", Date.now() - 10_000), issueFormToken(SECRET, Date.now() - 3 * 60 * 60 * 1000), "x"]) {
      const res = await postContact(request(PORTFOLIO, contactBody({ token })));
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ ok: false });
    }
    expect(db.contactMessage.create).not.toHaveBeenCalled();
  });

  it("answers 429 after five a minute from one sender", async () => {
    const ip = freshIp();
    for (let i = 0; i < 5; i++) {
      expect((await postContact(request(PORTFOLIO, contactBody(), ip))).status).toBe(200);
    }
    const res = await postContact(request(PORTFOLIO, contactBody(), ip));
    expect(res.status).toBe(429);
    expect(db.contactMessage.create).toHaveBeenCalledTimes(5);
  });

  it("answers 429 when the database count says three this hour", async () => {
    db.contactMessage.count.mockResolvedValue(3);
    const res = await postContact(request(PORTFOLIO, contactBody()));
    expect(res.status).toBe(429);
    expect(db.contactMessage.create).not.toHaveBeenCalled();
  });

  it("stores a valid message with a hashed IP and a short user agent, then runs after()", async () => {
    const ip = freshIp();
    const res = await postContact(request(PORTFOLIO, contactBody(), ip));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(db.contactMessage.create).toHaveBeenCalledTimes(1);
    const data = db.contactMessage.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ name: "Ada Lovelace", email: "ada@example.com", subject: null, body: "Hello, this is a test message." });
    expect(data.ipHash).toMatch(/^[0-9a-f]{32}$/);
    expect(JSON.stringify(data)).not.toContain(ip);
    expect(data.userAgent).toHaveLength(300);
    expect(afterCalls).toHaveLength(1);
  });

  it("answers 500 and keeps quiet when storing fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    db.contactMessage.create.mockRejectedValue(new Error("db down: Hello, this is a test message."));
    const res = await postContact(request(PORTFOLIO, contactBody()));
    expect(res.status).toBe(500);
    expect(JSON.stringify(spy.mock.calls)).not.toContain("test message");
    spy.mockRestore();
  });
});

describe("POST /api/comments", () => {
  it("answers 403 from the portfolio origin", async () => {
    expect((await postComment(request(PORTFOLIO, commentBody()))).status).toBe(403);
  });

  it("answers 400 for an unknown post", async () => {
    const res = await postComment(request(BLOG, commentBody({ postSlug: "no-such-post" })));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { fieldErrors: Record<string, string[]> };
    expect(Object.keys(data.fieldErrors)).toEqual(["postSlug"]);
    expect(db.comment.create).not.toHaveBeenCalled();
  });

  it("rejects a filled honeypot without confirming a comment", async () => {
    const res = await postComment(request(BLOG, commentBody({ website: "x" })));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ ok: false });
    expect(db.comment.create).not.toHaveBeenCalled();
  });

  it("answers 429 at ten a day", async () => {
    db.comment.count.mockResolvedValue(10);
    expect((await postComment(request(BLOG, commentBody()))).status).toBe(429);
  });

  it("ignores extra keys, so a visitor cannot set status, owner or id", async () => {
    const res = await postComment(
      request(BLOG, commentBody({ status: "APPROVED", isOwner: true, id: "x", ipHash: "f".repeat(32), parentId: "p" })),
    );
    expect(res.status).toBe(200);
    const data = db.comment.create.mock.calls[0][0].data;
    expect(Object.keys(data).sort()).toEqual(["authorEmail", "authorName", "body", "ipHash", "postSlug", "userAgent"]);
    expect(data.ipHash).not.toBe("f".repeat(32));
  });

  it("stores a valid comment as pending, without an empty email", async () => {
    const res = await postComment(request(BLOG, commentBody()));
    expect(res.status).toBe(200);
    const data = db.comment.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ postSlug: "pin-on-a-trusted-device", authorName: "Ada", authorEmail: null });
    expect(data.status).toBeUndefined();
    expect(data.isOwner).toBeUndefined();
  });
});

describe("hardening", () => {
  it("answers 403 without Origin even when a matching Referer is sent", async () => {
    const req = request(null, contactBody());
    req.headers.set("referer", `${PORTFOLIO}/contact`);
    expect((await postContact(req)).status).toBe(403);
  });

  it("answers 413 for a streamed body without Content-Length, before parsing", async () => {
    const chunk = new TextEncoder().encode("x".repeat(4096));
    let sent = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        sent += 1;
        if (sent > 64) controller.close();
        else controller.enqueue(chunk);
      },
    });
    const headers = new Headers({ "content-type": "application/json", origin: PORTFOLIO, "x-forwarded-for": freshIp() });
    const req = new Request("https://internal/api/contact", { method: "POST", headers, body, duplex: "half" } as RequestInit);
    expect(req.headers.get("content-length")).toBeNull();
    const res = await postContact(req);
    expect(res.status).toBe(413);
    // It stopped reading shortly after the limit instead of draining all 256 KB.
    expect(sent).toBeLessThan(10);
    expect(db.contactMessage.create).not.toHaveBeenCalled();
  });

  it("answers 413 when Content-Length declares too much", async () => {
    const req = request(PORTFOLIO, contactBody());
    req.headers.set("content-length", String(17 * 1024));
    expect((await postContact(req)).status).toBe(413);
  });

  it("caps one form at 30 a minute however many forged X-Forwarded-For values arrive", async () => {
    let lastStatus = 0;
    let stored = 0;
    for (let i = 0; i < 40; i++) {
      const res = await postContact(request(PORTFOLIO, contactBody(), `198.51.100.${i + 1}`));
      lastStatus = res.status;
      if (res.status === 200) stored += 1;
    }
    expect(stored).toBe(30);
    expect(lastStatus).toBe(429);
    expect(db.contactMessage.create).toHaveBeenCalledTimes(30);
  });

  it("does not turn junk X-Forwarded-For values into separate senders", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await postContact(request(PORTFOLIO, contactBody(), `junk-${i}`))).status).toBe(200);
    }
    // All five fell into the one "unknown sender" bucket, so the sixth is refused.
    expect((await postContact(request(PORTFOLIO, contactBody(), "junk-6"))).status).toBe(429);
    const hashes = db.contactMessage.create.mock.calls.map((call) => call[0].data.ipHash);
    expect(new Set(hashes)).toEqual(new Set([null]));
  });

  it("answers the documented 500 JSON when a check throws, without logging the body", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const posts = await import("@/lib/content/posts");
    vi.mocked(posts.getAllPosts).mockRejectedValueOnce(new Error("content unreadable"));
    const res = await postComment(request(BLOG, commentBody({ body: "secret words in the body" })));
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ ok: false });
    expect(JSON.stringify(spy.mock.calls)).not.toContain("secret words");
    expect(db.comment.create).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("swallows a failure in the work after the response", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const owner = await import("@/lib/notify/owner");
    vi.mocked(owner.notifyOwner).mockRejectedValueOnce(new Error("telegram down"));
    const res = await postContact(request(PORTFOLIO, contactBody({ message: "private message text here" })));
    expect(res.status).toBe(200);
    expect(afterCalls).toHaveLength(1);
    await expect((afterCalls[0] as () => Promise<void>)()).resolves.toBeUndefined();
    expect(JSON.stringify(spy.mock.calls)).not.toContain("private message");
    spy.mockRestore();
  });
});
