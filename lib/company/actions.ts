"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ─── Company profile ──────────────────────────────────────────────────────────

export async function upsertCompany(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

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
      bio: payload.description,
      role: "company",
      joined_date: new Date().toISOString().split("T")[0],
    });
    if (profileError) return { error: profileError.message };
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

  revalidatePath("/company/jobs");
  return { success: true, jobId: data.id };
}

export async function updateJob(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

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

  revalidatePath("/company/jobs");
  revalidatePath(`/company/jobs/${jobId}`);
  return { success: true };
}

export async function deleteJob(jobId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

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

  revalidatePath("/job-seeker/job-applications");
  return { success: true };
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "applied" | "under_review" | "assessment_sent" | "assessment_completed" | "shortlisted" | "rejected"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("job_applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  revalidatePath("/company/jobs");
  return { success: true };
}

// ─── Assessments ──────────────────────────────────────────────────────────────

export async function sendAssessment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const applicationId = formData.get("application_id") as string;
  const questionsRaw = formData.get("questions") as string;

  let questions = null;
  if (questionsRaw) {
    try { questions = JSON.parse(questionsRaw); } catch { questions = null; }
  }

  const deadline = formData.get("deadline") as string;

  const payload = {
    company_id: user.id,
    application_id: applicationId,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    deadline: deadline ? new Date(deadline).toISOString() : null,
    questions,
    status: "pending" as const,
  };

  const { error } = await supabase.from("assessments").insert(payload);
  if (error) return { error: error.message };

  // Update application status to assessment_sent
  await supabase
    .from("job_applications")
    .update({ status: "assessment_sent", updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  revalidatePath("/company/assessments");
  revalidatePath(`/company/applicants/${applicationId}`);
  return { success: true };
}

export async function submitAssessment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const assessmentId = formData.get("assessment_id") as string;
  const submissionRaw = formData.get("submission") as string;

  let submission = null;
  try { submission = JSON.parse(submissionRaw); } catch { submission = null; }

  const { data: assessment, error: fetchError } = await supabase
    .from("assessments")
    .select("application_id, status")
    .eq("id", assessmentId)
    .single();

  if (fetchError || !assessment) return { error: "Assessment not found." };
  if (assessment.status !== "pending") return { error: "Assessment already submitted." };

  const { error } = await supabase
    .from("assessments")
    .update({
      submission,
      status: "submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", assessmentId);

  if (error) return { error: error.message };

  // Update application status
  await supabase
    .from("job_applications")
    .update({ status: "assessment_completed", updated_at: new Date().toISOString() })
    .eq("id", assessment.application_id);

  revalidatePath("/job-seeker/job-applications");
  revalidatePath("/job-seeker/assessments");
  return { success: true };
}

export async function reviewAssessment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

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
