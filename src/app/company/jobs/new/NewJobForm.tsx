"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/company/actions";
import { LocationPicker } from "@/components/app/LocationPicker";
import { SkillPicker } from "@/components/app/SkillPicker";
import type { LocationOption, SkillCategory, SkillWithCategories } from "@/lib/company/data";
import { ArrowLeft, Briefcase } from "lucide-react";
import Link from "next/link";

const JOB_TYPES = ["Full-time", "Part-time", "Remote", "Hybrid", "Contract", "Internship"] as const;

export function NewJobForm({
  allSkills,
  categories,
  locations,
}: {
  allSkills: SkillWithCategories[];
  categories: SkillCategory[];
  locations: LocationOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createJob(formData);
    if ("error" in result) {
      setError(result.error ?? "Something went wrong.");
      setPending(false);
    } else {
      router.push("/company/jobs");
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <Link
          href="/company/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-[#3d4a41] hover:text-[#006d43] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>
        <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">
          Post a New Job
        </h2>
        <p className="text-[#3d4a41] text-sm mt-1">Fill in the details to attract the right candidates.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e2e1] p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Job Title *</label>
          <input
            name="title"
            required
            placeholder="e.g. Senior Frontend Engineer"
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1c1b1b]">Job Type *</label>
            <select
              name="type"
              required
              defaultValue="Full-time"
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            >
              {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="location" className="text-sm font-semibold text-[#1c1b1b]">Location</label>
            <LocationPicker locations={locations} placeholder="Search locations..." />
            <p className="text-xs text-[#5f5e5e]">Choose a location from the list, or use Not specified.</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Salary Range</label>
          <input
            name="salary_range"
            placeholder="e.g. $80,000 – $120,000 / year"
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Job Description *</label>
          <textarea
            name="description"
            required
            rows={6}
            placeholder="Describe the role, responsibilities, and what you're looking for..."
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Requirements</label>
          <textarea
            name="requirements"
            rows={4}
            placeholder="List the skills, experience, and qualifications required..."
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Required Skills</label>
          <p className="text-xs text-[#5f5e5e]">Select the skills candidates should have for this role.</p>
          <SkillPicker allSkills={allSkills} categories={categories} />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/company/jobs"
            className="px-5 py-2.5 rounded-xl border border-[#e5e2e1] text-sm font-medium text-[#3d4a41] hover:bg-[#f6f3f2] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold px-6 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[#00a86b]/20 text-sm disabled:opacity-60"
          >
            <Briefcase className="w-4 h-4" />
            {pending ? "Publishing..." : "Publish Job"}
          </button>
        </div>
      </form>
    </div>
  );
}
