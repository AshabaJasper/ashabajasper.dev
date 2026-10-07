"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AlertTriangle, Check, RotateCw, Send } from "lucide-react";
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
type Status = "idle" | "pending" | "sent";

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
 * states: floating labels, inline checks once a field has been left, pending
 * (no double submit), field errors tied to their inputs with focus on the
 * first one, a form-level alert that keeps every entry for a retry, and
 * navigation to /contact/thanks only after the server says ok.
 */
export function ContactForm() {
  const router = useRouter();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const pending = status !== "idle";

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
    const next = { ...values, [field]: value };
    setValues(next);
    // Once a field shows an error, it re-checks as the visitor types, so the message clears the moment it is fixed.
    if (field !== "website" && errors[field]) setErrors((prev) => ({ ...prev, [field]: validate(next)[field] }));
  }

  function leave(field: Field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    // An empty required field is not flagged on the way past; only on submit.
    if (values[field].trim() === "" && field !== "subject") return;
    setErrors((prev) => ({ ...prev, [field]: validate(values)[field] }));
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
    setTouched({ name: true, email: true, subject: true, message: true });
    if (Object.keys(found).length > 0) {
      focusFirst(found);
      return;
    }

    setStatus("pending");
    const token = await requestToken();
    if (!token) {
      setStatus("idle");
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
      setStatus("sent");
      router.push("/contact/thanks");
      return; // stay disabled while the next page loads
    }

    setStatus("idle");
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

  const describedBy = (field: Field, hint?: string) => [hint, errors[field] ? `${field}-error` : null].filter(Boolean).join(" ") || undefined;

  const valid = (field: Field) => touched[field] && !errors[field] && values[field].trim() !== "";

  const errorText = (field: Field) =>
    errors[field] ? (
      <p id={`${field}-error`} className="text-destructive mt-2 flex items-start gap-1.5 text-sm">
        <AlertTriangle aria-hidden className="mt-[0.15em] size-3.5 shrink-0" strokeWidth={2} />
        {errors[field]}
      </p>
    ) : null;

  const fieldClass =
    "peer border-input bg-background/60 text-foreground block w-full rounded-[12px] border px-4 pt-6 pb-2 text-base transition-[border-color,box-shadow] hover:border-foreground/25 focus-visible:border-ring focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--ring)_18%,transparent)] focus-visible:outline-none aria-invalid:border-destructive";

  // The label sits inside the field and floats up once there is a value or focus.
  const labelClass =
    "text-muted-foreground pointer-events-none absolute top-1.5 left-4 origin-left text-[0.74rem] font-medium transition-all duration-200 peer-placeholder-shown:top-[0.95rem] peer-placeholder-shown:text-[0.98rem] peer-focus-visible:top-1.5 peer-focus-visible:text-[0.74rem] peer-focus-visible:text-primary";

  const tick = (field: Field) =>
    valid(field) ? (
      <Check aria-hidden className="text-primary pointer-events-none absolute top-4 right-3.5 size-4" strokeWidth={2.5} />
    ) : null;

  const length = values.message.length;
  const remaining = MESSAGE_MAX - length;
  const near = remaining <= 200;

  return (
    <form noValidate onSubmit={onSubmit} onFocus={() => void requestToken()} aria-busy={pending} className="space-y-5">
      {formError ? (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="border-destructive/40 bg-destructive/5 rounded-[14px] border p-4 text-[0.95rem] focus-visible:outline-offset-2"
        >
          <p className="text-foreground flex items-center gap-2 font-medium">
            <AlertTriangle aria-hidden className="text-destructive size-4" strokeWidth={2} />
            We could not confirm your message.
          </p>
          <p className="text-ink-soft mt-1">{formError}</p>
          <p className="text-ink-soft mt-1">
            Everything you wrote is still here. Press Try again, or write to{" "}
            <a className="link" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            .
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="relative">
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
              placeholder=" "
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              onBlur={() => leave("name")}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy("name")}
              className={cn(fieldClass, "min-h-14 pr-10")}
            />
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            {tick("name")}
          </div>
          {errorText("name")}
        </div>
        <div>
          <div className="relative">
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
              placeholder=" "
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
              onBlur={() => leave("email")}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy("email", "email-hint")}
              className={cn(fieldClass, "min-h-14 pr-10")}
            />
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            {tick("email")}
          </div>
          <p id="email-hint" className="text-muted-foreground mt-2 text-[0.82rem]">
            Only used to reply to you.
          </p>
          {errorText("email")}
        </div>
      </div>

      <div>
        <div className="relative">
          <input
            ref={(el) => {
              fieldRefs.current.subject = el;
            }}
            id="subject"
            name="subject"
            type="text"
            maxLength={300}
            placeholder=" "
            value={values.subject}
            onChange={(e) => update("subject", e.target.value)}
            onBlur={() => leave("subject")}
            aria-invalid={errors.subject ? true : undefined}
            aria-describedby={describedBy("subject")}
            className={cn(fieldClass, "min-h-14 pr-10")}
          />
          <label htmlFor="subject" className={labelClass}>
            Subject <span className="font-normal">(optional)</span>
          </label>
          {tick("subject")}
        </div>
        {errorText("subject")}
      </div>

      <div>
        <div className="relative">
          <textarea
            ref={(el) => {
              fieldRefs.current.message = el;
            }}
            id="message"
            name="message"
            required
            rows={7}
            maxLength={MESSAGE_MAX + 500}
            placeholder=" "
            value={values.message}
            onChange={(e) => update("message", e.target.value)}
            onBlur={() => leave("message")}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describedBy("message", "message-hint message-count")}
            className={cn(fieldClass, "min-h-44 resize-y pt-7 leading-relaxed")}
          />
          <label htmlFor="message" className={labelClass}>
            Message
          </label>
        </div>
        <div className="mt-2 flex items-start justify-between gap-4 text-[0.82rem]">
          <p id="message-hint" className="text-muted-foreground">
            What you are building, and where you are stuck. At least 10 characters.
          </p>
          <p id="message-count" className={cn("shrink-0 font-mono tabular-nums", remaining < 0 ? "text-destructive" : near ? "text-foreground" : "text-muted-foreground")}>
            <span className="sr-only">Characters used: </span>
            {length.toLocaleString("en-GB")}/{MESSAGE_MAX.toLocaleString("en-GB")}
          </p>
        </div>
        <div className="bg-rule mt-2 h-1 overflow-hidden rounded-full" aria-hidden>
          <div
            className={cn("h-full rounded-full transition-[width,background-color] duration-300", remaining < 0 ? "bg-destructive" : "bg-primary")}
            style={{ width: `${Math.min(100, (length / MESSAGE_MAX) * 100)}%` }}
          />
        </div>
        {errorText("message")}
        {/* Announced only near the limit, so typing is not narrated. */}
        <p className="sr-only" aria-live="polite">
          {near ? (remaining < 0 ? `${-remaining} characters over the limit` : `${remaining} characters left`) : ""}
        </p>
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

      <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          data-status={status}
          className={cn(
            "send-button group relative inline-flex min-h-12 shrink-0 items-center whitespace-nowrap justify-center gap-2.5 overflow-hidden rounded-full px-7 text-[0.97rem] font-medium transition-[background-color,transform,box-shadow] duration-300 active:scale-[0.97] disabled:cursor-progress",
            status === "sent"
              ? "bg-primary text-primary-foreground"
              : "bg-foreground text-background hover:bg-primary hover:text-primary-foreground hover:shadow-[0_10px_30px_-12px_var(--primary)]",
          )}
        >
          {status === "pending" ? (
            <>
              <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
              Sending...
            </>
          ) : status === "sent" ? (
            <>
              <Check aria-hidden className="size-4" strokeWidth={2.5} />
              Sent
            </>
          ) : formError ? (
            <>
              <RotateCw aria-hidden className="size-4" strokeWidth={2} />
              Try again
            </>
          ) : (
            <>
              Send message
              <Send aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" strokeWidth={2} />
            </>
          )}
        </button>
        <p className="text-muted-foreground text-[0.84rem]">
          Your details are handled as the{" "}
          <Link className="link" href="/privacy">
            privacy notice
          </Link>{" "}
          describes.
        </p>
      </div>
      <p className="sr-only" aria-live="polite">
        {status === "pending" ? "Sending your message" : status === "sent" ? "Message sent" : ""}
      </p>
    </form>
  );
}
