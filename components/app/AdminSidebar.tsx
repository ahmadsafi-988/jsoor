"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Building2, Users,
  Flag, ScrollText, LogOut, ShieldCheck, Bell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard",  href: "/admin",            icon: LayoutDashboard },
  { label: "Jobs",       href: "/admin/jobs",        icon: Briefcase },
  { label: "Companies",  href: "/admin/companies",   icon: Building2 },
  { label: "Users",      href: "/admin/users",       icon: Users },
  { label: "Reports",    href: "/admin/reports",     icon: Flag },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Audit Log",  href: "/admin/audit-log",   icon: ScrollText },
];

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setUnreadNotifs(count ?? 0);
    };

    load();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const visibleUnreadNotifs = pathname.startsWith("/admin/notifications") ? 0 : unreadNotifs;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-neutral-950 z-50 flex flex-col p-6 shadow-[20px_0_40px_rgba(0,168,107,0.05)] hidden md:flex">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#00a86b] tracking-tight font-headline">JSOOR</h1>
        <p className="text-neutral-500 text-xs mt-0.5">Admin Panel</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = href === "/admin"
            ? pathname === "/admin"
            : isRouteActive(pathname, href);
          const badge = label === "Notifications" ? visibleUnreadNotifs : 0;
          return (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white shadow-lg shadow-[#00a86b]/20"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}>
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

      <div className="mt-auto flex flex-col gap-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>
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
