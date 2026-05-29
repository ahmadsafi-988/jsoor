// lib/profile/profile_data.ts
// Server-side Supabase queries for the profile page.

import { createClient } from "@/lib/supabase/server";
import type { FullJobSeekerProfile } from "@/lib/global_types";

export async function getProfileByUsername(
  username: string
): Promise<FullJobSeekerProfile | null> {
  const supabase = await createClient();

  const { data: profile_base, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (profileError || !profile_base) {
    console.error("[getProfileByUsername] profiles error:", profileError);
    return null;
  }

  const { data: job_seeker_profile_data } = await supabase
    .from("job_seeker_profiles")
    .select("*")
    .eq("id", profile_base.id)
    .maybeSingle();

  const job_seeker_profile = job_seeker_profile_data ?? {
    id: profile_base.id,
    bio: "",
    degree: null,
    institution: null,
    gpa: null,
    edu_start: null,
    edu_end: null,
    github: null,
    location: null,
    website: null,
    cv_url: null,
  };

  let education_logo_url: string | null = null;
  if (job_seeker_profile.institution) {
    const { data: university } = await supabase
      .from("universities")
      .select("logo_url")
      .eq("name", job_seeker_profile.institution)
      .maybeSingle();

    education_logo_url = university?.logo_url?.trim() || null;
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*, project_to_skills(skill:skills(name))")
    .eq("user_id", profile_base.id);

  if (projectsError) {
    console.error("[getProfileByUsername] projects error:", projectsError);
  }

  const { data: badges, error: badgesError } = await supabase
    .from("badges")
    .select("*")
    .eq("user_id", profile_base.id);

  if (badgesError) {
    console.error("[getProfileByUsername] badges error:", badgesError);
  }

  const { data: profileSkills } = await supabase
    .from("profile_to_skills")
    .select("skills(name)")
    .eq("user_id", profile_base.id);

  const skills = ((profileSkills ?? []) as Array<{ skills: { name: string } | null }>)
    .map((s) => s.skills?.name)
    .filter((name): name is string => Boolean(name));

  const projectsWithSkills = ((projects ?? []) as Array<
    NonNullable<typeof projects>[number] & {
      project_to_skills?: Array<{ skill: { name: string } | null }>;
    }
  >).map(({ project_to_skills, ...project }) => ({
    ...project,
    skills: (project_to_skills ?? [])
      .map((projectSkill) => projectSkill.skill?.name)
      .filter((name): name is string => Boolean(name)),
  }));

  return {
    profile_base,
    job_seeker_profile,
    education_logo_url,
    projects: projectsWithSkills,
    badges: badges ?? [],
    skills,
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getCurrentUsername(): Promise<string | null> {
  const supabase = await createClient();

  const id = await getCurrentUserId();
  if (!id) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error fetching username:", error?.message);
    return null;
  }

  return data.username || null;
}
