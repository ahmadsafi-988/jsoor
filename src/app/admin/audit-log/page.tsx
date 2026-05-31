import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAuditLog } from "@/lib/admin/data";

const ACTION_LABELS: Record<string, string> = {
  lock_job: "Locked job",
  unlock_job: "Unlocked job",
  verify_company: "Verified company",
  unverify_company: "Unverified company",
  request_company_changes: "Requested company changes",
  reject_company: "Rejected company",
  block_user: "Blocked user",
  unblock_user: "Unblocked user",
  suspend_user: "Suspended user",
  unsuspend_user: "Unsuspended user",
  review_report: "Marked report reviewed",
  dismiss_report: "Dismissed report",
  lock_job_from_report: "Locked job (from report)",
  create_forum: "Created forum",
  activate_forum: "Activated forum",
  deactivate_forum: "Deactivated forum",
  approve_forum_request: "Approved forum request",
  reject_forum_request: "Rejected forum request",
  hide_forum_post: "Hid forum post",
  unhide_forum_post: "Unhid forum post",
  delete_forum_post: "Deleted forum post",
  hide_forum_comment: "Hid forum comment",
  unhide_forum_comment: "Unhid forum comment",
  delete_forum_comment: "Deleted forum comment",
  review_forum_report: "Marked forum report reviewed",
  dismiss_forum_report: "Dismissed forum report",
};

const ACTION_COLORS: Record<string, string> = {
  lock_job: "bg-red-100 text-red-700",
  lock_job_from_report: "bg-red-100 text-red-700",
  block_user: "bg-red-100 text-red-700",
  suspend_user: "bg-yellow-100 text-yellow-700",
  verify_company: "bg-green-100 text-green-700",
  unlock_job: "bg-green-100 text-green-700",
  unblock_user: "bg-green-100 text-green-700",
  unsuspend_user: "bg-green-100 text-green-700",
  review_report: "bg-blue-100 text-blue-700",
  review_forum_report: "bg-blue-100 text-blue-700",
  dismiss_report: "bg-neutral-100 text-neutral-500",
  dismiss_forum_report: "bg-neutral-100 text-neutral-500",
  unverify_company: "bg-neutral-100 text-neutral-500",
  request_company_changes: "bg-amber-100 text-amber-700",
  reject_company: "bg-red-100 text-red-700",
  create_forum: "bg-green-100 text-green-700",
  activate_forum: "bg-green-100 text-green-700",
  approve_forum_request: "bg-green-100 text-green-700",
  reject_forum_request: "bg-red-100 text-red-700",
  deactivate_forum: "bg-neutral-100 text-neutral-500",
  hide_forum_post: "bg-red-100 text-red-700",
  delete_forum_post: "bg-red-100 text-red-700",
  hide_forum_comment: "bg-red-100 text-red-700",
  delete_forum_comment: "bg-red-100 text-red-700",
  unhide_forum_post: "bg-green-100 text-green-700",
  unhide_forum_comment: "bg-green-100 text-green-700",
};

export default async function AdminAuditLogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const logs = await getAuditLog();

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Audit Log</h1>
      <p className="text-neutral-500 text-sm mb-8">Full history of all admin actions (last 200)</p>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="text-left px-5 py-3 font-semibold text-neutral-600">When</th>
              <th className="text-left px-5 py-3 font-semibold text-neutral-600">Admin</th>
              <th className="text-left px-5 py-3 font-semibold text-neutral-600">Action</th>
              <th className="text-left px-5 py-3 font-semibold text-neutral-600">Target</th>
              <th className="text-left px-5 py-3 font-semibold text-neutral-600">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-5 py-3.5 text-neutral-400 text-xs whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-5 py-3.5 text-neutral-700 font-medium">{log.admin_name}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] ?? "bg-neutral-100 text-neutral-600"}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-neutral-600 max-w-xs truncate">{log.target_label}</td>
                <td className="px-5 py-3.5 text-neutral-400 max-w-xs truncate">{log.reason ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-neutral-400">No actions recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
