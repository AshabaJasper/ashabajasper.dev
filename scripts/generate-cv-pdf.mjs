/**
 * Prints the /cv page to public/cv/ashaba-jasper-cv.pdf: A4, light theme,
 * the page's own print stylesheet. The PDF is generated from the site, never
 * copied from the owner's original CV file, so it carries only what the page
 * shows (no phone numbers, no referees).
 *
 *   CV_URL=http://localhost:3201/cv node scripts/generate-cv-pdf.mjs
 *
 * Run it against a local dev or production build after changing the CV data
 * in src/data/experience.ts or src/data/cv.ts, then commit the new PDF.
 *
 * Playwright is resolved from PLAYWRIGHT_PATH (a folder whose node_modules has
 * playwright) or the project's local installation.
 */
import { createRequire } from "node:module";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const resolvePlaywright = process.env.PLAYWRIGHT_PATH
  ? createRequire(path.join(path.resolve(process.env.PLAYWRIGHT_PATH), "package.json"))
  : createRequire(import.meta.url);
const { chromium } = resolvePlaywright("playwright");

const url = process.env.CV_URL ?? "http://localhost:3000/cv";
const out = path.join(process.cwd(), "public", "cv", "ashaba-jasper-cv.pdf");

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ colorScheme: "light", reducedMotion: "reduce", viewport: { width: 794, height: 1123 } });
  const page = await context.newPage();
  // A fresh context has no saved theme, so next-themes follows the light colour scheme.
  await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
  await page.emulateMedia({ media: "print", colorScheme: "light" });
  await page.evaluate(() => document.fonts.ready);
  await mkdir(path.dirname(out), { recursive: true });
  await page.pdf({
    path: out,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate:
      '<div style="width:100%;font-size:7.5pt;color:#666;padding:0 14mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>Ashaba Joshua Jasper, CV. ashabajasper.dev/cv</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
  });
  const { size } = await stat(out);
  console.log(`Wrote ${path.relative(process.cwd(), out)} (${Math.round(size / 1024)} KB) from ${url}`);
} finally {
  await browser.close();
}
