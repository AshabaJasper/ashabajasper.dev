import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { profile } from "@/data/profile";

export const metadata: Metadata = pageMetadata({
  site: "portfolio",
  path: "/",
  title: `${profile.name}, software engineer and data scientist`,
  description: profile.heroLine,
  absoluteTitle: true,
});

/** Placeholder home; replaced by the portfolio build. */
export default function HomePage() {
  return (
    <section className="container-page py-24">
      <p className="kicker">{profile.location}</p>
      <h1 className="mt-4 font-serif text-6xl leading-none">{profile.name}</h1>
      <p className="text-muted-foreground mt-6 max-w-[56ch] text-lg">{profile.heroLine}</p>
    </section>
  );
}
