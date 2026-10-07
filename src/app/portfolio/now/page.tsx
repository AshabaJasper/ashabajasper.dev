import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/portfolio/prose";
import { ExternalLink, PageHeader } from "@/components/portfolio/ui";
import { crossHref } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  site: "portfolio",
  path: "/now",
  title: "Now",
  description:
    "What Ashaba Jasper is focused on right now: Persmon Technologies, Learnnovate, learning MLOps and data engineering, and launching this site and blog.",
});

const UPDATED = "2026-10-07";

export default function NowPage() {
  return (
    <>
      <PageHeader
        kicker="Now"
        title="What I am focused on."
        lede={
          <p>
            A{" "}
            <ExternalLink href="https://nownownow.com/about" className="link" icon={false}>
              now page
            </ExternalLink>
            : the few things that have my attention at the moment.
          </p>
        }
      >
        <p className="text-muted-foreground mt-6 font-mono text-[0.8rem]">
          Updated <time dateTime={UPDATED}>7 October 2026</time> in Kampala
        </p>
      </PageHeader>

      <div className="container-page">
        <Prose>
          <h2>Persmon Technologies</h2>
          <p>
            I co-founded{" "}
            <ExternalLink href="https://persmontechnologies.com" className="link" icon={false}>
              Persmon
            </ExternalLink>{" "}
            and run it as COO. My focus there is the systems we build for clients and the platforms we run ourselves,
            like the{" "}
            <Link href="/work/hms" className="link">
              hotel management system
            </Link>{" "}
            and{" "}
            <Link href="/work/oms" className="link">
              OMS
            </Link>
            .
          </p>

          <h2>Learnnovate</h2>
          <p>
            I am building{" "}
            <ExternalLink href="https://github.com/Learnnovate-Africa" className="link" icon={false}>
              Learnnovate
            </ExternalLink>
            , a non-profit that teaches technology skills.
          </p>

          <h2>Learning</h2>
          <p>
            I am going deeper into MLOps, data engineering and production-grade applied AI: taking models and pipelines
            past the prototype and running them as dependable systems.
          </p>

          <h2>This site</h2>
          <p>
            I have just launched this site and{" "}
            <a href={crossHref("portfolio", "blog", "/")} className="link">
              the blog
            </a>
            , where I write about how the systems I build actually work. It runs as one self-hosted Next.js app that
            serves the portfolio, the blog and a private admin.
          </p>
        </Prose>
      </div>
    </>
  );
}
