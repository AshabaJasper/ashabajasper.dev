"use client";

import { MonitorSmartphone, X } from "lucide-react";
import { toast } from "sonner";
import { revokeTrustedDevice } from "@/actions/pin";
import { signOutOtherDevices } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { callAction } from "@/components/admin/call-action";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

export interface DeviceRow {
  id: string;
  label: string;
  lastUsed: string;
  isCurrent: boolean;
}

export function DeviceList({ devices, hasPin }: { devices: DeviceRow[]; hasPin: boolean }) {
  if (devices.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {hasPin
          ? "None yet. Sign in with the password and tick “Unlock with my PIN on this device next time”."
          : "None. Devices are only trusted once a PIN is set."}
      </p>
    );
  }
  return (
    <ul className="border-rule divide-rule divide-y rounded-xl border">
      {devices.map((device) => (
        <li key={device.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <span className="flex min-w-0 items-center gap-3">
            <MonitorSmartphone aria-hidden className="text-muted-foreground size-[18px] shrink-0" strokeWidth={1.75} />
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {device.label}
                {device.isCurrent ? (
                  <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 font-mono text-[0.65rem] tracking-[0.08em] uppercase">
                    This device
                  </span>
                ) : null}
              </span>
              <span className="text-muted-foreground block text-xs">Last used {device.lastUsed}</span>
            </span>
          </span>
          <ConfirmDialog
            title="Stop trusting this device?"
            description={`${device.label} will need the password the next time it signs in.`}
            confirmLabel="Stop trusting"
            onConfirm={async () => {
              const result = await callAction(() => revokeTrustedDevice({ deviceId: device.id }));
              if (!result.ok) {
                toast.error(result.error);
                return false;
              }
              toast.success("Device no longer trusted");
              return true;
            }}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Stop trusting ${device.label}`}
                className="text-muted-foreground hover:text-destructive size-11 shrink-0 rounded-full"
              >
                <X aria-hidden className="size-4" />
              </Button>
            }
          />
        </li>
      ))}
    </ul>
  );
}

export function SignOutOthers({ otherCount }: { otherCount: number }) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium">Sign out of other devices</h3>
      <p className="text-muted-foreground max-w-[60ch] text-sm">
        Every other browser stops being trusted and has to use the password to sign in again. A session already open in
        another browser keeps working until it expires: within a day, or 30 days with “remember me”.
      </p>
      <ConfirmDialog
        title="Sign out of other devices?"
        description="Every browser except this one goes back to the password screen for its next sign-in."
        confirmLabel="Sign out others"
        onConfirm={async () => {
          const result = await callAction(() => signOutOtherDevices({}));
          if (!result.ok) {
            toast.error(result.error);
            return false;
          }
          toast.success("Other devices are no longer trusted");
          return true;
        }}
        trigger={
          <Button type="button" variant="outline" className="h-11 rounded-full px-5" disabled={otherCount === 0}>
            Sign out of other devices
          </Button>
        }
      />
    </div>
  );
}
