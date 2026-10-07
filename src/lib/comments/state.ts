/**
 * Comment moderation rules. Pure: no database, safe in tests and in client
 * components. The admin actions apply these and the database stores the result.
 *
 *   PENDING  -> APPROVED (approve) or SPAM (mark spam)
 *   APPROVED -> SPAM (mark spam)
 *   SPAM     -> APPROVED (restore)
 *
 * Owner replies are created APPROVED with isOwner set. Replying to a pending
 * comment approves it, since answering it in public is approval. Replies go
 * only to top-level comments, so threads stay one level deep.
 */

export type CommentState = "PENDING" | "APPROVED" | "SPAM";

export type ModerationOp = "approve" | "spam" | "restore";

const TRANSITIONS: Record<CommentState, readonly CommentState[]> = {
  PENDING: ["APPROVED", "SPAM"],
  APPROVED: ["SPAM"],
  SPAM: ["APPROVED"],
};

export function canTransition(from: CommentState, to: CommentState): boolean {
  return TRANSITIONS[from].includes(to);
}

const OP_TARGET: Record<ModerationOp, CommentState> = {
  approve: "APPROVED",
  spam: "SPAM",
  restore: "APPROVED",
};

const OP_SOURCES: Record<ModerationOp, readonly CommentState[]> = {
  approve: ["PENDING"],
  spam: ["PENDING", "APPROVED"],
  restore: ["SPAM"],
};

export type ModerationPlan =
  | { ok: true; to: CommentState; setApprovedAt: boolean }
  | { ok: false; reason: string };

/** What a moderation button does to a comment in a given state. */
export function planModeration(from: CommentState, op: ModerationOp): ModerationPlan {
  const to = OP_TARGET[op];
  if (!OP_SOURCES[op].includes(from) || !canTransition(from, to)) {
    return { ok: false, reason: "That comment has already been moderated. Refresh to see its current state." };
  }
  return { ok: true, to, setApprovedAt: to === "APPROVED" };
}

/** Which moderation buttons make sense for a comment. */
export function availableOps(status: CommentState): ModerationOp[] {
  return (Object.keys(OP_SOURCES) as ModerationOp[]).filter((op) => OP_SOURCES[op].includes(status));
}

export interface ReplyParent {
  status: CommentState;
  parentId: string | null;
}

export type ReplyPlan =
  | { ok: true; reply: { status: "APPROVED"; isOwner: true }; approveParent: boolean }
  | { ok: false; reason: string };

/** Whether the owner may reply to this comment, and what happens to it. */
export function planOwnerReply(parent: ReplyParent): ReplyPlan {
  if (parent.parentId !== null) {
    return { ok: false, reason: "Replies go to top-level comments only. Reply to the comment above it." };
  }
  if (parent.status === "SPAM") {
    return { ok: false, reason: "Restore the comment before replying to it." };
  }
  return {
    ok: true,
    reply: { status: "APPROVED", isOwner: true },
    approveParent: parent.status === "PENDING",
  };
}

export const COMMENT_STATE_LABEL: Record<CommentState, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  SPAM: "Spam",
};
