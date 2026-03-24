"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { navGroups } from "./nav-items";
import { ChevronLeft, ChevronRight, PanelLeft } from "lucide-react";

interface SidebarProps {
  activePath: string;
  onNavigate: (href: string) => void;
}

export function Sidebar({ activePath, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-border bg-white transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* ── Logo ── */}
      <div className="flex h-14 items-center border-b border-border px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-900">
            <PanelLeft className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-tight text-neutral-900">
              AdminPanel
            </span>
          )}
        </div>
      </div>

      {/* ── Nav groups ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {navGroups.map((group, gi) => (
          <div key={gi} className="mb-1">
            {group.title && !collapsed && (
              <p className="mb-1 px-4 pt-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                {group.title}
              </p>
            )}

            {group.items.map((item) => {
              const isActive = activePath === item.href;
              const Icon = item.icon;

              return (
                <button
                  key={item.href}
                  onClick={() => onNavigate(item.href)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative mx-2 my-0.5 flex w-[calc(100%-16px)] items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-neutral-100 font-medium text-neutral-900"
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
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
                        : "text-neutral-400 group-hover:text-neutral-700"
                    )}
                  />

                  {!collapsed && (
                    <span className="flex-1 truncate text-left">{item.label}</span>
                  )}

                  {!collapsed && item.badge && item.badge > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                  )}

                  {collapsed && item.badge && item.badge > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-neutral-900" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Collapse toggle ── */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900",
            collapsed && "justify-center"
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