import { sectorYear, workBySlug } from "@/data/work";
import { renderOgImage } from "@/lib/og";

export const runtime = "nodejs";

/** Social cards for the six case studies; anything else is a 404. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }): Promise<Response> {
  const item = workBySlug((await params).slug);
  if (!item || !item.featured || !item.caseStudy) {
    return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  return renderOgImage({
    kicker: "Case study",
    title: item.name,
    subtitle: item.caseStudy.headline,
    meta: sectorYear(item),
    host: "ashabajasper.dev",
  });
}
