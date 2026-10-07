"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  INTRO_COMMAND,
  completeCommand,
  runCommand,
  type TermContext,
  type TermLine,
  type TermPost,
} from "@/components/portfolio/terminal-commands";
import { TERM_INTRO_KEY } from "@/components/portfolio/terminal-intro";
import { cn } from "@/lib/utils";

interface Entry {
  id: number;
  input: string | null;
  lines: TermLine[];
}

const PROMPT_USER = "visitor";
const PROMPT_HOST = "ashabajasper.dev";


// useLayoutEffect warns during server rendering; this one only runs in the browser.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function Prompt() {
  return (
    <span aria-hidden className="shrink-0 whitespace-pre select-none">
      <span className="text-[color:var(--term-accent)]">{PROMPT_USER}</span>
      <span className="text-[color:var(--term-muted)]">@</span>
      <span className="text-[color:var(--term-info)]">{PROMPT_HOST}</span>
      <span className="text-[color:var(--term-muted)]">:~$ </span>
    </span>
  );
}

const TONE: Record<string, string> = {
  accent: "text-[color:var(--term-accent)]",
  muted: "text-[color:var(--term-muted)]",
  info: "text-[color:var(--term-info)]",
  error: "text-[color:var(--term-error)]",
  strong: "font-semibold text-white",
};

function Line({ line }: { line: TermLine }) {
  if (line.length === 0) return <div aria-hidden className="h-[1.6em]" />;
  return (
    <div className="break-words whitespace-pre-wrap">
      {line.map((part, i) => {
        const cls = TONE[part.tone ?? ""] ?? "";
        if (!part.href) return <span key={i} className={cls}>{part.text}</span>;
        const linkCls = cn(cls, "underline decoration-current/35 underline-offset-[3px] hover:decoration-current");
        const external = /^https?:/.test(part.href) || part.href.startsWith("mailto:");
        return external ? (
          <a key={i} href={part.href} className={linkCls} {...(part.href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener" })}>
            {part.text.trimEnd()}
            {part.text.length > part.text.trimEnd().length ? part.text.slice(part.text.trimEnd().length) : null}
          </a>
        ) : (
          <Link key={i} href={part.href} className={linkCls}>
            {part.text.trimEnd()}
            {part.text.length > part.text.trimEnd().length ? part.text.slice(part.text.trimEnd().length) : null}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * A working terminal on the home page. The intro (whoami) is rendered on
 * the server, so search engines and no-JS visitors get the same text. With
 * JavaScript, the intro is typed in on the first view of a session, unless
 * the visitor prefers reduced motion. All output comes from src/data.
 */
export function Terminal({ posts, blogHref }: { posts: readonly TermPost[]; blogHref: string }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const ctxBase: Omit<TermContext, "history"> = { posts, blogHref };
  const intro: Entry = { id: 0, input: INTRO_COMMAND, lines: runCommand(INTRO_COMMAND, ctxBase).lines };
  const hint: Entry = {
    id: 1,
    input: null,
    lines: [[{ text: "Type ", tone: "muted" }, { text: "help", tone: "accent" }, { text: " to see what this can do.", tone: "muted" }]],
  };

  const [entries, setEntries] = useState<Entry[]>([intro, hint]);
  const [value, setValue] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const nextId = useRef(2);
  const screenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // First view: clear the server-rendered intro before paint, then type it in.
  useBrowserLayoutEffect(() => {
    const root = document.documentElement;
    if (root.dataset.termIntro !== "play") {
      setLive(true);
      return;
    }
    try {
      sessionStorage.setItem(TERM_INTRO_KEY, "1");
    } catch {
      // Storage blocked: the intro may play again next time, which is harmless.
    }
    setEntries([]);
    setTyping("");
    setLive(true);
    const timers: number[] = [];
    let at = 0;
    const step = () => {
      at += 1;
      setTyping(INTRO_COMMAND.slice(0, at));
      if (at < INTRO_COMMAND.length) timers.push(window.setTimeout(step, 70 + Math.random() * 60));
      else
        timers.push(
          window.setTimeout(() => {
            setTyping(null);
            setEntries([intro, hint]);
            delete root.dataset.termIntro;
          }, 280),
        );
    };
    timers.push(window.setTimeout(step, 450));
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      delete root.dataset.termIntro;
    };
    // Mount only: the intro plays at most once.
  }, []);

  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, typing]);

  // The "/" shortcut and the command palette focus the prompt.
  useEffect(() => {
    const focus = () => {
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    };
    window.addEventListener("ajd:focus-terminal", focus);
    return () => window.removeEventListener("ajd:focus-terminal", focus);
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const input = value;
    setValue("");
    setCursor(null);
    if (!input.trim()) {
      setEntries((list) => [...list, { id: nextId.current++, input: "", lines: [] }]);
      return;
    }
    const nextHistory = [...history, input.trim()].slice(-50);
    setHistory(nextHistory);
    const result = runCommand(input, { ...ctxBase, history: nextHistory });
    if (result.effect?.type === "clear") {
      setEntries([]);
      return;
    }
    setEntries((list) => [...list, { id: nextId.current++, input, lines: result.lines }].slice(-40));
    const effect = result.effect;
    if (effect?.type === "theme") {
      setTheme(effect.value === "toggle" ? (resolvedTheme === "dark" ? "light" : "dark") : effect.value);
    } else if (effect?.type === "navigate") {
      if (/^https?:/.test(effect.href)) window.location.assign(effect.href);
      else window.setTimeout(() => router.push(effect.href), 250);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Tab") {
      const completed = completeCommand(value);
      if (completed !== null) {
        event.preventDefault();
        setValue(completed);
      } else if (value.trim()) {
        event.preventDefault();
      }
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      if (history.length === 0) return;
      event.preventDefault();
      const up = event.key === "ArrowUp";
      const next = cursor === null ? (up ? history.length - 1 : null) : up ? Math.max(0, cursor - 1) : cursor + 1;
      if (next === null || next >= history.length) {
        setCursor(null);
        setValue("");
      } else {
        setCursor(next);
        setValue(history[next]);
      }
      return;
    }
    if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      setEntries([]);
    }
  }

  return (
    <div className="terminal relative overflow-hidden rounded-[var(--radius-xl)] focus-within:ring-2 focus-within:ring-[color:var(--term-accent)]/45 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.55)]">
      <div className="flex items-center gap-3 border-b border-[color:var(--term-rule)] bg-[color:var(--term-bar)] px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]/85" />
          <span className="size-2.5 rounded-full bg-[#febc2e]/85" />
          <span className="size-2.5 rounded-full bg-[#28c840]/85" />
        </span>
        <p className="min-w-0 flex-1 truncate text-center font-mono text-[0.72rem] text-[color:var(--term-muted)]">
          {PROMPT_USER}@{PROMPT_HOST}: ~
        </p>
        <span aria-hidden className="hidden font-mono text-[0.68rem] text-[color:var(--term-muted)] sm:inline">zsh</span>
      </div>

      <div
        ref={screenRef}
        data-live={live ? "" : undefined}
        className="term-screen h-[20rem] overflow-y-auto overscroll-contain px-4 py-4 font-mono text-[0.78rem] leading-[1.6] sm:h-[26.5rem] sm:px-5 sm:text-[0.82rem] [scrollbar-color:#2b2f35_transparent] [scrollbar-width:thin]"
        onMouseUp={() => {
          if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true });
        }}
      >
        <div role="log" aria-live="polite" aria-busy={typing !== null} aria-label="Terminal output">
          {entries.map((entry) => (
            <div key={entry.id} className="mb-2.5 last:mb-0">
              {entry.input !== null ? (
                <div className="flex flex-wrap">
                  <Prompt />
                  <span className="text-white">{entry.input}</span>
                </div>
              ) : null}
              {entry.lines.map((line, i) => (
                <Line key={i} line={line} />
              ))}
            </div>
          ))}
        </div>

        {typing !== null ? (
          <div aria-hidden className="flex flex-wrap">
            <Prompt />
            <span className="text-white">{typing}</span>
            <span className="term-caret ml-px" />
          </div>
        ) : (
          <form onSubmit={submit} className="flex items-center">
            <Prompt />
            <label htmlFor="terminal-input" className="sr-only">
              Terminal command. Type help for the list of commands.
            </label>
            <input
              ref={inputRef}
              id="terminal-input"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setCursor(null);
              }}
              onKeyDown={onKeyDown}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-white caret-[color:var(--term-accent)] outline-none placeholder:text-[color:var(--term-muted)]/70 sm:text-[length:inherit] focus-visible:outline-none"
              placeholder="help"
            />
          </form>
        )}
      </div>
    </div>
  );
}
