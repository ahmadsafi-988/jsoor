"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Flag,
  Loader2,
  Maximize2,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardBackButton } from "@/components/app/DashboardBackButton";
import {
  createForumComment,
  deleteOwnForumComment,
  deleteOwnForumPost,
  reportForumTarget,
  updateOwnForumComment,
  voteForumTarget,
} from "@/lib/forums/actions";
import type { ForumCommentItem, ForumPostDetail } from "@/lib/forums/data";
import type { Tables } from "@/lib/supabase_generated_types";

function timeLabel(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function VoteControls({
  score,
  currentVote,
  targetType,
  targetId,
  href,
  orientation = "horizontal",
}: {
  score: number;
  currentVote: number | null;
  targetType: "post" | "comment";
  targetId: string;
  href: string;
  orientation?: "horizontal" | "vertical";
}) {
  const [pendingValue, setPendingValue] = useState<number | null>(null);
  const [optimisticScore, setOptimisticScore] = useState(score);
  const [optimisticVote, setOptimisticVote] = useState(currentVote);

  async function vote(value: 1 | -1) {
    const previousVote = optimisticVote ?? 0;
    const nextValue = optimisticVote === value ? 0 : value;
    const previousScore = optimisticScore;

    setOptimisticVote(nextValue === 0 ? null : nextValue);
    setOptimisticScore((current) => current - previousVote + nextValue);
    setPendingValue(value);
    const result = await voteForumTarget(targetType, targetId, nextValue, href);
    setPendingValue(null);
    if ("error" in result) {
      setOptimisticVote(previousVote === 0 ? null : previousVote);
      setOptimisticScore(previousScore);
    }
  }

  const isVertical = orientation === "vertical";

  return (
    <div
      className={`inline-flex shrink-0 items-center rounded-full border border-[#e5e2e1] bg-white shadow-sm ${
        isVertical ? "w-9 flex-col py-1" : "h-9 px-1"
      }`}
    >
      <button
        onClick={() => vote(1)}
        disabled={pendingValue !== null}
        className={`rounded-full p-1 transition-colors ${
          optimisticVote === 1
            ? "bg-[#78fbb6]/25 text-[#006d43]"
            : "text-[#5f5e5e] hover:bg-[#f6f3f2] hover:text-[#006d43]"
        }`}
        title={optimisticVote === 1 ? "Remove upvote" : "Upvote"}
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <span className="min-w-7 text-center text-sm font-bold text-[#1c1b1b]">{optimisticScore}</span>
      <button
        onClick={() => vote(-1)}
        disabled={pendingValue !== null}
        className={`rounded-full p-1 transition-colors ${
          optimisticVote === -1
            ? "bg-red-50 text-red-600"
            : "text-[#5f5e5e] hover:bg-[#f6f3f2] hover:text-red-600"
        }`}
        title={optimisticVote === -1 ? "Remove downvote" : "Downvote"}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

function authorHref({
  viewerRole,
  username,
  realUsername,
  authorId,
  isAnonymous,
}: {
  viewerRole?: string;
  username: string | null;
  realUsername?: string | null;
  authorId: string;
  isAnonymous: boolean;
}) {
  if (viewerRole === "admin") {
    return `/admin/users/${(isAnonymous ? realUsername : username) ?? authorId}`;
  }
  if (isAnonymous) {
    return null;
  }
  return username ? `/job-seeker/profile/${username}` : null;
}

function AuthorLine({
  display,
  username,
  realDisplay,
  realUsername,
  authorId,
  isAnonymous,
  createdAt,
  viewerRole,
}: {
  display: string;
  username: string | null;
  realDisplay?: string;
  realUsername?: string | null;
  authorId: string;
  isAnonymous: boolean;
  createdAt: string;
  viewerRole?: string;
}) {
  const href = authorHref({ viewerRole, username, realUsername, authorId, isAnonymous });

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-[#5f5e5e]">
      {!href || (isAnonymous && !realDisplay) ? (
        <span className="font-semibold text-[#1c1b1b]">{display}</span>
      ) : (
        <Link href={href} className="font-semibold text-[#1c1b1b] hover:text-[#006d43] hover:underline">
          {realDisplay && isAnonymous ? realDisplay : display}
        </Link>
      )}
      {realDisplay && isAnonymous && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
          Posted anonymously
        </span>
      )}
      <span>{timeLabel(createdAt)}</span>
    </div>
  );
}

function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "post" | "comment";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await reportForumTarget(targetType, targetId, reason);
      if ("error" in result) {
        setMessage(result.error);
      } else {
        setMessage("Report submitted.");
        setReason("");
        setOpen(false);
      }
    });
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#5f5e5e] hover:bg-red-50 hover:text-red-600"
      >
        <Flag className="h-3.5 w-3.5" />
        Report
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-[#e5e2e1] bg-white">
          <DialogHeader>
            <DialogTitle>Report {targetType}</DialogTitle>
            <DialogDescription>
              Tell admins what looks wrong. Reports are reviewed before action is taken.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Describe the issue..."
            className="w-full resize-none rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200"
          />
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#5f5e5e] hover:bg-[#f6f3f2]">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={isPending || !reason.trim()}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isPending ? "Submitting..." : "Submit Report"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {message && <p className="mt-1 text-xs text-[#5f5e5e]">{message}</p>}
    </div>
  );
}

function CommentForm({
  postId,
  forumSlug,
  parentCommentId,
  onDone,
}: {
  postId: string;
  forumSlug: string;
  parentCommentId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createForumComment(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setBody("");
      setAnonymous(false);
      onDone?.();
      router.refresh();
    });
  }

  return (
    <form action={submit} className="space-y-3">
      <input type="hidden" name="post_id" value={postId} />
      <input type="hidden" name="forum_slug" value={forumSlug} />
      {parentCommentId && <input type="hidden" name="parent_comment_id" value={parentCommentId} />}
      <textarea
        name="body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={parentCommentId ? 3 : 4}
        maxLength={2000}
        placeholder={parentCommentId ? "Write a reply..." : "Add a comment..."}
        className="w-full resize-none rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006d43]/20"
      />
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-[#5f5e5e]">
          <input
            name="is_anonymous"
            type="checkbox"
            checked={anonymous}
            onChange={(event) => setAnonymous(event.target.checked)}
            className="h-4 w-4 accent-[#006d43]"
          />
          Comment anonymously
        </label>
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#006d43] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {parentCommentId ? "Reply" : "Comment"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

function CommentItem({
  comment,
  postId,
  forumSlug,
  userId,
  viewerRole,
}: {
  comment: ForumCommentItem;
  postId: string;
  forumSlug: string;
  userId: string | null;
  viewerRole?: string;
}) {
  const router = useRouter();
  const [replyOpen, setReplyOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [editAnonymous, setEditAnonymous] = useState(comment.is_anonymous);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canEdit = userId === comment.author_id;

  function update(formData: FormData) {
    startTransition(async () => {
      const result = await updateOwnForumComment(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteOwnForumComment(comment.id, postId, forumSlug);
      if ("error" in result) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-[#e5e2e1] bg-white p-4">
      <div className="flex gap-3">
        <VoteControls
          score={comment.score}
          currentVote={comment.current_user_vote}
          targetType="comment"
          targetId={comment.id}
          href={`/forums/${forumSlug}/posts/${postId}`}
          orientation="vertical"
        />
        <div className="min-w-0 flex-1">
          <AuthorLine
            display={comment.author_display}
            username={comment.author_username}
            realDisplay={comment.real_author_display}
            realUsername={comment.real_author_username}
            authorId={comment.author_id}
            isAnonymous={comment.is_anonymous}
            createdAt={comment.created_at}
            viewerRole={viewerRole}
          />

          {editing ? (
            <form action={update} className="mt-3 space-y-3">
              <input type="hidden" name="comment_id" value={comment.id} />
              <input type="hidden" name="post_id" value={postId} />
              <input type="hidden" name="forum_slug" value={forumSlug} />
              <textarea
                name="body"
                value={editBody}
                onChange={(event) => setEditBody(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006d43]/20"
              />
              <label className="flex items-center gap-2 text-xs font-semibold text-[#5f5e5e]">
                <input name="is_anonymous" type="checkbox" checked={editAnonymous} onChange={(event) => setEditAnonymous(event.target.checked)} className="h-4 w-4 accent-[#006d43]" />
                Keep anonymous
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#5f5e5e] hover:bg-[#f6f3f2]">
                  Cancel
                </button>
                <button type="submit" disabled={isPending || !editBody.trim()} className="rounded-lg bg-[#006d43] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                  Save
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#3d4a41]">{comment.body}</p>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!comment.parent_comment_id && (
              <button onClick={() => setReplyOpen((current) => !current)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#5f5e5e] hover:bg-[#f6f3f2]">
                <MessageCircle className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
            <ReportButton targetType="comment" targetId={comment.id} />
            {canEdit && (
              <>
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#5f5e5e] hover:bg-[#f6f3f2]">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-[#e5e2e1] bg-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the comment and any replies attached to it.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={remove} className="bg-red-600 text-white hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>

          {replyOpen && (
            <div className="mt-4 border-l-2 border-[#e5e2e1] pl-4">
              <CommentForm postId={postId} forumSlug={forumSlug} parentCommentId={comment.id} onDone={() => setReplyOpen(false)} />
            </div>
          )}

          {comment.replies.length > 0 && (
            <div className="mt-4 space-y-3 border-l-2 border-[#e5e2e1] pl-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} postId={postId} forumSlug={forumSlug} userId={userId} viewerRole={viewerRole} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostImageCarousel({ images }: { images: ForumPostDetail["images"] }) {
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  if (images.length === 0) return null;

  const active = images[index] ?? images[0];
  const canMove = images.length > 1;

  function previous() {
    setIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  }

  function next() {
    setIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  }

  return (
    <div className="mt-6">
      <div className="relative overflow-hidden rounded-2xl border border-[#e5e2e1] bg-[#f6f3f2]">
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="block aspect-video w-full cursor-zoom-in"
          aria-label="Open image viewer"
        >
          {active.signed_url && (
            <img src={active.signed_url} alt={active.alt_text ?? ""} className="h-full w-full object-contain" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1c1b1b] shadow-sm transition-colors hover:bg-white"
          aria-label="Open image viewer"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        {canMove && (
          <>
            <button
              type="button"
              onClick={previous}
              className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1c1b1b] shadow-sm transition-colors hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1c1b1b] shadow-sm transition-colors hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {canMove && (
        <div className="mt-3 flex justify-center gap-1.5">
          {images.map((image, itemIndex) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setIndex(itemIndex)}
              className={`h-2 rounded-full transition-all ${
                itemIndex === index ? "w-6 bg-[#006d43]" : "w-2 bg-[#d8d3d1]"
              }`}
              aria-label={`Show image ${itemIndex + 1}`}
            />
          ))}
        </div>
      )}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] border-0 bg-transparent p-0 shadow-none sm:max-w-[calc(100vw-3rem)] [&>button]:bg-white/90 [&>button]:text-[#1c1b1b]">
          <DialogTitle className="sr-only">Post image viewer</DialogTitle>
          <DialogDescription className="sr-only">
            Enlarged view of the selected post image.
          </DialogDescription>
          <div className="relative flex h-[min(86vh,900px)] w-full items-center justify-center rounded-2xl bg-black/85 p-4">
            {active.signed_url && (
              <img
                src={active.signed_url}
                alt={active.alt_text ?? ""}
                className="max-h-full max-w-full object-contain"
              />
            )}
            {canMove && (
              <>
                <button
                  type="button"
                  onClick={previous}
                  className="absolute left-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1c1b1b] shadow-sm transition-colors hover:bg-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1c1b1b] shadow-sm transition-colors hover:bg-white"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#1c1b1b]">
                  {index + 1} / {images.length}
                </span>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ForumPostClient({
  forum,
  post,
  userId,
  role,
}: {
  forum: Tables<"forums">;
  post: ForumPostDetail;
  userId: string | null;
  role?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canEdit = userId === post.author_id;
  const href = `/forums/${forum.slug}/posts/${post.id}`;

  function deletePost() {
    startTransition(async () => {
      const result = await deleteOwnForumPost(post.id, forum.slug);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-8 py-8">
      <DashboardBackButton fallbackHref={`/forums/${forum.slug}`} label={`Back to ${forum.name}`} className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#006d43] transition-colors hover:text-[#005735]" />

      <article className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
        <div>
          <div className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#1c1b1b]">{post.title}</h1>
                <div className="mt-2">
                  <AuthorLine
                    display={post.author_display}
                    username={post.author_username}
                    realDisplay={post.real_author_display}
                    realUsername={post.real_author_username}
                    authorId={post.author_id}
                    isAnonymous={post.is_anonymous}
                    createdAt={post.created_at}
                    viewerRole={role}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <ReportButton targetType="post" targetId={post.id} />
                {canEdit && (
                  <>
                    <Link href={`/forums/${forum.slug}/posts/${post.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#5f5e5e] hover:bg-[#f6f3f2]">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl border-[#e5e2e1] bg-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete post?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes the post, its comments, and attached images.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={deletePost} className="bg-red-600 text-white hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>

            {error && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            )}

            {post.body && (
              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#3d4a41]">{post.body}</p>
            )}

            <PostImageCarousel images={post.images} />

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#f0edec] pt-4">
              <VoteControls
                score={post.score}
                currentVote={post.current_user_vote}
                targetType="post"
                targetId={post.id}
                href={href}
              />
              <span className="text-xs font-semibold text-[#5f5e5e]">Score</span>
            </div>
          </div>
        </div>
      </article>

      <section className="rounded-2xl border border-[#e5e2e1] bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-[#1c1b1b]">
          <MessageCircle className="h-4 w-4 text-[#006d43]" />
          Comments ({post.comment_count})
        </h2>
        <CommentForm postId={post.id} forumSlug={forum.slug} />
      </section>

      <div className="space-y-4">
        {post.comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} postId={post.id} forumSlug={forum.slug} userId={userId} viewerRole={role} />
        ))}
        {post.comments.length === 0 && (
          <div className="rounded-2xl border border-[#e5e2e1] bg-white p-10 text-center text-sm text-neutral-400 shadow-sm">
            No comments yet.
          </div>
        )}
      </div>
    </div>
  );
}
