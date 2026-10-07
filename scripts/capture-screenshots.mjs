/**
 * Captures the top of each featured project's public site for the work pages.
 *
 *   node scripts/capture-screenshots.mjs                 all public targets
 *   node scripts/capture-screenshots.mjs hms oms         only these slugs
 *
 * Output: assets/work-src/<slug>.png, 1600x1000 (a 1440x900 CSS px viewport rendered
 * at deviceScaleFactor 2, then downscaled). Run scripts/optimize-images.mjs afterwards.
 *
 * Jasper OS is private, so it is not captured here against production. To shoot a
 * local instance signed in as a throwaway demo user, run
 *
 *   JASPER_BASE_URL=http://localhost:3105 JASPER_EMAIL=... JASPER_PASSWORD=... \
 *   JASPER_SHOTS_DIR=<a folder outside this repo> node scripts/capture-screenshots.mjs --jasper
 *
 * which writes candidate pages to JASPER_SHOTS_DIR only. Review every candidate by eye
 * and copy a page that shows nothing personal to assets/work-src/jasper-os.png by hand.
 *
 * Rules the script follows: it never accepts a consent banner (it clicks a reject or
 * decline control when one exists, otherwise hides the overlay for the shot), never
 * signs in to a public site and never submits a form there.
 *
 * Playwright is resolved from PLAYWRIGHT_PATH (a folder whose node_modules has
 * playwright) or from the default scratch install below.
 */
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DEFAULT_PW =
  "C:/Users/ashab/AppData/Local/Temp/claude/C--Users-ashab-OneDrive-Desktop-Ashabas-OS/115a0957-6f31-4388-8c02-5a771d1c7d07/scratchpad/pw";
const pwRoot = process.env.PLAYWRIGHT_PATH || DEFAULT_PW;
const { chromium } = createRequire(path.join(pwRoot, "package.json"))("playwright");

const TARGETS = [
  { slug: "hms", url: "https://hms.persmon.cloud" },
  { slug: "oms", url: "https://ops.persmon.cloud" },
  { slug: "uganda-bookshop", url: "https://ugandabookshop.com" },
  { slug: "pearl-insights", url: "https://pearl-insights.org" },
  { slug: "sickle-cell-awards-voting", url: "https://mhfvotes.pearl-insights.org" },
];

const JASPER_PAGES = ["/", "/plan", "/reports", "/calculators", "/settings/modules"];

const VIEWPORT = { width: 1440, height: 900 };
const OUT_WIDTH = 1600;
const OUT_HEIGHT = 1000;

/** Product tours and promos are dismissed too, never started. */
const DISMISS_LABEL = /^\s*(no thanks|not now|skip( tour)?|maybe later)\s*$/i;

const REJECT_LABEL = /^\s*(reject( all)?|decline( all)?|refuse( all)?|deny|only (strictly )?necessary|necessary only|use necessary cookies only)\s*$/i;

/** Clicks a reject or decline control if the page offers one. Never accepts. */
async function rejectConsent(page, label = REJECT_LABEL) {
  for (const frame of page.frames()) {
    const buttons = frame.locator("button, [role=button], a");
    const count = Math.min(await buttons.count().catch(() => 0), 400);
    for (let i = 0; i < count; i++) {
      const b = buttons.nth(i);
      const text = ((await b.innerText().catch(() => "")) || "").trim();
      if (text.length > 40 || !label.test(text)) continue;
      if (!(await b.isVisible().catch(() => false))) continue;
      await b.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(600);
      return text;
    }
  }
  return null;
}

/** Hides fixed or sticky overlays that talk about cookies or consent. */
async function hideConsentOverlays(page) {
  return page.evaluate(() => {
    let hidden = 0;
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const style = getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "sticky") continue;
      const text = (el.textContent || "").toLowerCase();
      const id = `${el.id} ${el.className}`.toLowerCase();
      if (/cookie|consent|gdpr/.test(text) || /cookie|consent|gdpr/.test(id)) {
        if (el.tagName === "HEADER" || el.tagName === "NAV") continue;
        el.style.setProperty("display", "none", "important");
        hidden++;
      }
    }
    return hidden;
  });
}

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(1500);
}

async function shoot(page, file) {
  const raw = await page.screenshot({ type: "png", clip: { x: 0, y: 0, ...VIEWPORT } });
  await sharp(raw)
    .resize(OUT_WIDTH, OUT_HEIGHT, { fit: "cover", position: "top", kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toFile(file);
}

async function newContext(browser) {
  return browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "en-GB",
    timezoneId: "Africa/Kampala",
  });
}

async function capturePublic(browser, only) {
  await mkdir("assets/work-src", { recursive: true });
  const targets = only.length ? TARGETS.filter((t) => only.includes(t.slug)) : TARGETS;
  for (const t of targets) {
    const context = await newContext(browser);
    const page = await context.newPage();
    try {
      const res = await page.goto(t.url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await settle(page);
      const rejected = await rejectConsent(page);
      const dismissed = await rejectConsent(page, DISMISS_LABEL);
      const hidden = await hideConsentOverlays(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      const file = `assets/work-src/${t.slug}.png`;
      await shoot(page, file);
      console.log(
        `${t.slug}: ${res?.status() ?? "?"} ${page.url()} -> ${file}` +
          (rejected ? ` (clicked "${rejected}")` : "") +
          (dismissed ? ` (dismissed "${dismissed}")` : "") +
          (hidden ? ` (hid ${hidden} consent overlay)` : "")
      );
    } catch (e) {
      console.error(`${t.slug}: failed, ${e.message}`);
      process.exitCode = 1;
    } finally {
      await context.close();
    }
  }
}

async function captureJasper(browser) {
  const base = process.env.JASPER_BASE_URL;
  const email = process.env.JASPER_EMAIL;
  const password = process.env.JASPER_PASSWORD;
  const dir = process.env.JASPER_SHOTS_DIR;
  if (!base || !email || !password || !dir) {
    throw new Error("Set JASPER_BASE_URL, JASPER_EMAIL, JASPER_PASSWORD and JASPER_SHOTS_DIR");
  }
  const host = new URL(base).hostname;
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) {
    throw new Error("Jasper OS shots only run against a local development server");
  }
  if (path.resolve(dir).startsWith(path.resolve("."))) {
    throw new Error("JASPER_SHOTS_DIR must be outside this repository");
  }
  await mkdir(dir, { recursive: true });
  const context = await newContext(browser);
  const page = await context.newPage();
  try {
    await page.goto(`${base}/login`, { waitUntil: "domcontentloaded", timeout: 120000 });
    await settle(page);
    await shoot(page, path.join(dir, "login.png"));
    await page.fill("#email", email);
    await page.fill("#password", password);
    const trust = page.locator("#trustDevice");
    if ((await trust.getAttribute("data-state")) === "checked") await trust.click();
    await page.locator("button[type=submit]").click();
    await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 120000 });
    for (const p of JASPER_PAGES) {
      await page.goto(`${base}${p}`, { waitUntil: "domcontentloaded", timeout: 180000 });
      await settle(page);
      // The Next.js dev indicator and transient toasts are not part of the product.
      // The account avatar (the demo user's initials) and the unread count are hidden
      // too, so no shot carries anything that reads as a person or their activity.
      await page.addStyleTag({
        content: [
          "nextjs-portal, [data-sonner-toaster] { display: none !important; }",
          '[aria-label="Account menu"] { visibility: hidden !important; }',
          '[aria-label="Notifications"] > span { display: none !important; }',
        ].join("\n"),
      });
      await page.waitForTimeout(300);
      const name = p === "/" ? "overview" : p.slice(1).replace(/\//g, "-");
      await shoot(page, path.join(dir, `${name}.png`));
      console.log(`jasper ${p} -> ${path.join(dir, `${name}.png`)}`);
    }
  } finally {
    await context.close();
  }
}

const args = process.argv.slice(2);
const browser = await chromium.launch();
try {
  if (args.includes("--jasper")) await captureJasper(browser);
  else await capturePublic(browser, args);
} finally {
  await browser.close();
}
