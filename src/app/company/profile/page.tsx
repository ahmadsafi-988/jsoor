"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateCompanyCoverUrl, upsertCompany } from "@/lib/company/actions";
import { uploadCompanyCover } from "@/lib/storage/upload";
import { LocationPicker } from "@/components/app/LocationPicker";
import type { CompanyRow, LocationOption } from "@/lib/company/data";
import { Building2, Camera, ImageIcon, Loader2 } from "lucide-react";

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Retail",
  "Manufacturing", "Media", "Consulting", "Real Estate", "Other",
];
const SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1,000", "1,000+"];

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<Partial<CompanyRow> | null>(null);
  const [username, setUsername] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;
      const [companyRes, profileRes, locationsRes] = await Promise.all([
        supabase.from("companies").select("*").eq("id", user.id).single(),
        supabase.from("profiles").select("username").eq("id", user.id).single(),
        supabase.from("locations").select("id,name").order("name"),
      ]);
      setCompany(companyRes.data ?? {});
      setLogoUrl(companyRes.data?.logo_url ?? null);
      setCoverUrl(companyRes.data?.cover_url ?? null);
      setUsername(profileRes.data?.username ?? "");
      setLocations(locationsRes.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

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
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError("Failed to upload photo. Please try again.");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    // Bust cache so the new image loads immediately
    const urlWithBust = `${publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabase
      .from("companies")
      .update({ logo_url: urlWithBust })
      .eq("id", userIdRef.current);

    if (dbError) {
      setError("Photo uploaded but failed to save. Please try again.");
    } else {
      setLogoUrl(urlWithBust);
    }

    setUploading(false);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userIdRef.current) return;

    setUploadingCover(true);
    setError(null);

    const upload = await uploadCompanyCover(userIdRef.current, file);
    if ("error" in upload) {
      setError("Failed to upload background. Please try again.");
      setUploadingCover(false);
      return;
    }

    const saved = await updateCompanyCoverUrl(upload.url);
    if (saved?.error) {
      setError("Background uploaded but failed to save. Please try again.");
    } else {
      setCoverUrl(upload.url);
    }

    setUploadingCover(false);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    const result = await upsertCompany(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    }
    setPending(false);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#006d43] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">Company Profile</h2>
        <p className="text-[#3d4a41] text-sm mt-1">This information is shown to job seekers on your listings.</p>
      </div>

      {/* Company photo */}
      <div className="bg-white rounded-2xl border border-[#e5e2e1] p-6 mb-5 flex items-center gap-6">
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-2xl bg-white border border-[#e5e2e1] overflow-hidden flex items-center justify-center p-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-10 h-10 text-[#3d4a41]" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#006d43] text-white flex items-center justify-center shadow-md hover:bg-[#005232] transition-colors disabled:opacity-60"
            title="Upload company photo"
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
          <p className="text-[#5f5e5e] text-xs mt-0.5">Shown on job cards seen by applicants. JPG, PNG or WebP, max 2 MB.</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>

      {/* Company background */}
      <div className="bg-white rounded-2xl border border-[#e5e2e1] p-6 mb-5">
        <div className="overflow-hidden rounded-xl border border-[#e5e2e1] bg-[#f6f3f2]">
          <div className="h-36 bg-gradient-to-br from-[#006d43] via-[#008a55] to-[#00c47a]">
            {coverUrl ? (
              <img src={coverUrl} alt="Company background" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-white/80">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[#1c1b1b] text-sm">Company Background</p>
              <p className="text-[#5f5e5e] text-xs mt-0.5">Recommended: 1600 x 400 px. JPG, PNG or WebP.</p>
            </div>
            <button
              type="button"
              onClick={() => coverFileRef.current?.click()}
              disabled={uploadingCover}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e2e1] bg-white px-3 py-2 text-sm font-medium text-[#3d4a41] transition-colors hover:bg-[#f6f3f2] disabled:opacity-60"
            >
              {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Change background
            </button>
            <input
              ref={coverFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e2e1] p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Company Name *</label>
          <input
            name="name"
            required
            defaultValue={company?.name ?? ""}
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Username (public handle)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">@</span>
            <input
              name="username"
              defaultValue={username}
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] pl-8 pr-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Description</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={company?.description ?? ""}
            placeholder="Tell candidates what your company does and what makes it great..."
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-2 gap-4">
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

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-xl bg-[#78fbb6]/20 border border-[#78fbb6]/40 px-4 py-3 text-sm text-[#005232]">Profile saved successfully.</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold px-6 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[#00a86b]/20 text-sm disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
