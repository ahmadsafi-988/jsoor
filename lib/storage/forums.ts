import { createClient } from "@/lib/supabase/server";
import { FORUM_MEDIA_BUCKET } from "@/lib/storage/forum-constants";

export async function getForumMediaSignedUrl(
  storagePath: string,
  expiresIn = 3600,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(FORUM_MEDIA_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  return data?.signedUrl ?? null;
}
