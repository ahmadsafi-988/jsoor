"use client";

import { useState } from "react";
import Link from "next/link";
import { blockUser, unblockUser, suspendUser, unsuspendUser } from "@/lib/admin/actions";
import type { AdminUser } from "@/lib/admin/data";
import { ShieldOff, ShieldCheck, PauseCircle, PlayCircle, AlertTriangle } from "lucide-react";

export function AdminUsersClient({ users }: { users: AdminUser[] }) {
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; error?: string } | null>(null);

  function userLabel(u: AdminUser) {
    return `${u.first_name} ${u.last_name} (@${u.username})`;
  }

  async function handleBlock(u: AdminUser) {
    const reason = prompt(`Reason for banning ${userLabel(u)} (optional):`);
    if (reason === null) return;
    setPending(u.id);
    const result = await blockUser(u.id, userLabel(u), reason || undefined);
    if (result?.error) setFeedback({ id: u.id, error: result.error });
    setPending(null);
  }

  async function handleUnblock(u: AdminUser) {
    setPending(u.id);
    const result = await unblockUser(u.id, userLabel(u));
    if (result?.error) setFeedback({ id: u.id, error: result.error });
    setPending(null);
  }

  async function handleSuspend(u: AdminUser) {
    const reason = prompt(`Reason for suspending ${userLabel(u)}:`);
    if (!reason?.trim()) return;
    setPending(u.id);
    const result = await suspendUser(u.id, userLabel(u), reason.trim());
    if (result?.error) setFeedback({ id: u.id, error: result.error });
    setPending(null);
  }

  async function handleUnsuspend(u: AdminUser) {
    setPending(u.id);
    const result = await unsuspendUser(u.id, userLabel(u));
    if (result?.error) setFeedback({ id: u.id, error: result.error });
    setPending(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50">
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">User</th>
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Role</th>
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Status</th>
            <th className="text-right px-5 py-3 font-semibold text-neutral-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {users.map((u) => (
            <tr key={u.id} className={u.is_blocked ? "bg-red-50/40" : u.is_suspended ? "bg-yellow-50/40" : ""}>
              <td className="px-5 py-3.5">
                <div>
                  <Link
                    href={`/admin/users/${u.username || u.id}`}
                    className="font-medium text-neutral-900 hover:text-[#006d43] hover:underline"
                  >
                    {u.first_name} {u.last_name}
                  </Link>
                  <p className="text-xs text-neutral-500">@{u.username}</p>
                  {u.is_suspended && u.suspension_reason && (
                    <p className="text-xs text-yellow-700 mt-0.5">Suspended: {u.suspension_reason}</p>
                  )}
                </div>
              </td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  u.role === "company" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {u.role === "company" ? "Company" : "Job Seeker"}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  u.is_blocked ? "bg-red-100 text-red-700" :
                  u.is_suspended ? "bg-yellow-100 text-yellow-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {u.is_blocked ? "Banned" : u.is_suspended ? "Suspended" : "Active"}
                </span>
              </td>
              <td className="px-5 py-3.5">
                {feedback?.id === u.id && feedback.error && (
                  <span className="text-xs text-red-600 mr-2"><AlertTriangle className="inline w-3 h-3" /> {feedback.error}</span>
                )}
                <div className="flex items-center justify-end gap-2">
                  {u.is_blocked ? (
                    <button onClick={() => handleUnblock(u)} disabled={pending === u.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors disabled:opacity-50">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {pending === u.id ? "…" : "Unban"}
                    </button>
                  ) : (
                    <button onClick={() => handleBlock(u)} disabled={pending === u.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition-colors disabled:opacity-50">
                      <ShieldOff className="w-3.5 h-3.5" />
                      {pending === u.id ? "…" : "Ban"}
                    </button>
                  )}
                  {u.is_suspended ? (
                    <button onClick={() => handleUnsuspend(u)} disabled={pending === u.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors disabled:opacity-50">
                      <PlayCircle className="w-3.5 h-3.5" />
                      {pending === u.id ? "…" : "Unsuspend"}
                    </button>
                  ) : (
                    !u.is_blocked && (
                      <button onClick={() => handleSuspend(u)} disabled={pending === u.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 text-xs font-medium transition-colors disabled:opacity-50">
                        <PauseCircle className="w-3.5 h-3.5" />
                        {pending === u.id ? "…" : "Suspend"}
                      </button>
                    )
                  )}
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={4} className="px-5 py-10 text-center text-neutral-400">No users found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
