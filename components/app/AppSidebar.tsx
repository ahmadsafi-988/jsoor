"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, User, FileText, Brain, MessageSquare,
  Bell, ClipboardCheck, Bookmark,
} from "lucide-react";
import { JsoorLogo } from "@/components/JsoorLogo";
import { LogoutConfirmationButton } from "@/components/app/LogoutConfirmationButton";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { label: "Home",                href: "/job-seeker/home",                icon: Home },
  { label: "Profile",             href: "/job-seeker/profile",             icon: User },
  { label: "My Applications",     href: "/job-seeker/job-applications",    icon: FileText },
  { label: "Saved Jobs",          href: "/job-seeker/saved-jobs",          icon: Bookmark },
  { label: "Assessments",         href: "/job-seeker/assessments",         icon: ClipboardCheck },
  { label: "Interview Simulator", href: "/job-seeker/interview-simulator", icon: Brain },
  { label: "Messages",            href: "/job-seeker/messages",            icon: MessageSquare },
  { label: "Notifications",       href: "/job-seeker/notifications",       icon: Bell },
];

type SidebarUser = {
  name: string;
  role: string;
  avatarUrl: string | null;
};

export function AppSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<SidebarUser | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const [{ data }, { data: jsProfile }, { count: notifCount }] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, avatar_url").eq("id", authUser.id).single(),
        supabase.from("job_seeker_profiles").select("degree").eq("id", authUser.id).single(),
        supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", authUser.id).eq("is_read", false),
      ]);
      if (data) {
        setUser({
          name: `${data.first_name} ${data.last_name}`.trim(),
          role: jsProfile?.degree || "Job Seeker",
          avatarUrl: data.avatar_url,
        });
      }
      setUnreadNotifs(notifCount ?? 0);

      // Unread messages: count unread msgs in conversations this user is part of
      const { data: convIds } = await supabase
        .from("conversations")
        .select("id")
        .eq("job_seeker_id", authUser.id);
      if (convIds?.length) {
        const { count: msgCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", convIds.map((c) => c.id))
          .neq("sender_id", authUser.id)
          .eq("is_read", false);
        setUnreadMsgs(msgCount ?? 0);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/job-seeker/messages"))      setUnreadMsgs(0);
    if (pathname.startsWith("/job-seeker/notifications")) setUnreadNotifs(0);
  }, [pathname]);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-neutral-950 z-50 flex flex-col p-6 shadow-[20px_0_40px_rgba(0,168,107,0.05)] hidden md:flex">
      {/* Brand */}
      <div className="mb-8">
        <Link href="/job-seeker/home" className="inline-flex items-center">
          <JsoorLogo variant="white" className="h-10 w-auto" priority />
        </Link>
        <p className="text-neutral-500 text-xs mt-0.5">Career Curator</p>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/job-seeker/profile" && pathname.startsWith(href + "/"));
          const badge =
            label === "Notifications" ? unreadNotifs :
            label === "Messages"      ? unreadMsgs   : 0;
          return (
            <Link key={href} href={href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white shadow-lg shadow-[#00a86b]/20"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <div className="relative shrink-0">
                  <Icon className="w-5 h-5" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="mt-auto flex flex-col gap-1">
        <LogoutConfirmationButton />

        {/* User snippet */}
        {user && (
          <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-800 overflow-hidden shrink-0 ring-2 ring-[#006d43]/30 flex items-center justify-center">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-neutral-400 text-xs font-bold">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.name}</p>
              <p className="text-neutral-500 text-xs truncate">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
