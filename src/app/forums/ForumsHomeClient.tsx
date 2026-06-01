"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ImageIcon,
  Clock3,
  Flame,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { joinForum, leaveForum, requestForumCreation } from "@/lib/forums/actions";
import type { ForumListItem, ForumPostSummary, ForumRequestItem, ForumRole } from "@/lib/forums/data";
import { uploadCommunityImage } from "@/lib/storage/upload";
import { CommunityAvatar } from "./CommunityAvatar";
import { CommunityPostCard } from "./CommunityPostCard";

type TabKey = "communities" | "following" | "popular";
const TABS: Array<{ value: TabKey; label: string; icon: typeof Users }> = [
  { value: "communities", label: "All Communities", icon: Users },
  { value: "following", label: "My Feed", icon: MessageCircle },
  { value: "popular", label: "Popular Posts", icon: Flame },
];

function formatActivity(value: string | null) {
  if (!value) return "No activity yet";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusMeta(status: string) {
  if (status === "approved") return { icon: CheckCircle2, className: "bg-green-100 text-green-700", label: "Approved" };
  if (status === "rejected") return { icon: XCircle, className: "bg-red-100 text-red-700", label: "Rejected" };
  return { icon: Clock3, className: "bg-amber-100 text-amber-700", label: "Pending" };
}

function canParticipate(role: ForumRole | null) {
  return role === "job_seeker" || role === "company";
}

function ForumRequestModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      if (imageFile) {
        const upload = await uploadCommunityImage(imageFile);
        if ("error" in upload) {
          setError(upload.error);
          return;
        }
        formData.set("image_url", upload.url);
      } else {
        formData.set("image_url", "");
      }

      const result = await requestForumCreation(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setImageFile(null);
      setImagePreview(null);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-neutral-200 bg-white">
        <DialogHeader>
          <DialogTitle>Request Community</DialogTitle>
          <DialogDescription>
            Suggest a focused space for career questions, preparation, or peer support.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Your request was submitted and admins have been notified.
          </div>
        ) : (
          <form action={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                Community name
              </label>
              <input
                name="name"
                maxLength={80}
                required
                placeholder="Interview Prep"
                className="w-full rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006d43]/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                Description
              </label>
              <textarea
                name="description"
                maxLength={400}
                required
                rows={3}
                placeholder="A place to share interview questions, mock practice tips, and prep resources."
                className="w-full resize-none rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006d43]/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                Community image
              </label>
              <input type="hidden" name="image_url" value="" />
              <div className="flex items-center gap-3 rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] p-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-[#5f5e5e]">
                  {imagePreview ? (
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${imagePreview})` }}
                    />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="community_image_request"
                    className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#e5e2e1] bg-white px-3 py-1.5 text-sm font-semibold text-[#3d4a41] transition-colors hover:bg-[#f6f3f2]"
                  >
                    Choose image
                  </label>
                  <input
                    id="community_image_request"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setImageFile(file);
                      setImagePreview(file ? URL.createObjectURL(file) : null);
                    }}
                  />
                  <p className="mt-1 truncate text-xs text-[#5f5e5e]">
                    {imageFile ? imageFile.name : "Optional. JPG, PNG or WebP, max 2 MB."}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                Reason for admin
              </label>
              <textarea
                name="reason"
                maxLength={500}
                required
                rows={3}
                placeholder="Why would this community help JSOOR users?"
                className="w-full resize-none rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006d43]/20"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-gradient-to-br from-[#006d43] to-[#00a86b] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,109,67,0.15)] transition-all hover:brightness-110 disabled:opacity-60"
              >
                {isPending ? "Submitting..." : "Submit Request"}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function JoinButton({ forum, role }: { forum: ForumListItem; role: ForumRole | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!canParticipate(role)) return null;

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = forum.is_joined
        ? await leaveForum(forum.id, forum.slug)
        : await joinForum(forum.id, forum.slug);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
          forum.is_joined
            ? "border border-[#bccabe] bg-white text-[#006d43] hover:bg-[#f6f3f2]"
            : "bg-[#006d43] text-white hover:bg-[#005735]"
        }`}
      >
        {isPending ? "Saving..." : forum.is_joined ? "Joined" : "Join"}
      </button>
      {error && <span className="max-w-36 text-right text-[11px] text-red-600">{error}</span>}
    </div>
  );
}

function CommunityCard({ forum, role }: { forum: ForumListItem; role: ForumRole | null }) {
  return (
    <div className="group rounded-2xl border border-[#e5e2e1] bg-white p-5 shadow-sm transition-all hover:border-[#006d43]/25 hover:shadow-[0_16px_32px_rgba(0,109,67,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <CommunityAvatar name={forum.name} imageUrl={forum.image_url} />
          <div className="min-w-0">
            <Link
              href={`/forums/${forum.slug}`}
              className="block truncate text-base font-bold text-[#1c1b1b] group-hover:text-[#006d43]"
            >
              {forum.name}
            </Link>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#5f5e5e]">
              {forum.description}
            </p>
          </div>
        </div>
        <JoinButton forum={forum} role={role} />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-[#f0edec] pt-4 text-xs text-[#5f5e5e]">
        <span className="rounded-full bg-[#f6f3f2] px-2.5 py-1 font-semibold">
          {forum.post_count} posts
        </span>
        <span className="rounded-full bg-[#f6f3f2] px-2.5 py-1 font-semibold">
          {forum.comment_count} comments
        </span>
        <span className="rounded-full bg-[#f6f3f2] px-2.5 py-1 font-semibold">
          {forum.member_count} members
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-neutral-400">
          <MessageCircle className="h-3.5 w-3.5" />
          {formatActivity(forum.latest_activity_at)}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[#e5e2e1] bg-white p-12 text-center shadow-sm">
      <Sparkles className="mx-auto mb-3 h-10 w-10 text-[#006d43]/40" />
      <p className="font-semibold text-[#1c1b1b]">{title}</p>
      <p className="mt-1 text-sm text-[#5f5e5e]">{body}</p>
    </div>
  );
}

export function ForumsHomeClient({
  forums,
  requests,
  role,
  followingPosts,
  popularPosts,
}: {
  forums: ForumListItem[];
  requests: ForumRequestItem[];
  role: ForumRole | null;
  followingPosts: ForumPostSummary[];
  popularPosts: ForumPostSummary[];
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("communities");
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const filteredForums = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return forums;
    return forums.filter(
      (forum) =>
        forum.name.toLowerCase().includes(q) ||
        forum.description.toLowerCase().includes(q),
    );
  }, [forums, search]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Communities</h1>
          <p className="mt-1 text-sm text-[#5f5e5e]">
            Spaces for career questions, preparation, hiring insight, and peer support.
          </p>
        </div>
        {canParticipate(role) && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setRequestsOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#bccabe] bg-white px-4 py-2.5 text-sm font-semibold text-[#006d43] transition-colors hover:bg-[#f6f3f2]"
            >
              <Clock3 className="h-4 w-4" />
              My Requests
            </button>
            <button
              onClick={() => setRequestOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#006d43] to-[#00a86b] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,109,67,0.15)] transition-all hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Request Community
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#e5e2e1] bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                activeTab === value
                  ? "bg-[#006d43] text-white"
                  : "text-[#5f5e5e] hover:bg-[#f6f3f2] hover:text-[#1c1b1b]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        {activeTab === "communities" && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search communities..."
              className="w-full rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] py-2.5 pl-10 pr-4 text-sm text-[#1c1b1b] outline-none transition-all focus:ring-2 focus:ring-[#006d43]/20"
            />
          </div>
        )}
      </div>

      {activeTab === "communities" && (
        filteredForums.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredForums.map((forum) => (
              <CommunityCard key={forum.id} forum={forum} role={role} />
            ))}
          </div>
        ) : (
          <EmptyState title="No communities found" body="Try a different search term." />
        )
      )}

      {activeTab === "following" && (
        followingPosts.length > 0 ? (
          <div className="grid gap-5">
            {followingPosts.map((post) => (
              <CommunityPostCard key={post.id} post={post} role={role} />
            ))}
          </div>
        ) : (
          <EmptyState title="No posts in your feed yet" body="Join a community to start filling this feed." />
        )
      )}

      {activeTab === "popular" && (
        popularPosts.length > 0 ? (
          <div className="grid gap-5">
            {popularPosts.map((post) => (
              <CommunityPostCard key={post.id} post={post} role={role} />
            ))}
          </div>
        ) : (
          <EmptyState title="No popular posts yet" body="Community activity will appear here once posts get votes or comments." />
        )
      )}

      <ForumRequestModal open={requestOpen} onOpenChange={setRequestOpen} />
      <Dialog open={requestsOpen} onOpenChange={setRequestsOpen}>
        <DialogContent className="rounded-2xl border-neutral-200 bg-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>My Community Requests</DialogTitle>
            <DialogDescription>Track community requests you have sent to admins.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[520px] overflow-y-auto divide-y divide-[#f0edec]">
            {requests.map((request) => {
              const meta = statusMeta(request.status);
              const Icon = meta.icon;
              return (
                <div key={request.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-[#1c1b1b]">{request.name}</p>
                      <p className="mt-0.5 text-sm text-[#5f5e5e]">{request.description}</p>
                      {request.status === "rejected" && request.admin_reason && (
                        <p className="mt-2 text-sm text-red-600">Admin reason: {request.admin_reason}</p>
                      )}
                    </div>
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
            {requests.length === 0 && (
              <p className="py-8 text-center text-sm text-neutral-400">No community requests yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
