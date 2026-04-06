"use client";

// lib/storage/upload.ts
// Client-side helpers that upload files to Supabase Storage buckets.
// Called from client components; the resulting public URL is then
// saved to the profiles table via a server action.

import { createClient } from "@/lib/supabase/client";

const AVATAR_BUCKET = "avatars";
const CV_BUCKET = "cvs";

function getExtension(file: File) {
  return file.name.split(".").pop() ?? "bin";
}

/**
 * Uploads an avatar image to the "avatars" bucket (public).
 * Returns the public URL on success.
 * Path: {userId}/avatar.{ext}  — overwrites any previous avatar.
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const supabase = createClient();
  const ext = getExtension(file);
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return { error: error.message };

  const { data } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(path);
  // Bust cache so the new image shows immediately
  return { url: `${data.publicUrl}?t=${Date.now()}` };
}

/**
 * Uploads a CV PDF to the "cvs" bucket (private — access via signed URL).
 * Returns a long-lived signed URL (1 year) on success.
 * Path: {userId}/cv.{ext}  — overwrites any previous CV.
 */
export async function uploadCV(
  userId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const supabase = createClient();
  const ext = getExtension(file);
  const path = `${userId}/cv.${ext}`;

  const { error } = await supabase.storage
    .from(CV_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return { error: error.message };

  // Signed URL valid for 1 year (31_536_000 seconds)
  //   const { data, error: signError } = await supabase.storage
  //     .from(CV_BUCKET)
  //     .createSignedUrl(path, 31_536_000);
  //   if (signError || !data) return { error: signError?.message ?? "Failed to sign URL" };
  //   return { url: data.signedUrl };

    const { data} = await supabase.storage
        .from(CV_BUCKET)
        .getPublicUrl(path);
    return { url: data.publicUrl };
}