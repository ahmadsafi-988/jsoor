"use client";

import { useState } from "react";
import { lockJob, unlockJob } from "@/lib/admin/actions";
import type { AdminJob } from "@/lib/admin/data";
import { Lock, Unlock, AlertTriangle } from "lucide-react";

export function AdminJobsClient({ jobs }: { jobs: AdminJob[] }) {
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; error?: string } | null>(null);

  async function handleLock(job: AdminJob) {
    const reason = prompt(`Reason for locking "${job.title}" (optional):`);
    if (reason === null) return;
    setPending(job.id);
    const result = await lockJob(job.id, job.title, reason || undefined);
    if (result?.error) setFeedback({ id: job.id, error: result.error });
    setPending(null);
  }

  async function handleUnlock(job: AdminJob) {
    setPending(job.id);
    const result = await unlockJob(job.id, job.title);
    if (result?.error) setFeedback({ id: job.id, error: result.error });
    setPending(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50">
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Title</th>
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Company</th>
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Type</th>
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Status</th>
            <th className="text-right px-5 py-3 font-semibold text-neutral-600">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {jobs.map((job) => (
            <tr key={job.id} className={job.admin_locked ? "bg-red-50/50" : ""}>
              <td className="px-5 py-3.5 font-medium text-neutral-900 max-w-xs truncate">
                {job.title}
                {job.admin_locked && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-600 font-normal">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </td>
              <td className="px-5 py-3.5 text-neutral-600">{job.company_name}</td>
              <td className="px-5 py-3.5 text-neutral-500">{job.type}</td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  !job.is_active ? "bg-neutral-100 text-neutral-500" :
                  job.admin_locked ? "bg-red-100 text-red-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {job.admin_locked ? "Admin Locked" : job.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right">
                {feedback?.id === job.id && feedback.error && (
                  <span className="text-xs text-red-600 mr-2"><AlertTriangle className="inline w-3 h-3" /> {feedback.error}</span>
                )}
                {job.admin_locked ? (
                  <button
                    onClick={() => handleUnlock(job)}
                    disabled={pending === job.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    {pending === job.id ? "Unlocking…" : "Unlock"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleLock(job)}
                    disabled={pending === job.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {pending === job.id ? "Locking…" : "Lock"}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {jobs.length === 0 && (
            <tr><td colSpan={5} className="px-5 py-10 text-center text-neutral-400">No jobs found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
