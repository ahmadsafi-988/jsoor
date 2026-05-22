"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { insertNotification, insertNotificationsForAdmins } from "@/lib/notifications/actions";

async function requireVerifiedCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: company } = await supabase
    .from("companies")
    .select("is_verified")
    .eq("id", userId)
    .maybeSingle();

  if (!company?.is_verified) {
    return { error: "Your company must be verified by an admin before using this feature." };
  }

  return null;
}

// ─── Company profile ──────────────────────────────────────────────────────────

export async function upsertCompany(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: existingCompany } = await supabase
    .from("companies")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  const payload = {
    id: user.id,
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || "",
    industry: (formData.get("industry") as string) || null,
    website: (formData.get("website") as string) || null,
    location: (formData.get("location") as string) || null,
    size: (formData.get("size") as string) || null,
    founded_year: (formData.get("founded_year") as string) || null,
  };

  const { error } = await supabase.from("companies").upsert(payload);
  if (error) return { error: error.message };

  // Also create/update a stub profiles row so the company has a username
  const username = formData.get("username") as string;
  if (username) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      username,
      first_name: payload.name,
      last_name: "",
      role: "company",
      joined_date: new Date().toISOString().split("T")[0],
    });
    if (profileError) return { error: profileError.message };
  }

  if (!existingCompany) {
    await insertNotificationsForAdmins({
      type: "company_approval_requested",
      title: "Company Approval Requested",
      body: `${payload.name} submitted company details and is awaiting verification.`,
      link: "/admin/companies",
      actorId: user.id,
      entityType: "company",
      entityId: user.id,
    });
  }

  revalidatePath("/company/profile");
  return { success: true };
}

export async function updateCompanyLogo(logoUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("companies")
    .update({ logo_url: logoUrl })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/company/profile");
  return { success: true };
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function createJob(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const verificationError = await requireVerifiedCompany(supabase, user.id);
  if (verificationError) return verificationError;

  type JobType = "Full-time" | "Part-time" | "Remote" | "Hybrid" | "Contract" | "Internship";
  const payload = {
    company_id: user.id,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    location: (formData.get("location") as string) || null,
    type: ((formData.get("type") as string) || "Full-time") as JobType,
    salary_range: (formData.get("salary_range") as string) || null,
    requirements: (formData.get("requirements") as string) || null,
    is_active: true,
  };

  const { data, error } = await supabase.from("jobs").insert(payload).select("id").single();
  if (error) return { error: error.message };

  const skillIds: number[] = JSON.parse((formData.get("skill_ids") as string) || "[]");
  if (skillIds.length > 0) {
    await supabase.from("job_to_skills").insert(
      skillIds.map((skill_id) => ({ job_id: data.id, skill_id }))
    );
  }

  revalidatePath("/company/jobs");
  return { success: true, jobId: data.id };
}

export async function updateJob(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const verificationError = await requireVerifiedCompany(supabase, user.id);
  if (verificationError) return verificationError;

  const jobId = formData.get("jobId") as string;
  type JobType = "Full-time" | "Part-time" | "Remote" | "Hybrid" | "Contract" | "Internship";
  const payload = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    location: (formData.get("location") as string) || null,
    type: (formData.get("type") as string) as JobType,
    salary_range: (formData.get("salary_range") as string) || null,
    requirements: (formData.get("requirements") as string) || null,
    is_active: formData.get("is_active") !== "false",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("jobs")
    .update(payload)
    .eq("id", jobId)
    .eq("company_id", user.id);

  if (error) return { error: error.message };

  const skillIds: number[] = JSON.parse((formData.get("skill_ids") as string) || "[]");
  await supabase.from("job_to_skills").delete().eq("job_id", jobId);
  if (skillIds.length > 0) {
    await supabase.from("job_to_skills").insert(
      skillIds.map((skill_id) => ({ job_id: jobId, skill_id }))
    );
  }

  revalidatePath("/company/jobs");
  revalidatePath(`/company/jobs/${jobId}`);
  return { success: true };
}

export async function deleteJob(jobId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const verificationError = await requireVerifiedCompany(supabase, user.id);
  if (verificationError) return verificationError;

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId)
    .eq("company_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/company/jobs");
  return { success: true };
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function applyToJob(jobId: string, coverLetter?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("job_applications").insert({
    job_id: jobId,
    applicant_id: user.id,
    status: "applied",
    cover_letter: coverLetter || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "You have already applied to this job." };
    return { error: error.message };
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("company_id, title")
    .eq("id", jobId)
    .single();

  if (job) {
    await insertNotification(
      job.company_id,
      "new_application",
      "New Application",
      `A new candidate applied to "${job.title}"`,
      `/company/jobs/${jobId}/applicants`,
      jobId
    );
  }

  revalidatePath("/job-seeker/job-applications");
  return { success: true };
}

type ApplicationStatus =
  | "applied"
  | "under_review"
  | "assessment_sent"
  | "assessment_completed"
  | "shortlisted"
  | "accepted"
  | "rejected";

const ALLOWED_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  applied:               ["under_review"],
  under_review:          ["applied", "shortlisted", "rejected"],
  shortlisted:           ["accepted", "rejected", "under_review"],
  accepted:              ["rejected"],
  rejected:              ["under_review"],
  assessment_sent:       ["shortlisted", "accepted", "rejected", "under_review"],
  assessment_completed:  ["shortlisted", "accepted", "rejected", "under_review"],
};

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const verificationError = await requireVerifiedCompany(supabase, user.id);
  if (verificationError) return verificationError;

  // Fetch current application + owning company in one query
  const { data: application, error: fetchError } = await supabase
    .from("job_applications")
    .select("status, applicant_id, job:jobs!job_applications_job_id_fkey(id, company_id)")
    .eq("id", applicationId)
    .single();

  if (fetchError || !application) return { error: "Application not found." };

  const job = application.job as { id: string; company_id: string } | null;
  if (!job || job.company_id !== user.id) return { error: "Not authorized." };

  const currentStatus = application.status as ApplicationStatus;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    return { error: `Cannot transition from '${currentStatus}' to '${newStatus}'.` };
  }

  const { error } = await supabase
    .from("job_applications")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  const statusLabels: Record<ApplicationStatus, string> = {
    applied: "Applied",
    under_review: "Under Review",
    assessment_sent: "Assessment Sent",
    assessment_completed: "Assessment Completed",
    shortlisted: "Shortlisted",
    accepted: "Accepted",
    rejected: "Rejected",
  };
  await insertNotification(
    application.applicant_id,
    "application_status_changed",
    "Application Status Updated",
    `Your application status has changed to "${statusLabels[newStatus] ?? newStatus}"`,
    "/job-seeker/job-applications",
    job.id
  );

  revalidatePath(`/company/applicants/${applicationId}`);
  revalidatePath(`/company/jobs/${job.id}/applicants`);
  return { success: true };
}

// ─── Assessments ──────────────────────────────────────────────────────────────

export async function sendAssessment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const verificationError = await requireVerifiedCompany(supabase, user.id);
  if (verificationError) return verificationError;

  const applicationId = formData.get("application_id") as string;
  const questionsRaw = formData.get("questions") as string;

  let questions = null;
  if (questionsRaw) {
    try { questions = JSON.parse(questionsRaw); } catch { questions = null; }
  }

  const deadline = formData.get("deadline") as string;
  const timeLimitRaw = formData.get("time_limit") as string;
  const timeLimit = timeLimitRaw ? parseInt(timeLimitRaw) : null;

  const payload = {
    company_id: user.id,
    application_id: applicationId,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    deadline: deadline ? new Date(deadline).toISOString() : null,
    questions,
    time_limit: timeLimit && !isNaN(timeLimit) ? timeLimit : null,
    status: "pending" as const,
  };

  const { error } = await supabase.from("assessments").insert(payload);
  if (error) return { error: error.message };

  const { data: appRow } = await supabase
    .from("job_applications")
    .update({ status: "assessment_sent", updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .select("applicant_id, job_id")
    .single();

  if (appRow) {
    await insertNotification(
      appRow.applicant_id,
      "assessment_sent",
      "New Assessment",
      `You have received a new assessment: "${payload.title}"`,
      "/job-seeker/assessments",
      appRow.job_id
    );
  }

  const templateId = formData.get("template_id") as string | null;
  if (templateId) {
    const { data: tpl } = await supabase
      .from("assessment_templates")
      .select("use_count")
      .eq("id", templateId)
      .eq("company_id", user.id)
      .maybeSingle();
    if (tpl) {
      await supabase
        .from("assessment_templates")
        .update({ use_count: tpl.use_count + 1 })
        .eq("id", templateId);
    }
  }

  revalidatePath("/company/assessments");
  revalidatePath("/company/assessments/templates");
  revalidatePath(`/company/applicants/${applicationId}`);
  return { success: true };
}

export async function submitAssessment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const assessmentId = formData.get("assessment_id") as string;
  const submissionRaw = formData.get("submission") as string;

  let submission: any = null;
  try { submission = JSON.parse(submissionRaw); } catch { submission = null; }

  const { data: assessment, error: fetchError } = await supabase
    .from("assessments")
    .select("application_id, status, questions")
    .eq("id", assessmentId)
    .single();

  if (fetchError || !assessment) return { error: "Assessment not found." };
  if (assessment.status !== "pending") return { error: "Assessment already submitted." };

  const { data: application } = await supabase
    .from("job_applications")
    .select("applicant_id, job_id")
    .eq("id", assessment.application_id)
    .single();

  if (!application || application.applicant_id !== user.id) {
    return { error: "Not authorized." };
  }

  // Auto-score MCQ and True/False questions
  const questions = (assessment.questions as any[]) ?? [];
  const answers = submission?.answers ?? {};
  let correct = 0;
  let scorable = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q.type === "mcq" || q.type === "truefalse") {
      scorable++;
      if (answers[String(i)] === q.correct) correct++;
    }
  }
  const score = scorable > 0 ? Math.round((correct / scorable) * 100) : null;

  const { data: updatedAssessment, error } = await supabase
    .from("assessments")
    .update({
      submission,
      status: "submitted",
      score,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assessmentId)
    .select("company_id, title")
    .single();

  if (error) return { error: error.message };

  await supabase
    .from("job_applications")
    .update({ status: "assessment_completed", updated_at: new Date().toISOString() })
    .eq("id", assessment.application_id);

  if (updatedAssessment) {
    await insertNotification(
      updatedAssessment.company_id,
      "assessment_submitted",
      "Assessment Submitted",
      `A candidate has submitted their assessment: "${updatedAssessment.title}"`,
      `/company/applicants/${assessment.application_id}`,
      application.job_id
    );
  }

  revalidatePath("/job-seeker/job-applications");
  revalidatePath("/job-seeker/assessments");
  return { success: true, score };
}

export async function releaseAssessmentResults(assessmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const verificationError = await requireVerifiedCompany(supabase, user.id);
  if (verificationError) return verificationError;

  const { data: released, error } = await supabase
    .from("assessments")
    .update({ results_released: true, updated_at: new Date().toISOString() })
    .eq("id", assessmentId)
    .eq("company_id", user.id)
    .select("application_id")
    .single();

  if (error) return { error: error.message };

  if (released) {
    const { data: appRow } = await supabase
      .from("job_applications")
      .select("applicant_id, job_id")
      .eq("id", released.application_id)
      .single();

    if (appRow) {
      await insertNotification(
        appRow.applicant_id,
        "assessment_results_released",
        "Assessment Results Available",
        "Your assessment results have been released. Check your assessments page.",
        "/job-seeker/assessments",
        appRow.job_id
      );
    }
  }

  revalidatePath("/company/assessments");
  return { success: true };
}

export async function reviewAssessment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const verificationError = await requireVerifiedCompany(supabase, user.id);
  if (verificationError) return verificationError;

  const assessmentId = formData.get("assessment_id") as string;
  const score = formData.get("score") ? Number(formData.get("score")) : null;
  const feedback = (formData.get("feedback") as string) || null;

  const { error } = await supabase
    .from("assessments")
    .update({
      status: "reviewed",
      score,
      feedback,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assessmentId)
    .eq("company_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/company/assessments");
  return { success: true };
}

// ─── Saved jobs ───────────────────────────────────────────────────────────────

export async function saveJob(jobId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("saved_jobs")
    .upsert({ user_id: user.id, job_id: jobId }, { ignoreDuplicates: true });

  if (error) return { error: error.message };

  revalidatePath("/job-seeker/saved-jobs");
  return { success: true };
}

export async function reportJob(jobId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: report, error } = await supabase
    .from("job_reports")
    .insert({
      job_id: jobId,
      reported_by: user.id,
      reason,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "You have already reported this job." };
    return { error: error.message };
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("title")
    .eq("id", jobId)
    .maybeSingle();

  await insertNotificationsForAdmins({
    type: "job_report_submitted",
    title: "Job Report Submitted",
    body: `A job seeker reported "${job?.title ?? "a job"}".`,
    link: "/admin/reports",
    jobId,
    actorId: user.id,
    entityType: "job_report",
    entityId: report?.id ?? null,
    metadata: { reason },
  });

  return { success: true };
}

export async function unsaveJob(jobId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("saved_jobs")
    .delete()
    .eq("user_id", user.id)
    .eq("job_id", jobId);

  if (error) return { error: error.message };

  revalidatePath("/job-seeker/saved-jobs");
  return { success: true };
}

// ─── Company sign-up ──────────────────────────────────────────────────────────

export async function signUpAsCompany(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: "company" },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/company/onboarding`,
    },
  });

  if (error) return { error: error.message };
  redirect("/auth/sign-up-success");
}
