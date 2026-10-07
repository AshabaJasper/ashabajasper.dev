import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/**
 * The shared 1200x630 social card. Fonts are local OFL files in assets/fonts
 * (copied into the image by the Dockerfile and traced by next.config).
 */

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

let fontsPromise: Promise<{ name: string; data: Buffer; style: "normal" | "italic"; weight: 400 }[]> | null = null;

function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(path.join(FONT_DIR, "InstrumentSerif-Regular.ttf")).then((data) => ({
      name: "Instrument Serif",
      data,
      style: "normal" as const,
      weight: 400 as const,
    })),
    readFile(path.join(FONT_DIR, "InstrumentSerif-Italic.ttf")).then((data) => ({
      name: "Instrument Serif",
      data,
      style: "italic" as const,
      weight: 400 as const,
    })),
    readFile(path.join(FONT_DIR, "Geist-Regular.ttf")).then((data) => ({
      name: "Geist",
      data,
      style: "normal" as const,
      weight: 400 as const,
    })),
    readFile(path.join(FONT_DIR, "GeistMono-Regular.ttf")).then((data) => ({
      name: "Geist Mono",
      data,
      style: "normal" as const,
      weight: 400 as const,
    })),
  ]);
  return fontsPromise;
}

export interface OgCard {
  /** Small uppercase line at the top, for example "Writing" or "Case study". */
  kicker: string;
  title: string;
  subtitle?: string;
  /** Bottom-left meta, for example "7 October 2026 · 8 min read". */
  meta?: string;
  /** Bottom-right host label, for example "blog.ashabajasper.dev". */
  host: string;
}

export const OG_SIZE = { width: 1200, height: 630 };

export async function renderOgImage(card: OgCard): Promise<ImageResponse> {
  const fonts = await loadFonts();
  const titleSize = card.title.length > 70 ? 64 : card.title.length > 44 ? 76 : 92;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FAFAF8",
          color: "#1B1F23",
          padding: "72px 80px",
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "#137C72",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Instrument Serif",
              fontSize: 28,
            }}
          >
            AJ
          </div>
          <div
            style={{
              fontFamily: "Geist Mono",
              fontSize: 22,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#5F6973",
            }}
          >
            {card.kicker}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontFamily: "Instrument Serif",
              fontSize: titleSize,
              lineHeight: 1.02,
              letterSpacing: -1.5,
              maxWidth: 1000,
            }}
          >
            {card.title}
          </div>
          {card.subtitle ? (
            <div style={{ fontSize: 30, lineHeight: 1.35, color: "#3B434B", maxWidth: 940 }}>{card.subtitle}</div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "2px solid #E6E8EA",
            paddingTop: 26,
            fontFamily: "Geist Mono",
            fontSize: 22,
            color: "#5F6973",
          }}
        >
          <div style={{ display: "flex" }}>{card.meta ?? "Ashaba Jasper"}</div>
          <div style={{ display: "flex", color: "#137C72" }}>{card.host}</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts,
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    },
  );
}
