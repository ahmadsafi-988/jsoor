"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Brain,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Home,
  MessageSquare,
  MessagesSquare,
  User,
} from "lucide-react";
import { JsoorLogo } from "@/components/JsoorLogo";
import { LogoutConfirmationButton } from "@/components/app/LogoutConfirmationButton";
import { useDashboardSidebar } from "@/components/app/DashboardSidebarState";
import { useUnreadIndicators } from "@/components/app/useUnreadIndicators";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { label: "Home", href: "/job-seeker/home", icon: Home },
  { label: "Profile", href: "/job-seeker/profile", icon: User },
  { label: "My Applications", href: "/job-seeker/job-applications", icon: FileText },
  { label: "Assessments", href: "/job-seeker/assessments", icon: ClipboardCheck },
  { label: "Interview Simulator", href: "/job-seeker/interview-simulator", icon: Brain },
  { label: "Communities", href: "/forums", icon: MessagesSquare },
  { label: "Messages", href: "/job-seeker/messages", icon: MessageSquare },
  { label: "Notifications", href: "/job-seeker/notifications", icon: Bell },
];

type SidebarUser = {
  username: string | null;
};

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useDashboardSidebar();
  const [user, setUser] = useState<SidebarUser | null>(null);
  const [loadedUser, setLoadedUser] = useState(false);
  const { hasUnreadMessages, hasUnreadNotifications } =
    useUnreadIndicators("job-seeker");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setLoadedUser(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", authUser.id)
        .single();

      setUser({ username: profile?.username ?? null });

      setLoadedUser(true);
    };

    load();
  }, []);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen overflow-hidden bg-neutral-950 z-50 flex-col shadow-[20px_0_40px_rgba(0,168,107,0.05)] hidden md:flex transition-[width,padding] duration-200 ${
        collapsed ? "w-20 p-4" : "w-64 p-6"
      }`}
    >
      <div className={`mb-8 ${collapsed ? "flex justify-center" : ""}`}>
        <Link href="/" className="inline-flex items-center" title="JSOOR">
          <JsoorLogo
            variant="white"
            markOnly={collapsed}
            className={collapsed ? "h-9 w-9" : "h-10 w-auto"}
            priority
          />
        </Link>
        {!collapsed && (
          <p className="text-neutral-500 text-xs mt-0.5">Career Curator</p>
        )}
      </div>

      <nav className="scrollbar-hidden flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isProfile = label === "Profile";
          const resolvedHref = isProfile
            ? loadedUser
              ? user?.username
                ? `/job-seeker/profile/${user.username}`
                : "/job-seeker/onboarding"
              : null
            : href;
          const isActive = isProfile
            ? isRouteActive(pathname, "/job-seeker/profile")
            : isRouteActive(pathname, href);
          const showUnreadDot =
            label === "Notifications"
              ? hasUnreadNotifications
              : label === "Messages"
                ? hasUnreadMessages
                : false;

          const item = (
            <div
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-lg transition-all duration-200 ${
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"
              } ${
                isActive
                  ? "bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white shadow-lg shadow-[#00a86b]/20"
                  : resolvedHref
                    ? "text-neutral-400 hover:bg-neutral-800 hover:text-white cursor-pointer"
                    : "text-neutral-600 cursor-wait"
              }`}
            >
              <div className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {showUnreadDot && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-neutral-950"
                  />
                )}
              </div>
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </div>
          );

          return resolvedHref ? (
            <Link key={href} href={resolvedHref}>
              {item}
            </Link>
          ) : (
            <div key={href} aria-disabled="true">
              {item}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0 flex flex-col gap-1">
        <LogoutConfirmationButton
          showLabel={!collapsed}
          className={`flex items-center rounded-lg py-2.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors w-full ${
            collapsed ? "justify-center px-0" : "gap-3 px-4 text-left"
          }`}
        />

        <div className="mt-4 pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`flex w-full items-center rounded-lg py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white ${
              collapsed ? "justify-center px-0" : "gap-3 px-4 text-left"
            }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronLeft className="h-4 w-4 shrink-0" />
            )}
            {!collapsed && <span className="text-sm font-medium">Collapse</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
