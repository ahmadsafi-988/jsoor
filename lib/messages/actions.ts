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
  other_id: string;
  other_role: "job_seeker" | "company";
  other_username: string | null;
  other_profile_href: string | null;
  other_name: string;
  other_avatar: string | null;
  job_title: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

type ConversationActionResult =
  | { conversationId: string }
  | { error: string };

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

  // Return existing conversation if one already exists for this application
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

  // Race condition: another request created it between our check and insert
  if (error?.code === "23505") {
    const { data: fallback } = await supabase
      .from("conversations")
      .select("id")
      .eq("application_id", applicationId)
      .single();
    if (fallback) return { conversationId: fallback.id };
  }

  if (error) return { error: error.message };
  return { conversationId: created.id };
}

export async function openConversationWithCompany(
  companyId: string,
  applicationId?: string,
): Promise<ConversationActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in before starting a conversation." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "job_seeker") {
    return { error: "Only job seekers can message companies from this page." };
  }

  if (applicationId) {
    const { data: application } = await supabase
      .from("job_applications")
      .select("id, applicant_id, job:jobs!job_applications_job_id_fkey(company_id)")
      .eq("id", applicationId)
      .maybeSingle();

    const job = application?.job as { company_id: string } | null | undefined;
    if (
      application?.applicant_id === user.id &&
      job?.company_id === companyId
    ) {
      return getOrCreateConversation(application.id);
    }
  }

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("company_id", companyId);

  const jobIds = (jobs ?? []).map((job) => job.id);
  if (jobIds.length === 0) {
    return {
      error: "You need to apply to one of this company's jobs before starting a conversation.",
    };
  }

  const { data: application } = await supabase
    .from("job_applications")
    .select("id")
    .eq("applicant_id", user.id)
    .in("job_id", jobIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!application) {
    return {
      error: "You need to apply to one of this company's jobs before starting a conversation.",
    };
  }

  return getOrCreateConversation(application.id);
}

export async function openConversationWithJobSeeker(
  jobSeekerId: string,
  applicationId?: string,
): Promise<ConversationActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in before starting a conversation." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "company") {
    return { error: "Only companies can message job seekers from this page." };
  }

  if (applicationId) {
    const { data: application } = await supabase
      .from("job_applications")
      .select("id, applicant_id, job:jobs!job_applications_job_id_fkey(company_id)")
      .eq("id", applicationId)
      .maybeSingle();

    const job = application?.job as { company_id: string } | null | undefined;
    if (
      application?.applicant_id === jobSeekerId &&
      job?.company_id === user.id
    ) {
      return getOrCreateConversation(application.id);
    }
  }

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("company_id", user.id);

  const jobIds = (jobs ?? []).map((job) => job.id);
  if (jobIds.length === 0) {
    return {
      error: "You can message a job seeker only when they have applied to one of your jobs.",
    };
  }

  const { data: application } = await supabase
    .from("job_applications")
    .select("id")
    .eq("applicant_id", jobSeekerId)
    .in("job_id", jobIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!application) {
    return {
      error: "You can message a job seeker only when they have applied to one of your jobs.",
    };
  }

  return getOrCreateConversation(application.id);
}

// ─── Conversation lists ───────────────────────────────────────────────────────

export async function getJobSeekerConversations(): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // conversations_company_id_fkey → profiles, NOT companies, so we fetch companies separately
  const { data: convRows } = await supabase
    .from("conversations")
    .select(`
      id,
      application_id,
      company_id,
      created_at,
      application:job_applications!conversations_application_id_fkey(
        job:jobs!job_applications_job_id_fkey(title)
      )
    `)
    .eq("job_seeker_id", user.id)
    .order("created_at", { ascending: false });

  if (!convRows?.length) return [];

  const convIds = (convRows as any[]).map((c) => c.id);
  const companyIds = [...new Set((convRows as any[]).map((c) => c.company_id))] as string[];

  const [{ data: msgRows }, { data: companies }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, conversation_id, content, sender_id, is_read, created_at, attachment_name")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("companies")
      .select("id, name, logo_url")
      .in("id", companyIds),
  ]);

  const companyMap: Record<string, { name: string; logo_url: string | null }> =
    Object.fromEntries(((companies ?? []) as any[]).map((c) => [c.id, c]));

  return buildSummaries(convRows as any[], msgRows ?? [], user.id, "job_seeker", companyMap);
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
      seeker:profiles!conversations_job_seeker_id_fkey(first_name, last_name, avatar_url, username)
    `)
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  if (!convRows?.length) return [];

  const convIds = (convRows as any[]).map((c) => c.id);
  const { data: msgRows } = await supabase
    .from("messages")
    .select("id, conversation_id, content, sender_id, is_read, created_at, attachment_name")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });

  return buildSummaries(convRows as any[], msgRows ?? [], user.id, "company");
}

function buildSummaries(
  convRows: any[],
  msgRows: any[],
  userId: string,
  perspective: "job_seeker" | "company",
  companyMap?: Record<string, { name: string; logo_url: string | null }>
): ConversationSummary[] {
  const msgsByConv = new Map<string, any[]>();
  for (const msg of msgRows) {
    if (!msgsByConv.has(msg.conversation_id)) msgsByConv.set(msg.conversation_id, []);
    msgsByConv.get(msg.conversation_id)!.push(msg);
  }

  const summaries = convRows.map((conv) => {
    const msgs = msgsByConv.get(conv.id) ?? [];
    const lastMsg = msgs[0];
    const unreadCount = msgs.filter((m) => m.sender_id !== userId && !m.is_read).length;

    let otherName: string;
    let otherAvatar: string | null = null;
    let otherId: string;
    let otherRole: "job_seeker" | "company";
    let otherUsername: string | null = null;
    let otherProfileHref: string | null = null;

    if (perspective === "job_seeker") {
      const co = companyMap?.[conv.company_id];
      otherId = conv.company_id;
      otherRole = "company";
      otherName = co?.name ?? "Unknown Company";
      otherAvatar = co?.logo_url ?? null;
      otherProfileHref = `/job-seeker/companies/${conv.company_id}?applicationId=${conv.application_id}`;
    } else {
      const s = conv.seeker;
      const fullName = `${s?.first_name ?? ""} ${s?.last_name ?? ""}`.trim();
      otherId = conv.job_seeker_id;
      otherRole = "job_seeker";
      otherUsername = s?.username ?? null;
      otherName = fullName || "Applicant";
      otherAvatar = s?.avatar_url ?? null;
      otherProfileHref = otherUsername
        ? `/company/profiles/${otherUsername}?applicationId=${conv.application_id}`
        : null;
    }

    return {
      id: conv.id,
      application_id: conv.application_id,
      other_id: otherId,
      other_role: otherRole,
      other_username: otherUsername,
      other_profile_href: otherProfileHref,
      other_name: otherName,
      other_avatar: otherAvatar,
      job_title: (conv.application?.job?.title as string | undefined) ?? "Unknown Job",
      last_message: lastMsg
        ? lastMsg.content || `📎 ${lastMsg.attachment_name ?? "attachment"}`
        : "",
      last_message_at: lastMsg?.created_at ?? conv.created_at,
      unread_count: unreadCount,
    };
  });

  // Sort by most recent activity (last message) descending
  return summaries.sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );
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
