"use client";

import { useEffect, useState } from "react";
import { Building2, ShieldCheck, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DashboardRole = "job-seeker" | "company" | "admin";

type AccountBadgeData = {
  name: string;
  detail: string;
  imageUrl: string | null;
};

type DashboardAccountBadgeProps = {
  role: DashboardRole;
};

const ROLE_META: Record<
  DashboardRole,
  { label: string; detail: string; icon: typeof User }
> = {
  "job-seeker": { label: "Job Seeker", detail: "Account", icon: User },
  company: { label: "Company", detail: "Portal", icon: Building2 },
  admin: { label: "Admin", detail: "Full access", icon: ShieldCheck },
};

function fullName(firstName?: string | null, lastName?: string | null) {
  return `${firstName ?? ""} ${lastName ?? ""}`.trim();
}

export function DashboardAccountBadge({ role }: DashboardAccountBadgeProps) {
  const roleMeta = ROLE_META[role];
  const RoleIcon = roleMeta.icon;
  const [account, setAccount] = useState<AccountBadgeData>({
    name: roleMeta.label,
    detail: roleMeta.detail,
    imageUrl: null,
  });

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, username, avatar_url, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || !active) return;

      if (profile.role === "company") {
        const { data: company } = await supabase
          .from("companies")
          .select("name, logo_url")
          .eq("id", user.id)
          .maybeSingle();

        if (!active) return;

        setAccount({
          name:
            company?.name ||
            fullName(profile.first_name, profile.last_name) ||
            profile.username ||
            roleMeta.label,
          detail: roleMeta.detail,
          imageUrl: company?.logo_url ?? profile.avatar_url,
        });
        return;
      }

      setAccount({
        name:
          fullName(profile.first_name, profile.last_name) ||
          profile.username ||
          roleMeta.label,
        detail: roleMeta.detail,
        imageUrl: profile.avatar_url,
      });
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, [roleMeta.detail, roleMeta.label]);

  return (
    <div className="hidden sm:flex items-center gap-3 rounded-full border border-neutral-100 bg-white/70 py-1.5 pl-2 pr-3">
      <div className="w-8 h-8 rounded-full bg-[#006d43]/10 flex items-center justify-center ring-2 ring-[#006d43]/10 overflow-hidden">
        {account.imageUrl ? (
          <img
            src={account.imageUrl}
            alt={account.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <RoleIcon className="w-4 h-4 text-[#006d43]" />
        )}
      </div>
      <div className="min-w-0">
        <p className="max-w-36 truncate text-sm font-semibold leading-tight text-neutral-900">
          {account.name}
        </p>
        <p className="text-xs text-neutral-500 leading-tight truncate">
          {account.detail}
        </p>
      </div>
    </div>
  );
}
