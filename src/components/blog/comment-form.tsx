"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { fetchFormToken, submitPublicForm } from "@/lib/forms/client";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * The public comment form. Contract: docs/API.md (POST /api/comments).
 *
 * - The anti-spam token is fetched on first focus, because the page is cached.
 *   The server silently drops a submission sent within 3 seconds of the token
 *   being issued (and still answers ok), so the form waits out that window
 *   itself rather than ever showing success for something that was not stored.
 * - Field errors are linked with aria-describedby and focus moves to the first
 *   invalid field. A form-level error keeps every entry for a retry.
 * - Success clears the form and fires the analytics event, never before.
 */

type Field = "name" | "email" | "body";
type Values = Record<Field, string>;
type FieldErrors = Partial<Record<Field, string>>;

const EMPTY: Values = { name: "", email: "", body: "" };
const MIN_TOKEN_AGE_MS = 3_500;
const MAX_TOKEN_AGE_MS = 110 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: Values): FieldErrors {
  const errors: FieldErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const body = values.body.trim();
  if (!name) errors.name = "Add your name, or the name you write under.";
  else if (name.length > 80) errors.name = "Keep the name under 80 characters.";
  if (email && (!EMAIL_RE.test(email) || email.length > 254)) errors.email = "That email address does not look right.";
  if (body.length < 2) errors.body = "Write a comment before sending.";
  else if (body.length > 2000) errors.body = `Keep comments under 2000 characters (now ${body.length}).`;
  return errors;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function CommentForm({ postSlug }: { postSlug: string }) {
  const uid = useId();
  const ids = {
    name: `${uid}-name`,
    email: `${uid}-email`,
    body: `${uid}-body`,
    website: `${uid}-website`,
    emailHint: `${uid}-email-hint`,
    formError: `${uid}-form-error`,
  };

  const [values, setValues] = useState<Values>(EMPTY);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const token = useRef<{ value: string; at: number } | null>(null);
  const tokenRequest = useRef<Promise<void> | null>(null);
  const fieldRefs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    body: useRef<HTMLTextAreaElement>(null),
  };
  const formErrorRef = useRef<HTMLDivElement>(null);
  // Bumped on every form-level error so the alert takes focus after it has rendered, even when the message repeats.
  const [errorTick, setErrorTick] = useState(0);

  useEffect(() => {
    if (errorTick > 0) formErrorRef.current?.focus();
  }, [errorTick]);

  function showFormError(message: string) {
    setFormError(message);
    setErrorTick((tick) => tick + 1);
  }

  function requestToken(): Promise<void> {
    tokenRequest.current ??= fetchFormToken().then((value) => {
      token.current = value ? { value, at: Date.now() } : null;
      tokenRequest.current = null;
    });
    return tokenRequest.current;
  }

  function onFirstFocus() {
    if (!token.current && !tokenRequest.current) void requestToken();
  }

  async function freshToken(): Promise<string | null> {
    if (tokenRequest.current) await tokenRequest.current;
    if (!token.current || Date.now() - token.current.at > MAX_TOKEN_AGE_MS) await requestToken();
    if (!token.current) return null;
    const age = Date.now() - token.current.at;
    if (age < MIN_TOKEN_AGE_MS) await sleep(MIN_TOKEN_AGE_MS - age);
    return token.current.value;
  }

  function update(field: Field, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (sent) setSent(false);
  }

  function focusFirstError(found: FieldErrors) {
    const first = (["name", "email", "body"] as const).find((field) => found[field]);
    if (first) fieldRefs[first].current?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    setSent(false);

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstError(found);
      return;
    }

    setPending(true);
    try {
      const value = await freshToken();
      if (!value) {
        showFormError("The form could not get ready to send. Check your connection and try again; your comment is still here.");
        return;
      }
      const result = await submitPublicForm("/api/comments", {
        postSlug,
        name: values.name.trim(),
        email: values.email.trim(),
        body: values.body.trim(),
        website,
        token: value,
      });

      if (result.ok) {
        track("comment-sent", { post: postSlug });
        setValues(EMPTY);
        setErrors({});
        setSent(true);
        token.current = null;
        return;
      }

      const serverErrors: FieldErrors = {};
      for (const field of ["name", "email", "body"] as const) {
        const message = result.fieldErrors?.[field]?.[0];
        if (message) serverErrors[field] = message;
      }
      if (Object.keys(serverErrors).length > 0) {
        setErrors(serverErrors);
        focusFirstError(serverErrors);
      } else {
        showFormError(result.error);
        // A token can expire or be rejected; fetch a new one for the retry.
        token.current = null;
      }
    } finally {
      setPending(false);
    }
  }

  const describedBy = (field: Field, ...extra: string[]) =>
    [...extra, errors[field] ? `${ids[field]}-error` : null].filter(Boolean).join(" ") || undefined;

  return (
    <form noValidate onSubmit={onSubmit} onFocus={onFirstFocus} className="comment-form" aria-busy={pending}>
      {formError ? (
        <div ref={formErrorRef} id={ids.formError} role="alert" tabIndex={-1} className="comment-form-error">
          <p className="font-medium">Your comment was not sent.</p>
          <p>{formError}</p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="comment-field">
          <label htmlFor={ids.name}>Name</label>
          <input
            ref={fieldRefs.name}
            id={ids.name}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={80}
            required
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
          />
          {errors.name ? (
            <p id={`${ids.name}-error`} className="comment-field-error">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="comment-field">
          <label htmlFor={ids.email}>
            Email <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            ref={fieldRefs.email}
            id={ids.email}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email", ids.emailHint)}
          />
          <p id={ids.emailHint} className="comment-field-hint">
            Never shown. Only used if I need to reply privately.
          </p>
          {errors.email ? (
            <p id={`${ids.email}-error`} className="comment-field-error">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="comment-field">
        <label htmlFor={ids.body}>Comment</label>
        <textarea
          ref={fieldRefs.body}
          id={ids.body}
          name="body"
          rows={5}
          maxLength={2000}
          required
          value={values.body}
          onChange={(e) => update("body", e.target.value)}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={describedBy("body")}
        />
        {errors.body ? (
          <p id={`${ids.body}-error`} className="comment-field-error">
            {errors.body}
          </p>
        ) : null}
      </div>

      {/* Honeypot: hidden from people and assistive technology, tempting to bots. */}
      <div aria-hidden className="comment-honeypot">
        <label htmlFor={ids.website}>Website</label>
        <input
          id={ids.website}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "bg-primary text-primary-foreground inline-flex min-h-11 w-fit items-center justify-center rounded-full px-6 text-[0.95rem] font-medium transition-opacity",
            pending && "cursor-progress opacity-70",
          )}
        >
          {pending ? "Sending..." : "Send comment"}
        </button>
        <p role="status" className={cn("comment-form-status", sent && "comment-form-status-sent")}>
          {sent ? "Thanks, your reply will appear once it is approved." : pending ? "Sending your comment." : ""}
        </p>
      </div>
    </form>
  );
}
