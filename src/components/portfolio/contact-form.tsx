"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { fetchFormToken, submitPublicForm, FORM_TOKEN_READY_MS, FORM_TOKEN_REFRESH_MS } from "@/lib/forms/client";
import { contactSchema } from "@/lib/validators/contact";
import { track } from "@/lib/analytics";
import { profile } from "@/data/profile";
import { cn } from "@/lib/utils";

type Field = "name" | "email" | "subject" | "message";
const FIELDS: readonly Field[] = ["name", "email", "subject", "message"];
const MESSAGE_MAX = 4000;

type Values = Record<Field, string> & { website: string };
type FieldErrors = Partial<Record<Field, string>>;

const EMPTY: Values = { name: "", email: "", subject: "", message: "", website: "" };

const TOKEN_ERROR = "The form could not get ready to send. Check your connection and try again.";
const RATE_LIMIT_ERROR = "That is a few messages in a short time. Wait a little, then try again, or email me directly.";

function firstMessages(source: Record<string, string[] | undefined> | undefined): FieldErrors {
  const out: FieldErrors = {};
  if (!source) return out;
  for (const field of FIELDS) {
    const message = source[field]?.[0];
    if (message) out[field] = message;
  }
  return out;
}

/** Client-side check with the same schema the server uses (docs/API.md limits). */
function validate(values: Values): FieldErrors {
  const parsed = contactSchema.safeParse({ ...values, token: "" });
  if (parsed.success) return {};
  const out: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && (FIELDS as readonly string[]).includes(key) && !out[key as Field]) {
      out[key as Field] = issue.message;
    }
  }
  return out;
}

/**
 * The contact form. Server rendered page around it; this island owns the
 * states: pending (no double submit), field errors tied to their inputs with
 * focus on the first one, a form-level alert that keeps every entry for a
 * retry, and navigation to /contact/thanks only after the server says ok.
 */
export function ContactForm() {
  const router = useRouter();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const tokenRef = useRef<{ value: string; at: number } | null>(null);
  const tokenRequest = useRef<Promise<string | null> | null>(null);
  const fieldRefs = useRef<Partial<Record<Field, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const alertRef = useRef<HTMLDivElement>(null);

  function requestToken(): Promise<string | null> {
    if (tokenRef.current && Date.now() - tokenRef.current.at < FORM_TOKEN_REFRESH_MS) {
      return Promise.resolve(tokenRef.current.value);
    }
    tokenRequest.current ??= fetchFormToken().then((token) => {
      tokenRef.current = token ? { value: token, at: Date.now() } : null;
      tokenRequest.current = null;
      return token;
    });
    return tokenRequest.current;
  }

  function update(field: keyof Values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (field !== "website" && errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function focusFirst(found: FieldErrors) {
    const first = FIELDS.find((field) => found[field]);
    if (first) fieldRefs.current[first]?.focus();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirst(found);
      return;
    }

    setPending(true);
    const token = await requestToken();
    if (!token) {
      setPending(false);
      setFormError(TOKEN_ERROR);
      requestAnimationFrame(() => alertRef.current?.focus());
      return;
    }

    const age = Date.now() - (tokenRef.current?.at ?? Date.now());
    if (age < FORM_TOKEN_READY_MS) {
      await new Promise((resolve) => setTimeout(resolve, FORM_TOKEN_READY_MS - age));
    }

    const result = await submitPublicForm("/api/contact", {
      name: values.name.trim(),
      email: values.email.trim(),
      subject: values.subject.trim(),
      message: values.message.trim(),
      website: values.website,
      token,
    });

    if (result.ok) {
      track("contact-sent");
      router.push("/contact/thanks");
      return; // stay pending while the next page loads
    }

    setPending(false);
    // A used or expired token is never reused.
    tokenRef.current = null;
    tokenRequest.current = null;
    const serverFieldErrors = firstMessages(result.fieldErrors);
    if (Object.keys(serverFieldErrors).length > 0) {
      setErrors(serverFieldErrors);
      focusFirst(serverFieldErrors);
      return;
    }
    setFormError(result.status === 429 ? RATE_LIMIT_ERROR : result.error);
    requestAnimationFrame(() => alertRef.current?.focus());
  }

  const fieldClass =
    "border-input bg-card text-foreground placeholder:text-muted-foreground/80 block w-full rounded-[10px] border px-3.5 py-3 text-base transition-colors hover:border-foreground/25 focus-visible:border-ring aria-invalid:border-destructive";

  const describedBy = (field: Field, hint?: string) =>
    [hint, errors[field] ? `${field}-error` : null].filter(Boolean).join(" ") || undefined;

  const errorText = (field: Field) =>
    errors[field] ? (
      <p id={`${field}-error`} className="text-destructive mt-2 text-sm">
        <span aria-hidden>&#9888;&#xFE0E; </span>
        {errors[field]}
      </p>
    ) : null;

  const remaining = MESSAGE_MAX - values.message.length;

  return (
    <form noValidate onSubmit={onSubmit} onFocus={() => void requestToken()} aria-busy={pending} className="space-y-6">
      {formError ? (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="border-destructive/40 bg-destructive/5 rounded-[12px] border p-4 text-[0.95rem] focus-visible:outline-offset-2"
        >
          <p className="text-foreground font-medium">We could not confirm your message.</p>
          <p className="text-ink-soft mt-1">{formError}</p>
          <p className="text-ink-soft mt-1">
            Everything you wrote is still here. Press Send message to try again, or write to{" "}
            <a className="link" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            .
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-foreground block text-[0.94rem] font-medium">
            Name
          </label>
          <input
            ref={(el) => {
              fieldRefs.current.name = el;
            }}
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={200}
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
            className={cn(fieldClass, "mt-2 min-h-12")}
          />
          {errorText("name")}
        </div>
        <div>
          <label htmlFor="email" className="text-foreground block text-[0.94rem] font-medium">
            Email
          </label>
          <input
            ref={(el) => {
              fieldRefs.current.email = el;
            }}
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={400}
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email", "email-hint")}
            className={cn(fieldClass, "mt-2 min-h-12")}
          />
          <p id="email-hint" className="text-muted-foreground mt-2 text-sm">
            Only used to reply to you.
          </p>
          {errorText("email")}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="text-foreground block text-[0.94rem] font-medium">
          Subject <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          ref={(el) => {
            fieldRefs.current.subject = el;
          }}
          id="subject"
          name="subject"
          type="text"
          maxLength={300}
          value={values.subject}
          onChange={(e) => update("subject", e.target.value)}
          aria-invalid={errors.subject ? true : undefined}
          aria-describedby={describedBy("subject")}
          className={cn(fieldClass, "mt-2 min-h-12")}
        />
        {errorText("subject")}
      </div>

      <div>
        <label htmlFor="message" className="text-foreground block text-[0.94rem] font-medium">
          Message
        </label>
        <textarea
          ref={(el) => {
            fieldRefs.current.message = el;
          }}
          id="message"
          name="message"
          required
          rows={7}
          maxLength={MESSAGE_MAX + 500}
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describedBy("message", "message-hint")}
          className={cn(fieldClass, "mt-2 min-h-40 resize-y leading-relaxed")}
        />
        <p id="message-hint" className="text-muted-foreground mt-2 flex justify-between gap-4 text-sm">
          <span>What you are building, and where you are stuck. At least 10 characters.</span>
          <span className={cn("font-mono tabular-nums", remaining < 0 && "text-destructive")} aria-hidden>
            {values.message.length}/{MESSAGE_MAX}
          </span>
        </p>
        {errorText("message")}
      </div>

      {/* Honeypot: hidden from people and assistive technology, filled only by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-7 text-[0.97rem] font-medium transition-colors disabled:cursor-progress disabled:opacity-75"
        >
          {pending ? (
            <>
              <span
                aria-hidden
                className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
              />
              Sending...
            </>
          ) : (
            "Send message"
          )}
        </button>
        <p className="text-muted-foreground text-sm">
          Your details are handled as the{" "}
          <Link className="link" href="/privacy">
            privacy notice
          </Link>{" "}
          describes.
        </p>
      </div>
      <p className="sr-only" aria-live="polite">
        {pending ? "Sending your message" : ""}
      </p>
    </form>
  );
}
