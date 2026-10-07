import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUsableDevice } from "@/lib/auth/devices";
import { readDeviceToken } from "@/lib/auth/device-cookie";
import { LoginForm } from "@/components/admin/auth/login-form";
import { PinForm } from "@/components/admin/auth/pin-form";
import { FormMessage } from "@/components/admin/field";
import { siteOrigin } from "@/lib/sites";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the private admin of ashabajasper.dev.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string; locked?: string }>;
}) {
  const session = await getSession();
  if (session?.user?.id) redirect("/inbox");

  // A browser that signed in with the password before, and still holds a
  // usable device token, is greeted by the PIN screen. Everyone else sees the
  // password form, so a stranger cannot even attempt a PIN.
  const [params, device, owner] = await Promise.all([
    searchParams,
    readDeviceToken().then(getUsableDevice),
    prisma.user.findFirst({ select: { pinHash: true } }),
  ]);

  if (!owner) {
    return (
      <div>
        <p className="kicker">First run</p>
        <h1 className="mt-3 font-serif text-[2.6rem] leading-none tracking-[-0.015em]">No owner yet</h1>
        <p className="text-muted-foreground mt-4 text-[0.95rem]">
          Nobody can sign in until the owner account exists. Create it once with the setup token from the server
          environment.
        </p>
        <Link
          href="/setup"
          className="bg-primary text-primary-foreground mt-8 inline-flex min-h-11 items-center rounded-full px-6 text-sm font-medium"
        >
          Go to setup
        </Link>
      </div>
    );
  }

  const showPin = device !== null && params.password !== "1";
  const firstName = device?.user.name.split(" ")[0] ?? "";

  return (
    <div>
      <p className="kicker">{new URL(siteOrigin("admin")).host}</p>
      <h1 className="mt-3 font-serif text-[2.6rem] leading-none tracking-[-0.015em]">
        {showPin ? (firstName ? `Welcome back, ${firstName}` : "Welcome back") : "Sign in"}
      </h1>
      <p className="text-muted-foreground mt-3 text-[0.95rem]">
        {showPin
          ? "Enter your PIN to unlock the admin on this device."
          : "The inbox, comment moderation and settings for the site."}
      </p>
      <div className="mt-8">
        {params.locked === "1" && !showPin ? (
          <div className="mb-5">
            <FormMessage tone="notice">
              Too many wrong PINs on this device. Sign in with your password to use the PIN here again.
            </FormMessage>
          </div>
        ) : null}
        {showPin ? (
          <PinForm pinLength={device.user.pinLength} />
        ) : (
          <LoginForm offerPin={Boolean(owner.pinHash)} backToPin={device !== null} />
        )}
      </div>
    </div>
  );
}
