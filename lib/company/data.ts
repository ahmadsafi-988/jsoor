// lib/company/data.ts
// Server-side data fetching for the company role.

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase_generated_types";

export type JobRow = Tables<"jobs">;
export type CompanyRow = Tables<"companies">;
export type ApplicationRow = Tables<"job_applications">;
export type AssessmentRow = Tables<"assessments">;

export type JobWithCompany = JobRow & { company: Pick<CompanyRow, "name" | "logo_url"> | null };

export type ApplicationWithProfile = ApplicationRow & {
  profile: (Pick<Tables<"profiles">, "id" | "first_name" | "last_name" | "avatar_url" | "username"> & {
    job_seeker_profiles: Pick<Tables<"job_seeker_profiles">, "bio" | "degree" | "institution" | "location" | "github" | "website" | "cv_url"> | null;
  }) | null;
  job: Pick<JobRow, "title" | "type" | "location"> | null;
};

export type AssessmentWithApplication = AssessmentRow & {
  application: (Pick<ApplicationRow, "id" | "job_id" | "applicant_id" | "status"> & {
    profile: Pick<Tables<"profiles">, "first_name" | "last_name" | "avatar_url" | "username"> | null;
    job: Pick<JobRow, "title"> | null;
  }) | null;
};

// ─── Company queries ──────────────────────────────────────────────────────────

export async function getMyCompany(): Promise<CompanyRow | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("id", user.id)
    .single();

  return data ?? null;
}

export async function getCompanyJobs(): Promise<JobRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getJobById(jobId: string): Promise<JobRow | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("company_id", user.id)
    .single();

  return data ?? null;
}

export async function getJobApplicants(jobId: string): Promise<ApplicationWithProfile[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("job_applications")
    .select(`
      *,
      profile:profiles!job_applications_applicant_id_fkey(
        id, first_name, last_name, avatar_url, username,
        job_seeker_profiles(bio, degree, institution, location, github, website, cv_url)
      ),
      job:jobs!job_applications_job_id_fkey(title, type, location)
    `)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  return (data as any[]) ?? [];
}

export async function getApplicationById(applicationId: string): Promise<ApplicationWithProfile | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("job_applications")
    .select(`
      *,
      profile:profiles!job_applications_applicant_id_fkey(
        id, first_name, last_name, avatar_url, username,
        job_seeker_profiles(bio, degree, institution, location, github, website, cv_url)
      ),
      job:jobs!job_applications_job_id_fkey(title, type, location)
    `)
    .eq("id", applicationId)
    .single();

  return (data as any) ?? null;
}

export async function getAssessmentForApplication(applicationId: string): Promise<AssessmentRow | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("assessments")
    .select("*")
    .eq("application_id", applicationId)
    .single();

  return data ?? null;
}

export async function getCompanyAssessments(): Promise<AssessmentWithApplication[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("assessments")
    .select(`
      *,
      application:job_applications!assessments_application_id_fkey(
        id, job_id, applicant_id, status,
        profile:profiles!job_applications_applicant_id_fkey(first_name, last_name, avatar_url, username),
        job:jobs!job_applications_job_id_fkey(title)
      )
    `)
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  return (data as any[]) ?? [];
}

export async function getCompanyStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { totalJobs: 0, activeJobs: 0, totalApplications: 0, pendingAssessments: 0 };

  const [jobsRes, applicationsRes, assessmentsRes] = await Promise.all([
    supabase.from("jobs").select("id, is_active").eq("company_id", user.id),
    supabase.from("job_applications").select("id").in(
      "job_id",
      (await supabase.from("jobs").select("id").eq("company_id", user.id)).data?.map(j => j.id) ?? []
    ),
    supabase.from("assessments").select("id, status").eq("company_id", user.id),
  ]);

  const jobs = jobsRes.data ?? [];
  return {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.is_active).length,
    totalApplications: applicationsRes.data?.length ?? 0,
    pendingAssessments: assessmentsRes.data?.filter(a => a.status === "pending").length ?? 0,
  };
}

// ─── Job seeker queries ───────────────────────────────────────────────────────

export async function getActiveJobs(): Promise<JobWithCompany[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("jobs")
    .select(`
      *,
      company:companies!jobs_company_id_fkey(name, logo_url)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (data as any[]) ?? [];
}

export async function getMyApplications(): Promise<(ApplicationRow & { job: (JobRow & { company: Pick<CompanyRow, "name" | "logo_url"> | null }) | null })[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("job_applications")
    .select(`
      *,
      job:jobs!job_applications_job_id_fkey(
        *,
        company:companies!jobs_company_id_fkey(name, logo_url)
      )
    `)
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false });

  return (data as any[]) ?? [];
}

export async function getMyAssessments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("assessments")
    .select(`
      *,
      application:job_applications!assessments_application_id_fkey(
        id, job_id,
        job:jobs!job_applications_job_id_fkey(
          title,
          company:companies!jobs_company_id_fkey(name, logo_url)
        )
      )
    `)
    .in(
      "application_id",
      (await supabase.from("job_applications").select("id").eq("applicant_id", user.id)).data?.map(a => a.id) ?? []
    )
    .order("created_at", { ascending: false });

  return (data as any[]) ?? [];
}

export async function checkExistingApplication(jobId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("applicant_id", user.id)
    .single();

  return !!data;
}
