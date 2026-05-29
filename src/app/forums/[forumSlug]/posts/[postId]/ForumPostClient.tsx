"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Flag,
  Loader2,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  createForumComment,
  deleteOwnForumComment,
  deleteOwnForumPost,
  reportForumTarget,
  updateOwnForumComment,
  updateOwnForumPost,
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
    <div className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#5f5e5e] hover:bg-red-50 hover:text-red-600"
      >
        <Flag className="h-3.5 w-3.5" />
        Report
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-[#e5e2e1] bg-white p-3 shadow-sm">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Describe the issue..."
            className="w-full resize-none rounded-lg border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#5f5e5e] hover:bg-[#f6f3f2]">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={isPending || !reason.trim()}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {isPending ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}
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
    if (!confirm("Delete this comment?")) return;
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
                <button onClick={remove} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
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
  const router = useRouter();
  const [editingPost, setEditingPost] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [anonymous, setAnonymous] = useState(post.is_anonymous);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canEdit = userId === post.author_id;
  const href = `/forums/${forum.slug}/posts/${post.id}`;

  function updatePost(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateOwnForumPost(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setEditingPost(false);
        router.refresh();
      }
    });
  }

  function deletePost() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteOwnForumPost(post.id, forum.slug);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-8 py-8">
      <Link href={`/forums/${forum.slug}`} className="text-sm font-semibold text-[#006d43] hover:underline">
        Back to {forum.name}
      </Link>

      <article className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
        <div>
          <div className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                {editingPost ? (
                  <form action={updatePost} className="space-y-4">
                    <input type="hidden" name="post_id" value={post.id} />
                    <input type="hidden" name="forum_slug" value={forum.slug} />
                    <input
                      name="title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      maxLength={160}
                      className="w-full rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2.5 text-lg font-bold outline-none focus:ring-2 focus:ring-[#006d43]/20"
                    />
                    <textarea
                      name="body"
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      rows={8}
                      maxLength={8000}
                      className="w-full resize-y rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006d43]/20"
                    />
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#5f5e5e]">
                      <input name="is_anonymous" type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} className="h-4 w-4 accent-[#006d43]" />
                      Keep anonymous
                    </label>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingPost(false)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[#5f5e5e] hover:bg-[#f6f3f2]">
                        Cancel
                      </button>
                      <button type="submit" disabled={isPending || !title.trim() || !body.trim()} className="rounded-lg bg-[#006d43] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {!editingPost && (
                <div className="flex flex-wrap items-center gap-1">
                  <ReportButton targetType="post" targetId={post.id} />
                  {canEdit && (
                    <>
                      <button onClick={() => setEditingPost(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#5f5e5e] hover:bg-[#f6f3f2]">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button onClick={deletePost} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {error && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            )}

            {!editingPost && post.body && (
              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#3d4a41]">{post.body}</p>
            )}

            {post.images.length > 0 && (
              <div className="mt-6 flex snap-x gap-3 overflow-x-auto pb-2">
                {post.images.map((image) => (
                  <div
                    key={image.id}
                    className="aspect-video min-w-full snap-center overflow-hidden rounded-2xl border border-[#e5e2e1] bg-[#f6f3f2] sm:min-w-[78%]"
                  >
                    {image.signed_url && (
                      <img src={image.signed_url} alt={image.alt_text ?? ""} className="h-full w-full object-contain" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!editingPost && (
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
            )}
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
