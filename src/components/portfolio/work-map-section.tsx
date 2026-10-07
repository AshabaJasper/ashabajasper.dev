import { Building2, Cpu, Layers, Star } from "lucide-react";
import { KIND_ICON, sectorIcon } from "@/components/portfolio/icons";
import { TechLogo, logosFor } from "@/components/portfolio/tech";
import { WorkMap } from "@/components/portfolio/work-map";
import { MAP_TECHS, STACK_FAMILIES, workStats } from "@/components/portfolio/work-map-data";
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
    { value: stats.projects, label: "projects shipped", icon: Layers },
    { value: stats.sectors, label: "sectors served", icon: Building2 },
    { value: stats.technologies, label: "technologies in use", icon: Cpu },
    { value: stats.caseStudies, label: "in-depth case studies", icon: Star },
  ];
  // Only the logos the map draws are sent to the browser.
  const logos = logosFor([...MAP_TECHS.map((t) => t.tech), ...items.flatMap((w) => w.stack), ...STACK_FAMILIES.flatMap((f) => f.logos)]);

  return (
    <div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {figures.map((f, i) => (
          <div
            key={f.label}
            data-reveal
            className="stat-tile border-rule bg-card/80 relative flex flex-col-reverse overflow-hidden rounded-[var(--radius-lg)] border px-4 py-5 sm:px-5 sm:py-6"
            style={{ "--i": i } as React.CSSProperties}
          >
            <dt className="text-muted-foreground mt-2 font-mono text-[0.75rem]">{f.label}</dt>
            <dd className="font-display flex items-center justify-between gap-3 text-[clamp(2.2rem,5vw,3.4rem)] leading-none tabular-nums">
              {f.value}
              <span aria-hidden className="bg-accent text-primary inline-flex size-9 items-center justify-center rounded-[10px] sm:size-10">
                <f.icon className="size-[18px]" strokeWidth={1.75} />
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-10">
        <WorkMap logos={logos} />
      </div>

      <details className="group border-rule bg-card/40 mt-8 rounded-[var(--radius-lg)] border">
        <summary className="hover:text-foreground text-ink-soft flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-mono text-[0.8rem] [&::-webkit-details-marker]:hidden">
          <span aria-hidden className="text-primary transition-transform duration-200 group-open:rotate-90">
            &rsaquo;
          </span>
          Show the data as a table
        </summary>
        <div className="border-rule overflow-x-auto border-t">
          <table className="w-full min-w-[680px] text-left text-[0.85rem]">
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
              {items.map((item) => {
                const KindIcon = KIND_ICON[item.kind];
                const SectorIcon = sectorIcon(item.sector);
                return (
                  <tr key={item.slug} className="border-rule border-b last:border-b-0">
                    <th scope="row" className="px-4 py-2.5 font-medium">
                      {item.name}
                    </th>
                    <td className="text-ink-soft px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <KindIcon aria-hidden className="text-muted-foreground size-3.5" strokeWidth={1.75} />
                        {kind(item.kind)}
                      </span>
                    </td>
                    <td className="text-ink-soft px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <SectorIcon aria-hidden className="text-muted-foreground size-3.5 shrink-0" strokeWidth={1.75} />
                        {item.sector}
                      </span>
                    </td>
                    <td className="text-ink-soft px-4 py-2.5 tabular-nums">{item.year}</td>
                    <td className="text-muted-foreground px-4 py-2.5 font-mono text-[0.72rem]">
                      <span className="flex flex-wrap gap-x-2.5 gap-y-1">
                        {item.stack.map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 whitespace-nowrap">
                            <TechLogo name={t} className="size-3" />
                            {t}
                          </span>
                        ))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
