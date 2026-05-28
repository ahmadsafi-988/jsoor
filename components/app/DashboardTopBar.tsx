"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { DashboardAccountBadge } from "@/components/app/DashboardAccountBadge";
import { DashboardSearch } from "@/components/app/DashboardSearch";

type DashboardRole = "job-seeker" | "company" | "admin";

type HeaderAction = {
  href: string;
  label: string;
  icon: typeof Bell;
};

type DashboardTopBarProps = {
  title: string;
  role: DashboardRole;
  actions?: HeaderAction[];
};

export function DashboardTopBar({ title, role, actions = [] }: DashboardTopBarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-neutral-100 flex items-center justify-between px-8 h-16 gap-4">
      <span className="font-headline text-xl font-bold tracking-tight text-neutral-900 hidden md:block shrink-0">
        {title}
      </span>

      <DashboardSearch />

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {actions.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-label={label}>
              <button className="relative w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-[#006d43] transition-colors">
                <Icon className="w-5 h-5" />
              </button>
            </Link>
          ))}
        </div>

        <DashboardAccountBadge role={role} />
      </div>
    </header>
  );
}
