import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Download, Mail } from "lucide-react";
import { CvGantt, type GanttRow } from "@/components/portfolio/cv-gantt";
import { CvNav, PrintButton } from "@/components/portfolio/cv-controls";
import { EmailLink } from "@/components/portfolio/email-link";
import { PageHeader, buttonPrimary, buttonSecondary } from "@/components/portfolio/ui";
import { Magnetic } from "@/components/shared/motion";
import { awards, certifications, competencies, cvSummary, notableProjects, skillGroups, training } from "@/data/cv";
import { communityHistory, educationHistory, experience, experienceMonths, experiencePeriod, workHistory, type ExperienceEntry } from "@/data/experience";
import { profile } from "@/data/profile";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  site: "portfolio",
  path: "/cv",
  title: "CV",
  description:
    "The CV of Ashaba Jasper, data scientist, AI/ML engineer and full-stack developer in Kampala: experience, education, notable projects, skills, awards and certifications.",
  type: "profile",
});

const PDF_PATH = "/cv/ashaba-jasper-cv.pdf";

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "timeline", label: "Timeline" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "awards", label: "Awards" },
  { id: "community", label: "Community" },
] as const;

function SectionTitle({ id, index, children }: { id: string; index: number; children: React.ReactNode }) {
  return (
    <h2 id={`${id}-title`} className="font-display flex items-baseline gap-4 text-[clamp(1.7rem,3.4vw,2.4rem)] leading-none">
      <span className="text-primary font-mono text-[0.8rem] font-medium tracking-normal print:hidden">{String(index).padStart(2, "0")}</span>
      {children}
    </h2>
  );
}

function Entry({ entry }: { entry: ExperienceEntry }) {
  return (
    <li id={`exp-${entry.id}`} className="cv-entry relative scroll-mt-28 pb-12 pl-9 last:pb-0 sm:pl-12 print:pb-6">
      <span aria-hidden className="cv-node absolute top-[0.3rem] left-0 size-[15px] rounded-full border-2" />
      <p className="text-muted-foreground font-mono text-[0.75rem] tabular-nums">
        {experiencePeriod(entry)}
        {entry.location ? (
          <>
            <span aria-hidden className="px-2 opacity-50">/</span>
            {entry.location}
            {entry.remote ? ", remote" : ""}
          </>
        ) : null}
      </p>
      <h3 className="mt-2 text-[1.3rem] leading-snug font-semibold tracking-[-0.02em] sm:text-[1.45rem]">{entry.role}</h3>
      <p className="text-ink-soft mt-0.5 text-[1.02rem]">
        {entry.href ? (
          <a href={entry.href} target="_blank" rel="noopener" className="link">
            {entry.organisation}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          entry.organisation
        )}
      </p>
      <ul className="text-ink-soft mt-4 max-w-[68ch] space-y-2.5 text-[0.97rem] leading-relaxed">
        {entry.highlights.map((h) => (
          <li key={h} className="flex gap-3">
            <span aria-hidden className="text-primary mt-[0.62em] block size-1 shrink-0 rounded-full bg-current" />
            <span>{h}</span>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default function CvPage() {
  const today = new Date();
  const now = { year: today.getUTCFullYear(), month: today.getUTCMonth() + 1 };
  const rows: GanttRow[] = experience.map((e) => ({
    id: e.id,
    role: e.role,
    organisation: e.organisation,
    kind: e.kind,
    start: e.start,
    end: e.end,
    period: experiencePeriod(e),
    months: experienceMonths(e, now),
  }));

  return (
    <>
      <PageHeader
        kicker="CV"
        title={profile.fullName}
        lede={
          <p className="font-mono text-[0.85rem] sm:text-[0.92rem]">
            Data Scientist <span className="text-primary px-1.5">/</span> AI/ML Engineer <span className="text-primary px-1.5">/</span> Analytics and
            BI <span className="text-primary px-1.5">/</span> Full-Stack Developer
          </p>
        }
      >
        <div className="ring-primary/60 ring-offset-background relative mt-7 size-24 overflow-hidden rounded-2xl ring-2 ring-offset-2 sm:absolute sm:top-24 sm:right-8 sm:mt-0 sm:size-36 lg:right-[max(2rem,calc((100vw-1120px)/2+2rem))] lg:size-44 print:hidden">
          <Image src={profile.avatar.src} alt={profile.avatar.alt} fill priority sizes="(min-width: 1024px) 176px, 144px" className="object-cover" />
        </div>
        <ul className="text-ink-soft mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[0.95rem]">
          <li>
            <a href={`mailto:${profile.email}`} className="link">
              {profile.email}
            </a>
          </li>
          <li>{profile.location}</li>
          <li>
            <a href={profile.links.linkedin} target="_blank" rel="noopener" className="link">
              linkedin.com/in/ashaba-jasper-joshua
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
          <li>
            <a href={profile.links.github} target="_blank" rel="noopener" className="link">
              github.com/AshabaJasper
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
        {/* id="hero-actions": the call to action in the first viewport. */}
        <div id="hero-actions" className="mt-8 flex flex-wrap gap-3 print:hidden">
          <Magnetic>
            <a href={PDF_PATH} download className={buttonPrimary} data-no-transition>
              <Download aria-hidden className="size-4" strokeWidth={2} />
              Download CV (PDF)
            </a>
          </Magnetic>
          <Magnetic>
            <EmailLink placement="cv" className={buttonSecondary}>
              <Mail aria-hidden className="size-4" strokeWidth={1.75} />
              Email me
            </EmailLink>
          </Magnetic>
          <PrintButton className={`${buttonSecondary} hidden sm:inline-flex`} />
        </div>
      </PageHeader>

      <div className="container-page grid gap-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-16">
        <aside className="bg-background/85 border-rule sticky top-16 z-20 min-w-0 -mx-4 border-b px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-24 lg:mx-0 lg:self-start lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none print:hidden">
          <CvNav sections={SECTIONS} />
        </aside>

        <div className="min-w-0 space-y-24 sm:space-y-28 print:space-y-9">
          <section id="profile" aria-labelledby="profile-title" className="scroll-mt-28">
            <SectionTitle id="profile" index={1}>
              Profile
            </SectionTitle>
            <p className="text-foreground mt-6 max-w-[70ch] text-[1.08rem] leading-[1.7] sm:text-[1.15rem]">{cvSummary}</p>
            <ul className="mt-7 flex flex-wrap gap-2" aria-label="Core competencies">
              {competencies.map((c, i) => (
                <li
                  key={c}
                  className="chip-pop border-rule bg-card text-ink-soft rounded-full border px-3 py-1 text-[0.84rem]"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  {c}
                </li>
              ))}
            </ul>
          </section>

          <section id="timeline" aria-labelledby="timeline-title" className="scroll-mt-28 print:hidden">
            <SectionTitle id="timeline" index={2}>
              Career at a glance
            </SectionTitle>
            <p className="text-ink-soft mt-4 max-w-[60ch] leading-relaxed">
              Every role and degree on one axis. Several ran side by side. Hover or focus a bar for its dates, or follow it to the entry.
            </p>
            <div className="border-rule bg-card mt-8 rounded-[var(--radius-xl)] border p-4 sm:p-6">
              <CvGantt rows={rows} now={now} />
            </div>
          </section>

          <section id="experience" aria-labelledby="experience-title" className="scroll-mt-28">
            <SectionTitle id="experience" index={3}>
              Experience
            </SectionTitle>
            <ol className="cv-timeline mt-10 print:mt-5">
              {workHistory().map((entry) => (
                <Entry key={entry.id} entry={entry} />
              ))}
            </ol>
          </section>

          <section id="education" aria-labelledby="education-title" className="scroll-mt-28">
            <SectionTitle id="education" index={4}>
              Education and training
            </SectionTitle>
            <ol className="cv-timeline mt-10 print:mt-5">
              {educationHistory().map((entry) => (
                <Entry key={entry.id} entry={entry} />
              ))}
            </ol>
            <ul className="border-rule mt-10 border-t">
              {training.map((t) => (
                <li key={t.title} className="border-rule grid gap-1 border-b py-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
                  <p className="text-muted-foreground pt-0.5 font-mono text-[0.75rem]">{t.period}</p>
                  <div>
                    <h3 className="font-semibold tracking-[-0.01em]">{t.title}</h3>
                    <p className="text-muted-foreground text-[0.92rem]">{t.provider}</p>
                    <p className="text-ink-soft mt-1.5 text-[0.95rem] leading-relaxed">{t.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section id="projects" aria-labelledby="projects-title" className="scroll-mt-28">
            <SectionTitle id="projects" index={5}>
              Notable projects
            </SectionTitle>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {notableProjects.map((p, i) => (
                <li
                  key={p.name}
                  className="scroll-reveal border-rule bg-card hover:border-foreground/25 group relative overflow-hidden rounded-[var(--radius-lg)] border p-5 transition-colors sm:p-6"
                >
                  <p className="text-muted-foreground flex items-center justify-between font-mono text-[0.72rem]">
                    <span>{p.context}</span>
                    <span className="text-primary">{String(i + 1).padStart(2, "0")}</span>
                  </p>
                  <h3 className="mt-3 text-[1.2rem] font-semibold tracking-[-0.02em]">{p.name}</h3>
                  <p className="text-ink-soft mt-2 text-[0.95rem] leading-relaxed">{p.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="skills" aria-labelledby="skills-title" className="scroll-mt-28">
            <SectionTitle id="skills" index={6}>
              Skills
            </SectionTitle>
            <dl className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
              {skillGroups.map((group) => (
                <div key={group.id} className="border-rule border-t pt-4">
                  <dt className="flex items-center justify-between gap-3">
                    <span className="font-semibold tracking-[-0.01em]">{group.label}</span>
                    <span className="text-muted-foreground font-mono text-[0.72rem]">
                      {group.items.length} <span className="sr-only">skills</span>
                    </span>
                  </dt>
                  <dd className="mt-3">
                    <ul className="flex flex-wrap gap-1.5">
                      {group.items.map((item, i) => (
                        <li
                          key={item}
                          className="chip-pop border-rule text-ink-soft hover:border-primary hover:text-foreground rounded-[8px] border px-2.5 py-1 font-mono text-[0.75rem] transition-colors"
                          style={{ "--i": i } as React.CSSProperties}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="awards" aria-labelledby="awards-title" className="scroll-mt-28">
            <SectionTitle id="awards" index={7}>
              Awards and certifications
            </SectionTitle>
            <div className="mt-8 grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="kicker">Awards and honours</h3>
                <ul className="border-rule mt-3 border-t">
                  {awards.map((a) => (
                    <li key={a.title} className="border-rule flex items-start justify-between gap-4 border-b py-4">
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <p className="text-muted-foreground text-[0.9rem]">{a.issuer}</p>
                      </div>
                      <p className="text-muted-foreground shrink-0 pt-0.5 font-mono text-[0.72rem]">{a.year}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="kicker">Licences and certifications</h3>
                <ul className="border-rule mt-3 border-t">
                  {certifications.map((c) => (
                    <li key={c.title} className="border-rule flex items-start justify-between gap-4 border-b py-4">
                      <div>
                        <p className="font-medium">{c.title}</p>
                        <p className="text-muted-foreground text-[0.9rem]">{c.issuer}</p>
                      </div>
                      <p className="text-muted-foreground shrink-0 pt-0.5 font-mono text-[0.72rem]">{c.year}</p>
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground mt-3 text-[0.88rem]">The full certification portfolio is available on request.</p>
              </div>
            </div>
          </section>

          <section id="community" aria-labelledby="community-title" className="scroll-mt-28">
            <SectionTitle id="community" index={8}>
              Community and volunteering
            </SectionTitle>
            <ol className="cv-timeline mt-10 print:mt-5">
              {communityHistory().map((entry) => (
                <Entry key={entry.id} entry={entry} />
              ))}
            </ol>
          </section>

          <section aria-label="References" className="border-rule flex flex-col gap-5 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-ink-soft">References available on request.</p>
            <a href={profile.links.linkedin} target="_blank" rel="noopener" className="link inline-flex min-h-11 items-center gap-1 print:hidden">
              Connect on LinkedIn
              <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
