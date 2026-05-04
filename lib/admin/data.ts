import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase_generated_types";

export type AdminJob = Tables<"jobs"> & { company_name: string };
export type AdminCompany = Tables<"companies">;
export type AdminUser = Pick<Tables<"profiles">, "id" | "first_name" | "last_name" | "username" | "role" | "avatar_url" | "is_blocked" | "is_suspended" | "suspension_reason" | "joined_date">;
export type AdminReport = Tables<"job_reports"> & { job_title: string; reporter_name: string };
export type AdminAuditLog = Tables<"admin_audit_logs"> & { admin_name: string };

export async function getAdminStats() {
  const supabase = await createClient();
  const [users, companies, jobs, applications] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin"),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase.from("job_applications").select("id", { count: "exact", head: true }),
  ]);
  return {
    users: users.count ?? 0,
    companies: companies.count ?? 0,
    jobs: jobs.count ?? 0,
    applications: applications.count ?? 0,
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
    .select("*, job:jobs!job_reports_job_id_fkey(title), reporter:profiles!job_reports_reporter_id_fkey(first_name, last_name)")
    .order("created_at", { ascending: false });

  return ((data ?? []) as any[]).map((r) => ({
    ...r,
    job_title: r.job?.title ?? "Unknown job",
    reporter_name: r.reporter ? `${r.reporter.first_name} ${r.reporter.last_name}` : "Unknown",
  }));
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
