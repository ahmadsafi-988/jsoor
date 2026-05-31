"use client";

// lib/storage/upload.ts
// Client-side helpers that upload files to Supabase Storage buckets.
// Called from client components; the resulting public URL is then
// saved to the profiles table via a server action.

import { createClient } from "@/lib/supabase/client";
import {
  ASSESSMENT_SUBMISSIONS_BUCKET,
  isAllowedAssessmentFile,
  type AssessmentFileAnswer,
} from "@/lib/assessments";

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

async function uploadPublicImage(
  path: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return { error: error.message };

  const { data } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(path);

  return { url: `${data.publicUrl}?t=${Date.now()}` };
}

export async function uploadProfileCover(
  userId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const ext = getExtension(file);
  return uploadPublicImage(`${userId}/cover.${ext}`, file);
}

export async function uploadCompanyCover(
  userId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const ext = getExtension(file);
  return uploadPublicImage(`company-covers/${userId}.${ext}`, file);
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

  // Return the storage path only — never a public URL.
  // Signed URLs are generated server-side at read time by authorized parties.
  return { url: path };
}

function sanitizeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export async function uploadAssessmentSubmissionFile(
  assessmentId: string,
  questionIndex: number,
  file: File,
): Promise<{ file: AssessmentFileAnswer } | { error: string }> {
  const validationError = isAllowedAssessmentFile(file);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const safeName = sanitizeFileName(file.name) || "submission-file";
  const path = `${assessmentId}/${user.id}/question-${questionIndex}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(ASSESSMENT_SUBMISSIONS_BUCKET)
    .upload(path, file, { contentType: file.type || "application/octet-stream" });

  if (error) return { error: error.message };

  return {
    file: {
      path,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    },
  };
}
