"use server";

import { createClient } from "@/lib/supabase/server";

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  attachment_name: string | null;
  is_read: boolean;
  created_at: string;
};

export type ConversationSummary = {
  id: string;
  application_id: string;
  other_name: string;
  other_avatar: string | null;
  job_title: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

// ─── Conversation bootstrap ───────────────────────────────────────────────────

export async function getOrCreateConversation(applicationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Verify caller is the applicant or the hiring company
  const { data: application } = await supabase
    .from("job_applications")
    .select("applicant_id, job:jobs!job_applications_job_id_fkey(company_id)")
    .eq("id", applicationId)
    .single();

  if (!application) return { error: "Application not found." };

  const job = application.job as { company_id: string } | null;
  const isApplicant = application.applicant_id === user.id;
  const isCompany   = job?.company_id === user.id;
  if (!isApplicant && !isCompany) return { error: "Not authorized." };

  // Return existing conversation if already created
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (existing) return { conversationId: existing.id };

  // Create new conversation
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      application_id: applicationId,
      job_seeker_id: application.applicant_id,
      company_id: job!.company_id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { conversationId: created.id };
}

// ─── Conversation lists ───────────────────────────────────────────────────────

export async function getJobSeekerConversations(): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: convRows } = await supabase
    .from("conversations")
    .select(`
      id,
      application_id,
      company_id,
      created_at,
      application:job_applications!conversations_application_id_fkey(
        job:jobs!job_applications_job_id_fkey(title)
      ),
      company:companies!conversations_company_id_fkey(name, logo_url)
    `)
    .eq("job_seeker_id", user.id)
    .order("created_at", { ascending: false });

  if (!convRows?.length) return [];

  const convIds = convRows.map((c) => c.id);
  const { data: msgRows } = await supabase
    .from("messages")
    .select("id, conversation_id, content, sender_id, is_read, created_at, attachment_name")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });

  return buildSummaries(convRows, msgRows ?? [], user.id, "job_seeker");
}

export async function getCompanyConversations(): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: convRows } = await supabase
    .from("conversations")
    .select(`
      id,
      application_id,
      job_seeker_id,
      created_at,
      application:job_applications!conversations_application_id_fkey(
        job:jobs!job_applications_job_id_fkey(title)
      ),
      seeker:profiles!conversations_job_seeker_id_fkey(first_name, last_name, avatar_url)
    `)
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  if (!convRows?.length) return [];

  const convIds = convRows.map((c) => c.id);
  const { data: msgRows } = await supabase
    .from("messages")
    .select("id, conversation_id, content, sender_id, is_read, created_at, attachment_name")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });

  return buildSummaries(convRows, msgRows ?? [], user.id, "company");
}

function buildSummaries(
  convRows: any[],
  msgRows: any[],
  userId: string,
  perspective: "job_seeker" | "company"
): ConversationSummary[] {
  const msgsByConv = new Map<string, any[]>();
  for (const msg of msgRows) {
    if (!msgsByConv.has(msg.conversation_id)) msgsByConv.set(msg.conversation_id, []);
    msgsByConv.get(msg.conversation_id)!.push(msg);
  }

  return convRows.map((conv) => {
    const msgs = msgsByConv.get(conv.id) ?? [];
    const lastMsg = msgs[0];
    const unreadCount = msgs.filter((m) => m.sender_id !== userId && !m.is_read).length;

    let otherName: string;
    let otherAvatar: string | null = null;
    if (perspective === "job_seeker") {
      otherName = conv.company?.name ?? "Unknown Company";
      otherAvatar = conv.company?.logo_url ?? null;
    } else {
      const s = conv.seeker;
      otherName = s ? `${s.first_name} ${s.last_name}`.trim() : "Applicant";
      otherAvatar = s?.avatar_url ?? null;
    }

    const lastMsgPreview = lastMsg
      ? lastMsg.content || `📎 ${lastMsg.attachment_name ?? "attachment"}`
      : "";

    return {
      id: conv.id,
      application_id: conv.application_id,
      other_name: otherName,
      other_avatar: otherAvatar,
      job_title: (conv.application?.job?.title as string | undefined) ?? "Unknown Job",
      last_message: lastMsgPreview,
      last_message_at: lastMsg?.created_at ?? conv.created_at,
      unread_count: unreadCount,
    };
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(
  conversationId: string
): Promise<{ messages: MessageRow[] } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: conv } = await supabase
    .from("conversations")
    .select("job_seeker_id, company_id")
    .eq("id", conversationId)
    .single();

  if (!conv) return { error: "Conversation not found." };
  if (conv.job_seeker_id !== user.id && conv.company_id !== user.id) {
    return { error: "Not authorized." };
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, attachment_url, attachment_name, is_read, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { messages: data as MessageRow[] };
}

export async function sendMessage(
  conversationId: string,
  content: string,
  attachmentUrl?: string,
  attachmentName?: string
): Promise<{ message: MessageRow } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      attachment_url: attachmentUrl ?? null,
      attachment_name: attachmentName ?? null,
    })
    .select("id, conversation_id, sender_id, content, attachment_url, attachment_name, is_read, created_at")
    .single();

  if (error) return { error: error.message };
  return { message: data as MessageRow };
}

export async function markConversationRead(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .eq("is_read", false);
}

export async function getUnreadMessageCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: convIds } = await supabase
    .from("conversations")
    .select("id")
    .or(`job_seeker_id.eq.${user.id},company_id.eq.${user.id}`);

  if (!convIds?.length) return 0;

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .in("conversation_id", convIds.map((c) => c.id))
    .neq("sender_id", user.id)
    .eq("is_read", false);

  return count ?? 0;
}
