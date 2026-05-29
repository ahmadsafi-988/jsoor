import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Tables } from "@/lib/supabase_generated_types";

export type AdminJob = Tables<"jobs"> & { company_name: string };
export type AdminCompany = Tables<"companies">;
export type AdminUser = Pick<Tables<"profiles">, "id" | "first_name" | "last_name" | "username" | "role" | "avatar_url" | "is_blocked" | "is_suspended" | "suspension_reason" | "joined_date">;
export type AdminReport = Tables<"job_reports"> & { job_title: string; reporter_name: string; };
export type AdminAuditLog = Tables<"admin_audit_logs"> & { admin_name: string };

export async function getAdminStats() {
  const supabase = await createClient();
  // Service role bypasses RLS — needed for job_applications which restricts reads to applicant/company only
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const [usersRes, companiesRes, jobsRes, applicationsRes, pendingReportsRes, auditRes] = await Promise.all([
    supabase.from("profiles").select("is_blocked, is_suspended").neq("role", "admin"),
    supabase.from("companies").select("is_verified"),
    supabase.from("jobs").select("is_active, admin_locked"),
    service.from("job_applications").select("status"),
    supabase.from("job_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("admin_audit_logs")
      .select("id, action, target, created_at, admin:profiles!admin_audit_logs_admin_id_fkey(first_name, last_name, username)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const users    = usersRes.data ?? [];
  const companies = companiesRes.data ?? [];
  const jobs      = jobsRes.data ?? [];
  const apps      = applicationsRes.data ?? [];

  // Users
  const totalUsers      = users.length;
  const blockedUsers    = users.filter(u => u.is_blocked).length;
  const suspendedUsers  = users.filter(u => u.is_suspended).length;

  // Companies
  const totalCompanies      = companies.length;
  const verifiedCompanies   = companies.filter(c => c.is_verified).length;
  const unverifiedCompanies = totalCompanies - verifiedCompanies;

  // Jobs
  const totalJobs    = jobs.length;
  const activeJobs   = jobs.filter(j => j.is_active && !j.admin_locked).length;
  const inactiveJobs = jobs.filter(j => !j.is_active && !j.admin_locked).length;
  const lockedJobs   = jobs.filter(j => j.admin_locked).length;

  // Applications by status
  const statusCounts: Record<string, number> = {};
  for (const app of apps) {
    statusCounts[app.status] = (statusCounts[app.status] ?? 0) + 1;
  }

  // Recent audit
  const recentAudit = ((auditRes.data ?? []) as any[]).map(l => {
    const a = l.admin;
    const name = a ? `${a.first_name} ${a.last_name}`.trim() || a.username || "Admin" : "Admin";
    return { id: l.id, action: l.action as string, target: l.target as string, created_at: l.created_at as string, admin_name: name };
  });

  return {
    totalUsers, blockedUsers, suspendedUsers,
    totalCompanies, verifiedCompanies, unverifiedCompanies,
    totalJobs, activeJobs, inactiveJobs, lockedJobs,
    totalApplications: apps.length,
    statusCounts,
    pendingReports: pendingReportsRes.count ?? 0,
    recentAudit,
  };
}

export async function getAllJobs(): Promise<AdminJob[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*, company:companies!jobs_company_id_fkey(name)")
    .order("created_at", { ascending: false });

  return ((data ?? []) as any[]).map((j) => ({
    ...j,
    company_name: j.company?.name ?? "Unknown",
  }));
}

export async function getAllCompanies(): Promise<AdminCompany[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, username, role, avatar_url, is_blocked, is_suspended, suspension_reason, joined_date")
    .neq("role", "admin")
    .order("joined_date", { ascending: false });
  return (data ?? []) as AdminUser[];
}

export async function getAllReports(): Promise<AdminReport[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_reports")
    .select("*, job:jobs!job_reports_job_id_fkey(title), reporter:profiles!job_reports_reported_by_fkey(first_name, last_name, username)")
    .order("created_at", { ascending: false });

  return ((data ?? []) as any[]).map((r) => {
    const rep = r.reporter;
    const fullName = rep ? `${rep.first_name} ${rep.last_name}`.trim() : "";
    const reporter_name = fullName || rep?.username || "Unknown";
    return { ...r, job_title: r.job?.title ?? "Unknown job", reporter_name };
  });
}

export async function getAuditLog(): Promise<AdminAuditLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_audit_logs")
    .select("*, admin:profiles!admin_audit_logs_admin_id_fkey(first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return ((data ?? []) as any[]).map((l) => ({
    ...l,
    admin_name: l.admin ? `${l.admin.first_name} ${l.admin.last_name}` : "Unknown",
  }));
}
