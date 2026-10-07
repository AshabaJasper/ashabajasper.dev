import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ failures: 0, revoked: false, compare: vi.fn(), comparisons: 0 }));
vi.mock("server-only", () => ({}));
vi.mock("bcryptjs", () => ({ default: { compare: state.compare } }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  trustedDevice: {
    findUnique: vi.fn(async () => ({ id: "device", userId: "owner", failedPinCount: state.failures,
      revokedAt: state.revoked ? new Date() : null, expiresAt: new Date("2030-01-01"),
      user: { id: "owner", email: "qa@example.org", name: "QA", pinHash: "hash", pinLength: 4, passwordHash: "password-hash" } })),
    updateMany: vi.fn(async ({ where, data }) => {
      if (state.revoked || (where.failedPinCount.lt !== undefined && state.failures >= where.failedPinCount.lt)
        || (where.failedPinCount.gte !== undefined && state.failures < where.failedPinCount.gte)
        || (where.failedPinCount.lte !== undefined && state.failures > where.failedPinCount.lte)) return { count: 0 };
      if (data.failedPinCount?.increment) state.failures += data.failedPinCount.increment;
      if (data.failedPinCount === 0) state.failures = 0;
      if (data.revokedAt) state.revoked = true;
      return { count: 1 };
    }),
  }, auditLog: { create: vi.fn(async () => ({})) },
} }));

const { verifyPinOnDevice } = await import("@/lib/auth/devices");
beforeEach(() => {
  vi.clearAllMocks(); state.failures = 0; state.revoked = false;
  state.compare.mockResolvedValue(false);
});

describe("PIN attempt reservation", () => {
  it("allows at most five comparisons for a burst of concurrent wrong PINs", async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => verifyPinOnDevice("token", "2581")));
    expect(state.compare).toHaveBeenCalledTimes(5);
    expect(results.every(result => !result.ok)).toBe(true);
    expect(state.failures).toBe(5);
    expect(state.revoked).toBe(true);
  });
  it("rejects a correct PIN if trust is revoked during the comparison", async () => {
    state.compare.mockImplementation(async () => { state.revoked = true; return true; });
    expect(await verifyPinOnDevice("token", "2581")).toMatchObject({ ok: false, locked: true });
  });
  it("allows a correct fifth attempt and resets the failure counter", async () => {
    state.failures = 4; state.compare.mockResolvedValue(true);
    expect(await verifyPinOnDevice("token", "2581")).toMatchObject({ ok: true });
    expect(state.failures).toBe(0);
  });
});
