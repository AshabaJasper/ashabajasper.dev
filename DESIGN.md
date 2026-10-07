# Design: ashabajasper.dev

Approved direction, 7 October 2026: **editorial and quiet.** A well-set personal journal
by an engineer who ships real systems. The work and the writing carry the page; the
design gets out of the way and rewards a slow read.

## Principles

1. **Evidence over decoration.** Real screenshots, real project names, real stack lists.
   No skill bars, logo walls, invented metrics, testimonials we did not collect, or
   "available for hire" badges.
2. **One accent.** Teal is for links, focus and the monogram. Everything else is ink on
   paper. No gradients, glows, blobs, particles or glassmorphism.
3. **Type does the work.** Large serif display headlines, a calm sans for reading, mono
   for metadata. Hierarchy comes from size, weight of space and rules, not colour.
4. **Restraint in motion.** A single soft entrance on load, hover colour shifts, no
   parallax, no scroll-jacking, no typewriter heroes. Nothing moves under
   `prefers-reduced-motion`.
5. **Fast and honest.** Static pages, optimised images, no layout shift, no third-party
   requests except the self-hosted analytics script.

## Foundations

Runtime source of truth: `src/app/globals.css`.

| Role | Light | Dark |
| --- | --- | --- |
| Canvas (`background`) | `#FAFAF8` | `#121416` |
| Surface (`card`) | `#FFFFFF` | `#1A1D20` |
| Ink (`foreground`) | `#1B1F23` | `#E8EAEC` |
| Soft ink (`ink-soft`) | `#3B434B` | `#C9CFD4` |
| Muted text | `#5F6973` | `#A3ADB6` |
| Accent (`primary`, `link`) | `#137C72` | `#8BD6C5` |
| Accent tint (`accent`, `highlight`) | `#E3F1EE` | `#173A35` |
| Rule (`rule`, `border`) | `#E6E8EA` | `#2A2F34` |

All text pairs meet WCAG AA at their sizes (muted on canvas is about 5.4:1; accent on
canvas about 4.9:1).

### Type

| Use | Family | Size | Notes |
| --- | --- | --- | --- |
| Display (home hero) | Instrument Serif | 56 to 104px, fluid | `tracking-[-0.02em]`, `leading-[0.95]`, italic for one emphasised word at most |
| Page title | Instrument Serif | 44 to 64px | |
| Section heading | Instrument Serif | 32 to 40px | |
| Card title | Instrument Serif | 26 to 30px | |
| Body | Geist | 16 to 17px, `leading-relaxed` | measure 60 to 70ch |
| Article body | Geist | 17 to 18px, line-height 1.7 | 68ch measure |
| Kicker, meta, tags, dates | Geist Mono | 11.5 to 13px | uppercase kicker with `.kicker` |

Headings use `text-wrap: balance`, paragraphs `text-wrap: pretty`. Numbers in metadata
use tabular figures.

### Space and layout

- Spacing steps: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px.
- Container: `.container-page`, 1120px max, gutters 16px phone, 24px tablet, 32px desktop.
- Sections are separated by generous space (96 to 128px desktop, 64px phone) and an
  optional hairline rule, never by coloured bands.
- Corners: 12px on cards and images, full pill on buttons and chips.
- Shadows: none by default. Images sit on a 1px rule border.

### Components

- **Buttons:** primary is a teal pill (`bg-primary`), 44px tall minimum, 15px label.
  Secondary is an outlined pill on the rule colour. Text links use `.link`.
- **Kicker:** `.kicker` mono uppercase label above section titles, for example
  "Selected work".
- **Work card:** screenshot (16:10, rule border, 12px radius), serif title, one-line
  summary in soft ink, sector and year in mono, stack as plain mono text separated by
  middots. Hover: title underline in accent, image lifts by 2px. No overlays on images.
- **Post row:** date in mono on the left column (desktop), serif title, one-line
  description, reading time. The whole row is the link target.
- **Header:** sticky, translucent canvas with blur and a hairline rule; monogram plus
  serif name on the left; Work, Writing, About, Contact on the right; theme toggle. On
  phones the links move into a sheet.
- **Footer:** large serif call ("Have a system worth building?") with the plain email,
  link columns, then legal line.

### Motion

- Entrance: `.reveal` (opacity 0 to 1, 6px rise, 600ms) staggered by 60 to 80ms through
  `--reveal-delay`, hero only.
- Hover and focus: 150 to 200ms colour and transform transitions.
- Reduced motion: everything is instant (`globals.css`).

### Accessibility

- Skip link, one `main` landmark, visible focus rings (2px accent, 3px offset).
- Touch targets at least 44px.
- Decorative SVG is `aria-hidden`; informative images have contextual alt text.
- Colour is never the only signal.

## Per site

- **Portfolio:** the home page tells the whole story in one scroll: hero, currently,
  selected work, writing, experience, elsewhere. Deeper pages: work index and case
  studies, about, now, contact, privacy, terms.
- **Blog:** reading first. 68ch measure, serif headings, mono metadata, sticky table of
  contents on wide screens, quiet code blocks with a copy button, comments below the
  post behind moderation.
- **Admin:** a tool, not a showcase. Same tokens, denser layout, sidebar navigation,
  tables with clear states. Never indexed.
