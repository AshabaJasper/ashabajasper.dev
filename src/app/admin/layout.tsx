import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { siteOrigin } from "@/lib/sites";

/**
 * The private admin at admin.<root>. Never indexed (metadata here, the
 * X-Robots-Tag header in the middleware and next.config, and robots.txt),
 * and no analytics.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin("admin")),
  title: {
    default: "Admin",
    template: "%s · Admin",
  },
  description: "Private admin for ashabajasper.dev: contact messages, comment moderation and settings.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "same-origin",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" closeButton />
    </>
  );
}
