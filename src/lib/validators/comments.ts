import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/content/schema";

const ID = z.string().min(1).max(64);

/** "" or a valid email, at most 254 characters. */
const optionalEmail = z
  .string()
  .trim()
  .max(254, "That email address is too long")
  .refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email or leave it empty");

/**
 * POST /api/comments, exactly as docs/API.md describes it. Whether the slug
 * belongs to a published post is checked by the route, against the content.
 */
export const commentSchema = z.object({
  postSlug: z.string().max(120).regex(SLUG_PATTERN, "Unknown post"),
  name: z.string().trim().min(1, "Tell me your name").max(80, "Keep your name under 80 characters"),
  email: optionalEmail,
  body: z
    .string()
    .trim()
    .min(2, "Write at least 2 characters")
    .max(2000, "Keep the comment under 2,000 characters"),
  website: z.string().max(2000),
  token: z.string().max(200),
});

export type CommentInput = z.infer<typeof commentSchema>;

/** Admin: approve, mark spam or restore. */
export const moderateCommentSchema = z.object({
  id: ID,
  op: z.enum(["approve", "spam", "restore"]),
});

export const deleteCommentSchema = z.object({ id: ID });

/** Admin: the owner's public reply under a top-level comment. */
export const ownerReplySchema = z.object({
  parentId: ID,
  body: z.string().trim().min(2, "Write at least 2 characters").max(2000, "Keep the reply under 2,000 characters"),
});

export type OwnerReplyInput = z.infer<typeof ownerReplySchema>;
