"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, MessageCircle, Plus, Search, Sparkles, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requestForumCreation } from "@/lib/forums/actions";
import type { ForumListItem, ForumRequestItem, ForumRole } from "@/lib/forums/data";

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

function ForumRequestModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await requestForumCreation(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-neutral-200 bg-white">
        <DialogHeader>
          <DialogTitle>Create Forum</DialogTitle>
          <DialogDescription>
            Suggest a student-friendly space for conversations, questions, and shared advice.
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
                Forum name
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
                Reason for admin
              </label>
              <textarea
                name="reason"
                maxLength={500}
                required
                rows={3}
                placeholder="Why would this forum help JSOOR students?"
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

export function ForumsHomeClient({
  forums,
  requests,
  role,
}: {
  forums: ForumListItem[];
  requests: ForumRequestItem[];
  role: ForumRole | null;
}) {
  const [search, setSearch] = useState("");
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
          <h1 className="text-2xl font-bold text-neutral-900">Forums</h1>
          <p className="mt-1 text-sm text-[#5f5e5e]">
            Community spaces for career questions, preparation, and student support.
          </p>
        </div>
        {role === "job_seeker" && (
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
              Create Forum
            </button>
          </div>
        )}
      </div>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search forums..."
          className="w-full rounded-full border border-[#e5e2e1] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1c1b1b] outline-none transition-all focus:ring-2 focus:ring-[#006d43]/20"
        />
      </div>

      {filteredForums.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredForums.map((forum) => (
            <Link
              key={forum.id}
              href={`/forums/${forum.slug}`}
              className="group rounded-2xl border border-[#e5e2e1] bg-white p-5 shadow-sm transition-all hover:border-[#006d43]/25 hover:shadow-[0_16px_32px_rgba(0,109,67,0.08)]"
            >
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#78fbb6]/20 text-lg font-bold text-[#006d43]">
                  {forum.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-[#1c1b1b] group-hover:text-[#006d43]">
                    {forum.name}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#5f5e5e]">
                    {forum.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-[#f0edec] pt-4 text-xs text-[#5f5e5e]">
                <span className="rounded-full bg-[#f6f3f2] px-2.5 py-1 font-semibold">
                  {forum.post_count} posts
                </span>
                <span className="rounded-full bg-[#f6f3f2] px-2.5 py-1 font-semibold">
                  {forum.comment_count} comments
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-neutral-400">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {formatActivity(forum.latest_activity_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#e5e2e1] bg-white p-12 text-center shadow-sm">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-[#006d43]/40" />
          <p className="font-semibold text-[#1c1b1b]">No forums found</p>
          <p className="mt-1 text-sm text-[#5f5e5e]">Try a different search term.</p>
        </div>
      )}

      <ForumRequestModal open={requestOpen} onOpenChange={setRequestOpen} />
      <Dialog open={requestsOpen} onOpenChange={setRequestsOpen}>
        <DialogContent className="rounded-2xl border-neutral-200 bg-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>My Forum Requests</DialogTitle>
            <DialogDescription>Track forum requests you have sent to admins.</DialogDescription>
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
              <p className="py-8 text-center text-sm text-neutral-400">No forum requests yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
