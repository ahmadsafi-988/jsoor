"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { insertNotification, insertNotificationsForAdmins } from "@/lib/notifications/actions";
import type { Json } from "@/lib/supabase_generated_types";
import { companyVerificationTable } from "@/lib/company/verification";
import {
  ASSESSMENT_SUBMISSIONS_BUCKET,
  normalizeAssessmentQuestions,
  scoreAssessment,
  validateAssessmentSubmission,
  type AssessmentQuestion,
} from "@/lib/assessments";

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
    .select("id, is_verified")
    .eq("id", user.id)
    .maybeSingle();

  const isVerificationSubmission =
    formData.has("legal_company_name") ||
    formData.has("commercial_registration_number");

  const requiredValue = (name: string, label: string) => {
    const value = (formData.get(name) as string | null)?.trim() ?? "";
    if (!value) return { error: `${label} is required.` };
    return { value };
  };

  const nameResult = requiredValue("name", "Public company name");
  if ("error" in nameResult) return nameResult;

  if (isVerificationSubmission && existingCompany?.is_verified) {
    return { error: "Verified companies can edit public profile details from the company profile page." };
  }

  const payload: {
    id: string;
    name: string;
    description: string;
    industry: string | null;
    website: string | null;
    location: string | null;
    size: string | null;
    founded_year: string | null;
    logo_url?: string | null;
    cover_url?: string | null;
  } = {
    id: user.id,
    name: nameResult.value,
    description: ((formData.get("description") as string | null)?.trim()) || "",
    industry: ((formData.get("industry") as string | null)?.trim()) || null,
    website: ((formData.get("website") as string | null)?.trim()) || null,
    location: ((formData.get("location") as string | null)?.trim()) || null,
    size: ((formData.get("size") as string | null)?.trim()) || null,
    founded_year: ((formData.get("founded_year") as string | null)?.trim()) || null,
  };
  if (formData.has("logo_url")) {
    payload.logo_url = ((formData.get("logo_url") as string | null)?.trim()) || null;
  }
  if (formData.has("cover_url")) {
    payload.cover_url = ((formData.get("cover_url") as string | null)?.trim()) || null;
  }

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

  if (isVerificationSubmission) {
    const legalName = requiredValue("legal_company_name", "Legal company name");
    if ("error" in legalName) return legalName;
    const workEmail =
      ((formData.get("work_email") as string | null)?.trim()) ||
      user.email ||
      "";
    if (!workEmail) return { error: "Work email is required." };
    const contactName = requiredValue("contact_person_name", "Contact person full name");
    if ("error" in contactName) return contactName;
    const contactTitle = requiredValue("contact_job_title", "Contact job title");
    if ("error" in contactTitle) return contactTitle;
    const phoneNumber = requiredValue("phone_number", "Phone number");
    if ("error" in phoneNumber) return phoneNumber;
    const registrationNumber = requiredValue(
      "commercial_registration_number",
      "Commercial registration number",
    );
    if ("error" in registrationNumber) return registrationNumber;

    const verificationPayload = {
      company_id: user.id,
      legal_company_name: legalName.value,
      work_email: workEmail,
      contact_person_name: contactName.value,
      contact_job_title: contactTitle.value,
      phone_number: phoneNumber.value,
      country_of_registration: "Jordan",
      commercial_registration_number: registrationNumber.value,
      verification_status: "pending",
      review_message: null,
      reviewed_by: null,
      reviewed_at: null,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: verificationError } = await companyVerificationTable(supabase)
      .upsert(verificationPayload);
    if (verificationError) return { error: verificationError.message };
  }

  if (isVerificationSubmission && !existingCompany) {
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

  if (isVerificationSubmission && existingCompany) {
    await insertNotificationsForAdmins({
      type: "company_approval_requested",
      title: "Company Approval Updated",
      body: `${payload.name} updated their employer account request.`,
      link: "/admin/companies",
      actorId: user.id,
      entityType: "company",
      entityId: user.id,
    });
  }

  revalidatePath("/company/profile");
  revalidatePath("/company/onboarding");
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

export async function updateCompanyCoverUrl(coverUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("companies")
    .update({ cover_url: coverUrl })
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

type AssessmentTargetApplication = {
  id: string;
  applicant_id: string;
  job_id: string;
  job: { company_id?: string } | null;
};

function parseAnswers(submission: Json): Record<string, unknown> {
  return submission &&
    typeof submission === "object" &&
    !Array.isArray(submission) &&
    "answers" in submission &&
    submission.answers &&
    typeof submission.answers === "object" &&
    !Array.isArray(submission.answers)
      ? (submission.answers as Record<string, unknown>)
      : {};
}

function submissionContainsFilePath(value: unknown, path: string): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((entry) => submissionContainsFilePath(entry, path));
  const record = value as Record<string, unknown>;
  if (record.path === path) return true;
  return Object.values(record).some((entry) => submissionContainsFilePath(entry, path));
}

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
  const applicationIdsRaw = formData.get("application_ids") as string | null;
  let applicationIds = applicationId ? [applicationId] : [];
  if (applicationIdsRaw) {
    try {
      const parsed = JSON.parse(applicationIdsRaw);
      if (Array.isArray(parsed)) {
        applicationIds = parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
      }
    } catch {
      applicationIds = [];
    }
  }
  applicationIds = [...new Set(applicationIds)];
  if (applicationIds.length === 0) return { error: "Application is missing." };

  const questionsRaw = formData.get("questions") as string;

  let questions: Json = [];
  if (questionsRaw) {
    try {
      const parsed = JSON.parse(questionsRaw);
      const normalized = normalizeAssessmentQuestions(parsed);
      if (normalized.error) return { error: normalized.error };
      questions = normalized.questions as Json;
    } catch {
      return { error: "Questions could not be read." };
    }
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    return { error: "Add at least one question." };
  }

  const deadline = formData.get("deadline") as string;
  const timeLimitRaw = formData.get("time_limit") as string;
  const timeLimit = timeLimitRaw ? parseInt(timeLimitRaw) : null;

  const title = formData.get("title") as string;
  const payloadBase = {
    company_id: user.id,
    title,
    description: formData.get("description") as string,
    deadline: deadline ? new Date(deadline).toISOString() : null,
    questions,
    time_limit: timeLimit && !isNaN(timeLimit) ? timeLimit : null,
    status: "pending" as const,
  };

  const { data: existingAssessments } = await supabase
    .from("assessments")
    .select("application_id")
    .in("application_id", applicationIds);

  const existingIds = new Set((existingAssessments ?? []).map((row) => row.application_id));
  const candidateIds = applicationIds.filter((id) => !existingIds.has(id));

  if (candidateIds.length === 0) {
    return { success: true, sentCount: 0, skippedCount: applicationIds.length };
  }

  const { data: applications, error: applicationsError } = await supabase
    .from("job_applications")
    .select("id, applicant_id, job_id, job:jobs!job_applications_job_id_fkey(company_id)")
    .in("id", candidateIds);

  if (applicationsError) return { error: applicationsError.message };

  const ownedApplications = ((applications ?? []) as AssessmentTargetApplication[]).filter(
    (app) => app.job?.company_id === user.id
  );

  if (ownedApplications.length === 0) {
    if (applicationIds.length === 1 && existingIds.has(applicationIds[0])) {
      return { error: "This application already has an assessment." };
    }
    return { error: "No eligible applications found." };
  }

  const payload = ownedApplications.map((app) => ({
    ...payloadBase,
    application_id: app.id,
  }));

  const { error } = await supabase.from("assessments").insert(payload);
  if (error) return { error: error.message };

  const ownedApplicationIds = ownedApplications.map((app) => app.id as string);

  const { error: updateError } = await supabase
    .from("job_applications")
    .update({ status: "assessment_sent", updated_at: new Date().toISOString() })
    .in("id", ownedApplicationIds);

  if (updateError) return { error: updateError.message };

  for (const appRow of ownedApplications) {
    await insertNotification(
      appRow.applicant_id,
      "assessment_sent",
      "New Assessment",
      `You have received a new assessment: "${title}"`,
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
        .update({ use_count: tpl.use_count + ownedApplications.length })
        .eq("id", templateId);
    }
  }

  revalidatePath("/company/assessments");
  revalidatePath("/company/assessments/templates");
  for (const id of ownedApplicationIds) {
    revalidatePath(`/company/applicants/${id}`);
  }
  for (const jobId of [...new Set(ownedApplications.map((app) => app.job_id as string))]) {
    revalidatePath(`/company/jobs/${jobId}/applicants`);
  }

  return {
    success: true,
    sentCount: ownedApplications.length,
    skippedCount: applicationIds.length - ownedApplications.length,
  };
}

export async function submitAssessment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const assessmentId = formData.get("assessment_id") as string;
  const submissionRaw = formData.get("submission") as string;

  let submission: Json = null;
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
  const questions = (Array.isArray(assessment.questions) ? assessment.questions : []) as AssessmentQuestion[];
  const answers = parseAnswers(submission);
  const validationError = validateAssessmentSubmission(questions, answers);
  if (validationError) return { error: validationError };
  const { score } = scoreAssessment(questions, answers);

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

export async function getAssessmentSubmissionFileSignedUrl(
  assessmentId: string,
  path: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const verificationError = await requireVerifiedCompany(supabase, user.id);
  if (verificationError) return verificationError;

  const { data: assessment, error } = await supabase
    .from("assessments")
    .select("company_id, submission")
    .eq("id", assessmentId)
    .single();

  if (error || !assessment) return { error: "Assessment not found." };
  if (assessment.company_id !== user.id) return { error: "Not authorized." };
  if (!submissionContainsFilePath(assessment.submission, path)) {
    return { error: "File not found on this submission." };
  }

  const { data, error: signedError } = await supabase.storage
    .from(ASSESSMENT_SUBMISSIONS_BUCKET)
    .createSignedUrl(path, 60);

  if (signedError || !data?.signedUrl) {
    return { error: signedError?.message ?? "Could not create download link." };
  }

  return { signedUrl: data.signedUrl };
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
