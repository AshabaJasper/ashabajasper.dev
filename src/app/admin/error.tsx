"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Monogram } from "@/components/shared/monogram";

/**
 * Admin error boundary: a page failed to render (the database was briefly
 * unreachable, for example). Offers a retry in place and a way back. The
 * error itself is never shown, because its message can carry internals.
 */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = "Something went wrong · Admin";
    headingRef.current?.focus();
  }, []);

  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col justify-center px-4 py-16 sm:px-6">
      <Monogram className="size-10" />
      <p className="kicker mt-10">Admin, error</p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-serif text-5xl leading-none tracking-[-0.02em] outline-none">
        That did not load.
      </h1>
      <p className="text-muted-foreground mt-5 text-[0.98rem]">
        Something went wrong on the server while opening this page. Nothing you entered was changed. Try again in a
        moment; if it keeps happening, check the server logs.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-primary text-primary-foreground inline-flex min-h-11 items-center rounded-full px-6 text-sm font-medium"
        >
          Try again
        </button>
        <Link
          href="/inbox"
          className="border-rule hover:bg-muted inline-flex min-h-11 items-center rounded-full border px-6 text-sm transition-colors"
        >
          Go to the inbox
        </Link>
      </div>
    </main>
  );
}
