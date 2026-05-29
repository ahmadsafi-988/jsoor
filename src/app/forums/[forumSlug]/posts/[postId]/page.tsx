import { notFound } from "next/navigation";
import { getForumPostData } from "@/lib/forums/data";
import { ForumPostClient } from "./ForumPostClient";

export default async function ForumPostPage({
  params,
}: {
  params: Promise<{ forumSlug: string; postId: string }>;
}) {
  const { forumSlug, postId } = await params;
  const data = await getForumPostData(forumSlug, postId);
  if (!data) notFound();

  return <ForumPostClient forum={data.forum} post={data.post} userId={data.userId} role={data.role} />;
}
