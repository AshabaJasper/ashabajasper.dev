"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { authenticate, type SignInState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormMessage, TextField } from "@/components/admin/field";

const INITIAL: SignInState = { error: null };

/** A dropped connection becomes a message on the form instead of an error page. */
function withNetworkError(run: (prev: SignInState, data: FormData) => Promise<SignInState>) {
  return async (prev: SignInState, data: FormData): Promise<SignInState> => {
    try {
      return await run(prev, data);
    } catch {
      return { error: "The admin could not be reached. Check your connection and try again." };
    }
  };
}

const submit = withNetworkError(authenticate);

export function LoginForm({ offerPin, backToPin }: { offerPin: boolean; backToPin: boolean }) {
  const [state, formAction, actionPending] = useActionState(submit, INITIAL);
  // Stay busy while the browser loads the next page.
  const pending = actionPending || Boolean(state.redirectTo);
  // Controlled, so a failed try keeps the email; the password is cleared on purpose.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.redirectTo) {
      // A full load, so the middleware and the layout see the new session cookie.
      window.location.assign(state.redirectTo);
      return;
    }
    if (state.error) {
      setPassword("");
      passwordRef.current?.focus();
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-5" noValidate={false}>
      {state.error ? (
        <FormMessage tone="error" id="login-error">
          {state.error}
        </FormMessage>
      ) : null}
      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="username"
        required
        maxLength={254}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        ref={passwordRef}
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        maxLength={200}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="space-y-1">
        <div className="flex min-h-11 items-center gap-3">
          <Checkbox id="remember" name="remember" defaultChecked className="size-5" />
          <Label htmlFor="remember" className="text-ink-soft text-sm font-normal">
            Remember me for 30 days
          </Label>
        </div>
        {offerPin ? (
          <div className="flex min-h-11 items-center gap-3">
            <Checkbox id="trustDevice" name="trustDevice" defaultChecked className="size-5" />
            <Label htmlFor="trustDevice" className="text-ink-soft text-sm leading-snug font-normal">
              Unlock with my PIN on this device next time
            </Label>
          </div>
        ) : null}
      </div>
      <Button type="submit" className="h-11 w-full rounded-full text-[15px]" disabled={pending} aria-busy={pending}>
        {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
        {pending ? "Signing in" : "Sign in"}
      </Button>
      {backToPin ? (
        <p className="text-center text-sm">
          <Link href="/login" className="link inline-flex min-h-11 items-center">
            Use my PIN instead
          </Link>
        </p>
      ) : null}
    </form>
  );
}
