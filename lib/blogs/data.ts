import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase_generated_types";

export type BlogRow = Tables<"blogs">;

export async function getPublishedBlogs(limit?: number): Promise<BlogRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("blogs")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data } = await query;

  return data ?? [];
}

export async function getPublishedBlogBySlug(slug: string): Promise<BlogRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  return data ?? null;
}

export async function getAllBlogsForAdmin(): Promise<BlogRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blogs")
    .select("*")
    .order("updated_at", { ascending: false });

  return data ?? [];
}

export async function getBlogByIdForAdmin(id: string): Promise<BlogRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data ?? null;
}
