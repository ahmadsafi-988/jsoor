import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { ForumPostSummary, ForumRole } from "@/lib/forums/data";

function timeLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function excerpt(value: string, length = 260) {
  return value.length > length ? `${value.slice(0, length).trim()}...` : value;
}

function authorHref({
  role,
  username,
  realUsername,
  authorId,
  isAnonymous,
}: {
  role?: string;
  username: string | null;
  realUsername?: string | null;
  authorId: string;
  isAnonymous: boolean;
}) {
  if (role === "admin") {
    return `/admin/users/${(isAnonymous ? realUsername : username) ?? authorId}`;
  }
  if (isAnonymous || !username) return null;
  return `/job-seeker/profile/${username}`;
}

export function CommunityPostCard({
  post,
  role,
  showCommunity = true,
}: {
  post: ForumPostSummary;
  role?: ForumRole | string | null;
  showCommunity?: boolean;
}) {
  const postHref = `/forums/${post.forum_slug}/posts/${post.id}`;
  const href = authorHref({
    role: role ?? undefined,
    username: post.author_username,
    realUsername: post.real_author_username,
    authorId: post.author_id,
    isAnonymous: post.is_anonymous,
  });
  const label = role === "admin" && post.is_anonymous && post.real_author_display
    ? post.real_author_display
    : post.author_display;

  return (
    <article className="group grid overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white shadow-sm transition-all hover:border-[#006d43]/25 hover:shadow-[0_16px_32px_rgba(0,109,67,0.08)] sm:grid-cols-[180px_1fr] xl:grid-cols-[200px_1fr]">
      <Link href={postHref} className="block aspect-[4/3] overflow-hidden bg-[#f6f3f2] sm:aspect-square">
        {post.first_image_url ? (
          <img src={post.first_image_url} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
        ) : (
          <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#006d43] via-[#008a55] to-[#00c47a]">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-black/5" />
            <div className="absolute left-1/2 top-1/3 h-12 w-12 rounded-full bg-white/5" />
          </div>
        )}
      </Link>
      <div className="flex min-w-0 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#5f5e5e]">
          {showCommunity && (
            <Link href={`/forums/${post.forum_slug}`} className="rounded-full bg-[#78fbb6]/20 px-2.5 py-1 font-semibold text-[#006d43] hover:underline">
              {post.forum_name}
            </Link>
          )}
          {href ? (
            <Link href={href} className="font-semibold text-[#1c1b1b] hover:text-[#006d43] hover:underline">
              {label}
            </Link>
          ) : (
            <span className="font-semibold text-[#1c1b1b]">{label}</span>
          )}
          <span>{timeLabel(post.created_at)}</span>
          {role === "admin" && post.is_anonymous && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
              Posted anonymously
            </span>
          )}
          <span className="ml-auto inline-flex h-8 min-w-11 items-center justify-center rounded-full border border-[#e5e2e1] bg-white px-3 text-sm font-bold text-[#006d43] shadow-sm">
            {post.score}
          </span>
        </div>

        <div>
          <Link href={postHref}>
            <h3 className="line-clamp-2 text-lg font-bold text-[#1c1b1b] group-hover:text-[#006d43]">
              {post.title}
            </h3>
          </Link>
          {post.body && (
            <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[#5f5e5e]">
              {excerpt(post.body)}
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-[#5f5e5e]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f6f3f2] px-2.5 py-1 font-semibold">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.comment_count}
          </span>
        </div>
      </div>
    </article>
  );
}
