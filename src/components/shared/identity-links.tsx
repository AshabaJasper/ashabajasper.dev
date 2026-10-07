import { profile } from "@/data/profile";
import { siteUrl } from "@/lib/sites";

/**
 * Head links that tie this site to the owner's other profiles (rel="me", for
 * identity verification) and point machines at the plain-text guides. React
 * hoists <link> elements into the document head.
 */
export function IdentityLinks() {
  return (
    <>
      {Object.values(profile.links).map((href) => (
        <link key={href} rel="me" href={href} />
      ))}
      <link rel="me" href={`mailto:${profile.email}`} />
      <link rel="author" href={siteUrl("portfolio", "/about")} />
      <link rel="alternate" type="text/markdown" title="Profile for language models" href={siteUrl("portfolio", "/llms.txt")} />
    </>
  );
}
