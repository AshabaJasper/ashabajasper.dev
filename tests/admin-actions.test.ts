import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Server actions called the way an attacker would: directly, without a
 * session. Every action behind action() must refuse before touching the
 * database, and the two that run signed out (PIN unlock and setup) must hold
 * their own guards. The database, cookies and Auth.js are mocked.
 */

const calls = vi.hoisted(() => [] as string[]);
const db = vi.hoisted(() => {
  const record = (name: string, impl: (...args: unknown[]) => unknown = () => undefined) =>
    vi.fn(async (...args: unknown[]) => {
      calls.push(name);
      return impl(...args);
    });
  return {
    user: {
      count: record("user.count", () => 0),
      create: record("user.create", () => ({ id: "owner-1" })),
      findUnique: record("user.findUnique", () => null),
      findFirst: record("user.findFirst", () => null),
      update: record("user.update"),
    },
    loginAttempt: {
      count: record("loginAttempt.count", () => 0),
      create: record("loginAttempt.create", () => ({ id: "attempt-1" })),
      update: record("loginAttempt.update"),
    },
    auditLog: { create: record("auditLog.create") },
    contactMessage: {
      findUnique: record("contactMessage.findUnique"),
      update: record("contactMessage.update"),
      updateMany: record("contactMessage.updateMany", () => ({ count: 0 })),
    },
    comment: {
      findUnique: record("comment.findUnique"),
      updateMany: record("comment.updateMany", () => ({ count: 0 })),
      delete: record("comment.delete"),
      create: record("comment.create"),
    },
    trustedDevice: {
      findUnique: record("trustedDevice.findUnique"),
      create: record("trustedDevice.create"),
      update: record("trustedDevice.update"),
      updateMany: record("trustedDevice.updateMany", () => ({ count: 0 })),
    },
    $transaction: vi.fn(),
  };
});
const cookieJar = vi.hoisted(() => ({ value: null as string | null, writes: 0 }));
const authMock = vi.hoisted(() => ({
  signIn: vi.fn(async () => undefined),
  signOut: vi.fn(async () => undefined),
  requireUserId: vi.fn(async (): Promise<string> => {
    throw new Error("Not authenticated");
  }),
  getSession: vi.fn(async () => null),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/auth", () => authMock);
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/mail/send", () => ({ sendMail: vi.fn(async () => ({ messageId: "x" })) }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "test" }),
  cookies: async () => ({
    get: () => (cookieJar.value ? { value: cookieJar.value } : undefined),
    set: () => {
      cookieJar.writes += 1;
    },
    delete: () => {
      cookieJar.writes += 1;
    },
  }),
}));

const inbox = await import("@/actions/inbox");
const comments = await import("@/actions/comments");
const pin = await import("@/actions/pin");
const settings = await import("@/actions/settings");
const { unlockWithPin, authenticate, signOutAction } = await import("@/actions/auth");
const { completeSetup } = await import("@/actions/setup");

beforeEach(() => {
  vi.clearAllMocks();
  calls.length = 0;
  cookieJar.value = null;
  cookieJar.writes = 0;
  delete process.env.SETUP_TOKEN;
});

/** Plausible, valid input per action, so a refusal cannot be blamed on validation. */
const VALID_INPUT: Record<string, unknown> = {
  markMessageRead: { id: "m1" },
  setMessageStatus: { id: "m1", op: "archive" },
  sendReply: { id: "m1", body: "Thanks for writing." },
  markReplied: { id: "m1" },
  moderateComment: { id: "c1", op: "approve" },
  deleteComment: { id: "c1" },
  replyToComment: { parentId: "c1", body: "Thank you." },
  setSignInPin: { currentPassword: "a long password here", pin: "4831", confirmPin: "4831" },
  removeSignInPin: {},
  revokeTrustedDevice: { deviceId: "d1" },
  changePassword: { currentPassword: "old password value", newPassword: "a brand new password", confirmPassword: "a brand new password" },
  signOutOtherDevices: {},
};

describe("admin actions without a session", () => {
  const modules = { inbox, comments, pin, settings };
  const exported = Object.entries(modules).flatMap(([file, mod]) =>
    Object.entries(mod as Record<string, unknown>).map(([name, fn]) => ({ file, name, fn })),
  );

  it("covers every exported action", () => {
    expect(exported.map((e) => e.name).sort()).toEqual(Object.keys(VALID_INPUT).sort());
  });

  for (const { file, name } of exported) {
    it(`${file}.${name} refuses before touching the database or cookies`, async () => {
      const fn = (modules as Record<string, Record<string, (input: unknown) => Promise<unknown>>>)[file][name];
      const result = await fn(VALID_INPUT[name]);
      expect(result).toEqual({ ok: false, error: "You need to sign in again." });
      expect(calls).toEqual([]);
      expect(cookieJar.writes).toBe(0);
    });
  }
});

describe("signed-out auth actions", () => {
  it("never tries a PIN without the trusted-device cookie", async () => {
    const form = new FormData();
    form.set("pin", "4831");
    const result = await unlockWithPin({ error: null }, form);
    expect(result).toEqual({ error: null, redirectTo: "/login" });
    expect(authMock.signIn).not.toHaveBeenCalled();
  });

  it("asks for both fields before calling Auth.js", async () => {
    const result = await authenticate({ error: null }, new FormData());
    expect(result.error).toBeTruthy();
    expect(authMock.signIn).not.toHaveBeenCalled();
  });

  it("signs out without a session and without throwing", async () => {
    await expect(signOutAction()).resolves.toBeUndefined();
    expect(authMock.signOut).toHaveBeenCalledWith({ redirect: false });
  });
});

function setupForm(token: string, overrides: Record<string, string> = {}) {
  const form = new FormData();
  const values = {
    token,
    name: "Test Owner",
    email: "Owner@Example.test",
    password: "a long enough password",
    confirmPassword: "a long enough password",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

const GOOD_TOKEN = "0123456789abcdef0123456789abcdef";
const START = { error: null, fieldErrors: {} };

describe("first-run setup", () => {
  it("refuses once a user exists, before reading the token", async () => {
    process.env.SETUP_TOKEN = GOOD_TOKEN;
    db.user.count.mockResolvedValueOnce(1);
    const result = await completeSetup(START, setupForm(GOOD_TOKEN));
    expect(result.done).toBeUndefined();
    expect(result.error).toMatch(/already complete/);
    expect(db.loginAttempt.create).not.toHaveBeenCalled();
  });

  it("is switched off when SETUP_TOKEN is empty or short, even when the guess matches", async () => {
    for (const token of ["", "short-token"]) {
      process.env.SETUP_TOKEN = token;
      const result = await completeSetup(START, setupForm(token));
      expect(result.error).toMatch(/switched off/);
    }
    expect(db.user.create).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("stops after five wrong tokens without comparing", async () => {
    process.env.SETUP_TOKEN = GOOD_TOKEN;
    db.loginAttempt.count.mockResolvedValueOnce(5);
    const result = await completeSetup(START, setupForm(GOOD_TOKEN));
    expect(result.error).toMatch(/Too many/);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("counts a try before comparing, so parallel guesses past the limit are refused", async () => {
    process.env.SETUP_TOKEN = GOOD_TOKEN;
    // Under the limit when it starts, over it once this try is counted.
    db.loginAttempt.count.mockResolvedValueOnce(4).mockResolvedValueOnce(6);
    const result = await completeSetup(START, setupForm(GOOD_TOKEN));
    expect(result.error).toMatch(/Too many/);
    expect(db.loginAttempt.create).toHaveBeenCalledWith({ data: { email: "setup", success: false }, select: { id: true } });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("records a wrong token as a failure and creates nobody", async () => {
    process.env.SETUP_TOKEN = GOOD_TOKEN;
    const result = await completeSetup(START, setupForm("f".repeat(32)));
    expect(result.fieldErrors.token).toBeTruthy();
    expect(db.loginAttempt.create).toHaveBeenCalledTimes(1);
    expect(db.loginAttempt.update).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("creates no second owner when another request won the race", async () => {
    process.env.SETUP_TOKEN = GOOD_TOKEN;
    const tx = { user: { count: vi.fn(async () => 1), create: vi.fn() } };
    db.$transaction.mockImplementationOnce(async (fn: (t: typeof tx) => Promise<unknown>, options: unknown) => {
      expect(options).toEqual({ isolationLevel: "Serializable" });
      return fn(tx);
    });
    const result = await completeSetup(START, setupForm(GOOD_TOKEN));
    expect(result.error).toMatch(/already complete/);
    expect(tx.user.create).not.toHaveBeenCalled();
  });

  it("reports a serialisation failure without leaking the password", async () => {
    process.env.SETUP_TOKEN = GOOD_TOKEN;
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    db.$transaction.mockRejectedValueOnce(new Error("could not serialize access: a long enough password"));
    const result = await completeSetup(START, setupForm(GOOD_TOKEN));
    expect(result.done).toBeUndefined();
    expect(result.error).toMatch(/could not be created/);
    expect(JSON.stringify(spy.mock.calls)).not.toContain("long enough password");
    spy.mockRestore();
  });

  it("creates the owner with a hashed password and marks the try a success", async () => {
    process.env.SETUP_TOKEN = GOOD_TOKEN;
    const tx = { user: { count: vi.fn(async () => 0), create: vi.fn(async () => ({ id: "owner-1" })) } };
    db.$transaction.mockImplementationOnce(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx));
    const result = await completeSetup(START, setupForm(GOOD_TOKEN));
    expect(result).toEqual({ error: null, fieldErrors: {}, done: true });
    const data = (tx.user.create.mock.calls[0] as unknown as [{ data: Record<string, string> }])[0].data;
    expect(data.email).toBe("owner@example.test");
    expect(data.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(JSON.stringify(data)).not.toContain("a long enough password");
    expect(db.loginAttempt.update).toHaveBeenCalledWith({ where: { id: "attempt-1" }, data: { success: true } });
  });
});
