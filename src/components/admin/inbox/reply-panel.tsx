"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { markReplied, sendReply } from "@/actions/inbox";
import { Button } from "@/components/ui/button";
import { callAction } from "@/components/admin/call-action";
import { FormMessage, TextAreaField } from "@/components/admin/field";

interface Replied {
  at: string;
  via: "smtp" | "mailto";
  body: string | null;
}

/**
 * Reply to a message. With SMTP configured the reply is sent from here and
 * stored; without it, the owner's mail app opens prefilled, and the message
 * is marked as replied by hand.
 */
export function ReplyPanel({
  id,
  email,
  smtpConfigured,
  mailto,
  subject,
  quote,
  replied,
}: {
  id: string;
  email: string;
  smtpConfigured: boolean;
  mailto: string;
  subject: string;
  quote: string;
  replied: Replied | null;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function send() {
    setError(null);
    setFieldError(undefined);
    startTransition(async () => {
      const result = await callAction(() => sendReply({ id, body }));
      if (!result.ok) {
        const field = result.fieldErrors?.body?.[0];
        if (field) {
          setFieldError(field);
          document.getElementById("reply-body")?.focus();
        } else {
          setError(result.error);
        }
        return;
      }
      setBody("");
      toast.success(`Reply sent to ${email}`);
    });
  }

  function markDone() {
    setError(null);
    startTransition(async () => {
      const result = await callAction(() => markReplied({ id }));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Marked as replied");
    });
  }

  return (
    <section aria-labelledby="reply-heading" className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="reply-heading" className="font-serif text-[1.75rem] leading-tight">
          Reply
        </h2>
        <p className="text-muted-foreground text-sm">
          To <span className="text-ink-soft">{email}</span>, subject “{subject}”
        </p>
      </div>

      {replied ? (
        <div className="border-rule rounded-xl border border-dashed p-5">
          <p className="text-ink-soft flex items-center gap-2 text-sm">
            <Check aria-hidden className="text-primary size-4" />
            {replied.via === "smtp" ? `Replied from the admin on ${replied.at}.` : `Marked as replied from your mail app on ${replied.at}.`}
          </p>
          {replied.body ? (
            <div className="text-ink-soft mt-4 text-[0.95rem] leading-relaxed break-words whitespace-pre-wrap">
              {replied.body}
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      {smtpConfigured ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!pending) send();
          }}
        >
          <TextAreaField
            id="reply-body"
            label={replied ? "Send another reply" : "Your reply"}
            hint="Sent as plain text from your mail account, with the original message quoted below it."
            value={body}
            maxLength={10000}
            error={fieldError}
            onChange={(e) => setBody(e.target.value)}
            disabled={pending}
          />
          <details className="text-muted-foreground text-sm">
            <summary className="hover:text-foreground inline-flex min-h-11 cursor-pointer items-center">
              Show the quoted message
            </summary>
            <pre className="bg-code-bg mt-2 max-h-64 overflow-auto rounded-lg p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {quote}
            </pre>
          </details>
          <Button type="submit" className="h-11 rounded-full px-5" disabled={pending || body.trim().length < 2} aria-busy={pending}>
            {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
            {pending ? "Sending" : "Send reply"}
          </Button>
        </form>
      ) : (
        <div className="border-rule bg-card space-y-4 rounded-xl border p-5">
          <p className="text-ink-soft text-sm">
            Email sending is not configured, so the reply goes from your own mail app. It opens with the subject and the
            quoted message filled in. Come back and mark it as replied once it is sent.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="h-11 rounded-full px-5">
              <a href={mailto}>
                <Mail aria-hidden className="size-4" />
                Open in email app
              </a>
            </Button>
            {!replied ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full px-5"
                disabled={pending}
                aria-busy={pending}
                onClick={markDone}
              >
                {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Check aria-hidden className="size-4" />}
                Mark as replied
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
