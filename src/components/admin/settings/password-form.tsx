"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { callAction } from "@/components/admin/call-action";
import { FormMessage, TextField, focusFirstError } from "@/components/admin/field";
import type { ChangePasswordInput } from "@/lib/validators/settings";

const EMPTY: ChangePasswordInput = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordForm() {
  const [values, setValues] = useState<ChangePasswordInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const idFor = (field: string) => `pw-${field}`;
  const bind = (field: keyof ChangePasswordInput) => ({
    id: idFor(field),
    name: field,
    type: "password",
    value: values[field],
    error: errors[field]?.[0],
    maxLength: 200,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [field]: e.target.value })),
  });

  return (
    <form
      className="max-w-md space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        setFormError(null);
        startTransition(async () => {
          const result = await callAction(() => changePassword(values));
          if (!result.ok) {
            setErrors(result.fieldErrors ?? {});
            if (result.fieldErrors) focusFirstError(result.fieldErrors, idFor);
            else setFormError(result.error);
            return;
          }
          if (!result.data.changed) {
            setErrors({ currentPassword: [result.data.reason] });
            document.getElementById(idFor("currentPassword"))?.focus();
            return;
          }
          setErrors({});
          setValues(EMPTY);
          toast.success("Password changed. Sign in again with your new password.");
          await signOut({ callbackUrl: "/login" });
        });
      }}
    >
      {formError ? <FormMessage tone="error">{formError}</FormMessage> : null}
      <TextField {...bind("currentPassword")} label="Current password" autoComplete="current-password" />
      <TextField {...bind("newPassword")} label="New password" autoComplete="new-password" hint="At least 12 characters." />
      <TextField {...bind("confirmPassword")} label="Confirm new password" autoComplete="new-password" />
      <Button type="submit" className="h-11 rounded-full px-5" disabled={pending} aria-busy={pending}>
        {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
        {pending ? "Changing" : "Change password"}
      </Button>
    </form>
  );
}
