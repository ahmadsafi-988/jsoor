import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getBlogByIdForAdmin } from "@/lib/blogs/data";
import { BlogForm } from "../BlogForm";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ blogId: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { blogId } = await params;
  const blog = await getBlogByIdForAdmin(blogId);
  if (!blog) notFound();

  return <BlogForm blog={blog} />;
}
