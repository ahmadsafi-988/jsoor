"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Users, ClipboardCheck,
  Building2, Settings, LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard",    href: "/company/home",        icon: LayoutDashboard },
  { label: "Jobs",         href: "/company/jobs",         icon: Briefcase },
  { label: "Assessments",  href: "/company/assessments",  icon: ClipboardCheck },
  { label: "Profile",      href: "/company/profile",      icon: Building2 },
];

type SidebarCompany = { name: string; logoUrl: string | null };

export function CompanySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [company, setCompany] = useState<SidebarCompany | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("companies")
        .select("name, logo_url")
        .eq("id", user.id)
        .single();
      if (data) setCompany({ name: data.name, logoUrl: data.logo_url });
    };
    load();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-neutral-950 z-50 flex flex-col p-6 shadow-[20px_0_40px_rgba(0,168,107,0.05)] hidden md:flex">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#00a86b] tracking-tight font-headline">JSOOR</h1>
        <p className="text-neutral-500 text-xs mt-0.5">Company Portal</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
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
        <Link href="/company/settings">
          <div className="flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors cursor-pointer">
            <Settings className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Settings</span>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>

        {company && (
          <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-800 overflow-hidden shrink-0 ring-2 ring-[#006d43]/30 flex items-center justify-center">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-4 h-4 text-neutral-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{company.name}</p>
              <p className="text-neutral-500 text-xs">Company</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
