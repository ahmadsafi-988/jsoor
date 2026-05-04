"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Tables } from "@/lib/supabase_generated_types";

export type TemplateRow = Tables<"assessment_templates">;

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

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Template name is required." };

  const description = (formData.get("description") as string)?.trim() || null;
  const timeLimitRaw = formData.get("time_limit") as string;
  const time_limit = timeLimitRaw ? parseInt(timeLimitRaw) : null;
  const tagsRaw = (formData.get("tags") as string)?.trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : null;
  const questionsRaw = formData.get("questions") as string;
  let questions = null;
  if (questionsRaw) {
    try { questions = JSON.parse(questionsRaw); } catch { questions = null; }
  }

  const { error } = await supabase.from("assessment_templates").insert({
    company_id: user.id,
    name,
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

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Template name is required." };

  const description = (formData.get("description") as string)?.trim() || null;
  const timeLimitRaw = formData.get("time_limit") as string;
  const time_limit = timeLimitRaw ? parseInt(timeLimitRaw) : null;
  const tagsRaw = (formData.get("tags") as string)?.trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : null;
  const questionsRaw = formData.get("questions") as string;
  let questions = null;
  if (questionsRaw) {
    try { questions = JSON.parse(questionsRaw); } catch { questions = null; }
  }

  const { error } = await supabase
    .from("assessment_templates")
    .update({
      name,
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
