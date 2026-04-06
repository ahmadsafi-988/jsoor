// lib/profile/profile_data.ts
// Server-side Supabase queries for the profile page.

import { createClient } from "@/lib/supabase/server";
import type { profile } from "@/lib/global_types";

/**
 * Fetches the full profile composite (base + projects + badges)
 * by matching the `username` column in the `profiles` table.
 *
 * Returns null when no user with that username exists.
 */
export async function getProfileByUsername(
  username: string
): Promise<profile | null> {
  const supabase = await createClient();

  // ── 1. Base profile ────────────────────────────────────────────────────────
  const { data: profile_base, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (profileError || !profile_base) {
    console.error("[getProfileByUsername] profiles error:", profileError);
    return null;
  }

  // ── 2. Projects ────────────────────────────────────────────────────────────
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", profile_base.id);

  if (projectsError) {
    console.error("[getProfileByUsername] projects error:", projectsError);
  }

  // ── 3. Badges ──────────────────────────────────────────────────────────────
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
  .eq("user_id", profile_base.id)

  const skills = (profileSkills ?? []).map((s: any) => s.skills.name)
  return {
    profile_base,
    projects: projects ?? [],
    badges: badges ?? [],
    skills
  };

}

/**
 * Returns the currently authenticated user's ID, or null if not signed in.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims?.sub ?? null
}