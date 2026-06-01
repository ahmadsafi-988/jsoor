"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
} from "lucide-react";
import { JsoorLogo } from "@/components/JsoorLogo";
import { LogoutConfirmationButton } from "@/components/app/LogoutConfirmationButton";
import { useDashboardSidebar } from "@/components/app/DashboardSidebarState";
import { useUnreadIndicators } from "@/components/app/useUnreadIndicators";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/company/home", icon: LayoutDashboard },
  { label: "Jobs", href: "/company/jobs", icon: Briefcase },
  { label: "Assessments", href: "/company/assessments", icon: ClipboardCheck },
  { label: "Communities", href: "/forums", icon: MessagesSquare },
  { label: "Messages", href: "/company/messages", icon: MessageSquare },
  { label: "Profile", href: "/company/profile", icon: Building2 },
  { label: "Notifications", href: "/company/notifications", icon: Bell },
];

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CompanySidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useDashboardSidebar();
  const { hasUnreadMessages, hasUnreadNotifications } =
    useUnreadIndicators("company");

  return (
    <aside
      className={`fixed left-0 top-0 h-screen overflow-hidden bg-neutral-950 z-50 flex-col shadow-[20px_0_40px_rgba(0,168,107,0.05)] hidden md:flex transition-[width,padding] duration-200 ${
        collapsed ? "w-20 p-4" : "w-64 p-6"
      }`}
    >
      <div className={`mb-8 ${collapsed ? "flex justify-center" : ""}`}>
        <Link href="/company/home" className="inline-flex items-center" title="JSOOR">
          <JsoorLogo
            variant="white"
            markOnly={collapsed}
            className={collapsed ? "h-9 w-9" : "h-10 w-auto"}
            priority
          />
        </Link>
        {!collapsed && (
          <p className="text-neutral-500 text-xs mt-0.5">Company Portal</p>
        )}
      </div>

      <nav className="scrollbar-hidden flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = isRouteActive(pathname, href);
          const showUnreadDot =
            label === "Notifications"
              ? hasUnreadNotifications
              : label === "Messages"
                ? hasUnreadMessages
                : false;

          return (
            <Link key={href} href={href}>
              <div
                title={collapsed ? label : undefined}
                className={`flex items-center rounded-lg transition-all duration-200 cursor-pointer ${
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? "bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white shadow-lg shadow-[#00a86b]/20"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
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
            </Link>
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
