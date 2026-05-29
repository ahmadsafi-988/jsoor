import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewForumPostClient } from "./NewForumPostClient";

export default async function NewForumPostPage({
  params,
}: {
  params: Promise<{ forumSlug: string }>;
}) {
  const { forumSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: forum }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("forums").select("id, name, slug").eq("slug", forumSlug).eq("is_active", true).maybeSingle(),
  ]);

  if (profile?.role !== "job_seeker") redirect(`/forums/${forumSlug}`);
  if (!forum) notFound();

  return (
    <NewForumPostClient
      forumId={forum.id}
      forumSlug={forum.slug}
      forumName={forum.name}
      userId={user.id}
    />
  );
}
