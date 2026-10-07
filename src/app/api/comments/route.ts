import { prisma } from "@/lib/prisma";
import { getAllPosts } from "@/lib/content/posts";
import { commentSchema } from "@/lib/validators/comments";
import { handlePublicForm } from "@/lib/forms/submit";
import { notifyOwner } from "@/lib/notify/owner";
import { clearOldIpHashes } from "@/lib/housekeeping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ten stored comments a day per sender. */
const PER_DAY = 10;

/** Blog comments. They wait for approval in the admin. Contract: docs/API.md. */
export async function POST(req: Request) {
  return handlePublicForm(req, {
    form: "comments",
    site: "blog",
    schema: commentSchema,
    async check(data) {
      const posts = await getAllPosts();
      return posts.some((post) => post.slug === data.postSlug) ? null : { postSlug: ["Unknown post"] };
    },
    async overDbLimit(ipHash, now) {
      const count = await prisma.comment.count({
        where: { ipHash, isOwner: false, createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      });
      return count >= PER_DAY;
    },
    async store(data, meta) {
      await prisma.comment.create({
        data: {
          postSlug: data.postSlug,
          authorName: data.name,
          authorEmail: data.email ? data.email.toLowerCase() : null,
          body: data.body,
          ipHash: meta.ipHash,
          userAgent: meta.userAgent,
        },
      });
    },
    async afterStore(data) {
      await notifyOwner({ kind: "comment", name: data.name, postSlug: data.postSlug });
      await clearOldIpHashes();
    },
  });
}
