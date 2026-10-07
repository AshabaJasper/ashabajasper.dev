"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { removeSignInPin, setSignInPin } from "@/actions/pin";
import { Button } from "@/components/ui/button";
import { callAction } from "@/components/admin/call-action";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { FormMessage, TextField, focusFirstError } from "@/components/admin/field";
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH } from "@/lib/auth/pin";
import type { SetPinInput } from "@/lib/validators/pin";

const EMPTY: SetPinInput = { currentPassword: "", pin: "", confirmPin: "" };

export function PinSettings({ pinSetOn }: { pinSetOn: string | null }) {
  const [values, setValues] = useState<SetPinInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const idFor = (field: string) => `pin-${field}`;
  const digits = (value: string) => value.replace(/\D/g, "").slice(0, PIN_MAX_LENGTH);

  return (
    <div className="space-y-6">
      <p className="text-ink-soft text-sm">
        {pinSetOn ? `A PIN is set. It was last changed on ${pinSetOn}.` : "No PIN is set. Sign-in always asks for the password."}
      </p>

      <form
        className="max-w-md space-y-4"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          setFormError(null);
          startTransition(async () => {
            const result = await callAction(() => setSignInPin(values));
            if (!result.ok) {
              setErrors(result.fieldErrors ?? {});
              if (result.fieldErrors) focusFirstError(result.fieldErrors, idFor);
              else setFormError(result.error);
              return;
            }
            if (!result.data.saved) {
              setErrors({ currentPassword: [result.data.reason] });
              document.getElementById(idFor("currentPassword"))?.focus();
              return;
            }
            setErrors({});
            setValues(EMPTY);
            toast.success(pinSetOn ? "PIN changed" : "PIN set. This device will offer it next time.");
          });
        }}
      >
        {formError ? <FormMessage tone="error">{formError}</FormMessage> : null}
        <TextField
          id={idFor("currentPassword")}
          label="Your password"
          type="password"
          autoComplete="current-password"
          maxLength={200}
          value={values.currentPassword}
          error={errors.currentPassword?.[0]}
          onChange={(e) => setValues((v) => ({ ...v, currentPassword: e.target.value }))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id={idFor("pin")}
            label={pinSetOn ? "New PIN" : "PIN"}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_MAX_LENGTH}
            hint={`${PIN_MIN_LENGTH} to ${PIN_MAX_LENGTH} digits, not 1234 or 1111.`}
            value={values.pin}
            error={errors.pin?.[0]}
            onChange={(e) => setValues((v) => ({ ...v, pin: digits(e.target.value) }))}
          />
          <TextField
            id={idFor("confirmPin")}
            label="Confirm PIN"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_MAX_LENGTH}
            value={values.confirmPin}
            error={errors.confirmPin?.[0]}
            onChange={(e) => setValues((v) => ({ ...v, confirmPin: digits(e.target.value) }))}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="h-11 rounded-full px-5" disabled={pending} aria-busy={pending}>
            {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
            {pinSetOn ? "Change PIN" : "Set PIN"}
          </Button>
          {pinSetOn ? (
            <ConfirmDialog
              title="Remove the PIN?"
              description="Every device goes back to signing in with the password."
              confirmLabel="Remove PIN"
              onConfirm={async () => {
                const result = await callAction(() => removeSignInPin({}));
                if (!result.ok) {
                  toast.error(result.error);
                  return false;
                }
                toast.success("PIN removed");
                return true;
              }}
              trigger={
                <Button type="button" variant="outline" className="h-11 rounded-full px-5" disabled={pending}>
                  Remove PIN
                </Button>
              }
            />
          ) : null}
        </div>
      </form>
    </div>
  );
}
