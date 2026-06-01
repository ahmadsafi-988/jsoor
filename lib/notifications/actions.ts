"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase_generated_types";

export type NotificationType =
  | "application_status_changed"
  | "assessment_sent"
  | "assessment_results_released"
  | "new_application"
  | "assessment_submitted"
  | "new_message"
  | "company_approval_requested"
  | "job_report_submitted"
  | "job_locked"
  | "job_unlocked"
  | "forum_request_submitted"
  | "forum_request_received"
  | "forum_request_approved"
  | "forum_request_rejected"
  | "forum_post_commented"
  | "forum_comment_replied"
  | "forum_report_submitted";

export type AppNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType | string;
  title: string;
  body: string;
  link: string | null;
  job_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Json;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

type NotificationPayload = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  jobId?: string | null;
  actorId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Json;
};

type LegacyNotificationArgs = [
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
  jobId?: string,
];

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalizeNotification(row: Database["public"]["Tables"]["notifications"]["Row"]): AppNotification {
  return {
    id: row.id,
    user_id: row.user_id,
    actor_id: row.actor_id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    job_id: row.job_id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    metadata: row.metadata,
    is_read: row.is_read ?? false,
    read_at: row.read_at,
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

function fromLegacyArgs(args: LegacyNotificationArgs): NotificationPayload {
  const [userId, type, title, body, link, jobId] = args;
  return { userId, type, title, body, link, jobId };
}

export async function insertNotification(payload: NotificationPayload): Promise<{ success: true } | { error: string }>;
export async function insertNotification(...args: LegacyNotificationArgs): Promise<{ success: true } | { error: string }>;
export async function insertNotification(
  first: NotificationPayload | string,
  type?: NotificationType,
  title?: string,
  body?: string,
  link?: string,
  jobId?: string,
): Promise<{ success: true } | { error: string }> {
  const payload = typeof first === "string"
    ? fromLegacyArgs([first, type!, title!, body!, link, jobId])
    : first;

  const service = serviceClient();
  const { error } = await service.from("notifications").insert({
    user_id: payload.userId,
    actor_id: payload.actorId ?? null,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    link: payload.link ?? null,
    job_id: payload.jobId ?? null,
    entity_type: payload.entityType ?? null,
    entity_id: payload.entityId ?? null,
    metadata: payload.metadata ?? {},
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function insertNotificationsForAdmins(
  payload: Omit<NotificationPayload, "userId">
): Promise<{ success: true; count: number } | { error: string }> {
  const service = serviceClient();
  const { data: admins, error: adminError } = await service
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (adminError) return { error: adminError.message };
  if (!admins?.length) return { success: true, count: 0 };

  const { error } = await service.from("notifications").insert(
    admins.map((admin) => ({
      user_id: admin.id,
      actor_id: payload.actorId ?? null,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link ?? null,
      job_id: payload.jobId ?? null,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
      metadata: payload.metadata ?? {},
    }))
  );

  if (error) return { error: error.message };
  return { success: true, count: admins.length };
}

export async function getNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("id, user_id, actor_id, type, title, body, link, job_id, entity_type, entity_id, metadata, is_read, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []).map(normalizeNotification);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return count ?? 0;
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { error: error.message };

  revalidatePath("/job-seeker/notifications");
  revalidatePath("/company/notifications");
  revalidatePath("/admin/notifications");
  return { success: true };
}
