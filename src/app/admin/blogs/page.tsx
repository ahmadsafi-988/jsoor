import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getAllBlogsForAdmin } from "@/lib/blogs/data";
import { AdminBlogsClient } from "./AdminBlogsClient";

export default async function AdminBlogsPage() {
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

  const blogs = await getAllBlogsForAdmin();

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Blogs</h1>
          <p className="text-neutral-500 text-sm">
            Create and manage public landing page articles.
          </p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#006d43] to-[#00a86b] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          New Blog
        </Link>
      </div>

      <AdminBlogsClient blogs={blogs} />
    </div>
  );
}
