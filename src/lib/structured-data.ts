import { profile } from "@/data/profile";
import { skillGroups, awards } from "@/data/cv";
import { siteUrl } from "@/lib/sites";

/**
 * Schema.org entities shared across pages. Every page refers to the same
 * Person by @id, so search engines and AI systems join them into one entity.
 */

export const PERSON_ID = `${siteUrl("portfolio", "/")}#person`;
export const WEBSITE_ID = `${siteUrl("portfolio", "/")}#website`;

export function personSchema() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: profile.fullName,
    alternateName: profile.name,
    jobTitle: profile.headline,
    description: profile.heroLine,
    url: siteUrl("portfolio", "/"),
    image: siteUrl("portfolio", profile.avatar.src),
    email: `mailto:${profile.email}`,
    sameAs: Object.values(profile.links),
    address: { "@type": "PostalAddress", addressLocality: "Kampala", addressCountry: "UG" },
    worksFor: [
      { "@type": "Organization", name: "Persmon Technologies", url: "https://persmontechnologies.com" },
      { "@type": "Organization", name: "Learnnovate", url: "https://github.com/Learnnovate-Africa" },
    ],
    alumniOf: { "@type": "CollegeOrUniversity", name: profile.education.school },
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "degree",
      name: `${profile.education.degree} (GPA ${profile.education.gpa})`,
    },
    award: awards.map((a) => `${a.title}, ${a.issuer} (${a.year})`),
    knowsAbout: [
      "Data science",
      "Machine learning",
      "Applied AI",
      "Large language models",
      "MLOps",
      "Data engineering",
      "Full-stack web development",
      ...skillGroups.flatMap((g) => g.items).slice(0, 40),
    ],
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteUrl("portfolio", "/"),
    name: profile.name,
    description: profile.heroLine,
    inLanguage: "en-GB",
    publisher: { "@id": PERSON_ID },
    author: { "@id": PERSON_ID },
  };
}

export function profilePageSchema(path: string, name: string) {
  return {
    "@type": "ProfilePage",
    url: siteUrl("portfolio", path),
    name,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": PERSON_ID },
    about: { "@id": PERSON_ID },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: siteUrl("portfolio", item.path),
    })),
  };
}

/** A JSON-LD graph, serialised so "<" can never close the script element. */
export function jsonLd(...nodes: object[]): string {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(/</g, "\\u003c");
}
