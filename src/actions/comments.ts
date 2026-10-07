"use server";

import { prisma } from "@/lib/prisma";
import { action, audit } from "@/actions/safe-action";
import { UserInputError } from "@/lib/action-error";
import { deleteCommentSchema, moderateCommentSchema, ownerReplySchema } from "@/lib/validators/comments";
import { planModeration, planOwnerReply } from "@/lib/comments/state";
import { revalidateAdmin, revalidateBlogPost } from "@/lib/revalidate";

/** Approve, mark as spam, or restore a comment. */
export const moderateComment = action(moderateCommentSchema, async (input, userId) => {
  const comment = await prisma.comment.findUnique({
    where: { id: input.id },
    select: { id: true, status: true, postSlug: true },
  });
  if (!comment) throw new UserInputError("That comment no longer exists.");
  const plan = planModeration(comment.status, input.op);
  if (!plan.ok) throw new UserInputError(plan.reason);

  // Only move it if nobody moved it in the meantime.
  const result = await prisma.comment.updateMany({
    where: { id: comment.id, status: comment.status },
    data: { status: plan.to, ...(plan.setApprovedAt ? { approvedAt: new Date() } : {}) },
  });
  if (result.count === 0) throw new UserInputError("That comment changed in the meantime. Refresh and try again.");

  await audit(userId, `comments.${input.op}`, "Comment", comment.id, { post: comment.postSlug, from: comment.status, to: plan.to });
  revalidateBlogPost(comment.postSlug);
  revalidateAdmin();
  return { status: plan.to };
});

/** Delete a comment for good. Its replies go with it (cascade). */
export const deleteComment = action(deleteCommentSchema, async (input, userId) => {
  const comment = await prisma.comment.findUnique({
    where: { id: input.id },
    select: { id: true, postSlug: true, status: true, _count: { select: { replies: true } } },
  });
  if (!comment) throw new UserInputError("That comment no longer exists.");
  await prisma.comment.delete({ where: { id: comment.id } });
  await audit(userId, "comments.delete", "Comment", comment.id, {
    post: comment.postSlug,
    status: comment.status,
    replies: comment._count.replies,
  });
  revalidateBlogPost(comment.postSlug);
  revalidateAdmin();
  return { deleted: true };
});

/** Reply as the author: approved at once, and a pending parent is approved with it. */
export const replyToComment = action(ownerReplySchema, async (input, userId) => {
  const [parent, owner] = await Promise.all([
    prisma.comment.findUnique({
      where: { id: input.parentId },
      select: { id: true, status: true, parentId: true, postSlug: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);
  if (!parent) throw new UserInputError("That comment no longer exists.");
  if (!owner) throw new Error("Owner not found");
  const plan = planOwnerReply(parent);
  if (!plan.ok) throw new UserInputError(plan.reason);

  const now = new Date();
  const reply = await prisma.$transaction(async (tx) => {
    if (plan.approveParent) {
      await tx.comment.update({ where: { id: parent.id }, data: { status: "APPROVED", approvedAt: now } });
    }
    return tx.comment.create({
      data: {
        postSlug: parent.postSlug,
        parentId: parent.id,
        authorName: owner.name,
        body: input.body,
        status: plan.reply.status,
        isOwner: plan.reply.isOwner,
        approvedAt: now,
      },
      select: { id: true },
    });
  });

  await audit(userId, "comments.reply", "Comment", reply.id, {
    post: parent.postSlug,
    parent: parent.id,
    approvedParent: plan.approveParent,
  });
  revalidateBlogPost(parent.postSlug);
  revalidateAdmin();
  return { id: reply.id, approvedParent: plan.approveParent };
});
