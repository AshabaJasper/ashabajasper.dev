import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EmailLink } from "@/components/portfolio/email-link";
import { Prose } from "@/components/portfolio/prose";
import { ExternalLink, PageHeader } from "@/components/portfolio/ui";
import { profile } from "@/data/profile";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  site: "portfolio",
  path: "/about",
  title: "About",
  description:
    "About Ashaba Jasper: software engineer and data scientist in Kampala, co-founder and COO of Persmon Technologies, building data, AI and business systems end to end.",
  type: "profile",
});

/** Side projects named in the owner's GitHub profile README. */
const GITHUB_PROJECTS = [
  {
    name: "PaveStruct",
    href: "https://github.com/AshabaJasper/Pave-struct",
    text: "a pavement design tool for civil engineers that follows SATCC standards, with a six-step workflow and live structural-number calculations.",
  },
  {
    name: "SilverVibe SACCO",
    href: "https://github.com/AshabaJasper/SilverVibe-Fraternity",
    text: "a demo management platform for a Ugandan savings and credit co-operative, with an admin dashboard, a member portal and role-based views.",
  },
  {
    name: "Bookstore Inventory API",
    href: "https://github.com/AshabaJasper/Bookstore-Inventory-API",
    text: "a containerised REST service in Java and Spring Boot for books, authors, categories and orders, built around a layered architecture.",
  },
  {
    name: "SMART Debt Tracker",
    href: "https://github.com/AshabaJasper/SMART-DEBT-TRACKER",
    text: "a privacy-first personal finance app that compares snowball and avalanche payoff strategies, with all data kept in the browser.",
  },
  {
    name: "Handwriting Recognition",
    href: "https://github.com/AshabaJasper/Handwriting-Recognition-in-Python",
    text: "a neural network that classifies handwritten letters, with OpenCV preprocessing and notebook-based evaluation.",
  },
  {
    name: "Medical Diagnosis with Bayesian Networks",
    href: "https://github.com/AshabaJasper/Medical-Diagnosis-with-Bayseian-Networks",
    text: "a probabilistic model that reasons from observed symptoms to likely diagnoses.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <PageHeader kicker="About" title="I build practical systems, end to end." />

      <div className="container-page grid gap-14 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
        <Prose>
          <p className="!mt-0 text-foreground text-[1.2rem] leading-[1.65] sm:text-[1.3rem]">
            I am {profile.fullName}, a software engineer and data scientist in Kampala, Uganda. I design and build
            practical systems end to end: data pipelines and models, REST APIs and full-stack web applications.
          </p>
          <p>
            My work sits where data science, applied AI and software engineering meet. I care most about tools that solve
            real operational problems for businesses, co-operatives and non-profits in East Africa: the hotel that needs
            one set of books, the firm that needs to see its deadlines, the public that needs its data in a form it can
            use.
          </p>

          <h2>What I do now</h2>
          <p>
            I am co-founder and COO of{" "}
            <ExternalLink href="https://persmontechnologies.com" className="link" icon={false}>
              Persmon Technologies
            </ExternalLink>
            , a software company in Kampala. Together we have shipped 47 projects, from a{" "}
            <Link href="/work/hms" className="link">
              hotel management system
            </Link>{" "}
            and an{" "}
            <Link href="/work/oms" className="link">
              operations platform
            </Link>{" "}
            to an{" "}
            <Link href="/work/uganda-bookshop" className="link">
              online bookshop
            </Link>{" "}
            and a{" "}
            <Link href="/work/pearl-insights" className="link">
              civic data platform
            </Link>
            . The <Link href="/work" className="link">full list</Link> is here.
          </p>
          <p>
            I am also building{" "}
            <ExternalLink href="https://github.com/Learnnovate-Africa" className="link" icon={false}>
              Learnnovate
            </ExternalLink>
            , a non-profit that teaches technology skills.
          </p>

          <h2>What I am learning</h2>
          <p>
            Right now I am going deeper into MLOps, data engineering and production-grade applied AI: the part of the work
            where a model stops being a notebook and starts being a system other people depend on.
          </p>

          <h2>How I work</h2>
          <p>
            For data and models I work in Python with PyTorch, TensorFlow and scikit-learn, on PostgreSQL, MySQL and
            SQLite. Applications are mostly TypeScript and JavaScript with React, Next.js and Tailwind CSS, with services
            in FastAPI, Django, Spring with Java, and Node.js. I ship with Docker, GitHub Actions, Linux, Bash and Git, onto
            Azure, Firebase, Supabase, Vercel and Netlify. For mobile I reach for Flutter and Dart, and for reporting, Power
            BI and Tableau.
          </p>

          <h2>On GitHub</h2>
          <p>Some smaller projects I have built in the open:</p>
          <ul>
            {GITHUB_PROJECTS.map((project) => (
              <li key={project.name}>
                <ExternalLink href={project.href} className="link" icon={false}>
                  {project.name}
                </ExternalLink>
                , {project.text}
              </li>
            ))}
          </ul>

          <h2>Education</h2>
          <p>
            I studied at {profile.education.school}, where I earned a {profile.education.degree}.
          </p>

          <h2>Get in touch</h2>
          <p>
            I am open to collaboration on data, AI and software projects. The fastest way to reach me is{" "}
            <EmailLink placement="about" className="link">
              email
            </EmailLink>{" "}
            or{" "}
            <ExternalLink href={profile.links.linkedin} className="link" icon={false}>
              LinkedIn
            </ExternalLink>
            , or you can use the <Link href="/contact" className="link">contact form</Link>.
          </p>
        </Prose>

        <aside aria-label="At a glance" className="lg:pt-2">
          <div className="border-rule bg-muted relative aspect-square w-40 overflow-hidden rounded-[12px] border sm:w-48 lg:w-full">
            <Image
              src={profile.avatar.src}
              alt={profile.avatar.alt}
              fill
              sizes="(min-width: 1024px) 288px, 192px"
              className="object-cover"
            />
          </div>
          <dl className="mt-8 space-y-5 text-[0.95rem]">
            <div>
              <dt className="kicker">Based in</dt>
              <dd className="mt-1">{profile.location}</dd>
            </div>
            <div>
              <dt className="kicker">Role</dt>
              <dd className="mt-1">Co-founder and COO, Persmon Technologies</dd>
            </div>
            <div>
              <dt className="kicker">Education</dt>
              <dd className="mt-1">
                {profile.education.degree}, {profile.education.school}
              </dd>
            </div>
            <div>
              <dt className="kicker">Exploring</dt>
              <dd className="mt-1">{profile.exploring.join(", ")}</dd>
            </div>
          </dl>
          <ul className="border-rule mt-8 space-y-0.5 border-t pt-6">
            {(
              [
                ["GitHub", profile.links.github],
                ["LinkedIn", profile.links.linkedin],
                ["X", profile.links.x],
                ["Google Developers", profile.links.googleDevelopers],
              ] as const
            ).map(([label, href]) => (
              <li key={label}>
                <ExternalLink href={href} className="text-ink-soft hover:text-foreground inline-flex min-h-11 items-center">
                  {label}
                </ExternalLink>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
