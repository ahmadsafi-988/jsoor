"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { companyVerificationTable } from "@/lib/company/verification";
import { insertNotification } from "@/lib/notifications/actions";

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

async function notifyCompanyAboutJobModeration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  adminId: string,
  jobId: string,
  fallbackTitle: string,
  locked: boolean,
  reason?: string,
) {
  const { data: job } = await supabase
    .from("jobs")
    .select("company_id, title")
    .eq("id", jobId)
    .maybeSingle();

  if (!job?.company_id) return;

  const jobTitle = job.title || fallbackTitle;
  await insertNotification({
    userId: job.company_id,
    actorId: adminId,
    type: locked ? "job_locked" : "job_unlocked",
    title: locked ? "Job Locked by Admin" : "Job Unlocked by Admin",
    body: locked
      ? `"${jobTitle}" was locked by an administrator and is hidden from job seekers.`
      : `"${jobTitle}" was unlocked by an administrator and can be shown to job seekers again.`,
    link: `/company/jobs/${jobId}`,
    jobId,
    entityType: "job",
    entityId: jobId,
    metadata: reason ? { reason } : {},
  });
}

// ─── Job actions ──────────────────────────────────────────────────────────────

export async function lockJob(jobId: string, title: string, reason?: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("jobs").update({ admin_locked: true }).eq("id", jobId);
  if (error) return { error: error.message };
  await notifyCompanyAboutJobModeration(supabase, adminId, jobId, title, true, reason);
  await logAdminAction(supabase, adminId, "lock_job", "job", jobId, title, reason);
  revalidatePath("/admin/jobs");
  revalidatePath("/job-seeker/home");
  return { success: true };
}

export async function unlockJob(jobId: string, title: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("jobs").update({ admin_locked: false }).eq("id", jobId);
  if (error) return { error: error.message };
  await notifyCompanyAboutJobModeration(supabase, adminId, jobId, title, false);
  await logAdminAction(supabase, adminId, "unlock_job", "job", jobId, title);
  revalidatePath("/admin/jobs");
  revalidatePath("/job-seeker/home");
  return { success: true };
}

// ─── Company actions ──────────────────────────────────────────────────────────

export async function approveCompany(companyId: string, name: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("companies").update({ is_verified: true }).eq("id", companyId);
  if (error) return { error: error.message };
  const { error: verificationError } = await companyVerificationTable(supabase)
    .update({
      verification_status: "approved",
      review_message: null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId);
  if (verificationError) return { error: verificationError.message };
  await logAdminAction(supabase, adminId, "verify_company", "company", companyId, name);
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/company/home");
  return { success: true };
}

export async function requestCompanyChanges(companyId: string, name: string, message: string) {
  if (!message.trim()) return { error: "Review message is required." };
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("companies").update({ is_verified: false }).eq("id", companyId);
  if (error) return { error: error.message };
  const { error: verificationError } = await companyVerificationTable(supabase)
    .update({
      verification_status: "needs_changes",
      review_message: message,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId);
  if (verificationError) return { error: verificationError.message };
  await logAdminAction(supabase, adminId, "request_company_changes", "company", companyId, name, message);
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  return { success: true };
}

export async function rejectCompany(companyId: string, name: string, message: string) {
  if (!message.trim()) return { error: "Review message is required." };
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("companies").update({ is_verified: false }).eq("id", companyId);
  if (error) return { error: error.message };
  const { error: verificationError } = await companyVerificationTable(supabase)
    .update({
      verification_status: "rejected",
      review_message: message,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId);
  if (verificationError) return { error: verificationError.message };
  await logAdminAction(supabase, adminId, "reject_company", "company", companyId, name, message);
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  return { success: true };
}

export async function verifyCompany(companyId: string, name: string) {
  return approveCompany(companyId, name);
}

export async function unverifyCompany(companyId: string, name: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("companies").update({ is_verified: false }).eq("id", companyId);
  if (error) return { error: error.message };
  await companyVerificationTable(supabase)
    .update({
      verification_status: "needs_changes",
      review_message: "Employer approval was removed by an admin.",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId);
  await logAdminAction(supabase, adminId, "unverify_company", "company", companyId, name);
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
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

export async function lockJobFromReport(_reportId: string, jobId: string, jobTitle: string, reason?: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error: lockErr } = await supabase.from("jobs").update({ admin_locked: true }).eq("id", jobId);
  if (lockErr) return { error: lockErr.message };
  const { error: reviewErr } = await supabase
    .from("job_reports")
    .update({ status: "reviewed" })
    .eq("job_id", jobId)
    .eq("status", "pending");
  if (reviewErr) return { error: reviewErr.message };
  await notifyCompanyAboutJobModeration(supabase, adminId, jobId, jobTitle, true, reason);
  await logAdminAction(supabase, adminId, "lock_job_from_report", "job", jobId, jobTitle, reason);
  revalidatePath("/admin/reports");
  revalidatePath("/admin/jobs");
  revalidatePath("/job-seeker/home");
  return { success: true };
}
