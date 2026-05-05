import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAdminStats } from "@/lib/admin/data";
import {
  Users, Building2, Briefcase, ClipboardList,
  AlertTriangle, ShieldOff, Lock, CheckCircle2,
  TrendingUp, Activity,
} from "lucide-react";
import Link from "next/link";

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; bar: string; text: string }> = {
  applied:              { label: "Applied",         bar: "bg-blue-400",   text: "text-blue-700" },
  under_review:         { label: "Under Review",    bar: "bg-amber-400",  text: "text-amber-700" },
  shortlisted:          { label: "Shortlisted",     bar: "bg-emerald-400",text: "text-emerald-700" },
  assessment_sent:      { label: "Assessment Sent", bar: "bg-purple-400", text: "text-purple-700" },
  assessment_completed: { label: "Assess. Done",    bar: "bg-teal-400",   text: "text-teal-700" },
  rejected:             { label: "Rejected",        bar: "bg-red-400",    text: "text-red-700" },
};

const AUDIT_COLORS: Record<string, string> = {
  lock_job:         "bg-red-100 text-red-700",
  unlock_job:       "bg-green-100 text-green-700",
  activate_job:     "bg-green-100 text-green-700",
  deactivate_job:   "bg-amber-100 text-amber-700",
  verify_company:   "bg-blue-100 text-blue-700",
  unverify_company: "bg-neutral-100 text-neutral-500",
  block_user:       "bg-red-100 text-red-700",
  unblock_user:     "bg-green-100 text-green-700",
  suspend_user:     "bg-amber-100 text-amber-700",
  unsuspend_user:   "bg-green-100 text-green-700",
  review_report:    "bg-blue-100 text-blue-700",
  dismiss_report:   "bg-neutral-100 text-neutral-500",
};

function auditLabel(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const s = await getAdminStats();

  // Stat cards
  const statCards = [
    {
      label: "Total Users",
      value: s.totalUsers,
      sub: `${s.blockedUsers} blocked · ${s.suspendedUsers} suspended`,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      href: "/admin/users",
    },
    {
      label: "Total Companies",
      value: s.totalCompanies,
      sub: `${s.verifiedCompanies} verified · ${s.unverifiedCompanies} unverified`,
      icon: Building2,
      color: "from-purple-500 to-purple-600",
      href: "/admin/companies",
    },
    {
      label: "Total Jobs",
      value: s.totalJobs,
      sub: `${s.activeJobs} active · ${s.lockedJobs} locked`,
      icon: Briefcase,
      color: "from-[#006d43] to-[#00a86b]",
      href: "/admin/jobs",
    },
    {
      label: "Total Applications",
      value: s.totalApplications,
      sub: `Across all job listings`,
      icon: ClipboardList,
      color: "from-orange-500 to-orange-600",
      href: null,
    },
  ];

  // Needs attention
  const attention = [
    s.pendingReports > 0 && {
      label: `${s.pendingReports} pending report${s.pendingReports !== 1 ? "s" : ""} need review`,
      href: "/admin/reports",
      icon: AlertTriangle,
      style: "bg-red-50 border-red-200 text-red-700",
    },
    s.unverifiedCompanies > 0 && {
      label: `${s.unverifiedCompanies} company${s.unverifiedCompanies !== 1 ? "ies" : ""} awaiting verification`,
      href: "/admin/companies",
      icon: Building2,
      style: "bg-amber-50 border-amber-200 text-amber-700",
    },
    s.blockedUsers > 0 && {
      label: `${s.blockedUsers} blocked user${s.blockedUsers !== 1 ? "s" : ""} on the platform`,
      href: "/admin/users",
      icon: ShieldOff,
      style: "bg-neutral-50 border-neutral-200 text-neutral-600",
    },
  ].filter(Boolean) as { label: string; href: string; icon: any; style: string }[];

  // Application pipeline chart
  const statusOrder = ["applied", "under_review", "shortlisted", "assessment_sent", "assessment_completed", "rejected"];
  const maxStatusCount = Math.max(...statusOrder.map(s2 => s.statusCounts[s2] ?? 0), 1);
  const pipelineRows = statusOrder
    .map(key => ({ key, count: s.statusCounts[key] ?? 0, meta: STATUS_META[key] }))
    .filter(r => r.count > 0 || true); // show all statuses even if 0

  // Jobs health segments (stacked bar)
  const jobTotal = Math.max(s.totalJobs, 1);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-0.5">Platform overview — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color, href }) => {
          const inner = (
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-neutral-900">{value.toLocaleString()}</p>
                <p className="text-sm text-neutral-500">{label}</p>
                <p className="text-xs text-neutral-400 mt-1 truncate">{sub}</p>
              </div>
            </div>
          );
          return href ? <Link key={label} href={href}>{inner}</Link> : <div key={label}>{inner}</div>;
        })}
      </div>

      {/* ── Needs attention ── */}
      {attention.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Needs Attention</p>
          <div className="flex flex-col gap-2">
            {attention.map(({ label, href, icon: Icon, style }) => (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-opacity hover:opacity-80 ${style}`}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Application pipeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-neutral-400" />
            <h2 className="font-semibold text-neutral-800 text-sm">Application Pipeline</h2>
            <span className="ml-auto text-xs text-neutral-400">{s.totalApplications} total</span>
          </div>
          <div className="flex flex-col gap-3.5">
            {pipelineRows.map(({ key, count, meta }) => (
              <div key={key} className="flex items-center gap-3">
                <span className={`text-xs font-medium w-32 shrink-0 ${meta.text}`}>{meta.label}</span>
                <div className="flex-1 bg-neutral-100 rounded-full h-5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${meta.bar} transition-all`}
                    style={{ width: count === 0 ? "0%" : `${Math.max((count / maxStatusCount) * 100, 4)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-neutral-700 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
          {s.totalApplications === 0 && (
            <p className="text-sm text-neutral-400 text-center py-4">No applications yet.</p>
          )}
        </div>

        {/* Platform health */}
        <div className="flex flex-col gap-4">

          {/* Jobs health */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-neutral-400" />
              <h2 className="font-semibold text-neutral-800 text-sm">Jobs Health</h2>
            </div>
            {/* Stacked bar */}
            <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-4">
              {s.activeJobs > 0 && (
                <div className="bg-emerald-400 rounded-l-full" style={{ width: `${(s.activeJobs / jobTotal) * 100}%` }} title={`Active: ${s.activeJobs}`} />
              )}
              {s.inactiveJobs > 0 && (
                <div className="bg-neutral-300" style={{ width: `${(s.inactiveJobs / jobTotal) * 100}%` }} title={`Inactive: ${s.inactiveJobs}`} />
              )}
              {s.lockedJobs > 0 && (
                <div className="bg-red-400 rounded-r-full" style={{ width: `${(s.lockedJobs / jobTotal) * 100}%` }} title={`Locked: ${s.lockedJobs}`} />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Active",   count: s.activeJobs,   dot: "bg-emerald-400" },
                { label: "Inactive", count: s.inactiveJobs, dot: "bg-neutral-300" },
                { label: "Locked",   count: s.lockedJobs,   dot: "bg-red-400" },
              ].map(({ label, count, dot }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-neutral-500">
                    <span className={`w-2.5 h-2.5 rounded-full ${dot}`} /> {label}
                  </span>
                  <span className="font-semibold text-neutral-700">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Company verification */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-neutral-400" />
              <h2 className="font-semibold text-neutral-800 text-sm">Company Verification</h2>
            </div>
            <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-4">
              {s.verifiedCompanies > 0 && (
                <div className="bg-blue-400" style={{ width: `${(s.verifiedCompanies / Math.max(s.totalCompanies, 1)) * 100}%` }} />
              )}
              {s.unverifiedCompanies > 0 && (
                <div className="bg-amber-300" style={{ width: `${(s.unverifiedCompanies / Math.max(s.totalCompanies, 1)) * 100}%` }} />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Verified",   count: s.verifiedCompanies,   dot: "bg-blue-400" },
                { label: "Unverified", count: s.unverifiedCompanies, dot: "bg-amber-300" },
              ].map(({ label, count, dot }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-neutral-500">
                    <span className={`w-2.5 h-2.5 rounded-full ${dot}`} /> {label}
                  </span>
                  <span className="font-semibold text-neutral-700">{count}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Recent admin activity ── */}
      {s.recentAudit.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-800 text-sm">Recent Admin Activity</h2>
            <Link href="/admin/audit-log" className="text-xs text-[#006d43] hover:underline font-medium">View all</Link>
          </div>
          <div className="flex flex-col divide-y divide-neutral-100">
            {s.recentAudit.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 py-2.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${AUDIT_COLORS[entry.action] ?? "bg-neutral-100 text-neutral-500"}`}>
                  {auditLabel(entry.action)}
                </span>
                <span className="text-sm text-neutral-600 truncate flex-1">{entry.target}</span>
                <span className="text-xs text-neutral-400 shrink-0">{entry.admin_name}</span>
                <span className="text-xs text-neutral-300 shrink-0 w-14 text-right">{timeAgo(entry.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
