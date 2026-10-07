import type { Metadata } from "next";
import Link from "next/link";
import { Monogram } from "@/components/shared/monogram";

export const metadata: Metadata = {
  title: "Not found",
  description: "This admin page does not exist.",
  robots: { index: false, follow: false },
};

/** Admin 404: points back to the inbox, which sends a signed-out visitor to sign in. */
export default function AdminNotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col justify-center px-4 py-16 sm:px-6">
      <Monogram className="size-10" />
      <p className="kicker mt-10">Admin, error 404</p>
      <h1 className="mt-3 font-serif text-5xl leading-none tracking-[-0.02em]">Nothing here.</h1>
      <p className="text-muted-foreground mt-5 text-[0.98rem]">
        This admin page does not exist. It may have been a message or comment that was deleted.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/inbox"
          className="bg-primary text-primary-foreground inline-flex min-h-11 items-center rounded-full px-6 text-sm font-medium"
        >
          Go to the inbox
        </Link>
        <Link
          href="/comments"
          className="border-rule hover:bg-muted inline-flex min-h-11 items-center rounded-full border px-6 text-sm transition-colors"
        >
          Comments
        </Link>
      </div>
    </main>
  );
}
