import { createClient } from "@/lib/supabase/server";

const MARKER = "/object/public/cvs/";

function extractCvPath(cvUrl: string): string {
  // Old format: full public URL — extract the storage path
  const idx = cvUrl.indexOf(MARKER);
  if (idx !== -1) return cvUrl.slice(idx + MARKER.length);
  // New format: path only (e.g. "userId/cv.pdf")
  return cvUrl;
}

export async function getCvSignedUrl(cvUrl: string, expiresIn = 3600): Promise<string | null> {
  const supabase = await createClient();
  const path = extractCvPath(cvUrl);
  const { data } = await supabase.storage.from("cvs").createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}
