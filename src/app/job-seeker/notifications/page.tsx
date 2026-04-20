"use client";

import { useState } from "react";
import { CheckCircle, Info, Calendar, Star, Award } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: "check" | "info" | "calendar" | "star" | "award";
};

type Group = {
  label: string;
  items: NotificationItem[];
};

const INITIAL_GROUPS: Group[] = [
  {
    label: "Today",
    items: [
      {
        id: "1",
        title: "Application Accepted!",
        description:
          "TechNova Corp has accepted your application for the Senior UX Designer role. Proceed to the interview simulator.",
        time: "10:42 AM",
        read: false,
        icon: "check",
      },
      {
        id: "2",
        title: "Profile Match Alert",
        description:
          "We found 3 new roles that strongly match your curated profile. Review them in your dashboard.",
        time: "8:15 AM",
        read: false,
        icon: "info",
      },
    ],
  },
  {
    label: "Yesterday",
    items: [
      {
        id: "3",
        title: "Interview Scheduled",
        description:
          "Your mock interview with the AI Simulator is scheduled for tomorrow at 10:00 AM.",
        time: "Yesterday, 2:30 PM",
        read: true,
        icon: "calendar",
      },
    ],
  },
  {
    label: "Earlier",
    items: [
      {
        id: "4",
        title: "Portfolio Reviewed",
        description:
          "A senior recruiter from Global Dynamics viewed your portfolio link.",
        time: "Oct 12, 2023",
        read: true,
        icon: "star",
      },
      {
        id: "5",
        title: "Skill Badge Earned",
        description:
          "Congratulations! You earned the 'Advanced React UI' badge from your recent assessment.",
        time: "Oct 10, 2023",
        read: true,
        icon: "award",
      },
    ],
  },
];

const ICON_MAP = {
  check:    { Component: CheckCircle, color: "text-[#006d43]", fill: true },
  info:     { Component: Info,         color: "text-blue-600",  fill: true },
  calendar: { Component: Calendar,     color: "text-[#3d4a41]", fill: false },
  star:     { Component: Star,         color: "text-[#3d4a41]", fill: false },
  award:    { Component: Award,        color: "text-[#3d4a41]", fill: false },
};

export default function NotificationsPage() {
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);

  const markAllRead = () => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((n) => ({ ...n, read: true })),
      }))
    );
  };

  return (
    <div className="p-6 md:p-10 lg:px-16 flex-1">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="font-headline text-2xl font-bold text-[#1c1b1b] tracking-tight mb-1">
              Your Updates
            </h2>
            <p className="text-sm text-[#3d4a41]">Stay on top of your career journey.</p>
          </div>
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm font-medium text-[#006d43] hover:text-[#00a86b] transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Mark all as read
          </button>
        </div>

        {/* Notification groups */}
        <div className="space-y-10">
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="font-headline text-base font-semibold text-[#1c1b1b] mb-4 pl-3 border-l-4 border-[#e5e2e1]">
                {group.label}
              </h3>
              <div className="space-y-3">
                {group.items.map((notif) => {
                  const { Component, color, fill } = ICON_MAP[notif.icon];
                  return (
                    <div
                      key={notif.id}
                      className={`relative p-5 rounded-xl cursor-pointer transition-all group overflow-hidden ${
                        !notif.read
                          ? "bg-[#f6f3f2] border-l-4 border-[#006d43] shadow-sm hover:shadow-[0_20px_40px_rgba(0,109,67,0.08)]"
                          : "bg-[#fcf9f8] border border-[#e5e2e1] hover:bg-[#f6f3f2]"
                      }`}
                    >
                      {!notif.read && (
                        <div className="absolute inset-0 bg-[#006d43]/5 pointer-events-none" />
                      )}
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-11 h-11 rounded-full bg-[#e5e2e1] flex items-center justify-center shrink-0">
                          <Component
                            className={`w-5 h-5 ${color} ${fill ? "fill-current" : ""}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 mb-1">
                            <h4 className={`text-sm truncate ${!notif.read ? "font-bold text-[#1c1b1b]" : "font-semibold text-[#1c1b1b]"}`}>
                              {notif.title}
                            </h4>
                            <span className="text-xs text-[#3d4a41] whitespace-nowrap shrink-0">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-sm text-[#3d4a41] leading-relaxed">
                            {notif.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
