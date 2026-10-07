import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { setupToken } from "@/lib/env";
import { SETUP_TOKEN_MIN_LENGTH } from "@/lib/validators/setup";
import { SetupForm } from "@/components/admin/auth/setup-form";
import { FormMessage } from "@/components/admin/field";

export const metadata: Metadata = {
  title: "Setup",
  description: "Create the single owner account for the ashabajasper.dev admin, once.",
};

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const users = await prisma.user.count();
  const token = setupToken();

  if (users > 0) {
    return (
      <div>
        <p className="kicker">First run</p>
        <h1 className="mt-3 font-serif text-[2.6rem] leading-none tracking-[-0.015em]">Setup is complete</h1>
        <p className="text-muted-foreground mt-4 text-[0.95rem]">
          The owner account already exists, so this page does nothing any more.
        </p>
        <Link
          href="/login"
          className="bg-primary text-primary-foreground mt-8 inline-flex min-h-11 items-center rounded-full px-6 text-sm font-medium"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="kicker">First run</p>
      <h1 className="mt-3 font-serif text-[2.6rem] leading-none tracking-[-0.015em]">Create the owner</h1>
      <p className="text-muted-foreground mt-3 text-[0.95rem]">
        This happens once. The setup token is the SETUP_TOKEN value in the server environment.
      </p>
      <div className="mt-8">
        {token.length >= SETUP_TOKEN_MIN_LENGTH ? (
          <SetupForm />
        ) : (
          <FormMessage tone="notice">
            {token
              ? `Setup is switched off because SETUP_TOKEN is shorter than ${SETUP_TOKEN_MIN_LENGTH} characters. Generate a longer one with openssl rand -hex 24, restart, and reload this page.`
              : "Setup is switched off because SETUP_TOKEN is not set on the server. Set it, restart, and reload this page."}
          </FormMessage>
        )}
      </div>
    </div>
  );
}
