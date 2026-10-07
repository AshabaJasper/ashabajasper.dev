import { profile } from "@/data/profile";
import { renderOgImage } from "@/lib/og";

export const runtime = "nodejs";

/** The default social card for the portfolio. */
export async function GET(): Promise<Response> {
  return renderOgImage({
    kicker: "Portfolio",
    title: profile.name,
    subtitle: profile.heroLine,
    host: "ashabajasper.dev",
  });
}
