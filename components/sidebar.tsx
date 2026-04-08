"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  House,
  User,
  FileText,
  Briefcase,
  LogOut,
} from "lucide-react";
import type { NavGroup, IconName } from "@/components/nav-items";

import { LogoutButton } from '@/components/supabase/logout-button'

interface SidebarProps {
  title: string;
  navGroups: NavGroup[];
  rootHref?: string;
}

const iconMap: Record<IconName, React.ComponentType<{ className?: string }>> = {
  house: House,
  user: User,
  fileText: FileText,
  briefcase: Briefcase,
};

export function Sidebar({ title, navGroups, rootHref = "" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  console.log(collapsed);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    router.push("/auth/login");
  };

  return (
    <aside
      style={{ width: collapsed ? "3.5rem" : "16rem" }}
      className="relative z-10 flex h-screen shrink-0 flex-col  bg-white transition-[width] duration-300 ease-in-out"
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center",
            collapsed ? "justify-center" : "gap-2",
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-900">
            <PanelLeft className="h-4 w-4 text-white" />
          </div>

          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-tight text-neutral-900">
              {title}
            </span>
          )}
        </div>
      </div>

      {/* ✅ overflow-x-hidden only on the nav scroll area, not the whole aside */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {navGroups.map((group, gi) => (
          <div key={gi} className="mb-1">
            {group.title && !collapsed && (
              <p className="mb-1 px-4 pt-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                {group.title}
              </p>
            )}

            {group.items.map((item) => {
              const Icon = iconMap[item.icon];
              const isRootItem = rootHref && item.href === rootHref;
              const isActive = isRootItem
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative mx-2 my-0.5 flex items-center rounded-md py-2 text-sm transition-colors",
                    collapsed
                      ? "w-10 justify-center px-0"
                      : "w-[calc(100%-16px)] gap-3 px-2.5",
                    isActive
                      ? "bg-neutral-100 font-medium text-neutral-900"
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900",
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-neutral-900" />
                  )}

                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive
                        ? "text-neutral-900"
                        : "text-neutral-400 group-hover:text-neutral-700",
                    )}
                  />

                  {!collapsed && (
                    <span className="min-w-0 flex-1 truncate text-left">
                      {item.label}
                    </span>
                  )}

                  {!collapsed && item.badge && item.badge > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                  )}

                  {collapsed && item.badge && item.badge > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-neutral-900" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-2 p-3">
        <button
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center rounded-md py-2 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-600",
            collapsed ? "justify-center px-2" : "gap-3 px-2.5",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button> */}

        

        {/* TODO : FIX COLLAPSE BUTTON */}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={cn(
            "flex w-full items-center rounded-md py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900",
            collapsed ? "justify-center px-2" : "gap-3 px-2.5",
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
