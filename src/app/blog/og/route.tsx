import { renderOgImage } from "@/lib/og";
import { rootDomain } from "@/lib/sites";

export const runtime = "nodejs";

/** The default social card for the blog index, topics and anything without its own card. */
export async function GET() {
  return renderOgImage({
    kicker: "Writing",
    title: "Notes from building real systems",
    subtitle: "Data, AI and business systems in East Africa, by Ashaba Jasper.",
    host: `blog.${rootDomain().replace(/:\d+$/, "")}`,
  });
}
