import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EmailLink } from "@/components/portfolio/email-link";
import { Prose } from "@/components/portfolio/prose";
import { ExternalLink, PageHeader, SectionHeading, buttonPrimary, buttonSecondary } from "@/components/portfolio/ui";
import { ChartNoAxesCombined, Wrench } from "lucide-react";
import { NumbersBand, SkillGroups } from "@/components/portfolio/showcase";
import { TechLogo } from "@/components/portfolio/tech";
import { awards, certifications, cvSummary } from "@/data/cv";
import { highlights } from "@/data/highlights";
import { profile } from "@/data/profile";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, jsonLd, personSchema, profilePageSchema } from "@/lib/structured-data";

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
  const today = new Date();
  const figures = highlights({ year: today.getUTCFullYear(), month: today.getUTCMonth() + 1 });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(personSchema(), profilePageSchema("/about", `About ${profile.fullName}`), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])) }}
      />
      <PageHeader kicker="About" title="I build practical systems, end to end.">
        <div id="hero-actions" className="mt-8 flex flex-wrap gap-3">
          <Link href="/cv" className={buttonPrimary}>
            Read the CV
          </Link>
          <EmailLink placement="about-header" className={buttonSecondary}>
            Email me
          </EmailLink>
        </div>
      </PageHeader>

      <div className="container-page grid gap-14 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
        <Prose>
          <p className="!mt-0 text-foreground text-[1.2rem] leading-[1.65] sm:text-[1.3rem]">
            I am {profile.fullName}, a data scientist, AI/ML engineer and full-stack developer in Kampala, Uganda. I design and build
            practical systems end to end: data pipelines and models, REST APIs and full-stack web applications.
          </p>
          <p>
            My work sits where data science, applied AI and software engineering meet. I care most about tools that solve
            real operational problems for businesses, co-operatives and non-profits in East Africa: the hotel that needs
            one set of books, the firm that needs to see its deadlines, the public that needs its data in a form it can
            use.
          </p>

          <h2>In short</h2>
          <p>{cvSummary}</p>

          <h2>What I do now</h2>
          <p>
            I am co-founder and COO of{" "}
            <ExternalLink href="https://persmontechnologies.com" className="link" icon={false}>
              Persmon Technologies
            </ExternalLink>
            , a software company in Kampala. My work with Persmon dates to December 2022. Our portfolio includes 47 projects, from a{" "}
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
            , a technology education non-profit, where I have been Founder and Program Director since December 2022. Its programmes have reached 200+ learners across multiple schools.
          </p>

          <h2>Before Persmon, and alongside it</h2>
          <p>
            From February 2025 to June 2026 I worked remotely as a data scientist and AI/ML engineer with Reveloop Tech Systems for
            Envision Radiology, a US radiology network. There I built RadCareLoop, a multi-LLM follow-up analyser (Gemini, GPT and
            Claude with a Judge arbitration layer) validated at 97.9% accuracy against a 10,000-report gold-standard dataset, a
            document-intake pipeline for fax orders, DICOM computer vision on Azure Kubernetes Service and Grafana telemetry for the
            RIS and PACS ecosystem.
          </p>
          <p>
            Earlier roles took me through data engineering and BI at Uganda Bookshop, e-commerce and analytics at Excellent Shop,
            Flutter apps at Centenary Publishing, predictive maintenance for fleets at Blue Pearls and Uganda Transporters, and an
            internship in operations and monitoring at MTN Uganda. The <Link href="/cv" className="link">full CV</Link> has the
            dates and results.
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
            I studied at {profile.education.school} from January 2022 to July 2024, where I earned a {profile.education.degree}{" "}
            with a GPA of {profile.education.gpa}. My capstone, Help Anonymous, was an AI-powered mental-health app with BERT and
            LSTM sentiment analysis that reached 270+ active users.
          </p>
          <p>
            I was Lead of the Google Developer Student Club from 2022 to 2023, taking 100+ students through workshops on machine
            learning, Python, TensorFlow and cloud, and General Secretary of the Data Science Society. In the same period I was
            ranked among Africa&rsquo;s Top 100 in the Google Developer Community for Machine Learning and Cloud.
          </p>

          <h2>Recognition and certifications</h2>
          <ul>
            {awards.map((a) => (
              <li key={a.title}>
                {a.title}, {a.issuer} ({a.year})
              </li>
            ))}
          </ul>
          <p>Certifications include:</p>
          <ul>
            {certifications.map((c) => (
              <li key={c.title}>
                {c.title}, {c.issuer} ({c.year})
              </li>
            ))}
          </ul>

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
          <div className="border-rule bg-muted relative aspect-square w-40 overflow-hidden rounded-[var(--radius-xl)] border sm:w-48 lg:w-full">
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
                {profile.education.degree} (GPA {profile.education.gpa}), {profile.education.school}
              </dd>
            </div>
            <div>
              <dt className="kicker">Recognition</dt>
              <dd className="mt-1">Gold Award, Queen&rsquo;s Commonwealth Essay Competition (2021); Africa Top 100, Google Developer Community</dd>
            </div>
            <div>
              <dt className="kicker">Exploring</dt>
              <dd className="mt-1">{profile.exploring.join(", ")}</dd>
            </div>
          </dl>
          <ul className="border-rule mt-8 space-y-0.5 border-t pt-6">
            {(
              [
                ["GitHub", profile.links.github, "github"],
                ["LinkedIn", profile.links.linkedin, null],
                ["X", profile.links.x, "x"],
                ["Google Developers", profile.links.googleDevelopers, "Google Developers"],
              ] as const
            ).map(([label, href, logo]) => (
              <li key={label}>
                <ExternalLink href={href} className="text-ink-soft hover:text-foreground inline-flex min-h-11 items-center gap-2.5">
                  {logo ? (
                    <TechLogo name={logo} className="size-4" />
                  ) : (
                    <span aria-hidden className="bg-foreground text-background inline-flex size-4 items-center justify-center rounded-[3px] text-[0.6rem] font-bold">
                      in
                    </span>
                  )}
                  {label}
                </ExternalLink>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <section aria-labelledby="about-numbers" className="container-page mt-24 sm:mt-32">
        <SectionHeading id="about-numbers" icon={ChartNoAxesCombined} kicker="By the numbers" title="The short version, in figures." />
        <NumbersBand items={figures} className="mt-10" />
      </section>

      <section aria-labelledby="about-tools" className="container-page mt-24 sm:mt-32">
        <SectionHeading id="about-tools" icon={Wrench} kicker="Toolkit" title="What I build with." />
        <SkillGroups className="mt-10" only={["languages", "ml", "genai", "data", "web", "mlops"]} />
      </section>
    </>
  );
}
