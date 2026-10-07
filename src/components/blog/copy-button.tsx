"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyState = "idle" | "copied" | "failed";

/**
 * Copies the text of the code block it sits in. It reads the rendered <pre>
 * (shiki joins lines with newlines, so textContent is the original source)
 * instead of receiving the code as a prop, which keeps the server payload
 * small. The result is announced through a polite live region.
 */
export function CopyButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    const pre = buttonRef.current?.closest("[data-code-block]")?.querySelector("pre");
    const text = pre?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text.replace(/\n$/, ""));
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  const message = state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={copy}
        aria-label="Copy code"
        title="Copy code"
        className="copy-button"
        data-state={state}
      >
        {state === "copied" ? (
          <Check aria-hidden className="size-4" strokeWidth={1.75} />
        ) : (
          <Copy aria-hidden className="size-4" strokeWidth={1.75} />
        )}
        <span aria-hidden className="copy-button-label">
          {state === "copied" ? "Copied" : state === "failed" ? "Failed" : "Copy"}
        </span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {message}
      </span>
    </>
  );
}
