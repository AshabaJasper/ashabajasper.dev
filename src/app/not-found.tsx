import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This address does not lead anywhere on ashabajasper.dev.",
  robots: { index: false, follow: true },
};

/** Fallback for paths outside every site folder. Each site also has its own branded 404. */
export default function RootNotFound() {
  return (
    <main id="main" className="container-page flex min-h-[70vh] flex-col justify-center py-24">
      <p className="kicker">Error 404</p>
      <h1 className="mt-4 font-display text-5xl leading-none tracking-[-0.02em] sm:text-7xl">Nothing lives here.</h1>
      <p className="text-muted-foreground mt-6 max-w-[48ch] text-lg">
        The page may have moved, or the address has a typo.
      </p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground mt-10 inline-flex min-h-11 w-fit items-center rounded-full px-6 text-sm font-medium"
      >
        Go to the home page
      </Link>
    </main>
  );
}
