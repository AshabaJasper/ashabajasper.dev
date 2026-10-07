import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as robotsGET } from "@/app/portfolio/robots.txt/route";
import { GET as sitemapGET } from "@/app/portfolio/sitemap.xml/route";
import { featuredWork } from "@/data/work";

let saved: string | undefined;

beforeEach(() => {
  saved = process.env.ROOT_DOMAIN;
  delete process.env.ROOT_DOMAIN;
});

afterEach(() => {
  if (saved === undefined) delete process.env.ROOT_DOMAIN;
  else process.env.ROOT_DOMAIN = saved;
});

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

describe("portfolio sitemap.xml", () => {
  it("is a valid urlset served as XML", async () => {
    const res = sitemapGET();
    expect(res.headers.get("content-type")).toMatch(/^application\/xml/);
    const xml = await res.text();
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.trim().endsWith("</urlset>")).toBe(true);
    expect((xml.match(/<lastmod>2026-10-07<\/lastmod>/g) ?? []).length).toBe(locs(xml).length);
  });

  it("lists absolute production URLs for the public pages only", async () => {
    const urls = locs(await sitemapGET().text());
    const expected = [
      "/",
      "/work",
      ...featuredWork().map((w) => `/work/${w.slug}`),
      "/cv",
      "/about",
      "/now",
      "/contact",
      "/privacy",
      "/terms",
    ].map((path) => `https://ashabajasper.dev${path}`);
    expect(urls).toEqual(expected);
    for (const url of urls) {
      expect(url).not.toMatch(/\/(portfolio|blog|admin)(\/|$)/);
    }
    expect(urls.some((url) => url.includes("/contact/thanks"))).toBe(false);
  });

  it("follows ROOT_DOMAIN when it is set", async () => {
    process.env.ROOT_DOMAIN = "localhost:3101";
    const urls = locs(await sitemapGET().text());
    expect(urls[0]).toBe("http://localhost:3101/");
  });
});

describe("portfolio robots.txt", () => {
  it("allows crawling, keeps the thanks page out and points at the sitemap", async () => {
    const res = robotsGET();
    expect(res.headers.get("content-type")).toMatch(/^text\/plain/);
    const text = await res.text();
    expect(text).toContain("User-agent: *");
    expect(text).toContain("Allow: /");
    expect(text).toContain("Disallow: /contact/thanks");
    expect(text).toContain("Sitemap: https://ashabajasper.dev/sitemap.xml");
    expect(text).not.toMatch(/\/portfolio/);
  });
});
