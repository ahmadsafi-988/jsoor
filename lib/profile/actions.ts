"use server";

// lib/profile/actions.ts
// All server actions for profile creation, editing, projects, badges, and account.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function normalizeOptionalUrl(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  return raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function textFromMeta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }

  return "";
}

function titleFromHtml(html: string) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1]) : "";
}

function publicHttpUrl(rawUrl: string) {
  const normalized = normalizeOptionalUrl(rawUrl);
  if (!normalized) throw new Error("Badge URL is required.");

  const url = new URL(normalized);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Badge URL must be a public HTTP URL.");
  }

  const host = url.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "::1" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);

  if (blocked) throw new Error("Badge URL must be public.");
  return url.toString();
}

function firstJsonLdObject(html: string) {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];

  for (const script of scripts) {
    const json = script
      .replace(/^<script[^>]*>/i, "")
      .replace(/<\/script>$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) return parsed[0] ?? null;
      if (parsed?.["@graph"] && Array.isArray(parsed["@graph"])) return parsed["@graph"][0] ?? null;
      return parsed;
    } catch {
      continue;
    }
  }

  return null;
}

function cleanBadgeTitle(value: string) {
  return value
    .replace(/\s*[-|]\s*(Credly|Badgr|Acclaim)\s*$/i, "")
    .trim();
}

function namedObjectValue(source: Record<string, unknown> | null, key: string) {
  const value = source?.[key];
  if (!value || typeof value !== "object") return "";

  const name = (value as Record<string, unknown>).name;
  return typeof name === "string" ? name : "";
}

export async function fetchBadgeMetadata(url: string) {
  try {
    const publicUrl = publicHttpUrl(url);
    const response = await fetch(publicUrl, {
      headers: {
        "user-agent": "Jsoor badge importer",
        accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    if (!response.ok) return { error: `Could not read badge page (${response.status}).` };

    const html = (await response.text()).slice(0, 750_000);
    const jsonLd = firstJsonLdObject(html) as Record<string, unknown> | null;
    const description = textFromMeta(html, "description") || textFromMeta(html, "og:description");
    const rawTitle =
      (typeof jsonLd?.name === "string" ? jsonLd.name : "") ||
      textFromMeta(html, "og:title") ||
      textFromMeta(html, "twitter:title") ||
      titleFromHtml(html);
    const image =
      (typeof jsonLd?.image === "string" ? jsonLd.image : "") ||
      textFromMeta(html, "og:image") ||
      textFromMeta(html, "twitter:image");
    const issuer =
      namedObjectValue(jsonLd, "issuer") ||
      namedObjectValue(jsonLd, "provider") ||
      (description.match(/issued by ([^.]+)/i)?.[1] ?? "");
    const date =
      (typeof jsonLd?.dateIssued === "string" ? jsonLd.dateIssued : "") ||
      (typeof jsonLd?.validFrom === "string" ? jsonLd.validFrom : "") ||
      (html.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "");

    return {
      badge: {
        name: cleanBadgeTitle(rawTitle) || "Badge",
        issuer: issuer.trim(),
        image,
        url: publicUrl,
        date: date.slice(0, 10),
      },
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not read badge metadata." };
  }
}

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
    website: normalizeOptionalUrl(formData.get("website")),
    github: normalizeOptionalUrl(formData.get("github")),
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

export async function upsertProject(formData: FormData, username: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const idRaw = formData.get("id");
  const projectId = idRaw ? Number(idRaw) : null;
  const skillIds = [
    ...new Set(
      formData
        .getAll("skill_ids")
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    ),
  ];
  const payload = {
    user_id: user.id,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    status: formData.get("status") as string,
    url: formData.get("url") as string,
  };

  const projectResult = projectId
    ? await supabase
        .from("projects")
        .update(payload)
        .eq("id", projectId)
        .eq("user_id", user.id)
        .select("id")
        .single()
    : await supabase
        .from("projects")
        .insert(payload)
        .select("id")
        .single();

  if (projectResult.error) return { error: projectResult.error.message };
  if (!projectResult.data) return { error: "Project could not be saved." };

  const savedProjectId = projectResult.data.id;

  const { error: deleteSkillsError } = await supabase
    .from("project_to_skills")
    .delete()
    .eq("project_id", savedProjectId);

  if (deleteSkillsError) return { error: deleteSkillsError.message };

  if (skillIds.length > 0) {
    const { error: insertSkillsError } = await supabase
      .from("project_to_skills")
      .insert(skillIds.map((skillId) => ({ project_id: savedProjectId, skill_id: skillId })));

    if (insertSkillsError) return { error: insertSkillsError.message };
  }

  if (username) revalidatePath(`/job-seeker/profile/${username}`);
  return { success: true, projectId: savedProjectId };
}

export async function deleteProject(projectId: number, username: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: ownedProject, error: ownedProjectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownedProjectError) return { error: ownedProjectError.message };
  if (!ownedProject) return { error: "Project not found." };

  const { error: deleteSkillsError } = await supabase
    .from("project_to_skills")
    .delete()
    .eq("project_id", projectId);

  if (deleteSkillsError) return { error: deleteSkillsError.message };

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  if (username) revalidatePath(`/job-seeker/profile/${username}`);
  return { success: true };
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export async function upsertBadge(formData: FormData, username: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const idRaw = formData.get("id");
  const url = normalizeOptionalUrl(formData.get("url"));
  if (!url) return { error: "Badge URL is required." };

  const metadata = await fetchBadgeMetadata(url);
  const providedName = ((formData.get("name") as string) || "").trim();
  if (!providedName && "error" in metadata) return { error: metadata.error };

  const badgeMetadata = "badge" in metadata ? metadata.badge : null;

  const payload = {
    ...(idRaw ? { id: Number(idRaw) } : {}),
    user_id: user.id,
    name: (providedName || badgeMetadata?.name || "Badge").trim(),
    issuer: ((formData.get("issuer") as string) || badgeMetadata?.issuer || "").trim(),
    image: ((formData.get("image") as string) || badgeMetadata?.image || "").trim(),
    url,
    date: ((formData.get("date") as string) || badgeMetadata?.date || "").trim(),
  };

  const { error } = await supabase.from("badges").upsert(payload);
  if (error) return { error: error.message };

  if (username) revalidatePath(`/job-seeker/profile/${username}`);
  return { success: true };
}

export async function deleteBadge(badgeId: number, username: string) {
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
  if (username) revalidatePath(`/job-seeker/profile/${username}`);
  return { success: true };
}

export async function addProfileSkill(skillId: number, username: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("profile_to_skills")
    .insert({ user_id: user.id, skill_id: skillId });
  if (error) return { error: error.message };

  if (username) revalidatePath(`/job-seeker/profile/${username}`);
  return { success: true };
}

export async function removeProfileSkill(skillId: number, username: string) {
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

  if (username) revalidatePath(`/job-seeker/profile/${username}`);
  return { success: true };
}
