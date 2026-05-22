"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Json, Tables } from "@/lib/supabase_generated_types";

export type TemplateRow = Tables<"assessment_templates">;

function parseQuestions(raw: string | null): Json {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function requireVerifiedCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: company } = await supabase
    .from("companies")
    .select("is_verified")
    .eq("id", userId)
    .maybeSingle();

  if (!company?.is_verified) {
    return { error: "Your company must be verified by an admin before using this feature." };
  }

  return null;
}

export async function getCompanyTemplates(): Promise<TemplateRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("assessment_templates")
    .select("*")
    .eq("company_id", user.id)
    .order("updated_at", { ascending: false });

  return data ?? [];
}

export async function getTemplate(id: string): Promise<TemplateRow | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("assessment_templates")
    .select("*")
    .eq("id", id)
    .eq("company_id", user.id)
    .maybeSingle();

  return data ?? null;
}

export async function createTemplate(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const verificationError = await requireVerifiedCompany(supabase, user.id);
  if (verificationError) return verificationError;

  const title = ((formData.get("title") ?? formData.get("name")) as string)?.trim();
  if (!title) return { error: "Template name is required." };

  const description = (formData.get("description") as string)?.trim() || "";
  const timeLimitRaw = formData.get("time_limit") as string;
  const time_limit = timeLimitRaw ? parseInt(timeLimitRaw) : null;
  const tagsRaw = (formData.get("tags") as string)?.trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const questionsRaw = formData.get("questions") as string;
  const questions = parseQuestions(questionsRaw);

  const { error } = await supabase.from("assessment_templates").insert({
    company_id: user.id,
    title,
    description,
    time_limit: time_limit && !isNaN(time_limit) ? time_limit : null,
    tags,
    questions,
  });

  if (error) return { error: error.message };

  revalidatePath("/company/assessments/templates");
  redirect("/company/assessments/templates");
}

export async function updateTemplate(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const verificationError = await requireVerifiedCompany(supabase, user.id);
  if (verificationError) return verificationError;

  const title = ((formData.get("title") ?? formData.get("name")) as string)?.trim();
  if (!title) return { error: "Template name is required." };

  const description = (formData.get("description") as string)?.trim() || "";
  const timeLimitRaw = formData.get("time_limit") as string;
  const time_limit = timeLimitRaw ? parseInt(timeLimitRaw) : null;
  const tagsRaw = (formData.get("tags") as string)?.trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const questionsRaw = formData.get("questions") as string;
  const questions = parseQuestions(questionsRaw);

  const { error } = await supabase
    .from("assessment_templates")
    .update({
      title,
      description,
      time_limit: time_limit && !isNaN(time_limit) ? time_limit : null,
      tags,
      questions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/company/assessments/templates");
  redirect("/company/assessments/templates");
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const verificationError = await requireVerifiedCompany(supabase, user.id);
  if (verificationError) return verificationError;

  const { error } = await supabase
    .from("assessment_templates")
    .delete()
    .eq("id", id)
    .eq("company_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/company/assessments/templates");
}

export async function incrementTemplateUseCount(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("assessment_templates")
    .select("use_count")
    .eq("id", id)
    .eq("company_id", user.id)
    .maybeSingle();

  if (!data) return;

  await supabase
    .from("assessment_templates")
    .update({ use_count: data.use_count + 1 })
    .eq("id", id);
}
