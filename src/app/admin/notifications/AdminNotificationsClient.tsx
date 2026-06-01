"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Building2, CheckCircle, Flag, MessageSquare } from "lucide-react";
import { dispatchUnreadNotificationsCleared } from "@/components/app/useUnreadIndicators";
import { markAllNotificationsRead, type AppNotification } from "@/lib/notifications/actions";

const ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  company_approval_requested: { icon: Building2, color: "text-amber-600" },
  job_report_submitted:       { icon: Flag,      color: "text-red-500" },
  new_message:                { icon: MessageSquare, color: "text-blue-500" },
};

function groupByDate(notifications: AppNotification[]) {
  const today = new Date();
  const todayStr = today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const groups: { label: string; items: AppNotification[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Earlier", items: [] },
  ];

  for (const n of notifications) {
    const d = new Date(n.created_at).toDateString();
    if (d === todayStr) groups[0].items.push(n);
    else if (d === yesterdayStr) groups[1].items.push(n);
    else groups[2].items.push(n);
  }

  return groups.filter((g) => g.items.length > 0);
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString();
  if (d.toDateString() === today) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminNotificationsClient({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const groups = groupByDate(notifications);

  useEffect(() => {
    if (notifications.some((n) => !n.is_read)) {
      markAllNotificationsRead()
        .then((result) => {
          if ("success" in result) dispatchUnreadNotificationsCleared();
        })
        .catch(() => {});
    }
  }, [notifications]);

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if ("success" in result) dispatchUnreadNotificationsCleared();
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Notifications</h1>
          <p className="text-neutral-500 text-sm">Platform alerts that need admin attention</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="flex items-center gap-2 text-sm font-medium text-[#006d43] hover:text-[#00a86b] transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#f6f3f2] flex items-center justify-center">
            <Bell className="w-7 h-7 text-[#3d4a41]" />
          </div>
          <p className="text-[#3d4a41] font-medium">No notifications yet</p>
          <p className="text-sm text-[#3d4a41]/70">
            Company approvals and job reports will appear here.
          </p>
        </div>
      ) : (
        <div className="max-w-3xl space-y-8">
          {groups.map((group) => (
            <div key={group.label}>
              <h2 className="font-headline text-base font-semibold text-[#1c1b1b] mb-4 pl-3 border-l-4 border-[#e5e2e1]">
                {group.label}
              </h2>
              <div className="space-y-3">
                {group.items.map((notif) => {
                  const { icon: Icon, color } =
                    ICON_MAP[notif.type] ?? { icon: Bell, color: "text-[#3d4a41]" };
                  const inner = (
                    <div
                      className={`relative p-5 rounded-xl transition-all group overflow-hidden ${
                        !notif.is_read
                          ? "bg-white border-l-4 border-[#006d43] shadow-sm hover:shadow-[0_20px_40px_rgba(0,109,67,0.08)]"
                          : "bg-white border border-[#e5e2e1] hover:bg-[#f6f3f2]"
                      } ${notif.link ? "cursor-pointer" : ""}`}
                    >
                      {!notif.is_read && (
                        <div className="absolute inset-0 bg-[#006d43]/5 pointer-events-none" />
                      )}
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-11 h-11 rounded-full bg-[#e5e2e1] flex items-center justify-center shrink-0">
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 mb-1">
                            <h3
                              className={`text-sm truncate ${
                                !notif.is_read
                                  ? "font-bold text-[#1c1b1b]"
                                  : "font-semibold text-[#1c1b1b]"
                              }`}
                            >
                              {notif.title}
                            </h3>
                            <span className="text-xs text-[#3d4a41] whitespace-nowrap shrink-0">
                              {formatTime(notif.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-[#3d4a41] leading-relaxed">{notif.body}</p>
                        </div>
                      </div>
                    </div>
                  );

                  return notif.link ? (
                    <Link key={notif.id} href={notif.link}>
                      {inner}
                    </Link>
                  ) : (
                    <div key={notif.id}>{inner}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
