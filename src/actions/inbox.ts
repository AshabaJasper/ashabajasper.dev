"use server";

import { prisma } from "@/lib/prisma";
import { action, audit } from "@/actions/safe-action";
import { UserInputError } from "@/lib/action-error";
import { ownerEmail, smtpEnv } from "@/lib/env";
import { sendMail } from "@/lib/mail/send";
import { messageIdSchema, messageStatusSchema, sendReplySchema } from "@/lib/validators/inbox";
import { quoteForReply, replySubject } from "@/lib/contact/reply";
import { revalidateAdmin } from "@/lib/revalidate";

/** Opening a new message marks it read. Quiet when it was already read. */
export const markMessageRead = action(messageIdSchema, async (input, userId) => {
  const result = await prisma.contactMessage.updateMany({
    where: { id: input.id, status: "NEW" },
    data: { status: "READ" },
  });
  if (result.count > 0) {
    await audit(userId, "inbox.message.read", "ContactMessage", input.id);
    revalidateAdmin();
  }
  return { changed: result.count > 0 };
});

/** Archive, mark as spam, or put a message back in the inbox. */
export const setMessageStatus = action(messageStatusSchema, async (input, userId) => {
  const message = await prisma.contactMessage.findUnique({
    where: { id: input.id },
    select: { status: true, repliedAt: true },
  });
  if (!message) throw new UserInputError("That message no longer exists.");
  const status = input.op === "archive" ? "ARCHIVED" : input.op === "spam" ? "SPAM" : message.repliedAt ? "REPLIED" : "READ";
  await prisma.contactMessage.update({ where: { id: input.id }, data: { status } });
  await audit(userId, `inbox.message.${input.op}`, "ContactMessage", input.id, { from: message.status, to: status });
  revalidateAdmin();
  return { status };
});

/** Send the reply through SMTP. Only offered when SMTP is configured. */
export const sendReply = action(sendReplySchema, async (input, userId) => {
  const smtp = smtpEnv();
  if (!smtp) throw new UserInputError("Email sending is not configured. Use your email app instead.");
  const message = await prisma.contactMessage.findUnique({ where: { id: input.id } });
  if (!message) throw new UserInputError("That message no longer exists.");

  const text = `${input.body}\n\n${quoteForReply(message)}`;
  try {
    await sendMail({
      to: message.email,
      subject: replySubject(message.subject),
      text,
      replyTo: ownerEmail() || smtp.from,
    });
  } catch (err) {
    console.error("[inbox] reply failed:", err instanceof Error ? err.name : "unknown error");
    throw new UserInputError("The mail server could not confirm delivery. Your draft is still here; check your mailbox before trying again.");
  }

  const repliedAt = new Date();
  await prisma.contactMessage.update({
    where: { id: message.id },
    data: { replyBody: input.body, replyVia: "smtp", repliedAt, status: "REPLIED" },
  });
  await audit(userId, "inbox.message.reply", "ContactMessage", message.id, { via: "smtp" });
  revalidateAdmin();
  return { repliedAt: repliedAt.toISOString() };
});

/** The owner replied from their own mail app. */
export const markReplied = action(messageIdSchema, async (input, userId) => {
  const message = await prisma.contactMessage.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!message) throw new UserInputError("That message no longer exists.");
  const repliedAt = new Date();
  await prisma.contactMessage.update({
    where: { id: input.id },
    data: { replyVia: "mailto", repliedAt, status: "REPLIED" },
  });
  await audit(userId, "inbox.message.reply", "ContactMessage", input.id, { via: "mailto" });
  revalidateAdmin();
  return { repliedAt: repliedAt.toISOString() };
});
