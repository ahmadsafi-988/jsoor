"use client";

import { useState } from "react";
import { markReportReviewed, dismissReport, lockJobFromReport } from "@/lib/admin/actions";
import type { AdminReport } from "@/lib/admin/data";
import { CheckCircle, XCircle, Lock, AlertTriangle } from "lucide-react";

const STATUS_ORDER = ["pending", "reviewed", "dismissed"] as const;
const STATUS_LABELS: Record<string, string> = { pending: "Pending", reviewed: "Reviewed", dismissed: "Dismissed" };
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  reviewed: "bg-blue-100 text-blue-700",
  dismissed: "bg-neutral-100 text-neutral-500",
};

export function AdminReportsClient({ reports }: { reports: AdminReport[] }) {
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; error?: string } | null>(null);

  async function handleReview(r: AdminReport) {
    setPending(r.id);
    const result = await markReportReviewed(r.id, r.job_title);
    if (result?.error) setFeedback({ id: r.id, error: result.error });
    setPending(null);
  }

  async function handleDismiss(r: AdminReport) {
    setPending(r.id);
    const result = await dismissReport(r.id, r.job_title);
    if (result?.error) setFeedback({ id: r.id, error: result.error });
    setPending(null);
  }

  async function handleLock(r: AdminReport) {
    const reason = prompt(`Lock job "${r.job_title}" — reason (optional):`);
    if (reason === null) return;
    setPending(r.id);
    const result = await lockJobFromReport(r.id, r.job_id, r.job_title, reason || undefined);
    if (result?.error) setFeedback({ id: r.id, error: result.error });
    setPending(null);
  }

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: reports.filter((r) => r.status === status),
  })).filter((g) => g.items.length > 0);

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-neutral-400 shadow-sm">
        No reports submitted yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map(({ status, items }) => (
        <div key={status}>
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            {STATUS_LABELS[status]} ({items.length})
          </h2>
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">Job</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">Reporter</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">Reason</th>
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">Date</th>
                  <th className="text-right px-5 py-3 font-semibold text-neutral-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3.5 font-medium text-neutral-900">{r.job_title}</td>
                    <td className="px-5 py-3.5 text-neutral-500">{r.reporter_name}</td>
                    <td className="px-5 py-3.5 text-neutral-600 max-w-xs truncate">{r.reason}</td>
                    <td className="px-5 py-3.5 text-neutral-400 text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {feedback?.id === r.id && feedback.error && (
                        <span className="text-xs text-red-600 mr-2"><AlertTriangle className="inline w-3 h-3" /> {feedback.error}</span>
                      )}
                      {status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleReview(r)} disabled={pending === r.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition-colors disabled:opacity-50">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {pending === r.id ? "…" : "Review"}
                          </button>
                          <button onClick={() => handleDismiss(r)} disabled={pending === r.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 text-xs font-medium transition-colors disabled:opacity-50">
                            <XCircle className="w-3.5 h-3.5" />
                            {pending === r.id ? "…" : "Dismiss"}
                          </button>
                          <button onClick={() => handleLock(r)} disabled={pending === r.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition-colors disabled:opacity-50">
                            <Lock className="w-3.5 h-3.5" />
                            {pending === r.id ? "…" : "Lock Job"}
                          </button>
                        </div>
                      )}
                      {status !== "pending" && (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
                          {STATUS_LABELS[status]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
