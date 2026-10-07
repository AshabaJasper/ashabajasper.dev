import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { smtpEnv, telegramEnv } from "@/lib/env";
import { getUsableDevice, listDevices } from "@/lib/auth/devices";
import { readDeviceToken } from "@/lib/auth/device-cookie";
import { formatDateTime } from "@/lib/contact/format";
import { PageHeader } from "@/components/admin/page-header";
import { PasswordForm } from "@/components/admin/settings/password-form";
import { PinSettings } from "@/components/admin/settings/pin-settings";
import { DeviceList, SignOutOthers } from "@/components/admin/settings/devices";

export const metadata: Metadata = {
  title: "Settings",
  description: "Password, sign-in PIN, trusted devices and notification status for the admin.",
};

export const dynamic = "force-dynamic";

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-rule grid gap-6 border-t py-10 first:border-t-0 first:pt-0 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
      <div>
        <h2 id={id} className="font-serif text-[1.6rem] leading-tight">
          {title}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function ConfiguredRow({ label, configured, detail }: { label: string; configured: boolean; detail: string }) {
  return (
    <li className="flex flex-col items-start justify-between gap-2 py-3.5 sm:flex-row sm:gap-4">
      <div className="min-w-0 break-words">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground mt-0.5 text-sm">{detail}</p>
      </div>
      <span
        className={
          configured
            ? "bg-accent text-accent-foreground shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[0.68rem] tracking-[0.08em] uppercase"
            : "border-rule text-muted-foreground shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[0.68rem] tracking-[0.08em] uppercase"
        }
      >
        {configured ? "Configured" : "Not configured"}
      </span>
    </li>
  );
}

export default async function SettingsPage() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [user, devices, current] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, pinSetAt: true } }),
    listDevices(userId),
    readDeviceToken().then(getUsableDevice),
  ]);
  if (!user) redirect("/login");

  const smtpOn = smtpEnv() !== null;
  const telegramOn = telegramEnv() !== null;
  const currentId = current?.userId === userId ? current.id : null;

  return (
    <>
      <PageHeader
        kicker="Account"
        title="Settings"
        description={`Signed in as ${user.name}, ${user.email}.`}
      />

      <Section id="password-heading" title="Password" description="At least 12 characters. Changing it ends existing sessions and stops other devices from using the PIN.">
        <PasswordForm />
      </Section>

      <Section
        id="pin-heading"
        title="Sign-in PIN"
        description="A quick way back in on a device that already signed in with the password. Five wrong PINs and that device needs the password again."
      >
        <PinSettings pinSetOn={user.pinSetAt ? formatDateTime(user.pinSetAt) : null} />
      </Section>

      <Section id="devices-heading" title="Trusted devices" description="Browsers that may show the PIN screen. Stop trusting any you do not recognise.">
        <DeviceList
          devices={devices.map((d) => ({
            id: d.id,
            label: d.label,
            lastUsed: d.lastUsedAt ? formatDateTime(d.lastUsedAt) : "never",
            isCurrent: d.id === currentId,
          }))}
          hasPin={user.pinSetAt !== null}
        />
        <div className="border-rule mt-8 border-t pt-6">
          <SignOutOthers otherCount={devices.filter((d) => d.id !== currentId).length} />
        </div>
      </Section>

      <Section
        id="notify-heading"
        title="Notifications"
        description="How you hear about new messages and comments. Set in the server environment, never here."
      >
        <ul className="border-rule divide-rule divide-y rounded-xl border px-4 sm:px-5">
          <ConfiguredRow
            label="Email (SMTP)"
            configured={smtpOn}
            detail={
              smtpOn
                ? "New messages and comments are emailed to you, and replies can be sent from the inbox."
                : "Replies open in your own mail app instead. Set SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_TO to enable."
            }
          />
          <ConfiguredRow
            label="Telegram"
            configured={telegramOn}
            detail={
              telegramOn
                ? "A short alert with a link to the admin. Message text is never sent."
                : "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to get a short alert for each new message or comment."
            }
          />
        </ul>
      </Section>
    </>
  );
}
