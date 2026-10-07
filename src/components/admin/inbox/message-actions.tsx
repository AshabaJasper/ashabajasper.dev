"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, ShieldAlert, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { markMessageRead, setMessageStatus } from "@/actions/inbox";
import { Button } from "@/components/ui/button";
import { callAction } from "@/components/admin/call-action";

/** Opening a new message marks it read, once. */
export function MarkReadOnOpen({ id, isNew }: { id: string; isNew: boolean }) {
  const done = useRef(false);
  useEffect(() => {
    if (!isNew || done.current) return;
    done.current = true;
    // Best effort: the status badge still shows READ on the next load if this fails.
    markMessageRead({ id }).catch(() => undefined);
  }, [id, isNew]);
  return null;
}

type Op = "archive" | "spam" | "restore";

const COPY: Record<Op, { label: string; done: string }> = {
  archive: { label: "Archive", done: "Archived" },
  spam: { label: "Mark as spam", done: "Marked as spam" },
  restore: { label: "Move to inbox", done: "Back in the inbox" },
};

export function MessageStatusActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingOp, setPendingOp] = useState<Op | null>(null);

  const ops: Op[] =
    status === "ARCHIVED" ? ["restore", "spam"] : status === "SPAM" ? ["restore"] : ["archive", "spam"];

  function run(op: Op) {
    setPendingOp(op);
    startTransition(async () => {
      const result = await callAction(() => setMessageStatus({ id, op }));
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(COPY[op].done);
      if (op !== "restore") router.push("/inbox");
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ops.map((op) => {
        const Icon = op === "archive" ? Archive : op === "spam" ? ShieldAlert : Undo2;
        const busy = pending && pendingOp === op;
        return (
          <Button
            key={op}
            type="button"
            variant="outline"
            className="h-11 rounded-full px-4"
            disabled={pending}
            aria-busy={busy}
            onClick={() => run(op)}
          >
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Icon aria-hidden className="size-4" />}
            {COPY[op].label}
          </Button>
        );
      })}
    </div>
  );
}
