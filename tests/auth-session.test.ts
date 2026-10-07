import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), findUnique: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("next-auth", () => ({ default: () => ({ auth: mocks.auth }) }));
vi.mock("next-auth/providers/credentials", () => ({ default: (config: unknown) => config }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/auth/devices", () => ({ verifyPinOnDevice: vi.fn() }));

const { getSession, requireUserId } = await import("@/lib/auth");
const { passwordStamp } = await import("@/lib/auth/password-stamp");
const { authConfig } = await import("@/lib/auth.config");

beforeEach(() => vi.resetAllMocks());

describe("password-bound owner sessions", () => {
  const session = (): Session => ({ expires: "2030-01-01", user: { id: "owner", securityStamp: passwordStamp("original-hash") } });
  it("accepts a session only while its owner and password still match", async () => {
    mocks.auth.mockResolvedValue(session());
    mocks.findUnique.mockResolvedValue({ passwordHash: "original-hash" });
    expect(await requireUserId()).toBe("owner");
    mocks.findUnique.mockResolvedValue({ passwordHash: "replacement-hash" });
    expect(await getSession()).toBeNull();
    await expect(requireUserId()).rejects.toThrow("Not authenticated");
  });
  it("rejects deleted owners and sessions without a password stamp", async () => {
    mocks.auth.mockResolvedValue(session());
    mocks.findUnique.mockResolvedValue(null);
    expect(await getSession()).toBeNull();
    mocks.auth.mockResolvedValue({ ...session(), user: { id: "owner" } });
    mocks.findUnique.mockClear();
    expect(await getSession()).toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  it("preserves the signed-in stamp and ignores untrusted update data", () => {
    const jwt = authConfig.callbacks.jwt;
    const signedIn = jwt({ token: {}, user: { id: "owner", securityStamp: "verified-stamp" }, account: null, trigger: "signIn" });
    expect(signedIn).toMatchObject({ id: "owner", securityStamp: "verified-stamp" });
    const updated = jwt({ token: signedIn!, account: null, trigger: "update", session: { securityStamp: "attacker-stamp" } } as Parameters<typeof jwt>[0]);
    expect(updated).toMatchObject({ securityStamp: "verified-stamp" });
  });
});
