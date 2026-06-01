"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DashboardRole = "job-seeker" | "company" | "admin";

const UNREAD_MESSAGES_CLEARED_EVENT = "jsoor:unread-messages-cleared";
const UNREAD_NOTIFICATIONS_CLEARED_EVENT =
  "jsoor:unread-notifications-cleared";

export function dispatchUnreadMessagesCleared() {
  window.dispatchEvent(new Event(UNREAD_MESSAGES_CLEARED_EVENT));
}

export function dispatchUnreadNotificationsCleared() {
  window.dispatchEvent(new Event(UNREAD_NOTIFICATIONS_CLEARED_EVENT));
}

function notificationRouteFor(role: DashboardRole) {
  if (role === "admin") return "/admin/notifications";
  return `/${role}/notifications`;
}

function messageRouteFor(role: DashboardRole) {
  if (role === "admin") return null;
  return `/${role}/messages`;
}

export function useUnreadIndicators(role: DashboardRole) {
  const pathname = usePathname();
  const notificationRoute = notificationRouteFor(role);
  const messageRoute = messageRouteFor(role);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    const handleMessagesCleared = () => setHasUnreadMessages(false);
    const handleNotificationsCleared = () => setHasUnreadNotifications(false);

    window.addEventListener(
      UNREAD_MESSAGES_CLEARED_EVENT,
      handleMessagesCleared,
    );
    window.addEventListener(
      UNREAD_NOTIFICATIONS_CLEARED_EVENT,
      handleNotificationsCleared,
    );

    return () => {
      window.removeEventListener(
        UNREAD_MESSAGES_CLEARED_EVENT,
        handleMessagesCleared,
      );
      window.removeEventListener(
        UNREAD_NOTIFICATIONS_CLEARED_EVENT,
        handleNotificationsCleared,
      );
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const { count: notificationCount } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (!cancelled) {
        setHasUnreadNotifications((notificationCount ?? 0) > 0);
      }

      if (!messageRoute) return;

      const conversationOwnerColumn =
        role === "company" ? "company_id" : "job_seeker_id";
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .eq(conversationOwnerColumn, user.id);

      if (!conversations?.length || cancelled) {
        if (!cancelled) setHasUnreadMessages(false);
        return;
      }

      const { count: messageCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in(
          "conversation_id",
          conversations.map((conversation) => conversation.id),
        )
        .neq("sender_id", user.id)
        .eq("is_read", false);

      if (!cancelled) {
        setHasUnreadMessages((messageCount ?? 0) > 0);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [messageRoute, notificationRoute, role]);

  return {
    hasUnreadMessages:
      hasUnreadMessages &&
      Boolean(messageRoute) &&
      !pathname.startsWith(messageRoute ?? ""),
    hasUnreadNotifications:
      hasUnreadNotifications &&
      !pathname.startsWith(notificationRoute),
  };
}
