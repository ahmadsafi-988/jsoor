"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type DashboardSidebarContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

const DashboardSidebarContext =
  createContext<DashboardSidebarContextValue | null>(null);

export function DashboardSidebarProvider({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const value = useMemo(
    () => ({
      collapsed,
      toggleCollapsed: () => setCollapsed((current) => !current),
    }),
    [collapsed],
  );

  return (
    <DashboardSidebarContext.Provider value={value}>
      <div className={`flex min-h-screen ${className}`}>{children}</div>
    </DashboardSidebarContext.Provider>
  );
}

export function DashboardContent({
  children,
}: {
  children: ReactNode;
}) {
  const { collapsed } = useDashboardSidebar();

  return (
    <div
      className={`flex-1 flex flex-col min-w-0 transition-[margin] duration-200 ${
        collapsed ? "md:ml-20" : "md:ml-64"
      }`}
    >
      {children}
    </div>
  );
}

export function useDashboardSidebar() {
  const context = useContext(DashboardSidebarContext);
  if (!context) {
    throw new Error(
      "useDashboardSidebar must be used within DashboardSidebarProvider.",
    );
  }
  return context;
}
