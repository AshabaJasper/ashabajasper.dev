# Design: ashabajasper.dev

Approved direction, 7 October 2026: **a developer's workbench.** The owner asked for a
portfolio that shows, not tells, that he is an engineer and a data scientist. The site
is something to use: a real terminal, a command palette, keyboard shortcuts and a live,
honest chart of every project. Dark first, grotesk and mono, one signal accent. It
replaces the earlier "editorial and quiet" direction.

## Principles

1. **Evidence over decoration.** Real screenshots, real project names, real stack lists,
   real dates. Every number on the site is counted from `src/data` or quoted from the
   owner's CV and attributed as his. No skill bars or percentage meters, no logo walls,
   no invented metrics, testimonials or availability badges.
2. **Interactive, not animated for its own sake.** The terminal, the palette, the work
   map and the CV timeline do real work. Motion explains state (a card becoming its case
   study, marks regrouping, a timeline filling) or responds to the visitor (the cursor
   grid, magnetic buttons).
3. **One accent.** Signal green is for links, focus, prompts and the live dot. The rest
   is ink on a near-black or paper canvas. The data-viz slots are the only other hues.
4. **Type does the work.** Geist set heavy and tight for display, Geist for reading,
   Geist Mono for metadata, prompts and anything a machine would print.
5. **Fast and honest.** Static pages, small client islands, no layout shift, code-split
   effects, no third-party requests except the self-hosted analytics script. Missing
   data is shown as missing ("Year not listed", "Start not listed"), never guessed.
6. **Everyone gets the content.** The terminal intro, the work map table and every CV
   entry are in the server HTML. Without JavaScript or with reduced motion, nothing is
   hidden and nothing moves.

## Foundations

Runtime source of truth: `src/app/globals.css`.

| Role | Light | Dark |
| --- | --- | --- |
| Canvas (`background`) | `#F7F7F4` | `#0A0B0D` |
| Surface (`card`) | `#FFFFFF` | `#111317` |
| Ink (`foreground`) | `#0D0E10` | `#ECECEE` |
| Soft ink (`ink-soft`) | `#33373D` | `#C5C9D0` |
| Muted text | `#5C626B` | `#959BA5` |
| Accent (`primary`, `link`) | `#047857` | `#3DDC97` |
| Accent tint (`accent`) | `#DCF3E9` | `#0F2A1F` |
| Rule (`rule`, `border`) | `#E2E2DD` | `#1F2226` |

Text pairs meet WCAG AA: muted on canvas is about 5.7:1 light and 7:1 dark, the accent is
5.1:1 on the light canvas and 11:1 on the dark one; the accent
is used for text only at sizes and weights where it passes.

The **terminal** keeps its own dark palette in both themes (`.terminal` in globals.css):
background `#0B0C0E`, text `#D9DCE1`, muted `#8B929C`, prompt `#3DDC97`, info `#79C0FF`,
error `#FF8B80`.

### Data-viz slots

Validated with the dataviz skill's palette checker (all pairs, CVD and normal vision).
Websites, the majority, are a neutral, so the three hues stay distinguishable.

| Slot | Light | Dark | Shape |
| --- | --- | --- | --- |
| Systems / work | `#1BAF7A` | `#199E70` | square |
| E-commerce / community | `#EB6834` | `#D95926` | diamond |
| Mobile / education | `#2A78D6` | `#3987E5` | triangle |
| Websites | `#9A9EA6` | `#61676F` | circle |

Light aqua is under 3:1 on white, so every chart repeats the kind as a shape, has a
legend and direct labels, and ships a table view.

### Type

| Use | Family | Size | Notes |
| --- | --- | --- | --- |
| Hero name | Geist 600 | 58 to 138px, fluid | `tracking-[-0.055em]`, `leading-[0.86]`, two rising lines |
| Page title | Geist 600 (`.font-display`) | 42 to 88px | |
| Section heading | Geist 600 | 32 to 54px | decodes once from glyphs (`Scramble`) |
| Card title | Geist 600 | 26 to 46px | |
| Body | Geist | 16 to 18px | measure 60 to 70ch |
| Kicker, meta, chips, prompts | Geist Mono | 11 to 14px | `.kicker`, `.kicker-prompt` adds `// ` |

### Space and layout

- Container `.container-page`: 1200px max, gutters 16, 24 and 32px.
- Sections: 80 to 112px apart, numbered kickers (`01`, `02`) with a short rule.
- Corners: 14px base radius (`--radius`), 18px on terminal, cards and charts, full pill
  on buttons and filter chips, 8px on skill chips.
- Screenshots sit in a padded card frame so the radius never clips the image.
- Backgrounds: the CSS dot grid (`.dot-grid`) and one soft accent glow in page headers.

### Components

- **Header:** sticky, blurred canvas, the `aj` key-cap monogram with a cursor bar, nav
  (Work, CV, Writing, About, Contact), a "Jump to Ctrl K" button and the theme toggle.
  Phones: search, theme and a sheet menu with numbered links.
- **Terminal** (`components/portfolio/terminal.tsx`): working shell on the home page.
  Commands in `terminal-commands.ts` (pure and tested): help, whoami, projects, project,
  open, experience, skills, cv, stack, blog, contact, theme, clear, plus ls, cd, pwd,
  history, echo, sudo, rm and exit. Tab completion, history on the arrow keys, Ctrl L.
- **Command palette** (`components/shared/command-center.tsx`): Ctrl K or Cmd K on both
  hosts. Pages, case studies, every project, posts and actions (email, copy email,
  GitHub, LinkedIn, theme, terminal, shortcuts). ARIA combobox and listbox.
- **Shortcuts:** `?` help dialog, `/` terminal or search, `g` then h, w, c, a, n, b or m
  to navigate, `t` for theme. Ignored while typing.
- **Work card:** framed screenshot, index, sector and year, title, case study headline,
  stack chips. Rises in on scroll. Shares `view-transition-name`s with its case study.
- **Work map** (`work-map.tsx`, `work-map-data.ts`): one mark per project, grouped by
  kind, sector or year, with a technology highlight. Hover or focus shows a card; arrow
  keys move, Enter opens. Headline counts above, the full table below.
- **CV** (`/cv`): section index with scroll spy, a career Gantt chart of real months, an
  experience rail that draws as it scrolls, skill chips that pop in, notable projects,
  awards, certifications, community. Print stylesheet for A4.
- **Buttons:** primary is an ink pill that turns accent on hover; secondary is an
  outlined pill. Hero buttons are magnetic on fine pointers.
- **Footer:** a large closing question with the email in mono, link columns, "Designed
  and built by Ashaba Jasper", View source, the shortcuts button and legal links.

### Motion

| Effect | Where | How |
| --- | --- | --- |
| Rising hero name, staggered reveals | home and page headers | CSS keyframes |
| Typed terminal intro | home, first view per session | inline flag script plus React |
| Scroll reveals, kinetic band drift, CV rail and chip pops | home, CV | CSS scroll-driven animations (`animation-timeline: view()`), progressive |
| Card to case study morph, page cross-fade | all same-host links | View Transitions API (`view-transitions.tsx`), plain navigation as fallback |
| Generative cursor grid | page headers | 2D canvas, lazy chunk, paused off screen and in hidden tabs |
| Marks regrouping | work map | CSS transforms on SVG |
| Gantt bars growing | CV | CSS transform once in view |
| Magnetic buttons, heading scramble | heroes, section titles | small client components |

Under `prefers-reduced-motion: reduce` the intro does not play, the canvas never loads,
scroll animations are not attached, view transitions are skipped and every transition
or animation is instant (`globals.css`). Touch devices skip the magnetic effect.

### Accessibility

- Skip link, one `main`, visible 2px focus rings in the accent.
- Touch targets at least 44px; chart marks have 24px or larger hit areas.
- Charts: `role="group"` with a description, a label on every mark, a legend, shapes as
  well as colour, and a table alternative.
- The terminal output is a polite live region; the typing intro is `aria-busy`.
- Decorative canvas, glow and kinetic text are `aria-hidden`.

## Per site

- **Portfolio:** home is hero with terminal, selected work, the kinetic band, the work
  map, an experience highlight and the latest writing. Deeper pages: work (map and full
  list), case studies, CV, about, now, contact, privacy, terms.
- **Blog:** reading first. Same header, footer, palette and transitions; 68ch measure,
  grotesk headings, mono metadata, sticky contents on wide screens, quiet code blocks.
- **Admin:** a tool, not a showcase. Same tokens, denser layout, never indexed.
