import { notFound, redirect } from "next/navigation";
import { getForumPostData } from "@/lib/forums/data";
import { NewForumPostClient } from "../../../new/NewForumPostClient";

export default async function EditForumPostPage({
  params,
}: {
  params: Promise<{ forumSlug: string; postId: string }>;
}) {
  const { forumSlug, postId } = await params;
  const data = await getForumPostData(forumSlug, postId);
  if (!data) notFound();
  if (!data.userId) redirect("/auth/login");
  if (data.userId !== data.post.author_id) redirect(`/forums/${forumSlug}/posts/${postId}`);

  return (
    <NewForumPostClient
      mode="edit"
      forumId={data.forum.id}
      forumSlug={data.forum.slug}
      forumName={data.forum.name}
      userId={data.userId}
      postId={data.post.id}
      initialTitle={data.post.title}
      initialBody={data.post.body}
      initialAnonymous={data.post.is_anonymous}
      existingImages={data.post.images.map((image) => ({
        id: image.id,
        signed_url: image.signed_url,
        alt_text: image.alt_text,
      }))}
    />
  );
}
