"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Forbidden.");
  return { supabase, adminId: user.id };
}

async function logAdminAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  targetLabel: string,
  reason?: string,
) {
  await supabase.from("admin_audit_logs").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    target_label: targetLabel,
    reason: reason ?? null,
  });
}

// ─── Job actions ──────────────────────────────────────────────────────────────

export async function lockJob(jobId: string, title: string, reason?: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("jobs").update({ admin_locked: true }).eq("id", jobId);
  if (error) return { error: error.message };
  await logAdminAction(supabase, adminId, "lock_job", "job", jobId, title, reason);
  revalidatePath("/admin/jobs");
  revalidatePath("/job-seeker/home");
  return { success: true };
}

export async function unlockJob(jobId: string, title: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("jobs").update({ admin_locked: false }).eq("id", jobId);
  if (error) return { error: error.message };
  await logAdminAction(supabase, adminId, "unlock_job", "job", jobId, title);
  revalidatePath("/admin/jobs");
  revalidatePath("/job-seeker/home");
  return { success: true };
}

// ─── Company actions ──────────────────────────────────────────────────────────

export async function verifyCompany(companyId: string, name: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("companies").update({ is_verified: true }).eq("id", companyId);
  if (error) return { error: error.message };
  await logAdminAction(supabase, adminId, "verify_company", "company", companyId, name);
  revalidatePath("/admin/companies");
  return { success: true };
}

export async function unverifyCompany(companyId: string, name: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("companies").update({ is_verified: false }).eq("id", companyId);
  if (error) return { error: error.message };
  await logAdminAction(supabase, adminId, "unverify_company", "company", companyId, name);
  revalidatePath("/admin/companies");
  return { success: true };
}

// ─── User actions ─────────────────────────────────────────────────────────────

export async function blockUser(userId: string, label: string, reason?: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("profiles").update({ is_blocked: true }).eq("id", userId);
  if (error) return { error: error.message };
  await logAdminAction(supabase, adminId, "block_user", "user", userId, label, reason);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function unblockUser(userId: string, label: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("profiles").update({ is_blocked: false }).eq("id", userId);
  if (error) return { error: error.message };
  await logAdminAction(supabase, adminId, "unblock_user", "user", userId, label);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function suspendUser(userId: string, label: string, reason: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ is_suspended: true, suspension_reason: reason })
    .eq("id", userId);
  if (error) return { error: error.message };
  await logAdminAction(supabase, adminId, "suspend_user", "user", userId, label, reason);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function unsuspendUser(userId: string, label: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ is_suspended: false, suspension_reason: null })
    .eq("id", userId);
  if (error) return { error: error.message };
  await logAdminAction(supabase, adminId, "unsuspend_user", "user", userId, label);
  revalidatePath("/admin/users");
  return { success: true };
}

// ─── Report actions ───────────────────────────────────────────────────────────

export async function markReportReviewed(reportId: string, jobTitle: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("job_reports").update({ status: "reviewed" }).eq("id", reportId);
  if (error) return { error: error.message };
  await logAdminAction(supabase, adminId, "review_report", "report", reportId, jobTitle);
  revalidatePath("/admin/reports");
  return { success: true };
}

export async function dismissReport(reportId: string, jobTitle: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("job_reports").update({ status: "dismissed" }).eq("id", reportId);
  if (error) return { error: error.message };
  await logAdminAction(supabase, adminId, "dismiss_report", "report", reportId, jobTitle);
  revalidatePath("/admin/reports");
  return { success: true };
}

export async function lockJobFromReport(reportId: string, jobId: string, jobTitle: string, reason?: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error: lockErr } = await supabase.from("jobs").update({ admin_locked: true }).eq("id", jobId);
  if (lockErr) return { error: lockErr.message };
  const { error: reviewErr } = await supabase.from("job_reports").update({ status: "reviewed" }).eq("id", reportId);
  if (reviewErr) return { error: reviewErr.message };
  await logAdminAction(supabase, adminId, "lock_job_from_report", "job", jobId, jobTitle, reason);
  revalidatePath("/admin/reports");
  revalidatePath("/admin/jobs");
  revalidatePath("/job-seeker/home");
  return { success: true };
}
