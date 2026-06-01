"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase_generated_types";
import { insertNotification, insertNotificationsForAdmins } from "@/lib/notifications/actions";
import { FORUM_MEDIA_BUCKET, MAX_FORUM_IMAGES } from "@/lib/storage/forum-constants";
import { slugifyForumName } from "@/lib/forums/data";

type ActionResult = { success: true; id?: string } | { error: string };
type ForumAuthProfile = Pick<
  Tables<"profiles">,
  "id" | "first_name" | "last_name" | "username" | "role"
>;
type ForumAllowedRole = "job_seeker" | "company" | "admin";
type ForumAuthSuccess = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  service: SupabaseClient<Database>;
  user: User;
  profile: ForumAuthProfile;
};

const LIMITS = {
  forumName: 80,
  forumDescription: 400,
  forumReason: 500,
  postTitle: 160,
  postBody: 8000,
  commentBody: 2000,
  reportReason: 500,
};

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function getText(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

async function requireRole(
  allowed: ForumAllowedRole[],
): Promise<ForumAuthSuccess | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, username, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !allowed.includes(profile.role as ForumAllowedRole)) {
    return { error: "You do not have access to communities yet." as const };
  }

  return { supabase, service: serviceClient(), user, profile: profile as ForumAuthProfile };
}

async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  targetLabel: string,
  reason?: string | null,
) {
  await serviceClient().from("admin_audit_logs").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    target_label: targetLabel,
    reason: reason || null,
  });
}

async function forumExists(slug: string, name: string, excludeRequestId?: string) {
  const service = serviceClient();
  let requestQuery = service
    .from("forum_creation_requests")
    .select("id")
    .in("status", ["pending", "approved"])
    .or(`slug.eq.${slug},name.eq.${name}`)
    .limit(1);

  if (excludeRequestId) {
    requestQuery = requestQuery.neq("id", excludeRequestId);
  }

  const [{ data: forums }, { data: requests }] = await Promise.all([
    service
      .from("forums")
      .select("id")
      .or(`slug.eq.${slug},name.eq.${name}`)
      .limit(1),
    requestQuery,
  ]);

  return Boolean(forums?.length || requests?.length);
}

function parseImagePaths(formData: FormData, userId: string) {
  const raw = String(formData.get("image_paths") ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = [];
  }

  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.startsWith(`${userId}/`))
    .slice(0, MAX_FORUM_IMAGES);
}

function parseStringList(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = [];
  }

  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function deleteForumMedia(paths: string[]) {
  if (paths.length === 0) return;
  await serviceClient().storage.from(FORUM_MEDIA_BUCKET).remove(paths);
}

export async function requestForumCreation(formData: FormData): Promise<ActionResult> {
  const auth = await requireRole(["job_seeker", "company"]);
  if ("error" in auth) return auth;

  const name = getText(formData, "name", LIMITS.forumName);
  const description = getText(formData, "description", LIMITS.forumDescription);
  const reason = getText(formData, "reason", LIMITS.forumReason);
  const slug = slugifyForumName(name);

  if (!name) return { error: "Community name is required." };
  if (!slug) return { error: "Please use a community name with letters or numbers." };
  if (!description) return { error: "Community description is required." };
  if (!reason) return { error: "Please explain why this community should be created." };
  if (await forumExists(slug, name)) {
    return { error: "A community with this name already exists or is waiting for review." };
  }

  const { data, error } = await auth.supabase
    .from("forum_creation_requests")
    .insert({
      requested_by: auth.user.id,
      name,
      slug,
      description,
      reason,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await insertNotification({
    userId: auth.user.id,
    actorId: auth.user.id,
    type: "forum_request_submitted",
    title: "Community request submitted",
    body: `"${name}" has been sent to admins for review.`,
    link: "/forums",
    entityType: "forum_creation_request",
    entityId: data.id,
  });

  await insertNotificationsForAdmins({
    actorId: auth.user.id,
    type: "forum_request_received",
    title: "New community request",
    body: `${auth.profile.first_name} requested "${name}".`,
    link: "/admin/forums",
    entityType: "forum_creation_request",
    entityId: data.id,
  });

  revalidatePath("/forums");
  revalidatePath("/admin/forums");
  return { success: true, id: data.id };
}

export async function createForumDirect(formData: FormData): Promise<ActionResult> {
  const auth = await requireRole(["admin"]);
  if ("error" in auth) return auth;

  const name = getText(formData, "name", LIMITS.forumName);
  const description = getText(formData, "description", LIMITS.forumDescription);
  const slug = slugifyForumName(name);

  if (!name) return { error: "Community name is required." };
  if (!description) return { error: "Community description is required." };
  if (!slug) return { error: "Please use a community name with letters or numbers." };
  if (await forumExists(slug, name)) return { error: "A community with this name already exists." };

  const { data, error } = await auth.service
    .from("forums")
    .insert({ name, slug, description, created_by: auth.user.id, is_active: true })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAdminAction(auth.user.id, "create_forum", "forum", data.id, name);
  revalidatePath("/forums");
  revalidatePath("/admin/forums");
  return { success: true, id: data.id };
}

export async function approveForumRequest(requestId: string): Promise<ActionResult> {
  const auth = await requireRole(["admin"]);
  if ("error" in auth) return auth;

  const { data: request, error: requestError } = await auth.service
    .from("forum_creation_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) return { error: requestError.message };
  if (!request) return { error: "Community request not found." };
  if (request.status !== "pending") return { error: "This request has already been reviewed." };
  if (await forumExists(request.slug, request.name, request.id)) return { error: "A community with this name already exists." };

  const { data: forum, error: forumError } = await auth.service
    .from("forums")
    .insert({
      name: request.name,
      slug: request.slug,
      description: request.description,
      created_by: request.requested_by,
      created_from_request_id: request.id,
      is_active: true,
    })
    .select("id")
    .single();

  if (forumError) return { error: forumError.message };

  const reviewedAt = new Date().toISOString();
  const { error: updateError } = await auth.service
    .from("forum_creation_requests")
    .update({ status: "approved", reviewed_by: auth.user.id, reviewed_at: reviewedAt })
    .eq("id", request.id);
  if (updateError) return { error: updateError.message };

  await insertNotification({
    userId: request.requested_by,
    actorId: auth.user.id,
    type: "forum_request_approved",
    title: "Community request approved",
    body: `"${request.name}" is now available.`,
    link: `/forums/${request.slug}`,
    entityType: "forum",
    entityId: forum.id,
  });

  await logAdminAction(auth.user.id, "approve_forum_request", "forum_request", request.id, request.name);
  revalidatePath("/forums");
  revalidatePath("/admin/forums");
  return { success: true, id: forum.id };
}

export async function rejectForumRequest(requestId: string, reason?: string): Promise<ActionResult> {
  const auth = await requireRole(["admin"]);
  if ("error" in auth) return auth;

  const adminReason = (reason ?? "").trim().slice(0, LIMITS.forumReason) || null;
  const { data: request } = await auth.service
    .from("forum_creation_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) return { error: "Community request not found." };
  if (request.status !== "pending") return { error: "This request has already been reviewed." };

  const { error } = await auth.service
    .from("forum_creation_requests")
    .update({
      status: "rejected",
      admin_reason: adminReason,
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", request.id);

  if (error) return { error: error.message };

  await insertNotification({
    userId: request.requested_by,
    actorId: auth.user.id,
    type: "forum_request_rejected",
    title: "Community request reviewed",
    body: adminReason
      ? `"${request.name}" was not approved. Reason: ${adminReason}`
      : `"${request.name}" was not approved.`,
    link: "/forums",
    entityType: "forum_creation_request",
    entityId: request.id,
  });

  await logAdminAction(auth.user.id, "reject_forum_request", "forum_request", request.id, request.name, adminReason);
  revalidatePath("/forums");
  revalidatePath("/admin/forums");
  return { success: true };
}

export async function createForumPost(formData: FormData): Promise<ActionResult> {
  const auth = await requireRole(["job_seeker", "company"]);
  if ("error" in auth) return auth;

  const forumId = String(formData.get("forum_id") ?? "");
  const forumSlug = String(formData.get("forum_slug") ?? "");
  const title = getText(formData, "title", LIMITS.postTitle);
  const body = getText(formData, "body", LIMITS.postBody);
  const imagePaths = parseImagePaths(formData, auth.user.id);
  const isAnonymous = formData.get("is_anonymous") === "on";

  if (!title) return { error: "Post title is required." };
  if (!body && imagePaths.length === 0) return { error: "Add post text or at least one image." };

  const { data: forum } = await auth.supabase
    .from("forums")
    .select("id, slug")
    .eq("id", forumId)
    .eq("is_active", true)
    .maybeSingle();

  if (!forum) return { error: "Community not found." };

  const { data: membership } = await auth.supabase
    .from("forum_memberships")
    .select("id")
    .eq("forum_id", forum.id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!membership) return { error: "Join this community before posting." };

  const { data: post, error } = await auth.supabase
    .from("forum_posts")
    .insert({
      forum_id: forum.id,
      author_id: auth.user.id,
      title,
      body,
      is_anonymous: isAnonymous,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (imagePaths.length > 0) {
    const { error: imageError } = await auth.supabase.from("forum_post_images").insert(
      imagePaths.map((path, index) => ({
        post_id: post.id,
        storage_path: path,
        sort_order: index,
      })),
    );
    if (imageError) return { error: imageError.message };
  }

  revalidatePath(`/forums/${forumSlug || forum.slug}`);
  redirect(`/forums/${forumSlug || forum.slug}/posts/${post.id}`);
}

export async function requestForumDeletion(
  forumId: string,
  reason?: string,
): Promise<ActionResult> {
  const auth = await requireRole(["job_seeker", "company"]);
  if ("error" in auth) return auth;

  const trimmedReason = (reason ?? "").trim().slice(0, LIMITS.forumReason);
  const { data: forum, error: forumError } = await auth.supabase
    .from("forums")
    .select("id, name, slug, created_by, is_active")
    .eq("id", forumId)
    .eq("is_active", true)
    .maybeSingle();

  if (forumError) return { error: forumError.message };
  if (!forum) return { error: "Community not found." };
  if (forum.created_by !== auth.user.id) {
    return { error: "Only the community requester can request deletion." };
  }

  const requesterName =
    `${auth.profile.first_name ?? ""} ${auth.profile.last_name ?? ""}`.trim() ||
    auth.profile.username ||
    "A community member";

  const notification = await insertNotificationsForAdmins({
    actorId: auth.user.id,
    type: "forum_report_submitted",
    title: "Community deletion requested",
    body: `${requesterName} requested deleting "${forum.name}".`,
    link: "/admin/forums",
    entityType: "forum",
    entityId: forum.id,
    metadata: {
      action: "forum_deletion_requested",
      forumSlug: forum.slug,
      reason: trimmedReason || null,
    },
  });

  if ("error" in notification) return { error: notification.error };

  await insertNotification({
    userId: auth.user.id,
    actorId: auth.user.id,
    type: "forum_report_submitted",
    title: "Deletion request sent",
    body: `"${forum.name}" was sent to admins for review.`,
    link: `/forums/${forum.slug}`,
    entityType: "forum",
    entityId: forum.id,
    metadata: {
      action: "forum_deletion_requested",
      reason: trimmedReason || null,
    },
  });

  revalidatePath("/forums");
  revalidatePath(`/forums/${forum.slug}`);
  revalidatePath("/admin/forums");
  return { success: true, id: forum.id };
}

export async function joinForum(forumId: string, forumSlug?: string): Promise<ActionResult> {
  const auth = await requireRole(["job_seeker", "company"]);
  if ("error" in auth) return auth;

  const { data: forum } = await auth.supabase
    .from("forums")
    .select("id, slug")
    .eq("id", forumId)
    .eq("is_active", true)
    .maybeSingle();

  if (!forum) return { error: "Community not found." };

  const { error } = await auth.supabase
    .from("forum_memberships")
    .upsert(
      { forum_id: forum.id, user_id: auth.user.id },
      { onConflict: "forum_id,user_id" },
    );

  if (error) return { error: error.message };
  revalidatePath("/forums");
  revalidatePath(`/forums/${forumSlug || forum.slug}`);
  return { success: true, id: forum.id };
}

export async function leaveForum(forumId: string, forumSlug?: string): Promise<ActionResult> {
  const auth = await requireRole(["job_seeker", "company"]);
  if ("error" in auth) return auth;

  const { data: forum } = await auth.supabase
    .from("forums")
    .select("id, slug")
    .eq("id", forumId)
    .maybeSingle();

  const { error } = await auth.supabase
    .from("forum_memberships")
    .delete()
    .eq("forum_id", forumId)
    .eq("user_id", auth.user.id);

  if (error) return { error: error.message };
  revalidatePath("/forums");
  revalidatePath(`/forums/${forumSlug || forum?.slug || ""}`);
  return { success: true, id: forumId };
}

export async function updateOwnForumPost(formData: FormData): Promise<ActionResult> {
  const auth = await requireRole(["job_seeker", "company"]);
  if ("error" in auth) return auth;

  const postId = String(formData.get("post_id") ?? "");
  const forumSlug = String(formData.get("forum_slug") ?? "");
  const title = getText(formData, "title", LIMITS.postTitle);
  const body = getText(formData, "body", LIMITS.postBody);
  const isAnonymous = formData.get("is_anonymous") === "on";
  const newImagePaths = parseImagePaths(formData, auth.user.id);
  const keptImageIds = parseStringList(formData, "kept_image_ids");

  if (!title) return { error: "Post title is required." };

  const { data: post } = await auth.supabase
    .from("forum_posts")
    .select("id, author_id")
    .eq("id", postId)
    .eq("author_id", auth.user.id)
    .maybeSingle();
  if (!post) return { error: "Post not found." };

  const { data: currentImages } = await auth.service
    .from("forum_post_images")
    .select("*")
    .eq("post_id", postId)
    .order("sort_order", { ascending: true });

  const existingImages = (currentImages ?? []) as Tables<"forum_post_images">[];
  const keptImages = existingImages.filter((image) => keptImageIds.includes(image.id));
  const totalImages = keptImages.length + newImagePaths.length;
  if (totalImages > MAX_FORUM_IMAGES) return { error: `Posts can include up to ${MAX_FORUM_IMAGES} images.` };
  if (!body && totalImages === 0) return { error: "Add post text or at least one image." };

  const { error } = await auth.supabase
    .from("forum_posts")
    .update({ title, body, is_anonymous: isAnonymous, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("author_id", auth.user.id);

  if (error) return { error: error.message };

  const removedImages = existingImages.filter((image) => !keptImageIds.includes(image.id));
  if (removedImages.length > 0) {
    const { error: deleteError } = await auth.service
      .from("forum_post_images")
      .delete()
      .in("id", removedImages.map((image) => image.id));
    if (deleteError) return { error: deleteError.message };
    await deleteForumMedia(removedImages.map((image) => image.storage_path));
  }

  for (const [index, image] of keptImages.entries()) {
    if (image.sort_order !== index) {
      const { error: sortError } = await auth.service
        .from("forum_post_images")
        .update({ sort_order: index })
        .eq("id", image.id);
      if (sortError) return { error: sortError.message };
    }
  }

  if (newImagePaths.length > 0) {
    const { error: imageError } = await auth.service.from("forum_post_images").insert(
      newImagePaths.map((path, index) => ({
        post_id: postId,
        storage_path: path,
        sort_order: keptImages.length + index,
      })),
    );
    if (imageError) return { error: imageError.message };
  }

  revalidatePath(`/forums/${forumSlug}/posts/${postId}`);
  revalidatePath(`/forums/${forumSlug}`);
  return { success: true };
}

export async function deleteOwnForumPost(postId: string, forumSlug: string): Promise<ActionResult> {
  const auth = await requireRole(["job_seeker", "company"]);
  if ("error" in auth) return auth;

  const { data: images } = await auth.supabase
    .from("forum_post_images")
    .select("storage_path")
    .eq("post_id", postId);

  const { error } = await auth.supabase
    .from("forum_posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", auth.user.id);

  if (error) return { error: error.message };
  await deleteForumMedia((images ?? []).map((image) => image.storage_path));
  revalidatePath(`/forums/${forumSlug}`);
  redirect(`/forums/${forumSlug}`);
}

export async function createForumComment(formData: FormData): Promise<ActionResult> {
  const auth = await requireRole(["job_seeker", "company"]);
  if ("error" in auth) return auth;

  const postId = String(formData.get("post_id") ?? "");
  const forumSlug = String(formData.get("forum_slug") ?? "");
  const parentCommentId = String(formData.get("parent_comment_id") ?? "") || null;
  const body = getText(formData, "body", LIMITS.commentBody);
  const isAnonymous = formData.get("is_anonymous") === "on";

  if (!body) return { error: "Comment body is required." };

  const { data: post } = await auth.supabase
    .from("forum_posts")
    .select("id, title, author_id, forum_id")
    .eq("id", postId)
    .eq("is_hidden", false)
    .maybeSingle();
  if (!post) return { error: "Post not found." };

  let parent: Tables<"forum_comments"> | null = null;
  if (parentCommentId) {
    const { data } = await auth.supabase
      .from("forum_comments")
      .select("*")
      .eq("id", parentCommentId)
      .eq("post_id", postId)
      .eq("is_hidden", false)
      .maybeSingle();
    parent = data as Tables<"forum_comments"> | null;
    if (!parent) return { error: "Comment not found." };
    if (parent.parent_comment_id) return { error: "Replies can only be one level deep." };
  }

  const { data: comment, error } = await auth.supabase
    .from("forum_comments")
    .insert({
      post_id: postId,
      author_id: auth.user.id,
      parent_comment_id: parentCommentId,
      body,
      is_anonymous: isAnonymous,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (!parentCommentId && post.author_id !== auth.user.id) {
    await insertNotification({
      userId: post.author_id,
      actorId: auth.user.id,
      type: "forum_post_commented",
      title: "New comment on your post",
      body: `Someone commented on "${post.title}".`,
      link: `/forums/${forumSlug}/posts/${postId}`,
      entityType: "forum_comment",
      entityId: comment.id,
    });
  }

  if (parent && parent.author_id !== auth.user.id) {
    await insertNotification({
      userId: parent.author_id,
      actorId: auth.user.id,
      type: "forum_comment_replied",
      title: "New reply to your comment",
      body: `Someone replied in "${post.title}".`,
      link: `/forums/${forumSlug}/posts/${postId}`,
      entityType: "forum_comment",
      entityId: comment.id,
    });
  }

  revalidatePath(`/forums/${forumSlug}/posts/${postId}`);
  return { success: true, id: comment.id };
}

export async function updateOwnForumComment(formData: FormData): Promise<ActionResult> {
  const auth = await requireRole(["job_seeker", "company"]);
  if ("error" in auth) return auth;

  const commentId = String(formData.get("comment_id") ?? "");
  const postId = String(formData.get("post_id") ?? "");
  const forumSlug = String(formData.get("forum_slug") ?? "");
  const body = getText(formData, "body", LIMITS.commentBody);
  const isAnonymous = formData.get("is_anonymous") === "on";

  if (!body) return { error: "Comment body is required." };

  const { error } = await auth.supabase
    .from("forum_comments")
    .update({ body, is_anonymous: isAnonymous, updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_id", auth.user.id);

  if (error) return { error: error.message };
  revalidatePath(`/forums/${forumSlug}/posts/${postId}`);
  return { success: true };
}

export async function deleteOwnForumComment(commentId: string, postId: string, forumSlug: string): Promise<ActionResult> {
  const auth = await requireRole(["job_seeker", "company"]);
  if ("error" in auth) return auth;

  const { error } = await auth.supabase
    .from("forum_comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", auth.user.id);

  if (error) return { error: error.message };
  revalidatePath(`/forums/${forumSlug}/posts/${postId}`);
  return { success: true };
}

export async function voteForumTarget(
  targetType: "post" | "comment",
  targetId: string,
  value: 1 | -1 | 0,
  revalidateHref: string,
): Promise<ActionResult> {
  const auth = await requireRole(["job_seeker", "company"]);
  if ("error" in auth) return auth;

  if (value === 0) {
    const { error } = await auth.supabase
      .from("forum_votes")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId);
    if (error) return { error: error.message };
  } else {
    const { error } = await auth.supabase
      .from("forum_votes")
      .upsert(
        { user_id: auth.user.id, target_type: targetType, target_id: targetId, value },
        { onConflict: "user_id,target_type,target_id" },
      );
    if (error) return { error: error.message };
  }

  revalidatePath(revalidateHref);
  return { success: true };
}

export async function reportForumTarget(
  targetType: "post" | "comment",
  targetId: string,
  reason: string,
): Promise<ActionResult> {
  const auth = await requireRole(["job_seeker", "company"]);
  if ("error" in auth) return auth;

  const trimmed = reason.trim().slice(0, LIMITS.reportReason);
  if (!trimmed) return { error: "Report reason is required." };

  if (targetType === "post") {
    const { data: post } = await auth.supabase
      .from("forum_posts")
      .select("id")
      .eq("id", targetId)
      .eq("is_hidden", false)
      .maybeSingle();
    if (!post) return { error: "Post not found." };
  } else {
    const { data: comment } = await auth.supabase
      .from("forum_comments")
      .select("id")
      .eq("id", targetId)
      .eq("is_hidden", false)
      .maybeSingle();
    if (!comment) return { error: "Comment not found." };
  }

  const { data: report, error } = await auth.supabase
    .from("forum_reports")
    .insert({
      reporter_id: auth.user.id,
      target_type: targetType,
      target_id: targetId,
      reason: trimmed,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "You already have a pending report for this item." };
    return { error: error.message };
  }

  await insertNotificationsForAdmins({
    actorId: auth.user.id,
    type: "forum_report_submitted",
    title: "Community report submitted",
    body: `A user reported a community ${targetType}.`,
    link: "/admin/forums",
    entityType: "forum_report",
    entityId: report.id,
    metadata: { targetType, targetId, reason: trimmed },
  });

  revalidatePath("/admin/forums");
  return { success: true, id: report.id };
}

export async function adminSetForumActive(forumId: string, isActive: boolean, label: string): Promise<ActionResult> {
  const auth = await requireRole(["admin"]);
  if ("error" in auth) return auth;

  const { error } = await auth.service.from("forums").update({ is_active: isActive }).eq("id", forumId);
  if (error) return { error: error.message };

  await logAdminAction(auth.user.id, isActive ? "activate_forum" : "deactivate_forum", "forum", forumId, label);
  revalidatePath("/forums");
  revalidatePath("/admin/forums");
  return { success: true };
}

export async function adminDeleteForum(forumId: string, label: string): Promise<ActionResult> {
  const auth = await requireRole(["admin"]);
  if ("error" in auth) return auth;

  const { data: forum, error: forumError } = await auth.service
    .from("forums")
    .select("id, name")
    .eq("id", forumId)
    .maybeSingle();
  if (forumError) return { error: forumError.message };
  if (!forum) return { error: "Community not found." };

  const { data: posts } = await auth.service
    .from("forum_posts")
    .select("id")
    .eq("forum_id", forum.id);
  const postIds = (posts ?? []).map((post) => post.id);

  if (postIds.length > 0) {
    const { data: images } = await auth.service
      .from("forum_post_images")
      .select("storage_path")
      .in("post_id", postIds);
    await deleteForumMedia((images ?? []).map((image) => image.storage_path));
  }

  const { error } = await auth.service.from("forums").delete().eq("id", forum.id);
  if (error) return { error: error.message };

  await logAdminAction(auth.user.id, "delete_forum", "forum", forum.id, label || forum.name);
  revalidatePath("/forums");
  revalidatePath("/admin/forums");
  return { success: true };
}

export async function adminModerateForumContent(
  targetType: "post" | "comment",
  targetId: string,
  action: "hide" | "unhide" | "delete",
  label: string,
  reason?: string,
  reportId?: string,
): Promise<ActionResult> {
  const auth = await requireRole(["admin"]);
  if ("error" in auth) return auth;

  const table = targetType === "post" ? "forum_posts" : "forum_comments";
  const targetTypeLabel = targetType === "post" ? "forum_post" : "forum_comment";

  if (action === "delete") {
    if (targetType === "post") {
      const { data: images } = await auth.service
        .from("forum_post_images")
        .select("storage_path")
        .eq("post_id", targetId);
      await deleteForumMedia((images ?? []).map((image) => image.storage_path));
    }

    const { error } = await auth.service.from(table).delete().eq("id", targetId);
    if (error) return { error: error.message };
  } else {
    const { error } = await auth.service
      .from(table)
      .update({
        is_hidden: action === "hide",
        hidden_reason: action === "hide" ? (reason ?? null) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetId);
    if (error) return { error: error.message };
  }

  if (reportId && (action === "hide" || action === "delete")) {
    const { error: reportError } = await auth.service
      .from("forum_reports")
      .update({ status: "reviewed", resolved_by: auth.user.id, resolved_at: new Date().toISOString() })
      .eq("id", reportId);
    if (reportError) return { error: reportError.message };
  }

  await logAdminAction(
    auth.user.id,
    `${action}_forum_${targetType}`,
    targetTypeLabel,
    targetId,
    label,
    reason,
  );
  revalidatePath("/forums");
  revalidatePath("/admin/forums");
  return { success: true };
}

export async function adminResolveForumReport(
  reportId: string,
  status: "reviewed" | "dismissed",
  label: string,
): Promise<ActionResult> {
  const auth = await requireRole(["admin"]);
  if ("error" in auth) return auth;

  const { error } = await auth.service
    .from("forum_reports")
    .update({ status, resolved_by: auth.user.id, resolved_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) return { error: error.message };

  await logAdminAction(
    auth.user.id,
    status === "reviewed" ? "review_forum_report" : "dismiss_forum_report",
    "forum_report",
    reportId,
    label,
  );
  revalidatePath("/admin/forums");
  return { success: true };
}
