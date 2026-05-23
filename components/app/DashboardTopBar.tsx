"use client";

import { Bell, Building2, Search, ShieldCheck, User } from "lucide-react";
import Link from "next/link";

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

const ROLE_META: Record<
  DashboardRole,
  { label: string; detail: string; icon: typeof User }
> = {
  "job-seeker": { label: "Job Seeker", detail: "Account", icon: User },
  company: { label: "Company", detail: "Portal", icon: Building2 },
  admin: { label: "Admin", detail: "Full access", icon: ShieldCheck },
};

export function DashboardTopBar({ title, role, actions = [] }: DashboardTopBarProps) {
  const roleMeta = ROLE_META[role];
  const RoleIcon = roleMeta.icon;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-neutral-100 flex items-center justify-between px-8 h-16 gap-4">
      <span className="font-headline text-xl font-bold tracking-tight text-neutral-900 hidden md:block shrink-0">
        {title}
      </span>

      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-[#f6f3f2] rounded-full py-2.5 pl-10 pr-4 text-sm text-neutral-800 placeholder:text-neutral-400 border-none focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 transition-all"
        />
      </div>

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

        <div className="hidden sm:flex items-center gap-3 rounded-full border border-neutral-100 bg-white/70 py-1.5 pl-2 pr-3">
          <div className="w-8 h-8 rounded-full bg-[#006d43]/10 flex items-center justify-center ring-2 ring-[#006d43]/10">
            <RoleIcon className="w-4 h-4 text-[#006d43]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900 leading-tight truncate">
              {roleMeta.label}
            </p>
            <p className="text-xs text-neutral-500 leading-tight truncate">
              {roleMeta.detail}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
