import { Tables } from "./supabase_generated_types";

export type BaseProfile = Tables<"profiles">;
export type JobSeekerProfile = Tables<"job_seeker_profiles">;
export type Company = Tables<"companies">;
export type Project = Tables<"projects">;
export type Badge = Tables<"badges">;
export type ProjectSkill = { id: number; name: string };
export type ProjectWithSkills = Project & {
  skills?: string[];
  skillEntries?: ProjectSkill[];
};

// Flat merged type for job seeker profile pages.
// Combines base profile + job seeker extension into one object.
export type user = BaseProfile & Omit<JobSeekerProfile, "id">;

// Backward compat aliases
export type project = ProjectWithSkills;
export type badge = Badge;

export type FullJobSeekerProfile = {
  profile_base: BaseProfile;
  job_seeker_profile: JobSeekerProfile;
  education_logo_url: string | null;
  projects: ProjectWithSkills[];
  badges: Badge[];
  skills: string[];
};
