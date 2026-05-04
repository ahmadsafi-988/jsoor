// lib/company/data.ts
// Server-side data fetching for the company role.

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase_generated_types";

export type JobRow = Tables<"jobs">;
export type CompanyRow = Tables<"companies">;
export type ApplicationRow = Tables<"job_applications">;
export type AssessmentRow = Tables<"assessments">;

export type ProjectWithSkills = Tables<"projects"> & { skills: string[] };

export type ApplicantProfileResult = {
  application: Tables<"job_applications"> & {
    job: Pick<Tables<"jobs">, "id" | "title" | "type" | "location" | "company_id">;
  };
  applicant: Tables<"profiles"> & {
    job_seeker_profile: Tables<"job_seeker_profiles"> | null;
  };
  projects: ProjectWithSkills[];
  badges: Tables<"badges">[];
  skills: string[];
  company_owns_application: boolean;
};

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

  const { data: applications, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error || !applications?.length) return [];

  const applicantIds = applications.map((a) => a.applicant_id);

  const [{ data: profiles }, { data: jsProfiles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, username")
      .in("id", applicantIds),
    supabase
      .from("job_seeker_profiles")
      .select("id, bio, degree, institution, location, github, website, cv_url")
      .in("id", applicantIds),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const jsProfileMap = Object.fromEntries((jsProfiles ?? []).map((p) => [p.id, p]));

  return applications.map((app) => ({
    ...app,
    job: null,
    profile: profileMap[app.applicant_id]
      ? {
          ...profileMap[app.applicant_id],
          job_seeker_profiles: jsProfileMap[app.applicant_id] ?? null,
        }
      : null,
  }));
}

export async function getApplicationById(applicationId: string): Promise<ApplicationWithProfile | null> {
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (!application) return null;

  const [{ data: profile }, { data: jsProfile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, username")
      .eq("id", application.applicant_id)
      .single(),
    supabase
      .from("job_seeker_profiles")
      .select("id, bio, degree, institution, location, github, website, cv_url")
      .eq("id", application.applicant_id)
      .single(),
  ]);

  return {
    ...application,
    profile: profile
      ? { ...profile, job_seeker_profiles: jsProfile ?? null }
      : null,
  } as any;
}

export async function getApplicationWithApplicantProfile(
  applicationId: string
): Promise<ApplicantProfileResult | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Step 1: fetch application + job to verify ownership and get applicant_id
  const { data: application, error: appError } = await supabase
    .from("job_applications")
    .select("*, job:jobs!job_applications_job_id_fkey(id, title, type, location, company_id)")
    .eq("id", applicationId)
    .single();

  if (appError || !application) return null;

  const job = application.job as Pick<Tables<"jobs">, "id" | "title" | "type" | "location" | "company_id"> | null;
  if (!job) return null;

  const company_owns_application = job.company_id === user.id;
  const applicantId = application.applicant_id;

  // Step 2: fetch applicant data in parallel
  const [profileRes, projectsRes, skillsRes, badgesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("*, job_seeker_profile:job_seeker_profiles(*)")
      .eq("id", applicantId)
      .single(),

    supabase
      .from("projects")
      .select("*, project_to_skills(skill:skills(name))")
      .eq("user_id", applicantId)
      .order("created_at", { ascending: false }),

    supabase
      .from("profile_to_skills")
      .select("skill:skills(name)")
      .eq("user_id", applicantId),

    supabase
      .from("badges")
      .select("*")
      .eq("user_id", applicantId)
      .order("date", { ascending: false }),
  ]);

  if (!profileRes.data) return null;

  const applicant = profileRes.data as Tables<"profiles"> & {
    job_seeker_profile: Tables<"job_seeker_profiles"> | null;
  };

  const projects: ProjectWithSkills[] = ((projectsRes.data ?? []) as any[]).map((p) => ({
    ...p,
    skills: (p.project_to_skills ?? [])
      .map((pts: any) => pts.skill?.name)
      .filter(Boolean) as string[],
  }));

  const skills: string[] = ((skillsRes.data ?? []) as any[])
    .map((row) => row.skill?.name)
    .filter(Boolean) as string[];

  return {
    application: { ...application, job } as Tables<"job_applications"> & { job: typeof job },
    applicant,
    projects,
    badges: (badgesRes.data ?? []) as Tables<"badges">[],
    skills,
    company_owns_application,
  };
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

// ─── Skills queries ───────────────────────────────────────────────────────────

export async function getAllSkills(): Promise<Tables<"skills">[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("skills").select("*").order("name");
  return data ?? [];
}

export async function getJobSkillIds(jobId: string): Promise<number[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_to_skills")
    .select("skill_id")
    .eq("job_id", jobId);
  return (data ?? []).map((r) => r.skill_id);
}

export type JobWithSkillsAndMatch = JobWithCompany & {
  requiredSkills: string[];
  matchCount: number;
  matchTotal: number;
};

export async function getActiveJobsWithSkills(
  userSkillIds: number[]
): Promise<JobWithSkillsAndMatch[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("jobs")
    .select(`
      *,
      company:companies!jobs_company_id_fkey(name, logo_url),
      job_to_skills(skill_id, skill:skills(name))
    `)
    .eq("is_active", true)
    .eq("admin_locked", false)
    .order("created_at", { ascending: false });

  const userSkillSet = new Set(userSkillIds);

  const jobs: JobWithSkillsAndMatch[] = ((data ?? []) as any[]).map((job) => {
    const skillEntries: { skill_id: number; skill: { name: string } | null }[] =
      job.job_to_skills ?? [];
    const requiredSkills = skillEntries.map((s) => s.skill?.name).filter(Boolean) as string[];
    const matchCount = skillEntries.filter((s) => userSkillSet.has(s.skill_id)).length;
    return {
      ...job,
      requiredSkills,
      matchCount,
      matchTotal: requiredSkills.length,
    };
  });

  // Sort: highest match ratio first, then by created_at
  return jobs.sort((a, b) => {
    const ratioA = a.matchTotal > 0 ? a.matchCount / a.matchTotal : -1;
    const ratioB = b.matchTotal > 0 ? b.matchCount / b.matchTotal : -1;
    if (ratioB !== ratioA) return ratioB - ratioA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

// ─── Saved jobs queries ───────────────────────────────────────────────────────

export async function getSavedJobIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("saved_jobs")
    .select("job_id")
    .eq("user_id", user.id);

  return (data ?? []).map((r) => r.job_id);
}

export async function getSavedJobs(): Promise<JobWithCompany[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("saved_jobs")
    .select("job:jobs!saved_jobs_job_id_fkey(*, company:companies!jobs_company_id_fkey(name, logo_url))")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  return ((data ?? []).map((r: any) => r.job).filter(Boolean)) as JobWithCompany[];
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

  return (data ?? []).map((assessment: any) => {
    const questions = (assessment.questions as any[]) ?? [];
    const answers = (assessment.submission as any)?.answers ?? {};
    const sanitized = questions.map((q: any, i: number) => {
      const { correct, ...rest } = q;
      if (assessment.results_released && (q.type === "mcq" || q.type === "truefalse")) {
        return { ...rest, isCorrect: answers[String(i)] === correct };
      }
      return rest;
    });
    return { ...assessment, questions: sanitized };
  });
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
