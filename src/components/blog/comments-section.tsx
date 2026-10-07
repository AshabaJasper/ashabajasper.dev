import { Suspense } from "react";
import { CommentForm } from "@/components/blog/comment-form";
import { getApprovedComments, type PublicComment, type PublicReply } from "@/lib/comments/public";
import { cn } from "@/lib/utils";

/**
 * Comments under a post. Loaded from the database at render; if the database
 * is unreachable the article must still render, so any failure becomes a
 * quiet notice instead of an error page. Bodies are plain text only.
 */

const COMMENT_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Kampala",
});

function CommentItem({ comment, reply = false }: { comment: PublicReply; reply?: boolean }) {
  return (
    <article className={cn("comment", reply && "comment-reply", comment.isOwner && "comment-owner")}>
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-foreground text-[0.98rem] font-medium">{comment.authorName}</p>
        {comment.isOwner ? <span className="comment-badge">Author</span> : null}
        <time dateTime={comment.createdAt.toISOString()} className="text-muted-foreground font-mono text-[0.78rem] tabular-nums">
          {COMMENT_DATE.format(comment.createdAt)}
        </time>
      </header>
      <p className="text-ink-soft mt-2 text-[1rem] leading-relaxed break-words whitespace-pre-line">{comment.body}</p>
    </article>
  );
}

function CommentThread({ comment }: { comment: PublicComment }) {
  return (
    <li>
      <CommentItem comment={comment} />
      {comment.replies.length > 0 ? (
        <ul className="comment-replies" aria-label={`Replies to ${comment.authorName}`}>
          {comment.replies.map((reply) => (
            <li key={reply.id}>
              <CommentItem comment={reply} reply />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

async function CommentList({ slug }: { slug: string }) {
  let comments: PublicComment[];
  try {
    comments = await getApprovedComments(slug);
  } catch {
    return <p className="text-muted-foreground mt-8">Comments are unavailable right now.</p>;
  }
  if (comments.length === 0) {
    return <p className="text-muted-foreground mt-8">No comments yet.</p>;
  }
  return (
    <ol className="mt-8 space-y-8" aria-label="Comments">
      {comments.map((comment) => (
        <CommentThread key={comment.id} comment={comment} />
      ))}
    </ol>
  );
}

export async function CommentsSection({ slug }: { slug: string }) {
  return (
    <section aria-labelledby="comments-heading" id="comments" className="border-rule mt-16 border-t pt-12">
      <h2 id="comments-heading" className="font-display text-[2rem] leading-tight tracking-[-0.01em]">
        Comments
      </h2>
      <p className="text-muted-foreground mt-2 max-w-[60ch] text-[0.95rem]">
        Every comment is read before it appears here. Be kind and stay on topic; your email is never published.
      </p>

      <Suspense
        fallback={
          <p role="status" className="text-muted-foreground mt-8">
            Loading comments...
          </p>
        }
      >
        <CommentList slug={slug} />
      </Suspense>

      <div className="border-rule mt-12 border-t pt-10">
        <h3 className="font-display text-[1.6rem] leading-tight">Leave a comment</h3>
        <div className="mt-6">
          <CommentForm postSlug={slug} />
        </div>
      </div>
    </section>
  );
}
