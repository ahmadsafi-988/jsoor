"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upsertCompany } from "@/lib/company/actions";
import { LocationPicker } from "@/components/app/LocationPicker";
import { createClient } from "@/lib/supabase/client";
import { companyVerificationTable } from "@/lib/company/verification";
import type { Tables } from "@/lib/supabase_generated_types";
import type { LocationOption } from "@/lib/company/data";
import { AlertTriangle, ArrowRight, Building2, Camera, CheckCircle, Loader2 } from "lucide-react";

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Retail",
  "Manufacturing", "Media", "Consulting", "Real Estate", "Other",
];
const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1,000", "1,000+"];

type VerificationDetails = {
  legal_company_name: string;
  work_email: string;
  contact_person_name: string;
  contact_job_title: string;
  phone_number: string;
  country_of_registration: "Jordan";
  commercial_registration_number: string;
  verification_status: "pending" | "approved" | "rejected" | "needs_changes";
  review_message: string | null;
};

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Tables<"companies"> | null>(null);
  const [verification, setVerification] = useState<VerificationDetails | null>(null);
  const [username, setUsername] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);
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
      setWorkEmail(user.email ?? "");

      const [{ data: companyData }, { data: profile }, { data: locationRows }, { data: verificationData }] = await Promise.all([
        supabase.from("companies").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
        supabase.from("locations").select("id,name").order("name"),
        companyVerificationTable(supabase)
          .select("legal_company_name, work_email, contact_person_name, contact_job_title, phone_number, country_of_registration, commercial_registration_number, verification_status, review_message")
          .eq("company_id", user.id)
          .maybeSingle(),
      ]);

      if (companyData?.is_verified) {
        router.replace("/company/home");
        return;
      }

      setCompany(companyData ?? null);
      setVerification((verificationData ?? null) as VerificationDetails | null);
      setUsername(profile?.username ?? "");
      setLogoUrl(companyData?.logo_url ?? null);
      setLocations(locationRows ?? []);
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

    if (company) {
      const { error: dbError } = await supabase
        .from("companies")
        .update({ logo_url: urlWithBust })
        .eq("id", userIdRef.current);

      if (dbError) {
        setError("Logo uploaded but failed to save. It will be included when you submit the form.");
      }
    }

    setLogoUrl(urlWithBust);
    setCompany((prev) => prev ? { ...prev, logo_url: urlWithBust } : prev);
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
      setVerification({
        legal_company_name: String(formData.get("legal_company_name") ?? ""),
        work_email: String(formData.get("work_email") ?? workEmail),
        contact_person_name: String(formData.get("contact_person_name") ?? ""),
        contact_job_title: String(formData.get("contact_job_title") ?? ""),
        phone_number: String(formData.get("phone_number") ?? ""),
        country_of_registration: "Jordan",
        commercial_registration_number: String(formData.get("commercial_registration_number") ?? ""),
        verification_status: "pending",
        review_message: null,
      });
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

  const status = verification?.verification_status;
  const isNeedsChanges = status === "needs_changes" || status === "rejected";

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#006d43] to-[#00a86b] flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-headline text-3xl font-bold text-[#1c1b1b] tracking-tight">
            Submit your company for review
          </h1>
          <p className="text-[#3d4a41] mt-2">
            Jsoor reviews employer accounts before companies can post jobs or contact applicants.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-8 flex flex-col gap-8">
          <input type="hidden" name="work_email" value={workEmail} />
          <input type="hidden" name="logo_url" value={logoUrl ?? ""} />

          {status === "pending" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Your employer account is under review. You can update and resubmit these details while you wait.
            </div>
          )}
          {isNeedsChanges && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">
                    {status === "rejected" ? "Your employer request was rejected." : "Admin requested changes."}
                  </p>
                  {verification?.review_message && <p className="mt-1">{verification.review_message}</p>}
                </div>
              </div>
            </div>
          )}

          <section className="flex flex-col gap-4">
            <div>
              <h2 className="font-headline text-xl font-semibold text-[#1c1b1b]">Company Identity</h2>
              <p className="text-sm text-[#5f5e5e] mt-1">These details are used by admins to review your employer request.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1c1b1b]">Legal Company Name *</label>
                <input
                  name="legal_company_name"
                  required
                  defaultValue={verification?.legal_company_name ?? ""}
                  placeholder="Registered legal name"
                  className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1c1b1b]">Country of Registration *</label>
                <select
                  name="country_of_registration"
                  required
                  defaultValue={verification?.country_of_registration ?? "Jordan"}
                  className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                >
                  <option value="Jordan">Jordan</option>
                </select>
                <p className="text-xs text-[#5f5e5e]">Jsoor currently supports companies registered in Jordan.</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#1c1b1b]">Commercial Registration Number *</label>
              <input
                name="commercial_registration_number"
                required
                defaultValue={verification?.commercial_registration_number ?? ""}
                placeholder="Registration number issued in Jordan"
                className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
              />
            </div>
          </section>

          <section className="flex flex-col gap-4 border-t border-[#e5e2e1] pt-8">
            <div>
              <h2 className="font-headline text-xl font-semibold text-[#1c1b1b]">Representative Contact</h2>
              <p className="text-sm text-[#5f5e5e] mt-1">The person admins can contact about this employer request.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1c1b1b]">Work Email</label>
                <input
                  value={workEmail}
                  readOnly
                  className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#5f5e5e] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1c1b1b]">Phone Number *</label>
                <input
                  name="phone_number"
                  required
                  defaultValue={verification?.phone_number ?? ""}
                  placeholder="+962..."
                  className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1c1b1b]">Contact Person Full Name *</label>
                <input
                  name="contact_person_name"
                  required
                  defaultValue={verification?.contact_person_name ?? ""}
                  placeholder="Full name"
                  className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1c1b1b]">Contact Job Title *</label>
                <input
                  name="contact_job_title"
                  required
                  defaultValue={verification?.contact_job_title ?? ""}
                  placeholder="HR Manager, Recruiter, Founder..."
                  className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                />
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 border-t border-[#e5e2e1] pt-8">
            <div>
              <h2 className="font-headline text-xl font-semibold text-[#1c1b1b]">Public Company Profile</h2>
              <p className="text-sm text-[#5f5e5e] mt-1">These details help candidates understand who they are applying to.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1c1b1b]">Company Display Name *</label>
                <input
                  name="name"
                  required
                  defaultValue={company?.name ?? ""}
                  placeholder="Name shown to candidates"
                  className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                />
                <p className="text-xs text-[#5f5e5e]">This is the name candidates will see on jobs and your company profile.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1c1b1b]">Username *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">@</span>
                  <input
                    name="username"
                    required
                    defaultValue={username}
                    placeholder="companyname"
                    className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] pl-8 pr-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                  />
                </div>
              </div>
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
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
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
                <label htmlFor="location" className="text-sm font-semibold text-[#1c1b1b]">Location</label>
                <LocationPicker
                  locations={locations}
                  defaultValue={company?.location}
                  placeholder="Search locations..."
                />
                <p className="text-xs text-[#5f5e5e]">Choose a location from the list, or use Not specified.</p>
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
              <label className="text-sm font-semibold text-[#1c1b1b]">Company Overview</label>
              <textarea
                name="description"
                rows={4}
                defaultValue={company?.description ?? ""}
                placeholder="Briefly describe what your company does and the opportunities you offer."
                className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
              />
            </div>
          </section>

          {error && (
            <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          {saved && (
            <p className="rounded-xl bg-[#78fbb6]/20 border border-[#78fbb6]/40 px-4 py-3 text-sm text-[#005232] flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Your employer account request has been submitted for review.
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold py-3.5 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[#00a86b]/20 text-sm disabled:opacity-60"
          >
            {pending ? "Submitting..." : <>Submit for review <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
