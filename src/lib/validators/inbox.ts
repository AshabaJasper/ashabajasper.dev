import { z } from "zod";

const ID = z.string().min(1).max(64);

export const INBOX_FILTERS = ["new", "read", "replied", "archived", "spam", "all"] as const;
export type InboxFilter = (typeof INBOX_FILTERS)[number];

export const messageIdSchema = z.object({ id: ID });

/** Archive, mark as spam, or put back in the inbox. */
export const messageStatusSchema = z.object({
  id: ID,
  op: z.enum(["archive", "spam", "restore"]),
});

export const sendReplySchema = z.object({
  id: ID,
  body: z.string().trim().min(2, "Write a reply first").max(10000, "Keep the reply under 10,000 characters"),
});

export type SendReplyInput = z.infer<typeof sendReplySchema>;
