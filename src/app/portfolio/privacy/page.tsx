import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/portfolio/prose";
import { PageHeader } from "@/components/portfolio/ui";
import { profile } from "@/data/profile";
import { crossHref } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  site: "portfolio",
  path: "/privacy",
  title: "Privacy",
  description:
    "How ashabajasper.dev and its blog handle personal data: what the contact form and comments collect, why, where it is stored, for how long, and how to ask for it to be deleted.",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        kicker="Legal"
        title="Privacy"
        lede={<p>A plain account of what this site collects, why, and what happens to it.</p>}
      >
        <p className="text-muted-foreground mt-6 font-mono text-[0.8rem]">
          Last updated <time dateTime="2026-10-07">7 October 2026</time>
        </p>
      </PageHeader>

      <div className="container-page">
        <Prose>
          <h2>Who runs this site</h2>
          <p>
            This notice covers ashabajasper.dev and blog.ashabajasper.dev. Both are personal websites run by me,{" "}
            {profile.fullName}, in Kampala, Uganda. For anything about your data, email{" "}
            <a href={`mailto:${profile.email}`} className="link">
              {profile.email}
            </a>
            .
          </p>

          <h2>What is collected</h2>
          <h3>When you use the contact form</h3>
          <p>Your name, your email address, the subject if you give one, and your message.</p>
          <h3>When you comment on a blog post</h3>
          <p>
            Your name, your email address if you choose to give it, and your comment. Your email address is never shown
            publicly.
          </p>
          <h3>With every message and comment</h3>
          <p>
            A keyed hash of your IP address (a one-way code made with a secret key, not the address itself), which is
            eligible for deletion after 30 days, and your browser&apos;s user agent string. Cleanup runs when a new
            submission is processed, so deletion can happen later when the site is quiet.
          </p>
          <h3>When you visit any page</h3>
          <ul>
            <li>
              A self-hosted instance of Umami collects page paths, referring sites, approximate location, browser,
              operating system, device type and visit counts without cookies. It processes the IP address to derive
              location and a visit identifier; it does not store the raw IP address. Query strings, URL fragments and
              form contents are excluded from tracking. The tracker respects your browser&apos;s Do Not Track setting.
            </li>
          </ul>

          <h2>Why</h2>
          <ul>
            <li>To read and reply to your message.</li>
            <li>To moderate comments before they appear.</li>
            <li>To prevent spam and abuse, which is what the IP hash and user agent are for.</li>
          </ul>

          <h2>Where it is stored</h2>
          <p>
            Everything is stored on a virtual private server rented from Hostinger, located in Manchester, United Kingdom.
          </p>

          <h2>Who else handles it</h2>
          <ul>
            <li>
              <strong>Hostinger</strong> hosts the server.
            </li>
            <li>
              <strong>Hostinger Mail</strong>, when notifications are enabled, carries two things: a short notice to
              me that a message or comment has arrived, with the sender&apos;s name but never the message,
              and any reply sent from the site&apos;s admin. Replies sent from a personal mailbox go through that
              mailbox&apos;s provider as usual.
            </li>
            <li>
              <strong>Telegram</strong>, when it is set up, carries the same short notice to me. It contains
              the sender&apos;s name, never the message.
            </li>
          </ul>

          <h2>How long it is kept</h2>
          <ul>
            <li>
              Contact messages and comments: until I delete them. Published comments stay visible with
              their post.
            </li>
            <li>The IP hash: eligible for automatic cleanup after 30 days, as described above.</li>
            <li>Database backups: about two weeks. Deleted data may remain in a backup until it expires.</li>
            <li>Analytics: retained until I clear it; no automatic retention period is configured.</li>
            <li>
              A log of admin actions, such as a message being marked as read. It records the action and the time, not
              your name, email or message, and is kept until I delete it.
            </li>
          </ul>

          <h2>Cookies</h2>
          <p>
            The public sites set no cookies. If you switch between light and dark themes, that choice is kept in your
            own browser&apos;s local storage and never sent to the server.
          </p>

          <h2>Your choices</h2>
          <p>
            You can ask to see the data held about you, or ask for it to be deleted, by emailing{" "}
            <a href={`mailto:${profile.email}`} className="link">
              {profile.email}
            </a>
            . Please say which messages or comments you mean, for example the name and email you used.
          </p>

          <h2>Changes</h2>
          <p>
            If this notice changes, the new version will be published on this page with a new date at the top. See also
            the <Link href="/terms" className="link">terms of use</Link> and the{" "}
            <a href={crossHref("portfolio", "blog", "/")} className="link">
              blog
            </a>
            .
          </p>
        </Prose>
      </div>
    </>
  );
}
