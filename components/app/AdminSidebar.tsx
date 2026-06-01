"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Flag,
  LayoutDashboard,
  MessagesSquare,
  ScrollText,
  Users,
} from "lucide-react";
import { JsoorLogo } from "@/components/JsoorLogo";
import { LogoutConfirmationButton } from "@/components/app/LogoutConfirmationButton";
import { useDashboardSidebar } from "@/components/app/DashboardSidebarState";
import { useUnreadIndicators } from "@/components/app/useUnreadIndicators";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { label: "Blogs", href: "/admin/blogs", icon: BookOpen },
  { label: "Communities", href: "/admin/forums", icon: MessagesSquare },
  { label: "Companies", href: "/admin/companies", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Reports", href: "/admin/reports", icon: Flag },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
];

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useDashboardSidebar();
  const { hasUnreadNotifications } = useUnreadIndicators("admin");

  return (
    <aside
      className={`fixed left-0 top-0 h-screen overflow-hidden bg-neutral-950 z-50 flex-col shadow-[20px_0_40px_rgba(0,168,107,0.05)] hidden md:flex transition-[width,padding] duration-200 ${
        collapsed ? "w-20 p-4" : "w-64 p-6"
      }`}
    >
      <div className={`mb-8 ${collapsed ? "flex justify-center" : ""}`}>
        <Link href="/admin" className="inline-flex items-center" title="JSOOR">
          <JsoorLogo
            variant="white"
            markOnly={collapsed}
            className={collapsed ? "h-9 w-9" : "h-10 w-auto"}
            priority
          />
        </Link>
        {!collapsed && (
          <p className="text-neutral-500 text-xs mt-0.5">Admin Panel</p>
        )}
      </div>

      <nav className="scrollbar-hidden flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
              : isRouteActive(pathname, href);
          const showUnreadDot =
            label === "Notifications" ? hasUnreadNotifications : false;

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
