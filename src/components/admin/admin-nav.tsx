"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowUpRight, Inbox, Loader2, LogOut, Menu, MessageSquareText, ScrollText, Settings, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Monogram } from "@/components/shared/monogram";
import { signOutAction } from "@/actions/auth";
import { publicPath } from "@/lib/links";
import { cn } from "@/lib/utils";

/**
 * Admin navigation: a fixed sidebar from the large breakpoint, a top bar with
 * a sheet menu on phones and tablets. Counts arrive as plain numbers from the
 * server layout; icons stay inside this client file.
 */

export interface AdminNavProps {
  newMessages: number;
  pendingComments: number;
  ownerName: string;
  portfolioUrl: string;
  blogUrl: string;
}

const ITEMS = [
  { href: "/inbox", label: "Inbox", icon: Inbox, count: "newMessages", countLabel: "new" },
  { href: "/comments", label: "Comments", icon: MessageSquareText, count: "pendingComments", countLabel: "pending" },
  { href: "/audit", label: "Audit log", icon: ScrollText, count: null, countLabel: "" },
  { href: "/settings", label: "Settings", icon: Settings, count: null, countLabel: "" },
] as const;

function NavLinks({ props, path, onNavigate }: { props: AdminNavProps; path: string; onNavigate?: () => void }) {
  return (
    <ul className="space-y-0.5">
      {ITEMS.map((item) => {
        const active = path === item.href || path.startsWith(`${item.href}/`);
        const count = item.count ? props[item.count] : 0;
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.94rem] transition-colors",
                active ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <Icon aria-hidden className="size-[18px] shrink-0" strokeWidth={1.75} />
              <span className="flex-1">{item.label}</span>
              {count > 0 ? (
                <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-mono text-[0.72rem] tabular-nums">
                  {count}
                  <span className="sr-only"> {item.countLabel}</span>
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Stays busy from the click until the sign-in page has loaded. */
function SignOutButton({ className }: { className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? (
        <Loader2 aria-hidden className="size-[18px] animate-spin" strokeWidth={1.75} />
      ) : (
        <LogOut aria-hidden className="size-[18px]" strokeWidth={1.75} />
      )}
      {pending ? "Signing out" : "Sign out"}
    </button>
  );
}

function SecondaryLinks({ props }: { props: AdminNavProps }) {
  const linkClass =
    "text-muted-foreground hover:text-foreground hover:bg-muted/60 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-[0.94rem] transition-colors";
  return (
    <ul className="space-y-0.5">
      <li>
        <a href={props.portfolioUrl} className={linkClass}>
          <ArrowUpRight aria-hidden className="size-[18px]" strokeWidth={1.75} />
          View site
        </a>
      </li>
      <li>
        <a href={props.blogUrl} className={linkClass}>
          <ArrowUpRight aria-hidden className="size-[18px]" strokeWidth={1.75} />
          View blog
        </a>
      </li>
      <li>
        <form
          action={async () => {
            try {
              await signOutAction();
            } catch {
              toast.error("Signing out did not go through. Check your connection and try again.");
              return;
            }
            // A full load, so nothing from the signed-in pages stays in the router cache.
            window.location.assign("/login");
          }}
        >
          <SignOutButton className={linkClass} />
        </form>
      </li>
    </ul>
  );
}

function Brand() {
  return (
    <Link href="/inbox" className="flex items-center gap-2.5 rounded-lg" aria-label="Admin home, inbox">
      <Monogram className="size-8 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[1.3rem] tracking-[-0.01em]">Ashaba Jasper</span>
        <span className="kicker mt-1 text-[0.62rem]">Admin</span>
      </span>
    </Link>
  );
}

export function AdminSidebar(props: AdminNavProps) {
  const path = publicPath(usePathname() ?? "/");
  return (
    <aside className="border-rule bg-background sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r px-4 py-6 lg:flex">
      <div className="px-2">
        <Brand />
      </div>
      <nav aria-label="Admin" className="mt-10 flex flex-1 flex-col justify-between gap-8">
        <NavLinks props={props} path={path} />
        <div className="space-y-4">
          <div className="border-rule border-t pt-4">
            <SecondaryLinks props={props} />
          </div>
          <div className="flex items-center justify-between px-3">
            <span className="text-muted-foreground truncate text-xs">Signed in as {props.ownerName}</span>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </aside>
  );
}

export function AdminTopBar(props: AdminNavProps) {
  const path = publicPath(usePathname() ?? "/");
  const [open, setOpen] = useState(false);
  const total = props.newMessages + props.pendingComments;
  return (
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 border-rule sticky top-0 z-40 border-b backdrop-blur-md lg:hidden">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <Brand />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={total > 0 ? `Open menu, ${total} waiting` : "Open menu"}
                className="hover:bg-muted relative inline-flex size-11 items-center justify-center rounded-full"
              >
                <Menu aria-hidden className="size-5" strokeWidth={1.75} />
                {total > 0 ? (
                  <span aria-hidden className="bg-primary absolute top-2.5 right-2.5 size-2 rounded-full" />
                ) : null}
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-[85vw] max-w-xs px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              <SheetClose asChild>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="hover:bg-muted absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-full"
                >
                  <X aria-hidden className="size-5" strokeWidth={1.75} />
                </button>
              </SheetClose>
              <SheetHeader className="p-0 px-2">
                <SheetTitle className="font-serif text-2xl font-normal">Admin</SheetTitle>
                <SheetDescription>Signed in as {props.ownerName}</SheetDescription>
              </SheetHeader>
              <nav aria-label="Admin" className="flex flex-1 flex-col justify-between gap-8">
                <NavLinks props={props} path={path} onNavigate={() => setOpen(false)} />
                <div className="border-rule border-t pt-4">
                  <SecondaryLinks props={props} />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
