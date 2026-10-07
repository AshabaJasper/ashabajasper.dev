import { describe, expect, it } from "vitest";
import { apiAllowedOn, internalPath, normalizeHost, resolveSite, siteOrigin, siteUrl } from "@/lib/sites";

const ROOT = "ashabajasper.dev";

describe("resolveSite", () => {
  it("maps the apex, blog and admin hosts", () => {
    expect(resolveSite("ashabajasper.dev", ROOT)).toEqual({ site: "portfolio", redirectToApex: false });
    expect(resolveSite("blog.ashabajasper.dev", ROOT)).toEqual({ site: "blog", redirectToApex: false });
    expect(resolveSite("admin.ashabajasper.dev", ROOT)).toEqual({ site: "admin", redirectToApex: false });
  });

  it("sends www to the apex", () => {
    expect(resolveSite("www.ashabajasper.dev", ROOT)).toEqual({ site: "portfolio", redirectToApex: true });
  });

  it("ignores case, ports and a trailing dot", () => {
    expect(resolveSite("BLOG.AshabaJasper.dev:443", ROOT).site).toBe("blog");
    expect(resolveSite("admin.ashabajasper.dev.", ROOT).site).toBe("admin");
  });

  it("falls back to the portfolio for unknown hosts and the health check", () => {
    expect(resolveSite("127.0.0.1:3000", ROOT).site).toBe("portfolio");
    expect(resolveSite(null, ROOT).site).toBe("portfolio");
    expect(resolveSite("evil.example", ROOT).site).toBe("portfolio");
    expect(resolveSite("blog.evil.example", ROOT).site).toBe("portfolio");
  });

  it("works with a localhost root for development", () => {
    expect(resolveSite("blog.localhost:3000", "localhost:3000").site).toBe("blog");
    expect(resolveSite("admin.localhost:3000", "localhost:3000").site).toBe("admin");
    expect(resolveSite("portfolio.localhost:3000", "localhost:3000").site).toBe("portfolio");
    expect(resolveSite("localhost:3000", "localhost:3000").site).toBe("portfolio");
  });
});

describe("origins and urls", () => {
  it("uses https in production", () => {
    expect(siteOrigin("portfolio", ROOT)).toBe("https://ashabajasper.dev");
    expect(siteOrigin("blog", ROOT)).toBe("https://blog.ashabajasper.dev");
    expect(siteOrigin("admin", ROOT)).toBe("https://admin.ashabajasper.dev");
  });

  it("uses http and keeps the port on localhost", () => {
    expect(siteOrigin("blog", "localhost:3000")).toBe("http://blog.localhost:3000");
    expect(siteOrigin("portfolio", "localhost:3000")).toBe("http://localhost:3000");
  });

  it("builds absolute urls", () => {
    expect(siteUrl("blog", "/pin-on-a-trusted-device", ROOT)).toBe(
      "https://blog.ashabajasper.dev/pin-on-a-trusted-device",
    );
    expect(siteUrl("portfolio", "/", ROOT)).toBe("https://ashabajasper.dev/");
    expect(siteUrl("portfolio", "work", ROOT)).toBe("https://ashabajasper.dev/work");
  });

  it("normalizes hosts", () => {
    expect(normalizeHost(" Example.COM:8080 ")).toBe("example.com");
  });
});

describe("internalPath", () => {
  it("prefixes every public path with the site folder", () => {
    expect(internalPath("portfolio", "/")).toBe("/portfolio");
    expect(internalPath("portfolio", "/work/hms")).toBe("/portfolio/work/hms");
    expect(internalPath("blog", "/feed.xml")).toBe("/blog/feed.xml");
    expect(internalPath("admin", "/inbox")).toBe("/admin/inbox");
  });

  it("keeps a prefixed path typed on the wrong host inside that host", () => {
    expect(internalPath("portfolio", "/blog/x")).toBe("/portfolio/blog/x");
  });
});

describe("apiAllowedOn", () => {
  it("allows each API only on its hosts", () => {
    expect(apiAllowedOn("/api/auth/session", "admin")).toBe(true);
    expect(apiAllowedOn("/api/auth/session", "portfolio")).toBe(false);
    expect(apiAllowedOn("/api/contact", "portfolio")).toBe(true);
    expect(apiAllowedOn("/api/contact", "blog")).toBe(false);
    expect(apiAllowedOn("/api/comments", "blog")).toBe(true);
    expect(apiAllowedOn("/api/comments", "admin")).toBe(false);
    expect(apiAllowedOn("/api/form-token", "portfolio")).toBe(true);
    expect(apiAllowedOn("/api/form-token", "blog")).toBe(true);
    expect(apiAllowedOn("/api/form-token", "admin")).toBe(false);
    expect(apiAllowedOn("/api/health", "admin")).toBe(true);
  });

  it("refuses unknown API paths and look-alike prefixes", () => {
    expect(apiAllowedOn("/api/unknown", "portfolio")).toBe(false);
    expect(apiAllowedOn("/api/contactx", "portfolio")).toBe(false);
  });
});
