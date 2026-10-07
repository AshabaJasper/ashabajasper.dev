import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/portfolio/prose";
import { PageHeader } from "@/components/portfolio/ui";
import { profile } from "@/data/profile";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  site: "portfolio",
  path: "/terms",
  title: "Terms",
  description:
    "Terms of use for ashabajasper.dev and its blog: copyright, code examples, comment rules and moderation, outside links and contact.",
});

export default function TermsPage() {
  return (
    <>
      <PageHeader kicker="Legal" title="Terms of use" lede={<p>The short rules for using this site and its blog.</p>}>
        <p className="text-muted-foreground mt-6 font-mono text-[0.8rem]">
          Last updated <time dateTime="2026-10-07">7 October 2026</time>
        </p>
      </PageHeader>

      <div className="container-page">
        <Prose>
          <h2>About this site</h2>
          <p>
            ashabajasper.dev and blog.ashabajasper.dev are the personal websites of {profile.fullName}, in Kampala,
            Uganda. They describe my work and publish my writing. Nothing here is an offer to provide a service on
            particular terms; any work together is agreed separately.
          </p>

          <h2>Copyright</h2>
          <p>
            Unless a page says otherwise, the text, images and design of this site are copyright {profile.fullName}.
            Project names, logos and screenshots belong to the organisations they represent and appear here to describe work I was part of. Technology logos are drawn from Simple Icons and remain the trademarks of their respective holders; they only show which tools a project uses.
          </p>

          <h2>Code in blog posts</h2>
          <p>
            Code examples explain an implementation and come with no warranty. Check the associated repository for
            any licence that applies. For permission to reuse material without a stated licence, contact me.
          </p>

          <h2>Comments</h2>
          <p>Comments on the blog are welcome. Every comment is read before it is published. Please:</p>
          <ul>
            <li>stay on the topic of the post and be civil;</li>
            <li>not post spam, advertising, or anything unlawful, hateful or harassing;</li>
            <li>not share other people&apos;s personal information.</li>
          </ul>
          <p>
            I may decline or remove any comment, and may stop accepting comments on a post. By posting,
            you confirm the comment is your own and you allow it to be shown alongside the post.
          </p>

          <h2>Links to other sites</h2>
          <p>
            This site links to other websites, including live projects and profiles. I do not control them and am not
            responsible for their content or how they handle your data.
          </p>

          <h2>No warranty</h2>
          <p>
            Everything here is provided as is, for general information. I try to keep it accurate and current, but I make
            no promise that it is complete, correct or always available.
          </p>

          <h2>Privacy</h2>
          <p>
            How personal data is handled is set out in the <Link href="/privacy" className="link">privacy notice</Link>.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these terms:{" "}
            <a href={`mailto:${profile.email}`} className="link">
              {profile.email}
            </a>
            .
          </p>
        </Prose>
      </div>
    </>
  );
}
