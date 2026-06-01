"use client";

import { useState } from "react";
import { dismissReport, lockJobFromReport } from "@/lib/admin/actions";
import type { AdminReport } from "@/lib/admin/data";
import { AlertTriangle, Lock, XCircle } from "lucide-react";

export function AdminReportsClient({ reports }: { reports: AdminReport[] }) {
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; error?: string } | null>(null);

  async function handleDismiss(report: AdminReport) {
    setPending(report.id);
    const result = await dismissReport(report.id, report.job_title);
    if (result?.error) setFeedback({ id: report.id, error: result.error });
    setPending(null);
  }

  async function handleLock(report: AdminReport) {
    const reason = prompt(`Lock job "${report.job_title}"? Optional reason:`);
    if (reason === null) return;
    setPending(report.id);
    const result = await lockJobFromReport(report.id, report.job_id, report.job_title, reason || undefined);
    if (result?.error) setFeedback({ id: report.id, error: result.error });
    setPending(null);
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center text-neutral-400 shadow-sm">
        No pending job reports.
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
        Pending Job Reports ({reports.length})
      </h2>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="px-5 py-3 text-left font-semibold text-neutral-600">Job</th>
              <th className="px-5 py-3 text-left font-semibold text-neutral-600">Reporter</th>
              <th className="px-5 py-3 text-left font-semibold text-neutral-600">Reason</th>
              <th className="px-5 py-3 text-left font-semibold text-neutral-600">Date</th>
              <th className="px-5 py-3 text-right font-semibold text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="px-5 py-3.5 font-medium text-neutral-900">{report.job_title}</td>
                <td className="px-5 py-3.5 text-neutral-500">{report.reporter_name}</td>
                <td className="max-w-xs truncate px-5 py-3.5 text-neutral-600">{report.reason}</td>
                <td className="whitespace-nowrap px-5 py-3.5 text-xs text-neutral-400">
                  {new Date(report.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {feedback?.id === report.id && feedback.error && (
                    <span className="mr-2 text-xs text-red-600">
                      <AlertTriangle className="inline h-3 w-3" /> {feedback.error}
                    </span>
                  )}
                  <div className="inline-flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDismiss(report)}
                      disabled={pending === report.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {pending === report.id ? "..." : "Dismiss"}
                    </button>
                    <button
                      onClick={() => handleLock(report)}
                      disabled={pending === report.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      {pending === report.id ? "..." : "Lock Job"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
