# Website standard checklist

Status of ashabajasper.dev against the owner's 20-item website standard, for all three
hosts: portfolio (`ashabajasper.dev`, `www` redirects to it), blog
(`blog.ashabajasper.dev`) and admin (`admin.ashabajasper.dev`).

Last reviewed: 8 October 2026, on production. The sites have been live since 7 October
2026.

Status values:

- **PASS**: verified on production or in the test suite, with the evidence named.
- **MISSING/BLOCKED**: not done, or blocked on an owner input or action.
- **NOT APPLICABLE**: does not apply, with the reason recorded.

## Evidence used

- **Live curl, 7 and 8 October 2026.** On 8 October every URL in both sitemaps (13 on
  the portfolio, 20 on the blog) plus `/contact/thanks`, an unknown path and the admin
  sign-in were fetched: each public page returned 200, unknown paths 404, every page had
  its own non-empty `<title>` and meta description with no duplicates, and every public
  page carried `og:image` and `og:image:alt`. No public host sent `Set-Cookie`.
- **Tests, 8 October 2026:** `npm test`, 32 files, 307 tests passing.
- **Browser checks, 8 October 2026:** home, work, a case study, `/cv`, `/contact`, a post
  and the blog index at 1440 and 375 px showed no horizontal overflow and no page
  errors; the home hero was also checked at 1024 px in light and dark.
- **Local Playwright review, 7 October 2026** (dev server, before launch): 13 routes at
  320, 375, 768, 1024 and 1440 px in both themes, no horizontal overflow, the primary
  action (`#hero-actions`) inside the first viewport.

## Status

| # | Requirement | Status | Evidence / limitation |
| --- | --- | --- | --- |
| 1 | Custom 404 page | PASS | `src/app/not-found.tsx` plus a `[...missing]` catch-all in each site folder. Live 8 Oct: `https://ashabajasper.dev/no-such-page` and `https://blog.ashabajasper.dev/no-such-post` return 404 with the branded page and a link home; `blog.../llms-full.txt` (portfolio only) also 404s. |
| 2 | Meta title on every page | PASS | `pageMetadata()` in `src/lib/seo.ts`, `generateMetadata` for posts, tags and case studies; `tests/page-metadata.test.ts`. Live 8 Oct: 36 URLs, every title present and unique, including `/contact/thanks`, the 404 and admin sign-in. |
| 3 | Meta description on every page | PASS | Same helper and test; posts use their `description` frontmatter. Live 8 Oct: every description present, none duplicated across the 36 URLs. |
| 4 | CTA above the fold | PASS | `#hero-actions` on the portfolio home (email contact and the CV download), work, case studies, `/cv` and `/about`; blog pages link to the portfolio contact page. Observed in the first viewport at 320 to 1440 px (local, 7 Oct) and at 1440 and 375 px on production (8 Oct). Admin is private and has no conversion goal. |
| 5 | Favicon set | PASS | `public/favicon.ico`, `public/icons/` (SVG, 192, 512, maskable 512, apple touch), `public/site.webmanifest`, from `npm run icons`. Live 8 Oct: every page's head references `favicon.ico`, `icon.svg`, `icon-192.png`, `apple-touch-icon` and the manifest. |
| 6 | robots.txt | PASS | `robots.txt/route.ts` per site; public hosts use `robotsBody()` in `src/lib/crawlers.ts` (all allowed, AI crawlers named as allowed, sitemap and llms.txt linked; the portfolio disallows `/contact/thanks`). Admin returns `User-agent: *` / `Disallow: /` and sends `X-Robots-Tag: noindex, nofollow` (live 8 Oct). `tests/ai-discovery.test.ts`. |
| 7 | sitemap.xml | PASS | `sitemap.xml/route.ts` on portfolio and blog. Live 8 Oct: 13 and 20 absolute `https://` URLs, every one returning 200; `/contact/thanks`, 404s, drafts and the admin host are excluded. `tests/portfolio-sitemap.test.ts`. All sitemap URLs were submitted to IndexNow on 8 Oct and accepted (202). |
| 8 | Open Graph image | PASS | `renderOgImage()` in `src/lib/og.tsx`, route handlers `og/...` per site. Live 8 Oct: `/og` and `/og/<post>` return `image/png`; pages carry `og:title`, `og:description`, `og:url`, `og:image` (absolute, 1200x630), `og:image:alt` and `twitter:card=summary_large_image`. Not yet checked in the LinkedIn Post Inspector. Minor: the home page `og:image:alt` repeats the name ("..., Ashaba Jasper"). |
| 9 | Alt text on every image | PASS | Live 8 Oct: no `<img>` without `alt` on any of the 36 URLs; the home page images carry descriptive alt text. Decorative marks use `alt=""` or `aria-hidden`; figures keep a text alternative in the HTML (docs/CONTENT.md). |
| 10 | Mobile breakpoints | PASS | Local 7 Oct: 13 routes at 320, 375, 768, 1024 and 1440 px, both themes, no overflow. Production 8 Oct: 1440 and 375 px on the key pages, no overflow and no page errors. |
| 11 | Sticky mobile CTA | PASS | `src/components/portfolio/sticky-cta.tsx`, rendered by `src/app/portfolio/layout.tsx`: appears once `#hero-actions` leaves the viewport, pads for `env(safe-area-inset-bottom)`, hides on focus, near the footer and on the contact form, and can be dismissed (sessionStorage). Blog posts deliberately have none; the admin is not a conversion surface. |
| 12 | Loading states | PASS | `src/lib/forms/client.ts`: pending state, submit disabled while sending, timeout with a retry message; admin actions through `src/actions/safe-action.ts`. Covered by `tests/forms-token.test.ts`, `tests/forms-rate-limit.test.ts` and `tests/admin-actions.test.ts`. Limitation: no throttled-network run on production is recorded. |
| 13 | Form error states | PASS | Contract in `docs/API.md`: 400 returns `fieldErrors` shown next to each input with `aria-describedby` and focus on the first invalid field; 403, 413, 429 and 500 keep every entry and allow retry. `tests/validators.test.ts`, `tests/admin-api.test.ts`. Limitation: no offline run on production is recorded. |
| 14 | Thank-you page | PASS | `/contact/thanks` returns 200 (live 8 Oct), is reached only after `{ "ok": true }`, carries next steps and the CV link, is excluded from the sitemap and disallowed in robots.txt. Comments confirm inline that the reply awaits approval. Limitation: a real production message end to end is not recorded here. |
| 15 | Privacy policy page | PASS, with one wording gap | `/privacy` returns 200 and is linked from every footer. It names the operator, the forms' data, the 30-day IP hash cleanup, Hostinger (Manchester) as host, optional mail notifications and "until I delete them" retention. Gap: it says a self-hosted Umami collects visit data, but Umami is not deployed yet, so today it overstates collection. It becomes accurate when item 18 is done; if Umami is dropped, remove that paragraph. |
| 16 | Terms and conditions | PASS | `/terms` returns 200 and is linked from every footer: site use, content all rights reserved, no reuse licence for code in posts (check an associated repository or ask), comment rules, no warranty. |
| 17 | Cookie banner | NOT APPLICABLE | No optional tracking exists. The portfolio and blog set no cookies (no `Set-Cookie` on any public URL, live 8 Oct). Theme is `localStorage`; the terminal intro and the sticky bar use `sessionStorage`; all are functional and stay on the device. The admin sets only strictly necessary, host-only cookies (Auth.js session and CSRF, `ajd_device`) for the single owner. Umami, once deployed, is cookieless. A banner would offer a choice that changes nothing, which is misleading. Revisit if any cookie or tracker is added to a public host. |
| 18 | Analytics installed | MISSING/BLOCKED | Code ready: `src/components/analytics/umami.tsx` on portfolio and blog only, `track()` in `src/lib/analytics.ts` for `contact-sent`, `comment-sent`, `email-click` and `cta-click` without personal data. Blocked: Umami is not deployed (`stats.ashabajasper.dev` does not answer on 8 Oct) and the `NEXT_PUBLIC_UMAMI_*` build variables are empty, so no script loads. Done when page views, client-side navigation and each event are seen once in Umami (DEPLOYMENT.md section 8). |
| 19 | Real contact address | PASS | Owner decision, 7 Oct: city-level "Kampala, Uganda" and `ashabajasper@gmail.com` (`src/data/profile.ts`), no street address. Live 8 Oct: both appear on `/contact` with a working `mailto:` link, and in the footer and privacy page. |
| 20 | Compressed images | PASS | `scripts/optimize-images.mjs` writes resized WebP/AVIF to `public/images`; `next/image` with `srcSet`, width and height. Live 8 Oct: the hero portrait is prioritised (`fetchPriority="high"`, eager), images below the fold use `loading="lazy"`. The CV PDF is a static download, not a page image. A Lighthouse run on production is not recorded. |

## Launch blockers and owner inputs

Facts and actions only the owner can supply. Pages leave these out until they exist; none
is filled with a guess.

1. **Owner account and `SETUP_TOKEN`.** `/setup` reported "Setup is complete" on
   8 October 2026, so an owner account exists. Still to confirm: `SETUP_TOKEN` removed
   from Coolify, the app redeployed, and `printenv SETUP_TOKEN` empty in the `app`
   container (DEPLOYMENT.md section 7).
2. **Umami** (item 18): deploy it at `stats.ashabajasper.dev`, change the default
   `admin` / `umami` login immediately, add the website, set the two build variables and
   redeploy (DEPLOYMENT.md section 8).
3. **Google Search Console and Bing Webmaster Tools:** verify the domain and submit both
   sitemaps (DEPLOYMENT.md section 12).
4. **Persmon COO start date.** The CV does not list the current role, so `/cv` and the
   experience data show Co-founder and COO as "Present" with no start date. LinkedIn's
   December 2022 is organisation tenure, not the appointment date.
5. **Optional: the GitHub webhook** for auto-deploy (DEPLOYMENT.md section 5). Until
   then every release needs a Deploy press in Coolify.

Optional inputs, not blocking launch:

- **Years of experience**, if the portfolio should state it.
- **Outcome numbers** for work entries: only real, attributable figures.
- **SMTP or Telegram details**, only if notifications are wanted. Messages stay in the
  admin inbox without them.
- **Retention periods** for messages and comments, if the privacy page should state a
  period beyond "until I delete them".
- **A code licence** for posts: none is granted today; a grant needs an owner decision.
