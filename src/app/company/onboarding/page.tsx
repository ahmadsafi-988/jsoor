"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { upsertCompany } from "@/lib/company/actions";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase_generated_types";
import { Building2, ArrowRight, CheckCircle } from "lucide-react";

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Retail",
  "Manufacturing", "Media", "Consulting", "Real Estate", "Other",
];

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Tables<"companies"> | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadCompany = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const [{ data: companyData }, { data: profile }] = await Promise.all([
        supabase.from("companies").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
      ]);

      if (companyData?.is_verified) {
        router.replace("/company/home");
        return;
      }

      setCompany(companyData ?? null);
      setUsername(profile?.username ?? "");
      setLoading(false);
    };

    loadCompany();
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    const result = await upsertCompany(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    } else {
      setSaved(true);
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center p-6">
        <div className="w-8 h-8 border-2 border-[#006d43] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#006d43] to-[#00a86b] flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-headline text-3xl font-bold text-[#1c1b1b] tracking-tight">
            Set up your Company
          </h1>
          <p className="text-[#3d4a41] mt-2">
            {company ? "Your account is pending admin verification. You can still update these details." : "A few details to get you started."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e2e1] p-8 flex flex-col gap-5">
          {company && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Your company profile has been submitted. An admin needs to verify it before you can access company tools.</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1c1b1b]">Company Name *</label>
            <input
              name="name"
              required
              defaultValue={company?.name ?? ""}
              placeholder="Acme Corp"
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1c1b1b]">Username *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">@</span>
              <input
                name="username"
                required
                defaultValue={username}
                placeholder="acmecorp"
                className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] pl-8 pr-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1c1b1b]">Industry</label>
            <select
              name="industry"
              defaultValue={company?.industry ?? ""}
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1c1b1b]">Location</label>
            <input
              name="location"
              defaultValue={company?.location ?? ""}
              placeholder="e.g. New York, NY"
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1c1b1b]">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={company?.description ?? ""}
              placeholder="What does your company do?"
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          {saved && (
            <p className="rounded-xl bg-[#78fbb6]/20 border border-[#78fbb6]/40 px-4 py-3 text-sm text-[#005232]">
              Company details saved. You will get access after admin verification.
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold py-3.5 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[#00a86b]/20 text-sm disabled:opacity-60"
          >
            {pending ? "Saving..." : <>Save Company Details <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
