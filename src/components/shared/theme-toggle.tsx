"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Light and dark follow the system until the visitor picks one. The choice is
 * kept in localStorage by next-themes: a functional preference, not a cookie.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = mounted ? (isDark ? "Switch to light theme" : "Switch to dark theme") : "Switch theme";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-11 items-center justify-center rounded-full transition-colors",
        className,
      )}
    >
      <Sun aria-hidden className="size-[18px] dark:hidden" strokeWidth={1.75} />
      <Moon aria-hidden className="hidden size-[18px] dark:block" strokeWidth={1.75} />
    </button>
  );
}
