"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { unlockWithPin, type SignInState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const submit = withNetworkError(unlockWithPin);
const MAX_PIN = 8;

export function PinForm({ pinLength }: { pinLength: number | null }) {
  const [state, formAction, actionPending] = useActionState(submit, INITIAL);
  // Stay busy while the browser loads the next page.
  const pending = actionPending || Boolean(state.redirectTo);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState("");

  // A wrong PIN comes back as a new message: clear the field and take focus again.
  useEffect(() => {
    if (state.redirectTo) {
      // A full load, so the middleware and the layout see the new session cookie.
      window.location.assign(state.redirectTo);
      return;
    }
    if (state.error) {
      setPin("");
      inputRef.current?.focus();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="pin" className="text-sm font-medium">
          PIN
        </Label>
        <Input
          ref={inputRef}
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          autoFocus
          required
          maxLength={MAX_PIN}
          aria-describedby={state.error ? "pin-error pin-hint" : "pin-hint"}
          aria-invalid={state.error ? true : undefined}
          value={pin}
          readOnly={pending}
          onChange={(event) => {
            const next = event.target.value.replace(/\D/g, "").slice(0, MAX_PIN);
            setPin(next);
            // Submit on the last digit, the way a phone unlock does.
            if (pinLength && next.length === pinLength) {
              requestAnimationFrame(() => formRef.current?.requestSubmit());
            }
          }}
          className="bg-card h-14 text-center font-mono text-2xl tracking-[0.5em]"
        />
        <p id="pin-hint" className="text-muted-foreground text-xs">
          {pinLength ? `${pinLength} digits. It unlocks as soon as you type the last one.` : "4 to 8 digits."}
        </p>
      </div>
      {state.error ? (
        <p id="pin-error" role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-11 w-full rounded-full text-[15px]"
        disabled={pending || pin.length < 4}
        aria-busy={pending}
      >
        {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
        {pending ? "Unlocking" : "Unlock"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login?password=1" className="link inline-flex min-h-11 items-center">
          Use your password instead
        </Link>
      </p>
    </form>
  );
}
