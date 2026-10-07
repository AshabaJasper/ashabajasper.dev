import { describe, expect, it } from "vitest";
import {
  availableOps,
  canTransition,
  planModeration,
  planOwnerReply,
  type CommentState,
} from "@/lib/comments/state";

const STATES: CommentState[] = ["PENDING", "APPROVED", "SPAM"];

describe("comment transitions", () => {
  it("allows exactly the documented moves", () => {
    const allowed = new Set(["PENDING>APPROVED", "PENDING>SPAM", "APPROVED>SPAM", "SPAM>APPROVED"]);
    for (const from of STATES) {
      for (const to of STATES) {
        expect(canTransition(from, to), `${from}>${to}`).toBe(allowed.has(`${from}>${to}`));
      }
    }
  });

  it("plans approve, spam and restore", () => {
    expect(planModeration("PENDING", "approve")).toEqual({ ok: true, to: "APPROVED", setApprovedAt: true });
    expect(planModeration("PENDING", "spam")).toEqual({ ok: true, to: "SPAM", setApprovedAt: false });
    expect(planModeration("APPROVED", "spam")).toEqual({ ok: true, to: "SPAM", setApprovedAt: false });
    expect(planModeration("SPAM", "restore")).toEqual({ ok: true, to: "APPROVED", setApprovedAt: true });
  });

  it("refuses moves that are not allowed", () => {
    expect(planModeration("APPROVED", "approve").ok).toBe(false);
    expect(planModeration("SPAM", "approve").ok).toBe(false);
    expect(planModeration("SPAM", "spam").ok).toBe(false);
    expect(planModeration("PENDING", "restore").ok).toBe(false);
    expect(planModeration("APPROVED", "restore").ok).toBe(false);
  });

  it("offers the matching buttons", () => {
    expect(availableOps("PENDING")).toEqual(["approve", "spam"]);
    expect(availableOps("APPROVED")).toEqual(["spam"]);
    expect(availableOps("SPAM")).toEqual(["restore"]);
  });
});

describe("owner replies", () => {
  it("are approved owner replies, and approve a pending parent", () => {
    expect(planOwnerReply({ status: "PENDING", parentId: null })).toEqual({
      ok: true,
      reply: { status: "APPROVED", isOwner: true },
      approveParent: true,
    });
    expect(planOwnerReply({ status: "APPROVED", parentId: null })).toEqual({
      ok: true,
      reply: { status: "APPROVED", isOwner: true },
      approveParent: false,
    });
  });

  it("go only to top-level comments", () => {
    expect(planOwnerReply({ status: "APPROVED", parentId: "c1" }).ok).toBe(false);
  });

  it("are refused on spam until it is restored", () => {
    expect(planOwnerReply({ status: "SPAM", parentId: null }).ok).toBe(false);
  });
});
