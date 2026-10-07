"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, MessageSquareReply, ShieldAlert, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { deleteComment, moderateComment, replyToComment } from "@/actions/comments";
import { availableOps, type CommentState, type ModerationOp } from "@/lib/comments/state";
import { Button } from "@/components/ui/button";
import { callAction } from "@/components/admin/call-action";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { FormMessage, TextAreaField } from "@/components/admin/field";

const OP_COPY: Record<ModerationOp, { label: string; done: string }> = {
  approve: { label: "Approve", done: "Approved. It is now public." },
  spam: { label: "Mark spam", done: "Marked as spam and hidden" },
  restore: { label: "Restore", done: "Restored and public again" },
};

const OP_ICON = { approve: Check, spam: ShieldAlert, restore: Undo2 } as const;

export function CommentActions({
  id,
  status,
  canReply,
  authorName,
  replyCount,
}: {
  id: string;
  status: CommentState;
  canReply: boolean;
  authorName: string;
  replyCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [busyOp, setBusyOp] = useState<ModerationOp | "reply" | null>(null);
  const [replying, setReplying] = useState(false);
  const [body, setBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);

  function moderate(op: ModerationOp) {
    setBusyOp(op);
    startTransition(async () => {
      const result = await callAction(() => moderateComment({ id, op }));
      if (!result.ok) toast.error(result.error);
      else toast.success(OP_COPY[op].done);
    });
  }

  function reply() {
    setBusyOp("reply");
    setReplyError(null);
    startTransition(async () => {
      const result = await callAction(() => replyToComment({ parentId: id, body }));
      if (!result.ok) {
        setReplyError(result.fieldErrors?.body?.[0] ?? result.error);
        document.getElementById(`reply-${id}`)?.focus();
        return;
      }
      setBody("");
      setReplying(false);
      toast.success(result.data.approvedParent ? "Reply posted, and the comment approved" : "Reply posted");
    });
  }

  return (
    <div className="border-rule mt-5 border-t pt-4">
      <div className="flex flex-wrap items-center gap-2">
        {availableOps(status).map((op) => {
          const Icon = OP_ICON[op];
          const busy = pending && busyOp === op;
          return (
            <Button
              key={op}
              type="button"
              variant={op === "spam" ? "outline" : "default"}
              className="h-11 rounded-full px-4"
              disabled={pending}
              aria-busy={busy}
              onClick={() => moderate(op)}
            >
              {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Icon aria-hidden className="size-4" />}
              {OP_COPY[op].label}
            </Button>
          );
        })}
        {canReply ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full px-4"
            disabled={pending}
            aria-expanded={replying}
            aria-controls={`reply-form-${id}`}
            onClick={() => setReplying((v) => !v)}
          >
            <MessageSquareReply aria-hidden className="size-4" />
            Reply as author
          </Button>
        ) : null}
        <ConfirmDialog
          title="Delete this comment?"
          description={
            replyCount > 0
              ? `The comment by ${authorName} and its ${replyCount} ${replyCount === 1 ? "reply" : "replies"} are removed for good. This cannot be undone.`
              : `The comment by ${authorName} is removed for good. This cannot be undone.`
          }
          confirmLabel="Delete"
          onConfirm={async () => {
            const result = await callAction(() => deleteComment({ id }));
            if (!result.ok) {
              toast.error(result.error);
              return false;
            }
            toast.success("Comment deleted");
            return true;
          }}
          trigger={
            <Button type="button" variant="ghost" className="text-muted-foreground hover:text-destructive h-11 rounded-full px-4 sm:ml-auto" disabled={pending}>
              <Trash2 aria-hidden className="size-4" />
              Delete
            </Button>
          }
        />
      </div>

      {canReply && replying ? (
        <form
          id={`reply-form-${id}`}
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!pending) reply();
          }}
        >
          {replyError ? <FormMessage tone="error">{replyError}</FormMessage> : null}
          <TextAreaField
            id={`reply-${id}`}
            label={`Reply to ${authorName}`}
            hint={
              status === "PENDING"
                ? "Posted publicly under your name at once. Replying also approves this comment."
                : "Posted publicly under your name at once."
            }
            value={body}
            maxLength={2000}
            onChange={(e) => setBody(e.target.value)}
            disabled={pending}
            autoFocus
            className="min-h-28"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="h-11 rounded-full px-5" disabled={pending || body.trim().length < 2} aria-busy={pending}>
              {pending && busyOp === "reply" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
              Post reply
            </Button>
            <Button type="button" variant="ghost" className="h-11 rounded-full px-4" onClick={() => setReplying(false)} disabled={pending}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
