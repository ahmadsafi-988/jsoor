"use server";

// lib/profile/actions.ts
// All server actions for profile creation, editing, projects, badges, and account.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/job-seeker/onboarding`,
    },
  });

  if (error) return { error: error.message };

  redirect("/auth/sign-up-success");
}

export async function updateEmail(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: error.message };

  return {
    message:
      "Confirmation email sent to your new address. The change will take effect once you click the link.",
  };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not authenticated." };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) return { error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  return { message: "Password updated successfully." };
}

// ─── Profile upsert ───────────────────────────────────────────────────────────

export async function upsertProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const username = formData.get("username") as string;

  // Write 1: base profile (shared fields only)
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    username,
    joined_date: new Date().toISOString().split("T")[0],
  });
  if (profileError) return { error: profileError.message };

  // Write 2: job seeker extension
  const { error: jsError } = await supabase.from("job_seeker_profiles").upsert({
    id: user.id,
    bio: (formData.get("bio") as string) || "",
    location: (formData.get("location") as string) || null,
    website: (formData.get("website") as string) || null,
    github: (formData.get("github") as string) || null,
    institution: (formData.get("institution") as string) || null,
    degree: (formData.get("degree") as string) || null,
    gpa: (formData.get("gpa") as string) || null,
    edu_start: (formData.get("edu_start") as string) || null,
    edu_end: (formData.get("edu_end") as string) || null,
  });
  if (jsError) return { error: jsError.message };

  revalidatePath(`/job-seeker/profile/${username}`);
  return { success: true };
}

export async function updateAvatarUrl(avatarUrl: string, username: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/job-seeker/profile/${username}`);
  return { success: true };
}

export async function updateCvUrl(cvPath: string, username: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("job_seeker_profiles")
    .update({ cv_url: cvPath })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/job-seeker/profile/${username}`);
  return { success: true };
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function upsertProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const idRaw = formData.get("id");
  const payload = {
    ...(idRaw ? { id: Number(idRaw) } : {}),
    user_id: user.id,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    status: formData.get("status") as string,
    url: formData.get("url") as string,
  };

  const { error } = await supabase.from("projects").upsert(payload);
  if (error) return { error: error.message };

  revalidatePath("/job-seeker/profile");
  return { success: true };
}

export async function deleteProject(projectId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/job-seeker/profile");
  return { success: true };
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export async function upsertBadge(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const idRaw = formData.get("id");
  const payload = {
    ...(idRaw ? { id: Number(idRaw) } : {}),
    user_id: user.id,
    name: formData.get("name") as string,
    issuer: formData.get("issuer") as string,
    image: formData.get("image") as string,
    url: formData.get("url") as string,
    date: formData.get("date") as string,
  };

  const { error } = await supabase.from("badges").upsert(payload);
  if (error) return { error: error.message };

  revalidatePath("/job-seeker/profile");
  return { success: true };
}

export async function deleteBadge(badgeId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("badges")
    .delete()
    .eq("id", badgeId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/job-seeker/profile");
  return { success: true };
}

export async function addProfileSkill(skillId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("profile_to_skills")
    .insert({ user_id: user.id, skill_id: skillId });
  if (error) return { error: error.message };

  revalidatePath("/job-seeker/profile");
  return { success: true };
}

export async function removeProfileSkill(skillId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("profile_to_skills")
    .delete()
    .eq("user_id", user.id)
    .eq("skill_id", skillId);
  if (error) return { error: error.message };

  revalidatePath("/job-seeker/profile");
  return { success: true };
}
