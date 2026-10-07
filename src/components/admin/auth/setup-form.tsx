"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { completeSetup, type SetupState } from "@/actions/setup";
import { Button } from "@/components/ui/button";
import { FormMessage, TextField, focusFirstError } from "@/components/admin/field";

const INITIAL: SetupState = { error: null, fieldErrors: {} };

/** A dropped connection becomes a message on the form instead of an error page. Entries are kept. */
async function withSetupNetworkError(prev: SetupState, data: FormData): Promise<SetupState> {
  try {
    return await completeSetup(prev, data);
  } catch {
    return { error: "The admin could not be reached. Check your connection and try again.", fieldErrors: {} };
  }
}

type Field = "token" | "name" | "email" | "password" | "confirmPassword";

export function SetupForm() {
  const [state, formAction, actionPending] = useActionState(withSetupNetworkError, INITIAL);
  const pending = actionPending || Boolean(state.done);
  const [values, setValues] = useState<Record<Field, string>>({
    token: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (state.done) {
      window.location.assign("/login");
      return;
    }
    if (Object.keys(state.fieldErrors).length > 0) focusFirstError(state.fieldErrors, (field) => `setup-${field}`);
  }, [state]);

  const bind = (field: Field) => ({
    id: `setup-${field}`,
    name: field,
    value: values[field],
    error: state.fieldErrors[field]?.[0],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [field]: e.target.value })),
  });

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      <TextField {...bind("token")} label="Setup token" type="password" autoComplete="off" required maxLength={500} />
      <TextField {...bind("name")} label="Your name" autoComplete="name" required maxLength={80} />
      <TextField {...bind("email")} label="Email" type="email" autoComplete="username" required maxLength={254} />
      <TextField
        {...bind("password")}
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        maxLength={200}
        hint="At least 12 characters. A few unrelated words work well."
      />
      <TextField
        {...bind("confirmPassword")}
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        maxLength={200}
      />
      <Button type="submit" className="h-11 w-full rounded-full text-[15px]" disabled={pending} aria-busy={pending}>
        {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
        {pending ? "Creating the owner" : "Create the owner"}
      </Button>
    </form>
  );
}
