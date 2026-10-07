import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  site: "blog",
  path: "/",
  title: "Writing",
  description: "Notes on building data, AI and business systems in East Africa, by Ashaba Jasper.",
});

/** Placeholder index; replaced by the blog build. */
export default function BlogIndexPage() {
  return (
    <section className="container-page py-24">
      <p className="kicker">Writing</p>
      <h1 className="mt-4 font-serif text-6xl leading-none">Notes from the build.</h1>
    </section>
  );
}
