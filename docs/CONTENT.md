# Writing for the blog

Posts are MDX files in `content/posts`. The filename is the slug and the URL:
`content/posts/offline-first-forms.mdx` becomes
`https://blog.ashabajasper.dev/offline-first-forms`. There is no CMS and no database
for posts: publishing is a commit to `main`.

## A new post

1. Create `content/posts/<slug>.mdx`. Slugs are lower-case kebab-case (`a-z`, `0-9` and
   single hyphens). These names are reserved and refused: `tags`, `feed.xml`,
   `robots.txt`, `sitemap.xml`, `og`, `api`, `page`.
2. Start it with frontmatter, then write the body in MDX.
3. Run `npm run dev` and read it at `http://blog.localhost:3000/<slug>`.
4. Run `npm run content:check`, then commit and push (see Publishing).

```mdx
---
title: "Offline-first forms for field data collection"
description: "How we kept survey data safe on patchy connections, and what we would do differently next time."
date: 2026-10-07
tags: [data-engineering, web]
---

The opening paragraph says what the reader will get from the post.
```

## Frontmatter

Validated by `src/lib/content/schema.ts`. Unknown keys are an error, so a typo such as
`tag:` fails the check instead of being silently ignored.

| Field | Required | Rules | Used for |
| --- | --- | --- | --- |
| `title` | Yes | 1 to 90 characters | Page heading, document title, feed |
| `description` | Yes | 20 to 200 characters | Meta description, list excerpt, social card text |
| `date` | Yes | `YYYY-MM-DD` | Publication date and ordering (newest first) |
| `updated` | No | `YYYY-MM-DD`, not before `date` | "Updated" line, sitemap `lastmod` |
| `tags` | Yes | 1 to 6, each kebab-case | Tag pages and the tag list |
| `series` | No | `{ name: 1 to 60 characters, part: whole number from 1 }` | Grouping a multi-part series |
| `draft` | No | `true` or `false` | Hides the post outside development |
| `ogTitle` | No | 1 to 60 characters | A shorter title for the social card |

Dates may be written bare (`2026-10-07`) or quoted; both are read as the same day.
Reading time is calculated from the body, never written by hand.

## What MDX can do here

- **Headings:** start the body at `##`; the page already renders the title as the only
  `h1`. Use `###` below that and do not skip levels. Headings get ids and anchor links
  automatically, so `## Why offline first` can be linked as `#why-offline-first`.
- **Code fences** are highlighted with Shiki at build time, in both themes. Add a file
  title and highlighted lines in the meta after the language:

  ````mdx
  ```ts title="src/lib/queue.ts" {3,7-9}
  export function enqueue(item: Item) {
    // ...
  }
  ```
  ````

  `title="..."` shows a caption above the block; `{3,7-9}` highlights line 3 and lines
  7 to 9. Always give the language, `txt` for plain output. Inline code uses single
  backticks.
- **GFM:** tables, task lists, strikethrough and autolinked URLs work as on GitHub. Keep
  tables narrow enough to read on a phone, or they scroll sideways inside their block.
- **Figure components** (diagrams, timelines, stats, comparisons, callouts): see the
  next section.
- **Links:** use relative links between posts (`[the first part](/offline-first-forms)`)
  and full `https://` URLs elsewhere. Link to the portfolio with
  `https://ashabajasper.dev/...`.
- **Images:** if a post needs one, put a compressed WebP or AVIF of the display size in
  `public/images/posts/<slug>/` and give it real alt text that says what the image shows.
  Purely decorative images take `alt=""`. Prefer a code block or a table to a screenshot
  of text.

Anything else (raw HTML, scripts, imports from npm, JavaScript expressions in braces) is
not supported.

## Figure components

A post may use only the components named in `MDX_COMPONENT_NAMES`
(`src/components/blog/mdx-names.ts`); they are registered in
`src/components/blog/mdx-components.tsx`, and `tests/blog-figures.test.ts` keeps the two
lists equal. `npm run content:check` fails on any other component and prints the list.
Props are plain strings: JavaScript expressions are blocked, so there are no `{...}`
values. Every figure keeps its words in the HTML, so it reads without the picture and
without JavaScript.

| Component | Use | Props |
| --- | --- | --- |
| `<Note>` | An aside the reader can skip. Keep to one or two a post. | `title` (optional) |
| `<Callout>` | A highlighted box with an icon. | `type`: `note` (default), `tip`, `warning` or `check`; `title` (optional) |
| `<Diagram>` with `<Node>` children | A left-to-right flow with arrows, as a numbered list. | Diagram: `caption`, `summary` (a sentence for screen readers saying what the figure shows). Node: `title` (required), `detail`, `label`, `icon`, `tone` (`accent` or `muted`) |
| `<Steps>` with `<Step>` children | A numbered vertical sequence. | Steps: `caption`. Step: `title` (required), `icon`; the body is the step's text |
| `<Timeline>` with `<Step>` children | The same as `Steps`, for when the order is time. | As `Steps` |
| `<Stats>` with `<Stat>` children | A row of figures. Only real numbers you can stand behind. | Stats: `caption`. Stat: `value` and `label` (required), `unit` |
| `<Compare>` with two `<CompareSide>` children | Before and after, or two options side by side. | Compare: `caption`. CompareSide: `title` (required), `label`, `icon`, `tone` (`before` shows a cross, `after` a tick, default `neutral`); the body is the side's text |
| `<Cards>` with `<Card>` children | An icon grid, optionally linking to sections of the post. | Cards: `caption`. Card: `title` (required), `icon`, `href` (for example `#a-heading-id`); the body is the card's text |
| `<BookingTimeline />`, `<RaceSequence />`, `<CnnLayers />` | Hand-drawn SVG figures made for one post each (`src/components/blog/post-diagrams.tsx`), with a text alternative in the HTML. | none |

`icon` takes a name from `FIGURE_ICONS` in `src/components/blog/figure-icons.ts`:
`banknote`, `book`, `brain`, `camera`, `chart`, `check`, `cross`, `clipboard`,
`contrast`, `crop`, `database`, `file`, `flask`, `images`, `inbox`, `info`, `layers`,
`lightbulb`, `mail`, `message`, `receipt`, `scan`, `send`, `server`, `shield`, `bag`,
`cart`, `sigma`, `phone`, `store`, `test`, `warning`, `person`, `wrench`. An unknown name
renders no icon.

```mdx
<Diagram caption="From a photo to a prediction." summary="A photo is cleaned with OpenCV, a CNN reads it, and a softmax picks one of 26 letters.">
  <Node icon="camera" label="Input" title="A photo of one letter" />
  <Node icon="layers" label="CNN" title="Learn the strokes" detail="3 convolution blocks" />
  <Node icon="check" label="Output" tone="accent" title="Pick the letter" />
</Diagram>

<Callout type="tip" title="Where the real gains are">
Better data beats a bigger model here.
</Callout>
```

A new component needs code first: add it to `mdx-figures.tsx` (or `post-diagrams.tsx`
for a one-off drawing), register it in `mdx-components.tsx`, add its name to
`MDX_COMPONENT_NAMES`, and keep the tests passing.

## Posts in llms-full.txt

`https://ashabajasper.dev/llms-full.txt` (`buildLlmsFullTxt()` in `src/lib/llms.ts`)
ends with a "Blog posts" section that holds every published post: its title, URL, date
and the **raw MDX body** as written in the file. Drafts are left out. Two consequences:

- The post's `##` headings appear as headings in that file, so keep them descriptive.
- Figure components appear as their source tags, for example `<Node title="..." />`.
  Put the meaning in the props and captions (`title`, `detail`, `caption`, `summary`),
  so a language model reading the tags gets the same facts as a reader seeing the figure.

`/llms.txt` on both public hosts lists every post with its title, URL and description.
Both files are built from the same post files, so a deploy updates them.

## Drafts

`draft: true` keeps a post out of every list, page, feed and sitemap in production. In
`npm run dev` drafts load normally so you can read them. A draft is still public in the
Git repository, so never put anything private in one.

## Series

Give each part the same `series.name` and its own `part` number:

```yaml
series:
  name: "Data pipelines on a budget"
  part: 2
```

Parts are grouped by this name and ordered by `part`, so keep the name identical,
letter for letter, in every part.

## Tags

Lower-case kebab-case, 1 to 6 per post (`data-engineering`, `nextjs`, `career`). Reuse
existing tags before inventing new ones: `npm run dev` and the blog's tags page show the
current list. Each tag gets a page at `https://blog.ashabajasper.dev/tags/<tag>`.

## Social images

Every post gets its own Open Graph image, generated from its title (or `ogTitle` when the
title is too long for the card) in the site's fonts. There is nothing to design or
upload. Check it after publishing with the LinkedIn Post Inspector or opengraph.xyz.

## The content check

`npm run content:check` (`scripts/check-content.ts`) parses every file in
`content/posts` with the same rules as the site: slug, frontmatter, `updated` not before
`date`. It runs before every production build (`prebuild`) and in CI, so a post that
fails it never deploys. Fix the message it prints, which names the file and the field.

## House style

- **No em dashes**, anywhere: use a comma, a colon, brackets or a new sentence. The
  tests fail on one.
- **British spelling:** organisation, colour, licence (noun), analyse, programme (but
  "program" for software).
- **Plain and specific.** Say what was built, for whom and what changed. Numbers only
  when they are real and you can stand behind them.
- **No private data.** No client names without their permission, no personal details of
  other people, no internal URLs, keys, IP addresses or screenshots that show any of
  these. Anonymise examples.
- **Code you can run.** Snippets should be correct as shown, or clearly marked as
  shortened with a `// ...` line.
- This site grants no reuse licence for code in posts. An associated repository may
  have its own licence; otherwise ask the owner. The prose stays all rights reserved.

## Publishing

```bash
npm run content:check
npm test
git add content/posts/<slug>.mdx
git commit -m "Blog: <title>"
git push origin main
```

The push triggers CI. It does not deploy by itself: there is no webhook yet, so trigger
the deploy in Coolify (DEPLOYMENT.md section 5). The post is live once the deploy
finishes. Then resubmit the blog sitemap to IndexNow (DEPLOYMENT.md section 12). To fix a typo later, edit the file, set `updated` if the
change is meaningful, and push again.
