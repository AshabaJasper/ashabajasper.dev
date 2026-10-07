"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * A confirmation step for destructive actions. The dialog stays open while
 * the action runs, so a failure can be read and retried in place.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  trigger,
  destructive = true,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  /** Resolve true to close the dialog, false to keep it open. */
  onConfirm: () => Promise<boolean>;
  trigger: React.ReactNode;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-2xl font-normal">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 rounded-full px-5" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            className="h-11 rounded-full px-5"
            disabled={pending}
            aria-busy={pending}
            onClick={async () => {
              setPending(true);
              try {
                if (await onConfirm()) setOpen(false);
              } catch {
                // onConfirm reports its own failures; this covers one that throws instead.
                toast.error("That did not go through. Check your connection and try again.");
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
