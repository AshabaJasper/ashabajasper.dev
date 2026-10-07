"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Copy,
  CornerDownLeft,
  FileText,
  Code,
  Keyboard,
  Link2,
  Mail,
  MoonStar,
  Search,
  SquareTerminal,
  User,
} from "lucide-react";
import { profile } from "@/data/profile";
import { allWork, sectorYear } from "@/data/work";
import { cn } from "@/lib/utils";

export interface PalettePost {
  slug: string;
  title: string;
}

type IconKey = "page" | "work" | "post" | "mail" | "copy" | "github" | "linkedin" | "theme" | "keys" | "terminal" | "cv" | "about";

const ICONS = {
  page: ArrowRight,
  work: Briefcase,
  post: BookOpen,
  mail: Mail,
  copy: Copy,
  github: Code,
  linkedin: Link2,
  theme: MoonStar,
  keys: Keyboard,
  terminal: SquareTerminal,
  cv: FileText,
  about: User,
} as const;

interface Item {
  id: string;
  group: "Pages" | "Case studies" | "Projects" | "Writing" | "Actions";
  label: string;
  hint?: string;
  keywords?: string;
  icon: IconKey;
  run: () => void;
}

export const OPEN_PALETTE_EVENT = "ajd:palette";
export const OPEN_SHORTCUTS_EVENT = "ajd:shortcuts";
export const FOCUS_TERMINAL_EVENT = "ajd:focus-terminal";

/** True on Apple platforms, where the shortcut is Cmd K. */
export function useIsMac(): boolean {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    setMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent));
  }, []);
  return mac;
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
}

/** Match every word of the query; prefer labels that start with it. */
function score(item: Item, query: string): number {
  if (!query) return 1;
  const hay = `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""} ${item.group}`.toLowerCase();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.every((w) => hay.includes(w))) return 0;
  const label = item.label.toLowerCase();
  return (label.startsWith(words[0]) ? 4 : 0) + (label.includes(query.toLowerCase()) ? 2 : 0) + 1;
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["Ctrl", "K"], label: "Open the command palette" },
  { keys: ["?"], label: "Show these shortcuts" },
  { keys: ["/"], label: "Focus the terminal on the home page, or search" },
  { keys: ["g", "h"], label: "Go home" },
  { keys: ["g", "w"], label: "Go to work" },
  { keys: ["g", "c"], label: "Go to the CV" },
  { keys: ["g", "a"], label: "Go to about" },
  { keys: ["g", "n"], label: "Go to now" },
  { keys: ["g", "b"], label: "Go to the writing" },
  { keys: ["g", "m"], label: "Go to contact" },
  { keys: ["t"], label: "Switch light and dark" },
];

/**
 * The command palette (Ctrl K or Cmd K), the keyboard shortcuts and the "?"
 * help dialog, shared by the portfolio and the blog. Same-host links use the
 * router; links to the other host are absolute URLs built on the server.
 */
export function CommandCenter({
  posts,
  portfolioPrefix,
  blogPrefix,
}: {
  posts: readonly PalettePost[];
  /** "" on the portfolio, the portfolio origin on the blog. */
  portfolioPrefix: string;
  /** "" on the blog, the blog origin on the portfolio. */
  blogPrefix: string;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const mac = useIsMac();
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  const go = (prefix: string, path: string) => {
    const href = `${prefix}${path}`;
    if (/^https?:/.test(href)) window.location.assign(href);
    else router.push(href);
  };
  const toPortfolio = (path: string) => go(portfolioPrefix, path);
  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  const items = useMemo<Item[]>(() => {
    const work = allWork();
    const pages: Item[] = [
      { id: "home", group: "Pages", label: "Home", icon: "page", keywords: "index start terminal", run: () => toPortfolio("/") },
      { id: "work", group: "Pages", label: "Work", hint: `${work.length} projects`, icon: "work", keywords: "projects portfolio map", run: () => toPortfolio("/work") },
      { id: "cv", group: "Pages", label: "CV", hint: "Experience, skills, awards", icon: "cv", keywords: "resume experience skills timeline", run: () => toPortfolio("/cv") },
      { id: "about", group: "Pages", label: "About", icon: "about", keywords: "bio", run: () => toPortfolio("/about") },
      { id: "now", group: "Pages", label: "Now", icon: "page", keywords: "current focus", run: () => toPortfolio("/now") },
      { id: "writing", group: "Pages", label: "Writing", hint: "The blog", icon: "post", keywords: "blog posts articles", run: () => go(blogPrefix, "/") },
      { id: "contact", group: "Pages", label: "Contact", icon: "mail", keywords: "form message hire", run: () => toPortfolio("/contact") },
      { id: "privacy", group: "Pages", label: "Privacy", icon: "page", run: () => toPortfolio("/privacy") },
      { id: "terms", group: "Pages", label: "Terms", icon: "page", run: () => toPortfolio("/terms") },
    ];
    const cases: Item[] = work
      .filter((w) => w.featured)
      .map((w) => ({
        id: `case-${w.slug}`,
        group: "Case studies" as const,
        label: w.name,
        hint: sectorYear(w),
        icon: "work" as const,
        keywords: `${w.slug} ${w.stack.join(" ")}`,
        run: () => toPortfolio(`/work/${w.slug}`),
      }));
    const projects: Item[] = work
      .filter((w) => !w.featured)
      .map((w) => ({
        id: `work-${w.slug}`,
        group: "Projects" as const,
        label: w.name,
        hint: sectorYear(w),
        icon: "work" as const,
        keywords: `${w.slug} ${w.kind} ${w.stack.join(" ")}`,
        run: () => toPortfolio(`/work#${w.slug}`),
      }));
    const writing: Item[] = posts.map((p) => ({
      id: `post-${p.slug}`,
      group: "Writing" as const,
      label: p.title,
      icon: "post" as const,
      run: () => go(blogPrefix, `/${p.slug}`),
    }));
    const actions: Item[] = [
      { id: "email", group: "Actions", label: "Email Ashaba", hint: profile.email, icon: "mail", keywords: "mail contact", run: () => window.location.assign(`mailto:${profile.email}`) },
      {
        id: "copy",
        group: "Actions",
        label: "Copy email address",
        icon: "copy",
        keywords: "clipboard",
        run: () => {
          void navigator.clipboard?.writeText(profile.email).then(() => setCopied(true));
        },
      },
      { id: "github", group: "Actions", label: "GitHub", hint: "AshabaJasper", icon: "github", keywords: "code source", run: () => window.open(profile.links.github, "_blank", "noopener") },
      { id: "linkedin", group: "Actions", label: "LinkedIn", icon: "linkedin", run: () => window.open(profile.links.linkedin, "_blank", "noopener") },
      { id: "theme", group: "Actions", label: "Switch theme", hint: "Light or dark", icon: "theme", keywords: "dark light mode", run: toggleTheme },
      { id: "terminal", group: "Actions", label: "Open the terminal", icon: "terminal", keywords: "shell console command", run: () => focusTerminal() },
      { id: "keys", group: "Actions", label: "Keyboard shortcuts", icon: "keys", keywords: "help keys", run: () => setHelp(true) },
    ];
    return [...pages, ...cases, ...actions, ...writing, ...projects];
    // The callbacks close over stable setters and props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, portfolioPrefix, blogPrefix, resolvedTheme]);

  function focusTerminal() {
    if (document.getElementById("terminal-input")) window.dispatchEvent(new Event(FOCUS_TERMINAL_EVENT));
    else toPortfolio("/#terminal");
  }

  const results = useMemo(() => {
    const scored = items.map((item) => ({ item, s: score(item, query.trim()) })).filter((r) => r.s > 0);
    // Without a query, keep the curated order and leave the long project list out.
    if (!query.trim()) return scored.filter((r) => r.item.group !== "Projects").map((r) => r.item);
    return scored.sort((a, b) => b.s - a.s).slice(0, 30).map((r) => r.item);
  }, [items, query]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    if (!open) {
      setQuery("");
      setCopied(false);
    }
  }, [open]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // Global keys.
  useEffect(() => {
    let pendingG = false;
    let gTimer = 0;
    const routes: Record<string, () => void> = {
      h: () => toPortfolio("/"),
      w: () => toPortfolio("/work"),
      c: () => toPortfolio("/cv"),
      a: () => toPortfolio("/about"),
      n: () => toPortfolio("/now"),
      b: () => go(blogPrefix, "/"),
      m: () => toPortfolio("/contact"),
    };
    const onKey = (event: KeyboardEvent) => {
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setHelp(false);
        setOpen((o) => !o);
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target) || event.defaultPrevented) return;
      if (document.querySelector("[role=dialog]")) return;
      if (pendingG) {
        pendingG = false;
        window.clearTimeout(gTimer);
        const route = routes[event.key.toLowerCase()];
        if (route) {
          event.preventDefault();
          route();
        }
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        setHelp(true);
      } else if (event.key === "/") {
        event.preventDefault();
        if (document.getElementById("terminal-input")) window.dispatchEvent(new Event(FOCUS_TERMINAL_EVENT));
        else setOpen(true);
      } else if (event.key === "g") {
        pendingG = true;
        gTimer = window.setTimeout(() => (pendingG = false), 1200);
      } else if (event.key === "t") {
        toggleTheme();
      }
    };
    const openPalette = () => setOpen(true);
    const openHelp = () => setHelp(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, openPalette);
    window.addEventListener(OPEN_SHORTCUTS_EVENT, openHelp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, openPalette);
      window.removeEventListener(OPEN_SHORTCUTS_EVENT, openHelp);
      window.clearTimeout(gTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme, portfolioPrefix, blogPrefix]);

  function choose(item: Item | undefined) {
    if (!item) return;
    if (item.id !== "copy") setOpen(false);
    item.run();
  }

  function onInputKey(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
    } else if (event.key === "Home") {
      setActive(0);
    } else if (event.key === "End") {
      setActive(Math.max(0, results.length - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[active]);
    }
  }

  const mod = mac ? "⌘" : "Ctrl";
  let lastGroup = "";

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px]" />
          <DialogPrimitive.Content
            aria-describedby="palette-help"
            className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 border-rule bg-popover text-popover-foreground fixed top-[12vh] left-1/2 z-50 flex max-h-[min(34rem,76vh)] w-[min(40rem,calc(100vw-24px))] -translate-x-1/2 flex-col overflow-hidden rounded-[var(--radius-xl)] border shadow-[0_40px_120px_-30px_rgb(0_0_0/0.6)]"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              document.getElementById("palette-input")?.focus();
            }}
          >
            <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
            <p id="palette-help" className="sr-only">
              Type to search pages, projects and actions. Use the arrow keys to choose and Enter to open.
            </p>
            <div className="border-rule flex items-center gap-3 border-b px-4">
              <Search aria-hidden className="text-muted-foreground size-[18px] shrink-0" strokeWidth={1.75} />
              <input
                id="palette-input"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
                aria-autocomplete="list"
                aria-label="Search pages, projects and actions"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search pages, projects, posts, actions"
                autoComplete="off"
                spellCheck={false}
                className="placeholder:text-muted-foreground min-h-14 min-w-0 flex-1 bg-transparent text-[16px] outline-none focus-visible:outline-none"
              />
              <kbd className="kbd hidden sm:inline-flex">Esc</kbd>
            </div>
            <ul id="palette-list" ref={listRef} role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {results.length === 0 ? (
                <li className="text-muted-foreground px-3 py-10 text-center text-sm">
                  Nothing matches &ldquo;{query}&rdquo;. Try a project, a technology or a page.
                </li>
              ) : null}
              {results.map((item, index) => {
                const Icon = ICONS[item.icon];
                const header = item.group !== lastGroup ? item.group : null;
                lastGroup = item.group;
                return (
                  <li key={item.id} role="presentation">
                    {header ? (
                      <p role="presentation" className="kicker px-3 pt-3 pb-1.5">
                        {header}
                      </p>
                    ) : null}
                    <div
                      id={`palette-${item.id}`}
                      role="option"
                      aria-selected={index === active}
                      data-index={index}
                      onMouseMove={() => setActive(index)}
                      onClick={() => choose(item)}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 text-[0.92rem]",
                        index === active ? "bg-accent text-accent-foreground" : "text-foreground",
                      )}
                    >
                      <Icon aria-hidden className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
                      <span className="min-w-0 flex-1 truncate">{item.id === "copy" && copied ? "Copied to the clipboard" : item.label}</span>
                      {item.hint ? <span className="text-muted-foreground hidden truncate font-mono text-[0.72rem] sm:inline">{item.hint}</span> : null}
                      {index === active ? <CornerDownLeft aria-hidden className="size-3.5 shrink-0 opacity-60" strokeWidth={1.75} /> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="border-rule text-muted-foreground flex items-center justify-between gap-3 border-t px-4 py-2.5 font-mono text-[0.7rem]">
              <span className="flex items-center gap-1.5">
                <kbd className="kbd">&uarr;</kbd>
                <kbd className="kbd">&darr;</kbd> to move <kbd className="kbd ml-2">Enter</kbd> to open
              </span>
              <button type="button" className="hover:text-foreground min-h-8" onClick={() => setHelp(true)}>
                ? shortcuts
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <DialogPrimitive.Root open={help} onOpenChange={setHelp}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px]" />
          <DialogPrimitive.Content className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] border-rule bg-popover text-popover-foreground fixed top-1/2 left-1/2 z-50 max-h-[85vh] w-[min(28rem,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[var(--radius-xl)] border p-6 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.6)]">
            <DialogPrimitive.Title className="font-display text-[1.4rem]">Keyboard shortcuts</DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-muted-foreground mt-1 text-sm">
              They work anywhere except while you are typing in a field.
            </DialogPrimitive.Description>
            <dl className="mt-5 space-y-1">
              {SHORTCUTS.map((s) => (
                <div key={s.label} className="border-rule flex items-center justify-between gap-4 border-b py-2.5 last:border-b-0">
                  <dt className="text-ink-soft text-[0.92rem]">{s.label}</dt>
                  <dd className="flex shrink-0 items-center gap-1">
                    {s.keys.map((k, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && s.keys[0] === "g" ? <span className="text-muted-foreground text-xs">then</span> : null}
                        <kbd className="kbd">{k === "Ctrl" ? mod : k}</kbd>
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
            <DialogPrimitive.Close className="bg-foreground text-background mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full text-sm font-medium">
              Close
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
