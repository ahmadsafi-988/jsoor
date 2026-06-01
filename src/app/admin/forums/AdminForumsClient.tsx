"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  MessageSquareWarning,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  adminDeleteForum,
  adminModerateForumContent,
  adminResolveForumDeletionRequest,
  adminResolveForumReport,
  adminSetForumActive,
  approveForumRequest,
  createForumDirect,
  rejectForumRequest,
} from "@/lib/forums/actions";
import type { AdminForumsDashboard } from "@/lib/forums/data";

function statusClass(status: string) {
  if (status === "approved" || status === "reviewed") return "bg-green-100 text-green-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  if (status === "dismissed") return "bg-neutral-100 text-neutral-500";
  return "bg-amber-100 text-amber-700";
}

export function AdminForumsClient({ data }: { data: AdminForumsDashboard }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(id: string, action: () => Promise<{ success: true; id?: string } | { error: string }>) {
    setFeedback(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await action();
      if ("error" in result) setFeedback(result.error);
      else router.refresh();
      setPendingId(null);
    });
  }

  function submitCreate(formData: FormData) {
    run("create", () => createForumDirect(formData));
  }

  return (
    <div className="flex flex-col gap-8">
      {feedback && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {feedback}
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-[#006d43]" />
          <h2 className="font-bold text-neutral-900">Create Community</h2>
        </div>
        <form action={submitCreate} className="grid gap-3 lg:grid-cols-[220px_1fr_auto]">
          <input
            name="name"
            required
            maxLength={80}
            placeholder="Community name"
            className="rounded-xl border border-neutral-200 bg-[#f6f3f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006d43]/20"
          />
          <input
            name="description"
            required
            maxLength={400}
            placeholder="Description"
            className="rounded-xl border border-neutral-200 bg-[#f6f3f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006d43]/20"
          />
          <button
            disabled={pendingId === "create" && isPending}
            className="rounded-xl bg-[#006d43] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Create
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Community Requests
        </h2>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Requester</th>
                <th className="px-5 py-3 font-semibold">Reason</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-neutral-900">{request.name}</p>
                    <p className="max-w-sm truncate text-xs text-neutral-500">{request.description}</p>
                    {request.admin_reason && (
                      <p className="mt-1 text-xs text-red-600">Reason: {request.admin_reason}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-neutral-600">
                    <Link href={`/admin/users/${request.requester_username ?? request.requested_by}`} className="hover:text-[#006d43] hover:underline">
                      {request.requester_name}
                    </Link>
                  </td>
                  <td className="max-w-xs truncate px-5 py-4 text-neutral-500">{request.reason}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {request.status === "pending" ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => run(request.id, () => approveForumRequest(request.id))}
                          disabled={pendingId === request.id && isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt(`Reject "${request.name}"? Optional reason:`);
                            if (reason === null) return;
                            run(request.id, () => rejectForumRequest(request.id, reason));
                          }}
                          disabled={pendingId === request.id && isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-neutral-400">
                    No community requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Community Deletion Requests
        </h2>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Community</th>
                <th className="px-5 py-3 font-semibold">Requester</th>
                <th className="px-5 py-3 font-semibold">Reason</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.deletionRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-5 py-4">
                    {request.forum_slug ? (
                      <Link href={`/forums/${request.forum_slug}`} className="font-semibold text-neutral-900 hover:text-[#006d43] hover:underline">
                        {request.forum_name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-neutral-500">{request.forum_name}</span>
                    )}
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {request.created_at ? new Date(request.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">
                    <Link href={`/admin/users/${request.requester_username ?? request.requester_id}`} className="hover:text-[#006d43] hover:underline">
                      {request.requester_name}
                    </Link>
                  </td>
                  <td className="max-w-md px-5 py-4 text-neutral-500">
                    {request.reason || <span className="text-neutral-400">No reason provided.</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (!confirm(`Delete "${request.forum_name}" and all of its posts?`)) return;
                          run(`${request.id}-approve-delete`, () => adminResolveForumDeletionRequest(request.id, "approved"));
                        }}
                        disabled={pendingId === `${request.id}-approve-delete` && isPending}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Approve Delete
                      </button>
                      <button
                        onClick={() => run(`${request.id}-dismiss-delete`, () => adminResolveForumDeletionRequest(request.id, "dismissed"))}
                        disabled={pendingId === `${request.id}-dismiss-delete` && isPending}
                        className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.deletionRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-neutral-400">
                    No community deletion requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Communities
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.forums.map((forum) => (
            <div key={forum.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-neutral-900">{forum.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{forum.description}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${forum.is_active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>
                  {forum.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
                <span>{forum.post_count} posts</span>
                <span>{forum.comment_count} comments</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                <Link href={`/forums/${forum.slug}`} className="text-xs font-semibold text-[#006d43] hover:underline">
                  View community
                </Link>
                <button
                  onClick={() => run(forum.id, () => adminSetForumActive(forum.id, !forum.is_active, forum.name))}
                  className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-200"
                >
                  {forum.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {forum.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`Delete "${forum.name}" and all of its posts?`)) return;
                    run(`${forum.id}-delete`, () => adminDeleteForum(forum.id, forum.name));
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="reported-content" className="scroll-mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          <MessageSquareWarning className="h-4 w-4" />
          Reported Community Content
        </h2>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Content</th>
                <th className="px-5 py-3 font-semibold">Author</th>
                <th className="px-5 py-3 font-semibold">Reporter</th>
                <th className="px-5 py-3 font-semibold">Reason</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      {report.target_href ? (
                        <Link href={report.target_href} className="max-w-xs truncate font-semibold text-neutral-900 hover:text-[#006d43] hover:underline">
                          {report.target_label}
                        </Link>
                      ) : (
                        <span className="max-w-xs truncate font-semibold text-neutral-500">{report.target_label}</span>
                      )}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
                          {report.target_type}
                        </span>
                        {report.target_is_anonymous && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Posted anonymously
                          </span>
                        )}
                        {report.target_is_hidden && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">
                    <Link href={`/admin/users/${report.target_author_username ?? report.target_author_id ?? ""}`} className="hover:text-[#006d43] hover:underline">
                      {report.target_author_name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{report.reporter_name}</td>
                  <td className="max-w-xs truncate px-5 py-4 text-neutral-500">{report.reason}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex flex-wrap justify-end gap-1">
                      <button
                        onClick={() => {
                          const reason = report.target_is_hidden ? undefined : prompt("Hide reason (optional):") ?? undefined;
                          run(`${report.id}-hide`, () =>
                            adminModerateForumContent(
                              report.target_type as "post" | "comment",
                              report.target_id,
                              report.target_is_hidden ? "unhide" : "hide",
                              report.target_label,
                              reason,
                            ),
                          );
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-200"
                      >
                        {report.target_is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {report.target_is_hidden ? "Unhide" : "Hide"}
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm("Delete this content?")) return;
                          run(`${report.id}-delete`, () =>
                            adminModerateForumContent(
                              report.target_type as "post" | "comment",
                              report.target_id,
                              "delete",
                              report.target_label,
                              undefined,
                            ),
                          );
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                      <button
                        onClick={() => run(`${report.id}-dismiss`, () => adminResolveForumReport(report.id, "dismissed", report.target_label))}
                        className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-200"
                      >
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-neutral-400">
                    No community reports submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isPending && pendingId && (
        <div className="fixed bottom-5 right-5 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-lg">
          <AlertTriangle className="h-4 w-4 text-[#006d43]" />
          Updating...
        </div>
      )}
    </div>
  );
}
