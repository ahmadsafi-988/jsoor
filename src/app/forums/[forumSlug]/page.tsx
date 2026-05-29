import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpDown, MessageCircle, Plus, Search } from "lucide-react";
import { getForumFeedData } from "@/lib/forums/data";

function timeLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function excerpt(value: string) {
  return value.length > 180 ? `${value.slice(0, 180).trim()}...` : value;
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

export default async function ForumFeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ forumSlug: string }>;
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const { forumSlug } = await params;
  const { sort = "newest", q = "" } = await searchParams;
  const data = await getForumFeedData(forumSlug, { sort, query: q });
  if (!data) notFound();

  const { forum, posts, role } = data;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-8">
      <section className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#78fbb6]/20 text-xl font-bold text-[#006d43]">
              {forum.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1c1b1b]">{forum.name}</h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5f5e5e]">
                {forum.description}
              </p>
            </div>
          </div>
          {role === "job_seeker" && (
            <Link
              href={`/forums/${forum.slug}/new`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#006d43] to-[#00a86b] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,109,67,0.15)] transition-all hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Create Post
            </Link>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#e5e2e1] bg-white p-4 shadow-sm md:flex-row md:items-center">
        <form className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search posts in this forum..."
            className="w-full rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] py-2.5 pl-10 pr-4 text-sm text-[#1c1b1b] outline-none focus:ring-2 focus:ring-[#006d43]/20"
          />
          <input type="hidden" name="sort" value={sort} />
        </form>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-neutral-400" />
          {[
            ["newest", "Newest"],
            ["top", "Top"],
            ["commented", "Most Commented"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={`/forums/${forum.slug}?sort=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                sort === value
                  ? "bg-[#006d43] text-white"
                  : "bg-[#f6f3f2] text-[#5f5e5e] hover:bg-[#e5e2e1]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/forums/${forum.slug}/posts/${post.id}`}
            className="group rounded-2xl border border-[#e5e2e1] bg-white p-5 shadow-sm transition-all hover:border-[#006d43]/25 hover:shadow-[0_14px_28px_rgba(0,109,67,0.07)]"
          >
            <div className="flex gap-4">
              <div className="shrink-0">
                <span className="inline-flex h-9 min-w-12 items-center justify-center rounded-full border border-[#e5e2e1] bg-white px-3 text-sm font-bold text-[#006d43] shadow-sm">
                  {post.score}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[#1c1b1b] group-hover:text-[#006d43]">
                      {post.title}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5f5e5e]">
                      {(() => {
                        const href = authorHref({
                          role,
                          username: post.author_username,
                          realUsername: post.real_author_username,
                          authorId: post.author_id,
                          isAnonymous: post.is_anonymous,
                        });
                        const label = role === "admin" && post.is_anonymous && post.real_author_display
                          ? post.real_author_display
                          : post.author_display;
                        return href ? (
                          <Link href={href} className="font-semibold text-[#1c1b1b] hover:text-[#006d43] hover:underline">
                            {label}
                          </Link>
                        ) : (
                          <span className="font-semibold text-[#1c1b1b]">{label}</span>
                        );
                      })()}
                      {role === "admin" && post.is_anonymous && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                          Posted anonymously
                        </span>
                      )}
                      <span>{timeLabel(post.created_at)}</span>
                    </div>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#f6f3f2] px-2.5 py-1 text-xs font-semibold text-[#5f5e5e]">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {post.comment_count}
                  </span>
                </div>
                {post.body && (
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#5f5e5e]">
                    {excerpt(post.body)}
                  </p>
                )}
                {post.first_image_url && (
                  <div className="mt-4 h-40 overflow-hidden rounded-xl border border-[#e5e2e1] bg-[#f6f3f2]">
                    <img src={post.first_image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
        {posts.length === 0 && (
          <div className="rounded-2xl border border-[#e5e2e1] bg-white p-12 text-center text-sm text-neutral-400 shadow-sm">
            No posts found in this forum yet.
          </div>
        )}
      </div>
    </div>
  );
}
