import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/sites";
import { AdminSidebar, AdminTopBar, type AdminNavProps } from "@/components/admin/admin-nav";

/**
 * Every signed-in admin page. The middleware already sends signed-out visitors
 * to /login; this checks again with the full Auth.js config and the database.
 */
export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [owner, newMessages, pendingComments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.comment.count({ where: { status: "PENDING" } }),
  ]);
  if (!owner) redirect("/login");

  const nav: AdminNavProps = {
    newMessages,
    pendingComments,
    ownerName: owner.name,
    portfolioUrl: siteUrl("portfolio", "/"),
    blogUrl: siteUrl("blog", "/"),
  };

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="lg:flex">
        <AdminSidebar {...nav} />
        <div className="min-w-0 flex-1">
          <AdminTopBar {...nav} />
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1040px] px-4 py-8 outline-none sm:px-6 sm:py-10 lg:px-10 lg:py-14">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
