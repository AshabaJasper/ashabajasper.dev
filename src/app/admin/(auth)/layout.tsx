import { Monogram } from "@/components/shared/monogram";
import { ThemeToggle } from "@/components/shared/theme-toggle";

/** A quiet, centred frame for sign-in and first-run setup. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Monogram className="size-8" />
          <span className="kicker">Admin</span>
        </div>
        <ThemeToggle />
      </header>
      <main id="main" className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}
