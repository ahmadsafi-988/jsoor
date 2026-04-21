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

  const { data: job_seeker_profile, error: jsError } = await supabase
    .from("job_seeker_profiles")
    .select("*")
    .eq("id", profile_base.id)
    .single();

  if (jsError || !job_seeker_profile) {
    console.error("[getProfileByUsername] job_seeker_profiles error:", jsError);
    return null;
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
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

  const skills = (profileSkills ?? []).map((s: any) => s.skills.name);

  return {
    profile_base,
    job_seeker_profile,
    projects: projects ?? [],
    badges: badges ?? [],
    skills,
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
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

  return data.username;
}
