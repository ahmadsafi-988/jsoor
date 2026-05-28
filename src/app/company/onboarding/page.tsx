"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upsertCompany } from "@/lib/company/actions";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase_generated_types";
import { Building2, ArrowRight, CheckCircle, Camera, Loader2 } from "lucide-react";

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Retail",
  "Manufacturing", "Media", "Consulting", "Real Estate", "Other",
];
const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1,000", "1,000+"];

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Tables<"companies"> | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadCompany = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      userIdRef.current = user.id;

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
      setLogoUrl(companyData?.logo_url ?? null);
      setLoading(false);
    };

    loadCompany();
  }, [router]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userIdRef.current) return;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `company-logos/${userIdRef.current}.${ext}`;
    const supabase = createClient();

    setUploading(true);
    setError(null);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setError("Failed to upload logo. Please try again.");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);
    const urlWithBust = `${publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabase
      .from("companies")
      .update({ logo_url: urlWithBust })
      .eq("id", userIdRef.current);

    if (dbError) {
      setError("Logo uploaded but failed to save. Please try again.");
    } else {
      setLogoUrl(urlWithBust);
      setCompany((prev) => prev ? { ...prev, logo_url: urlWithBust } : prev);
    }

    setUploading(false);
    e.target.value = "";
  }

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
      <div className="w-full max-w-3xl">
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

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e2e1] p-8 flex flex-col gap-6">
          {company && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Your company profile has been submitted. An admin needs to verify it before you can access company tools.</span>
            </div>
          )}

          <div className="rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-4 py-3 text-sm text-[#3d4a41]">
            These details help admins verify your company and help candidates understand who they are applying to.
          </div>

          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white border border-[#e5e2e1] overflow-hidden flex items-center justify-center p-2">
                {logoUrl ? (
                  <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-9 h-9 text-[#3d4a41]" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#006d43] text-white flex items-center justify-center shadow-md hover:bg-[#005232] transition-colors disabled:opacity-60"
                title="Upload company logo"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div>
              <p className="font-semibold text-[#1c1b1b] text-sm">Company Logo</p>
              <p className="text-[#5f5e5e] text-xs mt-0.5">Shown on job cards and company surfaces. JPG, PNG or WebP, max 2 MB.</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-sm font-semibold text-[#1c1b1b]">Company Size</label>
              <select
                name="size"
                defaultValue={company?.size ?? ""}
                className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
              >
                <option value="">Select size</option>
                {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-sm font-semibold text-[#1c1b1b]">Founded Year</label>
              <input
                name="founded_year"
                defaultValue={company?.founded_year ?? ""}
                placeholder="e.g. 2010"
                className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1c1b1b]">Website</label>
            <input
              name="website"
              type="url"
              defaultValue={company?.website ?? ""}
              placeholder="https://yourcompany.com"
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1c1b1b]">Description</label>
            <textarea
              name="description"
              rows={4}
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
