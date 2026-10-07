import { WorkMap } from "@/components/portfolio/work-map";
import { workStats } from "@/components/portfolio/work-map-data";
import { allWork, workKinds } from "@/data/work";

/**
 * The work map with its headline numbers and the same data as a table. The
 * table is server rendered, so it is the whole visual for no-JS readers and
 * an exact alternative for screen readers.
 */
export function WorkMapSection() {
  const stats = workStats();
  const items = allWork();
  const kind = (k: string) => workKinds.find((w) => w.kind === k)?.label.replace(/s$/, "") ?? k;
  const figures = [
    { value: stats.projects, label: "projects" },
    { value: stats.sectors, label: "sectors" },
    { value: stats.technologies, label: "technologies named" },
    { value: stats.caseStudies, label: "case studies" },
  ];

  return (
    <div>
      <dl className="bg-rule border-rule grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border sm:grid-cols-4">
        {figures.map((f) => (
          <div key={f.label} className="bg-background flex flex-col-reverse px-4 py-5 sm:px-5 sm:py-6">
            <dt className="text-muted-foreground mt-2 font-mono text-[0.75rem]">{f.label}</dt>
            <dd className="font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-none tabular-nums">{f.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted-foreground mt-4 max-w-[70ch] text-[0.88rem] leading-relaxed">
        Counted from the project listing. {stats.withYear} of {stats.projects} projects list a year and {stats.withStack} list a stack;
        the rest are shown as not listed rather than guessed.
      </p>

      <div className="mt-10">
        <WorkMap />
      </div>

      <details className="group border-rule mt-8 rounded-[var(--radius-lg)] border">
        <summary className="hover:text-foreground text-ink-soft flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-mono text-[0.8rem] [&::-webkit-details-marker]:hidden">
          <span aria-hidden className="text-primary transition-transform duration-200 group-open:rotate-90">
            &rsaquo;
          </span>
          Show the data as a table
        </summary>
        <div className="border-rule overflow-x-auto border-t">
          <table className="w-full min-w-[640px] text-left text-[0.85rem]">
            <caption className="sr-only">All {items.length} projects with kind, sector, year and stack</caption>
            <thead>
              <tr className="border-rule text-muted-foreground border-b font-mono text-[0.7rem] tracking-[0.08em] uppercase">
                <th scope="col" className="px-4 py-3 font-medium">Project</th>
                <th scope="col" className="px-4 py-3 font-medium">Kind</th>
                <th scope="col" className="px-4 py-3 font-medium">Sector</th>
                <th scope="col" className="px-4 py-3 font-medium">Year</th>
                <th scope="col" className="px-4 py-3 font-medium">Stack</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.slug} className="border-rule border-b last:border-b-0">
                  <th scope="row" className="px-4 py-2.5 font-medium">
                    {item.name}
                  </th>
                  <td className="text-ink-soft px-4 py-2.5">{kind(item.kind)}</td>
                  <td className="text-ink-soft px-4 py-2.5">{item.sector}</td>
                  <td className="text-ink-soft px-4 py-2.5 tabular-nums">{item.year ?? <span className="text-muted-foreground">Not listed</span>}</td>
                  <td className="text-muted-foreground px-4 py-2.5 font-mono text-[0.75rem]">{item.stack.length ? item.stack.join(", ") : "Not listed"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
