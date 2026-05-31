"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Json, Tables } from "@/lib/supabase_generated_types";
import { normalizeAssessmentQuestions } from "@/lib/assessments";

export type TemplateRow = Tables<"assessment_templates">;

function parseQuestions(raw: string | null): Json {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeAssessmentQuestions(parsed);
    return normalized.error ? [] : (normalized.questions as Json);
  } catch {
    return [];
  }
}

function getQuestionsValidationError(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const normalized = normalizeAssessmentQuestions(JSON.parse(raw));
    return normalized.error ?? null;
  } catch {
    return "Questions could not be read.";
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

export async function createTemplateRecord(formData: FormData) {
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
  const questionError = getQuestionsValidationError(questionsRaw);
  if (questionError) return { error: questionError };
  const questions = parseQuestions(questionsRaw);

  const { data, error } = await supabase
    .from("assessment_templates")
    .insert({
      company_id: user.id,
      title,
      description,
      time_limit: time_limit && !isNaN(time_limit) ? time_limit : null,
      tags,
      questions,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/company/assessments/templates");
  return { success: true, templateId: data.id };
}

export async function createTemplate(formData: FormData) {
  const result = await createTemplateRecord(formData);
  if ("error" in result) return result;

  redirect("/company/assessments/templates");
}

export async function updateTemplateRecord(id: string, formData: FormData) {
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
  const questionError = getQuestionsValidationError(questionsRaw);
  if (questionError) return { error: questionError };
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
  return { success: true };
}

export async function updateTemplate(id: string, formData: FormData) {
  const result = await updateTemplateRecord(id, formData);
  if ("error" in result) return result;

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
