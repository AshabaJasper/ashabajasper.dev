import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validators/contact";
import { handlePublicForm } from "@/lib/forms/submit";
import { notifyOwner } from "@/lib/notify/owner";
import { clearOldIpHashes } from "@/lib/housekeeping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Three stored messages an hour per sender. */
const PER_HOUR = 3;

/** The portfolio contact form. Contract: docs/API.md. */
export async function POST(req: Request) {
  return handlePublicForm(req, {
    form: "contact",
    site: "portfolio",
    schema: contactSchema,
    async overDbLimit(ipHash, now) {
      const count = await prisma.contactMessage.count({
        where: { ipHash, createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) } },
      });
      return count >= PER_HOUR;
    },
    async store(data, meta) {
      await prisma.contactMessage.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          subject: data.subject || null,
          body: data.message,
          ipHash: meta.ipHash,
          userAgent: meta.userAgent,
        },
      });
    },
    async afterStore(data) {
      await notifyOwner({ kind: "contact", name: data.name });
      await clearOldIpHashes();
    },
  });
}
