"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Monogram } from "@/components/shared/monogram";
import { OPEN_PALETTE_EVENT, useIsMac } from "@/components/shared/command-center";
import { publicPath, type NavItem } from "@/lib/links";
import type { Site } from "@/lib/sites";
import { cn } from "@/lib/utils";

function isActive(item: NavItem, current: Site, path: string): boolean {
  if (item.site !== current) return false;
  if (item.site === "blog") return true;
  return path === item.path || path.startsWith(`${item.path}/`);
}

const openPalette = () => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));

export function SiteHeader({ site, homeHref, navItems }: {
  site: Exclude<Site, "admin">;
  homeHref: string;
  navItems: readonly (NavItem & { href: string })[];
}) {
  const path = publicPath(usePathname() ?? "/");
  const [open, setOpen] = useState(false);
  const mac = useIsMac();

  return (
    <header className="bg-background/75 supports-[backdrop-filter]:bg-background/60 border-rule/80 sticky top-0 z-40 border-b backdrop-blur-xl backdrop-saturate-150">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link href={homeHref} className="group flex min-w-0 items-center gap-2.5 rounded-[10px]" aria-label="Ashaba Jasper, home">
            <Monogram className="size-8 shrink-0 transition-transform duration-300 group-hover:-rotate-6" />
            <span className="font-display text-[1.02rem] leading-none whitespace-nowrap">Ashaba Jasper</span>
          </Link>
          {site === "blog" ? (
            <>
              <span aria-hidden className="text-muted-foreground/60 hidden font-mono text-[0.95rem] min-[420px]:inline">
                /
              </span>
              <Link href="/" className="text-muted-foreground hover:text-foreground hidden font-mono text-[0.85rem] min-[420px]:inline">
                writing
              </Link>
            </>
          ) : null}
        </div>

        <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
          {navItems.map((item) => {
            const active = isActive(item, site, path);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-2 text-[0.88rem] transition-colors",
                  active ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={openPalette}
            aria-label="Open the command palette"
            aria-keyshortcuts={mac ? "Meta+K" : "Control+K"}
            className="border-rule bg-card/60 text-muted-foreground hover:text-foreground hover:border-foreground/25 ml-2 inline-flex h-9 items-center gap-2 rounded-full border pr-1.5 pl-3 text-[0.8rem] transition-colors"
          >
            <Search aria-hidden className="size-3.5" strokeWidth={2} />
            <span className="hidden lg:inline">Jump to</span>
            <kbd className="kbd">{mac ? "⌘" : "Ctrl"} K</kbd>
          </button>
          <ThemeToggle className="ml-0.5" />
        </nav>

        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={openPalette}
            aria-label="Open the command palette"
            className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-11 items-center justify-center rounded-full"
          >
            <Search aria-hidden className="size-[18px]" strokeWidth={1.75} />
          </button>
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="text-foreground hover:bg-muted inline-flex size-11 items-center justify-center rounded-full"
              >
                <Menu aria-hidden className="size-5" strokeWidth={1.75} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(20rem,85vw)]">
              <SheetHeader>
                <SheetTitle className="kicker kicker-prompt font-normal">menu</SheetTitle>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col px-4 pb-6">
                {navItems.map((item, i) => {
                  const active = isActive(item, site, path);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "border-rule flex min-h-14 items-baseline gap-3 border-b font-display text-[1.75rem] leading-none",
                        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span aria-hidden className="text-primary font-mono text-[0.75rem] font-normal tracking-normal">
                        0{i + 1}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
