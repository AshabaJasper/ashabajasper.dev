import { describe, expect, it } from "vitest";
import { AI_CRAWLERS, robotsBody } from "@/lib/crawlers";
import { PERSON_ID, jsonLd, personSchema } from "@/lib/structured-data";

describe("AI and search discovery", () => {
  it("robots welcomes every listed AI crawler and points at the sitemap and llms.txt", () => {
    const body = robotsBody({ sitemap: "https://ashabajasper.dev/sitemap.xml", llms: "https://ashabajasper.dev/llms.txt", disallow: ["/contact/thanks"] });
    for (const bot of AI_CRAWLERS) expect(body).toContain(`User-agent: ${bot}`);
    expect(body).toContain("Allow: /");
    expect(body).toContain("Sitemap: https://ashabajasper.dev/sitemap.xml");
    expect(body).toContain("https://ashabajasper.dev/llms.txt");
    expect(body).not.toMatch(/Disallow: \/\s*$/m);
  });

  it("the Person entity is stable and linked to the owner's profiles", () => {
    const person = personSchema();
    expect(person["@id"]).toBe(PERSON_ID);
    expect(person.sameAs.length).toBeGreaterThanOrEqual(3);
    expect(person.name).toBe("Ashaba Joshua Jasper");
  });

  it("serialised JSON-LD cannot close its script element", () => {
    expect(jsonLd({ name: "</script><b>" })).not.toContain("</script>");
  });
});
