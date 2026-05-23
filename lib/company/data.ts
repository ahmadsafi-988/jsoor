// lib/company/data.ts
// Server-side data fetching for the company role.

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
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

export type CanonicalJob = JobRow & {
  company: CompanyRow | null;
  requiredSkills: string[];
};

export type PublicCompanyProfile = {
  company: CompanyRow;
  profile: Pick<Tables<"profiles">, "id" | "username" | "first_name" | "last_name" | "avatar_url"> | null;
  jobs: Pick<JobRow, "id" | "title" | "type" | "location" | "salary_range" | "created_at">[];
};

export type CanonicalApplicationDetail = {
  application: ApplicationRow;
  job: JobRow | null;
  company: CompanyRow | null;
  applicant: Pick<Tables<"profiles">, "id" | "first_name" | "last_name" | "username" | "avatar_url"> | null;
  applicantProfile: Pick<Tables<"job_seeker_profiles">, "bio" | "degree" | "institution" | "location" | "website"> | null;
  viewerRole: string;
  isOwnApplication: boolean;
  companyOwnsApplication: boolean;
  isAdmin: boolean;
};

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

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

export async function getPublicCompanyByIdentifier(
  identifier: string
): Promise<PublicCompanyProfile | null> {
  const supabase = await createClient();

  const { data: profileByUsername } = await supabase
    .from("profiles")
    .select("id, username, first_name, last_name, avatar_url, role")
    .eq("username", identifier)
    .maybeSingle();

  if (profileByUsername && profileByUsername.role !== "company") return null;

  const companyId = profileByUsername?.id ?? (UUID_RE.test(identifier) ? identifier : null);
  if (!companyId) return null;

  const [{ data: company }, { data: profileById }, { data: jobs }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", companyId).maybeSingle(),
    supabase
      .from("profiles")
      .select("id, username, first_name, last_name, avatar_url")
      .eq("id", companyId)
      .maybeSingle(),
    supabase
      .from("jobs")
      .select("id, title, type, location, salary_range, created_at")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .eq("admin_locked", false)
      .order("created_at", { ascending: false }),
  ]);

  if (!company) return null;

  return {
    company,
    profile: profileByUsername
      ? {
          id: profileByUsername.id,
          username: profileByUsername.username,
          first_name: profileByUsername.first_name,
          last_name: profileByUsername.last_name,
          avatar_url: profileByUsername.avatar_url,
        }
      : profileById,
    jobs: jobs ?? [],
  };
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

export async function getCanonicalJobById(jobId: string): Promise<CanonicalJob | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  const { data } = await supabase
    .from("jobs")
    .select(`
      *,
      company:companies!jobs_company_id_fkey(*),
      job_to_skills(skill:skills(name))
    `)
    .eq("id", jobId)
    .maybeSingle();

  if (!data) return null;

  const job = data as JobRow & {
    company: CompanyRow | null;
    job_to_skills?: { skill: { name: string } | null }[];
  };

  const isOwner = user?.id === job.company_id;
  const isAdmin = profile?.role === "admin";
  const isPublic = job.is_active && !job.admin_locked;
  if (!isPublic && !isOwner && !isAdmin) return null;

  return {
    ...job,
    requiredSkills: (job.job_to_skills ?? [])
      .map((entry) => entry.skill?.name)
      .filter(Boolean) as string[],
  };
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

export async function getCanonicalApplicationDetail(
  applicationId: string
): Promise<CanonicalApplicationDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = viewerProfile?.role === "admin";
  const queryClient = isAdmin ? getServiceClient() ?? supabase : supabase;

  const { data: applicationData } = await queryClient
    .from("job_applications")
    .select("*, job:jobs!job_applications_job_id_fkey(*)")
    .eq("id", applicationId)
    .maybeSingle();

  if (!applicationData) return null;

  const application = applicationData as ApplicationRow & { job: JobRow | null };
  const job = application.job;
  const isOwnApplication = application.applicant_id === user.id;
  const companyOwnsApplication = viewerProfile?.role === "company" && job?.company_id === user.id;

  if (!isAdmin && !isOwnApplication && !companyOwnsApplication) return null;

  const [{ data: company }, { data: applicant }, { data: applicantProfile }] = await Promise.all([
    job
      ? queryClient.from("companies").select("*").eq("id", job.company_id).maybeSingle()
      : Promise.resolve({ data: null }),
    queryClient
      .from("profiles")
      .select("id, first_name, last_name, username, avatar_url")
      .eq("id", application.applicant_id)
      .maybeSingle(),
    queryClient
      .from("job_seeker_profiles")
      .select("bio, degree, institution, location, website")
      .eq("id", application.applicant_id)
      .maybeSingle(),
  ]);

  return {
    application,
    job,
    company,
    applicant,
    applicantProfile,
    viewerRole: viewerProfile?.role ?? "unknown",
    isOwnApplication,
    companyOwnsApplication,
    isAdmin,
  };
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

  // applicant_id FK → auth.users (not profiles) so PostgREST can't join profiles in one shot
  const { data: rows } = await supabase
    .from("assessments")
    .select(`
      *,
      application:job_applications!assessments_application_id_fkey(
        id, job_id, applicant_id, status,
        job:jobs!job_applications_job_id_fkey(title)
      )
    `)
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  if (!rows || rows.length === 0) return [];

  const applicantIds = [
    ...new Set(
      (rows as any[]).map((r) => r.application?.applicant_id).filter(Boolean)
    ),
  ];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, username")
    .in("id", applicantIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return (rows as any[]).map((r) => ({
    ...r,
    application: r.application
      ? {
          ...r.application,
          profile: profileMap[r.application.applicant_id] ?? null,
        }
      : null,
  })) as AssessmentWithApplication[];
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
