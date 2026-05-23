"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Building2, Users,
  Flag, ScrollText, ShieldCheck, BookOpen,
} from "lucide-react";
import { JsoorLogo } from "@/components/JsoorLogo";
import { LogoutConfirmationButton } from "@/components/app/LogoutConfirmationButton";

const NAV_ITEMS = [
  { label: "Dashboard",  href: "/admin",            icon: LayoutDashboard },
  { label: "Jobs",       href: "/admin/jobs",        icon: Briefcase },
  { label: "Blogs",      href: "/admin/blogs",       icon: BookOpen },
  { label: "Companies",  href: "/admin/companies",   icon: Building2 },
  { label: "Users",      href: "/admin/users",       icon: Users },
  { label: "Reports",    href: "/admin/reports",     icon: Flag },
  { label: "Audit Log",  href: "/admin/audit-log",   icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-neutral-950 z-50 flex flex-col p-6 shadow-[20px_0_40px_rgba(0,168,107,0.05)] hidden md:flex">
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center">
          <JsoorLogo variant="white" className="h-10 w-auto" priority />
        </Link>
        <p className="text-neutral-500 text-xs mt-0.5">Admin Panel</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = href === "/admin"
            ? pathname === "/admin"
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white shadow-lg shadow-[#00a86b]/20"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}>
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <LogoutConfirmationButton />
        <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#006d43]/20 flex items-center justify-center ring-2 ring-[#006d43]/30">
            <ShieldCheck className="w-4 h-4 text-[#00a86b]" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Admin</p>
            <p className="text-neutral-500 text-xs">Full access</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
