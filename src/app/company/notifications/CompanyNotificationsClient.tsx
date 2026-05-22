"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, Bell, ClipboardCheck, FileText, MessageSquare } from "lucide-react";
import { markAllNotificationsRead } from "@/lib/notifications/actions";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

const ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  new_application:      { icon: FileText,       color: "text-[#006d43]" },
  assessment_submitted: { icon: ClipboardCheck, color: "text-blue-500" },
  new_message:          { icon: MessageSquare,  color: "text-blue-500" },
};

function groupByDate(notifications: Notification[]) {
  const today = new Date();
  const todayStr = today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const groups: { label: string; items: Notification[] }[] = [
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

export default function CompanyNotificationsClient({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const groups = groupByDate(notifications);

  useEffect(() => {
    if (notifications.some((n) => !n.is_read)) markAllNotificationsRead().catch(() => {});
  }, [notifications]);

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  return (
    <div className="p-6 md:p-10 lg:px-16 flex-1">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="font-headline text-2xl font-bold text-[#1c1b1b] tracking-tight mb-1">
              Notifications
            </h2>
            <p className="text-sm text-[#3d4a41]">Stay up to date with applicant activity.</p>
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
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#f6f3f2] flex items-center justify-center">
              <Bell className="w-7 h-7 text-[#3d4a41]" />
            </div>
            <p className="text-[#3d4a41] font-medium">No notifications yet</p>
            <p className="text-sm text-[#3d4a41]/70">
              You&apos;ll see updates about new applications and assessment submissions here.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <div key={group.label}>
                <h3 className="font-headline text-base font-semibold text-[#1c1b1b] mb-4 pl-3 border-l-4 border-[#e5e2e1]">
                  {group.label}
                </h3>
                <div className="space-y-3">
                  {group.items.map((notif) => {
                    const { icon: Icon, color } =
                      ICON_MAP[notif.type] ?? { icon: Bell, color: "text-[#3d4a41]" };
                    const inner = (
                      <div
                        className={`relative p-5 rounded-xl transition-all group overflow-hidden ${
                          !notif.is_read
                            ? "bg-[#f6f3f2] border-l-4 border-[#006d43] shadow-sm hover:shadow-[0_20px_40px_rgba(0,109,67,0.08)]"
                            : "bg-[#fcf9f8] border border-[#e5e2e1] hover:bg-[#f6f3f2]"
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
                              <h4
                                className={`text-sm truncate ${
                                  !notif.is_read
                                    ? "font-bold text-[#1c1b1b]"
                                    : "font-semibold text-[#1c1b1b]"
                                }`}
                              >
                                {notif.title}
                              </h4>
                              <span className="text-xs text-[#3d4a41] whitespace-nowrap shrink-0">
                                {formatTime(notif.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-[#3d4a41] leading-relaxed">
                              {notif.body}
                            </p>
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
    </div>
  );
}
