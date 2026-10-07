import type { Metadata } from "next";
import { ContactForm } from "@/components/portfolio/contact-form";
import { EmailLink } from "@/components/portfolio/email-link";
import { PageHeader } from "@/components/portfolio/ui";
import { profile } from "@/data/profile";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  site: "portfolio",
  path: "/contact",
  title: "Contact",
  description:
    "Contact Ashaba Jasper about a data, AI or software project: email ashabajasper@gmail.com or send a message through the form. Based in Kampala, Uganda.",
});

export default function ContactPage() {
  return (
    <>
      <PageHeader
        kicker="Contact"
        title="Tell me what you are building."
        lede={
          <p>
            I am open to collaboration on data, AI and software projects. Write as much or as little as you like; a few
            lines about the problem and who it is for is a great start.
          </p>
        }
      />

      <div className="container-page grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-20">
        <aside aria-label="Other ways to reach me" className="space-y-8">
          <div>
            <h2 className="kicker">Email</h2>
            <p className="mt-2">
              <EmailLink
                placement="contact-page"
                className="text-link hover:text-link-hover inline-flex min-h-11 items-center font-serif text-[1.5rem] break-all underline decoration-current/30 underline-offset-4 transition-colors hover:decoration-current sm:text-[1.75rem]"
              />
            </p>
            <p className="text-muted-foreground mt-1 text-sm">The quickest way to reach me.</p>
          </div>
          <div>
            <h2 className="kicker">Based in</h2>
            <p className="mt-2 text-[1.05rem]">{profile.location}</p>
          </div>
        </aside>

        <section id="contact-form-section" aria-labelledby="form-title" className="scroll-mt-24">
          <h2 id="form-title" className="font-serif text-[2rem] leading-tight tracking-[-0.01em]">
            Send a message
          </h2>
          <p className="text-muted-foreground mt-2 mb-8 text-[0.95rem]">All fields are required unless marked optional.</p>
          <ContactForm />
        </section>
      </div>
    </>
  );
}
