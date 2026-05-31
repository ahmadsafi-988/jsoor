import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpDown, Plus, Search, Users } from "lucide-react";
import { DashboardBackButton } from "@/components/app/DashboardBackButton";
import { CommunityJoinButton } from "../CommunityJoinButton";
import { CommunityPostCard } from "../CommunityPostCard";
import { getForumFeedData } from "@/lib/forums/data";

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

  const canParticipate = role === "job_seeker" || role === "company";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 py-8">
      <DashboardBackButton fallbackHref="/forums" label="Back to Communities" className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#006d43] transition-colors hover:text-[#005735]" />
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
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#5f5e5e]">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f6f3f2] px-2.5 py-1">
                  <Users className="h-3.5 w-3.5" />
                  {forum.member_count} members
                </span>
                <span className="rounded-full bg-[#f6f3f2] px-2.5 py-1">
                  {forum.post_count} posts
                </span>
                <span className="rounded-full bg-[#f6f3f2] px-2.5 py-1">
                  {forum.comment_count} comments
                </span>
              </div>
            </div>
          </div>
          {canParticipate && (
            <div className="flex flex-wrap items-center gap-2">
              <CommunityJoinButton forumId={forum.id} forumSlug={forum.slug} isJoined={forum.is_joined} compact />
              <Link
                href={`/forums/${forum.slug}/new`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#006d43] to-[#00a86b] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,109,67,0.15)] transition-all hover:brightness-110"
              >
                <Plus className="h-4 w-4" />
                Create Post
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#e5e2e1] bg-white p-4 shadow-sm md:flex-row md:items-center">
        <form className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search posts in this community..."
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

      <div className="grid gap-5">
        {posts.map((post) => (
          <CommunityPostCard key={post.id} post={post} role={role} showCommunity={false} />
        ))}
        {posts.length === 0 && (
          <div className="rounded-2xl border border-[#e5e2e1] bg-white p-12 text-center text-sm text-neutral-400 shadow-sm">
            No posts found in this community yet.
          </div>
        )}
      </div>
    </div>
  );
}
