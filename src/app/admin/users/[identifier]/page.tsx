import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Building2, Calendar, Mail, ShieldAlert, User } from "lucide-react";
import { DashboardBackButton } from "@/components/app/DashboardBackButton";
import { JobSeekerProfileDetail } from "@/components/app/details/JobSeekerProfileDetail";
import { getProfileByUsername } from "@/lib/profile/profile_data";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase_generated_types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ identifier: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (adminProfile?.role !== "admin") redirect("/");

  const { identifier } = await params;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq(UUID_RE.test(identifier) ? "id" : "username", identifier)
    .maybeSingle();
  if (!profile || profile.role === "admin") notFound();

  if (profile.role === "job_seeker") {
    const profileData = await getProfileByUsername(profile.username);
    if (!profileData) notFound();
    return <JobSeekerProfileDetail profileData={profileData} backHref="/admin/users" />;
  }

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.id)
    .maybeSingle();

  return <AdminCompanyUserDetail profile={profile} company={company} />;
}

function AdminCompanyUserDetail({
  profile,
  company,
}: {
  profile: Tables<"profiles">;
  company: Tables<"companies"> | null;
}) {
  const fullName = `${profile.first_name} ${profile.last_name}`.trim() || profile.username;

  return (
    <div>
      <DashboardBackButton fallbackHref="/admin/users" />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e5e2e1] bg-[#f6f3f2]">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <User className="h-7 w-7 text-[#3d4a41]" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{fullName}</h1>
            <p className="text-sm text-neutral-500">@{profile.username}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-[#f6f3f2] p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
              <Mail className="h-3.5 w-3.5" />
              Role
            </p>
            <p className="text-sm font-semibold text-[#1c1b1b]">Company</p>
          </div>
          <div className="rounded-xl bg-[#f6f3f2] p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
              <Calendar className="h-3.5 w-3.5" />
              Joined
            </p>
            <p className="text-sm font-semibold text-[#1c1b1b]">
              {new Date(profile.joined_date).toLocaleDateString()}
            </p>
          </div>
          <div className="rounded-xl bg-[#f6f3f2] p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
              <ShieldAlert className="h-3.5 w-3.5" />
              Status
            </p>
            <p className="text-sm font-semibold text-[#1c1b1b]">
              {profile.is_blocked ? "Blocked" : profile.is_suspended ? "Suspended" : "Active"}
            </p>
          </div>
        </div>

        {company && (
          <div className="mt-6 rounded-xl border border-[#e5e2e1] p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
              <Building2 className="h-3.5 w-3.5" />
              Company Profile
            </p>
            <Link
              href={`/admin/companies/${company.id}`}
              className="text-sm font-semibold text-[#006d43] hover:underline"
            >
              {company.name}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
