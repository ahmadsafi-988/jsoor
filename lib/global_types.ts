import { Tables } from "./supabase_generated_types";

export type BaseProfile = Tables<"profiles">;
export type JobSeekerProfile = Tables<"job_seeker_profiles">;
export type Company = Tables<"companies">;
export type Project = Tables<"projects">;
export type Badge = Tables<"badges">;

// Flat merged type for job seeker profile pages.
// Combines base profile + job seeker extension into one object.
export type user = BaseProfile & Omit<JobSeekerProfile, "id">;

// Backward compat aliases
export type project = Project;
export type badge = Badge;

export type FullJobSeekerProfile = {
  profile_base: BaseProfile;
  job_seeker_profile: JobSeekerProfile;
  projects: Project[];
  badges: Badge[];
  skills: string[];
};
