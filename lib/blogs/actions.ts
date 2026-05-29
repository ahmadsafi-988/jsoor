"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase_generated_types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Forbidden." as const };
  return { supabase, adminId: user.id };
}

function blogPayload(formData: FormData):
  | { error: string }
  | { payload: TablesInsert<"blogs"> } {
  const title = ((formData.get("title") as string) || "").trim();
  const slugInput = ((formData.get("slug") as string) || "").trim();
  const slug = slugify(slugInput || title);
  const content = ((formData.get("content") as string) || "").trim();

  if (!title) return { error: "Title is required." as const };
  if (!slug) return { error: "Slug is required." as const };
  if (!content) return { error: "Content is required." as const };

  return {
    payload: {
      title,
      slug,
      content,
      excerpt: ((formData.get("excerpt") as string) || "").trim(),
      category: ((formData.get("category") as string) || "Career Tips").trim(),
      image_url: ((formData.get("image_url") as string) || "").trim() || null,
      read_time: ((formData.get("read_time") as string) || "").trim() || null,
      is_published: formData.get("is_published") === "on",
    },
  };
}

export async function createBlog(formData: FormData) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;

  const parsed = blogPayload(formData);
  if ("error" in parsed) return parsed;

  const { error } = await admin.supabase.from("blogs").insert({
    ...parsed.payload,
    author_id: admin.adminId,
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin/blogs");
  redirect("/admin/blogs");
}

export async function updateBlog(id: string, formData: FormData) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;

  const parsed = blogPayload(formData);
  if ("error" in parsed) return parsed;

  const { data: existing } = await admin.supabase
    .from("blogs")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.supabase
    .from("blogs")
    .update(parsed.payload)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin/blogs");
  revalidatePath(`/blog/${parsed.payload.slug}`);
  if (existing?.slug && existing.slug !== parsed.payload.slug) {
    revalidatePath(`/blog/${existing.slug}`);
  }
  redirect("/admin/blogs");
}

export async function deleteBlog(id: string) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin;

  const { data: existing } = await admin.supabase
    .from("blogs")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.supabase.from("blogs").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin/blogs");
  if (existing?.slug) revalidatePath(`/blog/${existing.slug}`);
  return { success: true };
}
