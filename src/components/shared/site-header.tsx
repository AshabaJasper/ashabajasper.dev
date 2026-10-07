"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Monogram } from "@/components/shared/monogram";
import { publicPath, type NavItem } from "@/lib/links";
import type { Site } from "@/lib/sites";
import { cn } from "@/lib/utils";

function isActive(item: NavItem, current: Site, path: string): boolean {
  if (item.site !== current) return false;
  if (item.site === "blog") return true;
  return path === item.path || path.startsWith(`${item.path}/`);
}

export function SiteHeader({ site, homeHref, navItems }: {
  site: Exclude<Site, "admin">;
  homeHref: string;
  navItems: readonly (NavItem & { href: string })[];
}) {
  const path = publicPath(usePathname() ?? "/");
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 border-rule/70 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href={homeHref}
            className="group flex min-w-0 items-center gap-2.5 rounded-full"
            aria-label="Ashaba Jasper, home"
          >
            <Monogram className="size-8 shrink-0" />
            <span className="font-serif text-[1.35rem] leading-none tracking-[-0.01em] whitespace-nowrap">
              Ashaba Jasper
            </span>
          </Link>
          {site === "blog" ? (
            <>
              <span aria-hidden className="text-muted-foreground/60 hidden font-serif text-[1.35rem] leading-none min-[420px]:inline">
                /
              </span>
              <Link href="/" className="text-muted-foreground hover:text-foreground hidden font-serif text-[1.35rem] leading-none italic min-[420px]:inline">
                Writing
              </Link>
            </>
          ) : null}
        </div>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = isActive(item, site, path);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[0.92rem] transition-colors",
                  active ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <ThemeToggle className="ml-1" />
        </nav>

        <div className="flex items-center gap-1 md:hidden">
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
                <SheetTitle className="font-serif text-2xl font-normal">Menu</SheetTitle>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col px-4 pb-6">
                {navItems.map((item) => {
                  const active = isActive(item, site, path);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "border-rule flex min-h-12 items-center border-b font-serif text-[1.75rem] leading-none",
                        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
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
