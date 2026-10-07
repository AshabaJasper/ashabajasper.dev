import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Approved comments for one post, as the public blog shows them. The
 * selection is explicit so the sender's email, IP hash and user agent can
 * never reach a page, even by accident.
 */

export interface PublicReply {
  id: string;
  authorName: string;
  body: string;
  isOwner: boolean;
  createdAt: Date;
}

export interface PublicComment extends PublicReply {
  replies: PublicReply[];
}

const publicFields = {
  id: true,
  authorName: true,
  body: true,
  isOwner: true,
  createdAt: true,
} as const;

/** Top-level approved comments, oldest first, each with its approved replies, oldest first. */
export async function getApprovedComments(slug: string): Promise<PublicComment[]> {
  return prisma.comment.findMany({
    where: { postSlug: slug, parentId: null, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    select: {
      ...publicFields,
      replies: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "asc" },
        select: publicFields,
      },
    },
  });
}
