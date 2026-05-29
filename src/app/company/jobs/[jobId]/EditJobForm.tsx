"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateJob, deleteJob } from "@/lib/company/actions";
import { LocationPicker } from "@/components/app/LocationPicker";
import { SkillPicker } from "@/components/app/SkillPicker";
import type { Tables } from "@/lib/supabase_generated_types";
import type { LocationOption, SkillCategory, SkillWithCategories } from "@/lib/company/data";
import { ArrowLeft, Users, Trash2, Save, Lock } from "lucide-react";
import Link from "next/link";

const JOB_TYPES = ["Full-time", "Part-time", "Remote", "Hybrid", "Contract", "Internship"] as const;

type Props = {
  job: Tables<"jobs">;
  allSkills: SkillWithCategories[];
  initialSkillIds: number[];
  categories: SkillCategory[];
  locations: LocationOption[];
};

export function EditJobForm({ job, allSkills, initialSkillIds, categories, locations }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    formData.set("jobId", job.id);
    const result = await updateJob(formData);
    if ("error" in result) {
      setError(result.error ?? "Something went wrong.");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    }
    setPending(false);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this job? This cannot be undone.")) return;
    const result = await deleteJob(job.id);
    if ("error" in result) {
      setError(result.error ?? "Something went wrong.");
    } else {
      router.push("/company/jobs");
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link
            href="/company/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-[#3d4a41] hover:text-[#006d43] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Jobs
          </Link>
          <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">
            {job.title}
          </h2>
        </div>
        <Link
          href={`/company/jobs/${job.id}/applicants`}
          className="inline-flex items-center gap-2 border border-[#006d43]/30 text-[#006d43] font-semibold px-4 py-2 rounded-xl hover:bg-[#006d43]/5 transition-colors text-sm mt-8"
        >
          <Users className="w-4 h-4" /> View Applicants
        </Link>
      </div>

      {job.admin_locked && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <Lock className="w-4 h-4 shrink-0" />
          <span>This job has been locked by an admin and is hidden from job seekers. You cannot reactivate it until the admin removes the lock.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e2e1] p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Job Title *</label>
          <input
            name="title"
            required
            defaultValue={job.title}
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1c1b1b]">Job Type *</label>
            <select
              name="type"
              required
              defaultValue={job.type}
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            >
              {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="location" className="text-sm font-semibold text-[#1c1b1b]">Location</label>
            <LocationPicker
              locations={locations}
              defaultValue={job.location}
              placeholder="Search locations..."
            />
            <p className="text-xs text-[#5f5e5e]">Choose a location from the list, or use Not specified.</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Salary Range</label>
          <input
            name="salary_range"
            defaultValue={job.salary_range ?? ""}
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Description *</label>
          <textarea
            name="description"
            required
            rows={6}
            defaultValue={job.description}
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Requirements</label>
          <textarea
            name="requirements"
            rows={4}
            defaultValue={job.requirements ?? ""}
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Required Skills</label>
          <p className="text-xs text-[#5f5e5e]">Select the skills candidates should have for this role.</p>
          <SkillPicker
            allSkills={allSkills}
            categories={categories}
            initialSelectedIds={initialSkillIds}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            defaultChecked={job.is_active && !job.admin_locked}
            value="true"
            disabled={job.admin_locked}
            className="w-4 h-4 accent-[#006d43] disabled:opacity-40"
          />
          <label htmlFor="is_active" className={`text-sm font-medium ${job.admin_locked ? "text-neutral-400" : "text-[#1c1b1b]"}`}>
            Job is active (visible to applicants)
            {job.admin_locked && <span className="ml-1.5 text-red-600 font-normal">(locked by admin)</span>}
          </label>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-xl bg-[#78fbb6]/20 border border-[#78fbb6]/40 px-4 py-3 text-sm text-[#005232]">
            Job updated successfully.
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete Job
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold px-6 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[#00a86b]/20 text-sm disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {pending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
