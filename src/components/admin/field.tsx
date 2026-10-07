import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * A labelled input with its hint and error wired to it through
 * aria-describedby, so a screen reader hears the problem with the field.
 */

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: (describedBy: string | undefined, invalid: boolean) => React.ReactNode;
}

function FieldShell({ id, label, hint, error, className, children }: FieldShellProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children(describedBy, Boolean(error))}
      {error ? (
        <p id={errorId} className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = Omit<React.ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export function TextField({ id, label, hint, error, wrapperClassName, className, ...props }: InputProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      {(describedBy, invalid) => (
        <Input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn("h-11 bg-card", className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}

type TextareaProps = Omit<React.ComponentProps<"textarea">, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export function TextAreaField({ id, label, hint, error, wrapperClassName, className, ...props }: TextareaProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      {(describedBy, invalid) => (
        <Textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn("bg-card min-h-36 text-[15px] leading-relaxed", className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}

/** A form-level message: errors are announced at once, notices politely. */
export function FormMessage({ tone, children, id }: { tone: "error" | "notice"; children: React.ReactNode; id?: string }) {
  return (
    <p
      id={id}
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3.5 py-2.5 text-sm",
        tone === "error" ? "border-destructive/40 text-destructive bg-destructive/5" : "border-rule bg-muted text-ink-soft",
      )}
    >
      {children}
    </p>
  );
}

/** Focus the first field that has an error, in DOM order. */
export function focusFirstError(fieldErrors: Record<string, string[] | undefined>, idFor: (field: string) => string) {
  const ids = Object.keys(fieldErrors)
    .filter((key) => fieldErrors[key]?.length)
    .map(idFor);
  const elements = ids
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null)
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  elements[0]?.focus();
}
