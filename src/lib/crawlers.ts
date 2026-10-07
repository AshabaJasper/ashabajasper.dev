/**
 * Search and AI crawlers we explicitly welcome on the public hosts. Listing
 * them is belt and braces: "User-agent: *" already allows everyone, but some
 * operators only read their own group.
 */
export const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Bingbot",
  "DuckAssistBot",
  "Meta-ExternalAgent",
  "MistralAI-User",
  "CCBot",
  "cohere-ai",
  "YouBot",
] as const;

/** robots.txt body: everyone allowed, AI crawlers named, optional disallows, sitemap and llms.txt. */
export function robotsBody(options: { sitemap: string; llms: string; disallow?: string[] }): string {
  const disallow = (options.disallow ?? []).map((path) => `Disallow: ${path}`);
  const groups = [
    ["User-agent: *", "Allow: /", ...disallow].join("\n"),
    [...AI_CRAWLERS.map((bot) => `User-agent: ${bot}`), "Allow: /", ...disallow].join("\n"),
  ];
  return `${groups.join("\n\n")}\n\n# A plain-text guide for language models: ${options.llms}\nSitemap: ${options.sitemap}\n`;
}
