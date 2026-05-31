"use client";

// app/onboarding/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Multi-step onboarding wizard — Steps: 1·Identity  2·Education  3·Skills  4·Done
//
// Key design decision: SINGLE UPSERT architecture
//  - Steps 1 & 2 are pure UI — they only update React state, zero DB writes
//  - Step 3 (Skills) calls addProfileSkill per-skill (junction table, unavoidable)
//  - "Finish setup" on step 3 fires the ONE upsertProfile + avatar + CV upload
//  - This prevents partial overwrites between steps
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LocationPicker } from "@/components/app/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  upsertProfile,
  updateAvatarUrl,
  updateCvUrl,
  addProfileSkill,
} from "@/lib/profile/actions";
import { uploadAvatar, uploadCV } from "@/lib/storage/upload";
import type { LocationOption } from "@/lib/company/data";
import {
  ImageIcon, Search, CheckCircle2, PlusCircle, Loader2,
  XCircle, ArrowRight, ArrowLeft, Sparkles, User,
  GraduationCap, Wrench, Check, FileText, Upload,
  FolderGit2, Award, SlidersHorizontal, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4;

type IdentityData = {
  firstName: string;
  lastName: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  cvFile: File | null;
  cvName: string | null;
};

type EducationData = {
  institution: string;
  logo_url: string;
  degree: string;
  gpa: string;
  eduStart: string;
  eduEnd: string;
};

type SkillEntry = { skill_id: number; name: string };
type SkillRow   = { id: number; name: string; skill_to_categories?: { category_id: number }[] | null };
type SkillCategory = { id: number; name: string; slug: string; sort_order: number };
type University = { id: number; name: string; logo_url: string };

const FIELD_LABEL = "text-sm font-semibold text-[#1c1b1b]";
const FIELD_CLASS =
  "h-11 rounded-xl border-[#e5e2e1] bg-[#f6f3f2] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus-visible:border-[#006d43]/50 focus-visible:ring-[#006d43]/20";
const TEXTAREA_CLASS =
  "rounded-xl border-[#e5e2e1] bg-[#f6f3f2] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus-visible:border-[#006d43]/50 focus-visible:ring-[#006d43]/20";
const PRIMARY_BUTTON =
  "rounded-xl bg-gradient-to-br from-[#006d43] to-[#00a86b] px-6 text-sm font-semibold text-white shadow-lg shadow-[#00a86b]/20 hover:brightness-110";
const OUTLINE_BUTTON =
  "rounded-xl border-[#e5e2e1] bg-white text-sm font-semibold text-[#3d4a41] hover:bg-[#f6f3f2]";
const GHOST_BUTTON =
  "rounded-xl text-sm font-semibold text-[#3d4a41] hover:bg-[#f6f3f2] hover:text-[#1c1b1b]";

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS: { label: string; icon: React.ElementType }[] = [
  { label: "Identity",  icon: User          },
  { label: "Education", icon: GraduationCap },
  { label: "Skills",    icon: Wrench        },
  { label: "Done",      icon: Sparkles      },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex w-full items-center justify-center overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const stepNum  = (i + 1) as Step;
        const isDone   = current > stepNum;
        const isActive = current === stepNum;
        const Icon = s.icon;
        return (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={[
                "flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300",
                isDone   ? "border-[#006d43] bg-[#006d43] text-white" : "",
                isActive ? "border-[#006d43] bg-white text-[#006d43] shadow-[0_0_0_4px_rgba(0,109,67,0.12)]" : "",
                !isDone && !isActive ? "border-[#e5e2e1] bg-[#f6f3f2] text-[#5f5e5e]" : "",
              ].join(" ")}>
                {isDone ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`whitespace-nowrap text-xs font-semibold ${isActive ? "text-[#1c1b1b]" : "text-[#5f5e5e]"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 mb-6 h-px w-8 rounded-full transition-all duration-500 sm:w-16 ${current > stepNum ? "bg-[#006d43]" : "bg-[#e5e2e1]"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
function Feedback({ state }: { state: { error?: string; message?: string } | null }) {
  if (!state) return null;
  if (state.error)
    return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>;
  if (state.message)
    return <p className="rounded-xl border border-[#78fbb6]/40 bg-[#78fbb6]/20 px-4 py-3 text-sm text-[#005232]">{state.message}</p>;
  return null;
}

// ─── Step 1: Identity ─────────────────────────────────────────────────────────
// Pure UI — no DB writes. Only reads DB for username uniqueness check.
function StepIdentity({
  data,
  onChange,
  onNext,
  userId,
}: {
  data: IdentityData;
  onChange: (d: Partial<IdentityData>) => void;
  onNext: () => void;
  userId: string;
}) {
  const supabase = createClient();
  const [usernameStatus, setUsernameStatus] = React.useState<
    "idle" | "checking" | "taken" | "available"
  >("idle");
  const [locations, setLocations] = React.useState<LocationOption[]>([]);

  React.useEffect(() => {
    const trimmed = data.username.trim();
    if (!trimmed || trimmed.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    const t = setTimeout(async () => {
      const { data: existing } = await supabase
        .from("profiles").select("id").eq("username", trimmed).neq("id", userId).maybeSingle();
      setUsernameStatus(existing ? "taken" : "available");
    }, 400);
    return () => clearTimeout(t);
  }, [data.username]);

  React.useEffect(() => {
    const client = createClient();
    client
      .from("locations")
      .select("id,name")
      .order("name")
      .then(({ data: rows }) => setLocations(rows ?? []));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (usernameStatus === "taken" || usernameStatus === "checking") return;
    onNext();
  }

  function renderUsernameIcon() {
    if (usernameStatus === "checking")  return <Loader2 className="h-4 w-4 animate-spin text-[#5f5e5e]" />;
    if (usernameStatus === "taken")     return <XCircle className="h-4 w-4 text-red-600" />;
    if (usernameStatus === "available") return <CheckCircle2 className="h-4 w-4 text-[#006d43]" />;
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">

      {/* Avatar + CV upload row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Avatar */}
        <div className="flex flex-col gap-2">
          <Label className={FIELD_LABEL}>Profile photo</Label>
          <div className="flex items-center gap-4 rounded-2xl border border-[#e5e2e1] bg-[#f6f3f2] p-4">
            <Avatar className="h-20 w-20 shrink-0 border border-[#e5e2e1] bg-white">
              <AvatarImage src={data.avatarPreview ?? undefined} />
              <AvatarFallback className="bg-white"><ImageIcon className="h-7 w-7 text-[#3d4a41]" /></AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <Label
                htmlFor="avatar_onboard"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#e5e2e1] bg-white px-3 py-2 text-sm font-semibold text-[#3d4a41] transition-colors hover:bg-[#fcf9f8]"
              >
                <Upload className="h-3.5 w-3.5" />
                {data.avatarPreview ? "Change photo" : "Upload photo"}
              </Label>
              <input
                id="avatar_onboard" type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  onChange({ avatarFile: f, avatarPreview: URL.createObjectURL(f) });
                }}
              />
              <p className="text-xs text-[#5f5e5e]">Recommended: 400 x 400 px. PNG, JPG or WEBP.</p>
            </div>
          </div>
        </div>

        {/* CV */}
        <div className="flex flex-col gap-2">
          <Label className={FIELD_LABEL}>Curriculum Vitae</Label>
          <div className={[
            "flex min-h-[114px] flex-col justify-center gap-2 rounded-2xl border border-dashed px-4 py-4 transition-colors",
            data.cvFile ? "border-[#006d43]/40 bg-[#78fbb6]/15" : "border-[#bccabe] bg-[#f6f3f2] hover:border-[#006d43]/50",
          ].join(" ")}>
            {data.cvFile ? (
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 shrink-0 text-[#006d43]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1c1b1b]">{data.cvName}</p>
                  <p className="text-xs text-[#5f5e5e]">Ready to upload</p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ cvFile: null, cvName: null })}
                  className="shrink-0 text-[#5f5e5e] transition-colors hover:text-red-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <FileText className="h-8 w-8 text-[#3d4a41]" />
                <div>
                  <Label
                    htmlFor="cv_onboard"
                    className="cursor-pointer text-sm font-semibold text-[#006d43] hover:underline"
                  >
                    Click to upload your CV
                  </Label>
                  <p className="mt-0.5 text-xs text-[#5f5e5e]">PDF - Max 10 MB - Optional</p>
                </div>
              </div>
            )}
            <input
              id="cv_onboard" type="file" accept="application/pdf" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                onChange({ cvFile: f, cvName: f.name });
              }}
            />
          </div>
        </div>
      </div>

      <Separator className="bg-[#e5e2e1]" />

      {/* Name */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="first_name" className={FIELD_LABEL}>First name <span className="text-red-600">*</span></Label>
          <Input id="first_name" value={data.firstName} required onChange={(e) => onChange({ firstName: e.target.value })} placeholder="Ada" className={FIELD_CLASS} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="last_name" className={FIELD_LABEL}>Last name <span className="text-red-600">*</span></Label>
          <Input id="last_name" value={data.lastName} required onChange={(e) => onChange({ lastName: e.target.value })} placeholder="Lovelace" className={FIELD_CLASS} />
        </div>
      </div>

      {/* Username */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="username" className={FIELD_LABEL}>Username <span className="text-red-600">*</span></Label>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center">
            <span className="flex h-11 items-center rounded-l-xl border border-r-0 border-[#e5e2e1] bg-[#f6f3f2] px-4 text-sm text-[#5f5e5e]">@</span>
            <Input
              id="username" value={data.username} required minLength={3}
              onChange={(e) => onChange({ username: e.target.value.toLowerCase().replace(/\s/g, "") })}
              placeholder="ada_lovelace"
              className={`${FIELD_CLASS} rounded-l-none`}
            />
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            {renderUsernameIcon()}
          </div>
        </div>
        {usernameStatus === "taken"     && <p className="text-xs text-red-600">That username is already taken.</p>}
        {usernameStatus === "available" && <p className="text-xs text-[#006d43]">Looks good.</p>}
        {usernameStatus === "idle"      && <p className="text-xs text-[#5f5e5e]">Your public profile URL - at least 3 characters.</p>}
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="bio" className={FIELD_LABEL}>Short bio</Label>
        <Textarea
          id="bio" value={data.bio} rows={4} maxLength={1000} className={`${TEXTAREA_CLASS} resize-none`}
          onChange={(e) => onChange({ bio: e.target.value })}
          placeholder="A few words about yourself..."
        />
        <p className="text-right text-xs text-[#5f5e5e]">{data.bio.length}/1000</p>
      </div>

      {/* Location / Website */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="location" className={FIELD_LABEL}>Location</Label>
          <LocationPicker
            locations={locations}
            value={data.location}
            onChange={(location) => onChange({ location })}
            placeholder="Search locations..."
            inputClassName="h-11 w-full rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-4 py-3 pl-9 text-sm text-[#1c1b1b] shadow-none outline-none placeholder:text-neutral-400 focus-visible:border-[#006d43]/50 focus-visible:ring-2 focus-visible:ring-[#006d43]/20"
          />
          <p className="text-xs text-[#5f5e5e]">Choose a location from the list, or use Not specified.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="website" className={FIELD_LABEL}>Website / Portfolio URL</Label>
          <Input
            id="website"
            type="url"
            value={data.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="https://your-portfolio.com"
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={usernameStatus === "taken" || usernameStatus === "checking"}
          className={`${PRIMARY_BUTTON} gap-2`}
        >
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

// ─── Step 2: Education ────────────────────────────────────────────────────────
// Pure UI — no DB writes.
function StepEducation({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: EducationData;
  onChange: (d: Partial<EducationData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const supabase = createClient();
  const [query, setQuery]           = React.useState(data.institution);
  const [uniResults, setUniResults] = React.useState<University[]>([]);
  const [selectedUni, setSelectedUni] = React.useState<University | null>(
    data.institution ? { id: 0, name: data.institution, logo_url: data.logo_url } : null
  );

  React.useEffect(() => {
    if (!query.trim() || selectedUni) { setUniResults([]); return; }
    const t = setTimeout(async () => {
      const { data: unis } = await supabase
        .from("universities").select("id,name,logo_url").ilike("name", `%${query}%`).limit(6);
      setUniResults(unis ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [query, selectedUni]);

  function selectUni(u: University) {
    setSelectedUni(u);
    onChange({ institution: u.name, logo_url: u.logo_url });
    setUniResults([]);
  }

  function clearUni() {
    setSelectedUni(null);
    onChange({ institution: "", logo_url: "" });
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-7">
      <p className="-mt-1 text-sm text-[#5f5e5e]">
        Tell us about your academic background. You can always fill this in later.
      </p>

      {/* University search */}
      <div className="flex flex-col gap-2">
        <Label className={FIELD_LABEL}>University / Institution</Label>
        {selectedUni ? (
          <div className="flex items-center gap-3 rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-4 py-3">
            {selectedUni.logo_url && (
              <img src={selectedUni.logo_url} alt={selectedUni.name} className="h-9 w-9 rounded object-contain" />
            )}
            <span className="flex-1 text-sm font-semibold text-[#1c1b1b]">{selectedUni.name}</span>
            <button type="button" onClick={clearUni} className="text-[#5f5e5e] transition-colors hover:text-red-600">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f5e5e]" />
            <Input className={`${FIELD_CLASS} pl-10`} placeholder="Search your university..." value={query} onChange={(e) => setQuery(e.target.value)} />
            {uniResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-[#e5e2e1] bg-white shadow-lg">
                {uniResults.map((u) => (
                  <button key={u.id} type="button" onClick={() => selectUni(u)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#1c1b1b] transition-colors hover:bg-[#f6f3f2]">
                    {u.logo_url && <img src={u.logo_url} alt={u.name} className="h-6 w-6 rounded object-contain" />}
                    {u.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Degree */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="degree" className={FIELD_LABEL}>Degree</Label>
        <Input id="degree" value={data.degree} onChange={(e) => onChange({ degree: e.target.value })} placeholder="B.Sc. Computer Science" className={FIELD_CLASS} />
      </div>

      {/* GPA + years */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="gpa" className={FIELD_LABEL}>GPA</Label>
          <Input id="gpa" value={data.gpa} onChange={(e) => onChange({ gpa: e.target.value })} placeholder="3.8" className={FIELD_CLASS} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="edu_start" className={FIELD_LABEL}>Start year</Label>
          <Input
            id="edu_start" value={data.eduStart} placeholder="2020" maxLength={4} className={FIELD_CLASS}
            onChange={(e) => onChange({ eduStart: e.target.value.replace(/\D/g, "").slice(0, 4) })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="edu_end" className={FIELD_LABEL}>End year</Label>
          <Input
            id="edu_end" value={data.eduEnd} placeholder="2024" maxLength={4} className={FIELD_CLASS}
            onChange={(e) => onChange({ eduEnd: e.target.value.replace(/\D/g, "").slice(0, 4) })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} className={`${GHOST_BUTTON} gap-2 sm:w-auto`}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" size="lg" onClick={onNext} className={OUTLINE_BUTTON}>Skip for now</Button>
          <Button type="button" size="lg" onClick={onNext} className={`${PRIMARY_BUTTON} gap-2`}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Skills ───────────────────────────────────────────────────────────
function StepSkills({
  onFinish,
  onBack,
  username,
}: {
  onFinish: () => Promise<void>;
  onBack: () => void;
  username: string;
}) {
  const [query, setQuery]         = React.useState("");
  const [results, setResults]     = React.useState<SkillRow[]>([]);
  const [categories, setCategories] = React.useState<SkillCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<Set<number>>(new Set());
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [selected, setSelected]   = React.useState<SkillEntry[]>([]);
  const [isPending, setIsPending] = React.useState<number | null>(null);
  const [finishing, setFinishing] = React.useState(false);
  const [feedback, setFeedback]   = React.useState<{ error?: string } | null>(null);

  React.useEffect(() => {
    const client = createClient();

    Promise.all([
      client
        .from("skills")
        .select("id,name,skill_to_categories(category_id)")
        .order("name"),
      client
        .from("skill_categories")
        .select("id,name,slug,sort_order")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
    ]).then(([skillsRes, categoriesRes]) => {
      setResults((skillsRes.data ?? []) as SkillRow[]);
      setCategories(categoriesRes.data ?? []);
    });
  }, []);

  const filtered = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return results.filter((skill) => {
      const matchesQuery = normalizedQuery
        ? skill.name.toLowerCase().includes(normalizedQuery)
        : true;
      const matchesCategory =
        selectedCategoryIds.size === 0 ||
        (skill.skill_to_categories ?? []).some((entry) =>
          selectedCategoryIds.has(entry.category_id)
        );

      return matchesQuery && matchesCategory;
    });
  }, [query, results, selectedCategoryIds]);

  function toggleCategory(categoryId: number) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  async function handleAdd(skill: SkillRow) {
    if (selected.some((s) => s.skill_id === skill.id)) return;
    setIsPending(skill.id);
    const result = await addProfileSkill(skill.id, username);
    if (result?.error) {
      setFeedback({ error: result.error });
    } else {
      setSelected((prev) => [...prev, { skill_id: skill.id, name: skill.name }]);
    }
    setIsPending(null);
  }

  function handleRemove(skillId: number) {
    setSelected((prev) => prev.filter((s) => s.skill_id !== skillId));
  }

  async function handleFinish() {
    setFinishing(true);
    setFeedback(null);
    try {
      await onFinish();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setFeedback({ error: message });
      setFinishing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="-mt-1 text-sm text-[#5f5e5e]">
        Add skills that best represent your expertise. You can refine these anytime.
      </p>

      {/* Selected chips */}
      <div className="flex min-h-[3rem] flex-wrap gap-2 rounded-2xl border border-[#e5e2e1] bg-[#f6f3f2] p-3">
        {selected.length === 0
          ? <p className="py-1 text-sm text-[#5f5e5e]">No skills selected yet.</p>
          : selected.map((s) => (
            <Badge key={s.skill_id} variant="secondary" className="gap-2 rounded-full border border-[#006d43]/20 bg-[#78fbb6]/20 px-3 py-1.5 text-sm text-[#005232]">
              <span className="font-medium">{s.name}</span>
              <button type="button" onClick={() => handleRemove(s.skill_id)} className="text-[#3d4a41] transition-colors hover:text-red-600">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))
        }
      </div>

      <Separator className="bg-[#e5e2e1]" />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f5e5e]" />
        <Input className={`${FIELD_CLASS} pl-10`} placeholder="Search skills..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {categories.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[#1c1b1b]"
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#5f5e5e]" />
              Filter by industry
              {selectedCategoryIds.size > 0 && (
                <span className="rounded-full bg-[#78fbb6]/20 px-2 py-0.5 text-xs font-semibold text-[#005232]">
                  {selectedCategoryIds.size} selected
                </span>
              )}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-[#5f5e5e] transition-transform ${
                filtersOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {filtersOpen && (
            <div className="border-t border-[#e5e2e1] bg-[#f6f3f2] p-3">
              {selectedCategoryIds.size > 0 && (
                <div className="mb-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryIds(new Set())}
                    className="text-xs font-semibold text-[#006d43] hover:text-[#005232]"
                  >
                    Clear filters
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const checked = selectedCategoryIds.has(category.id);
                  return (
                    <label
                      key={category.id}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        checked
                          ? "border-[#006d43]/50 bg-[#78fbb6]/20 text-[#005232]"
                          : "border-[#e5e2e1] bg-white text-[#3d4a41] hover:border-[#006d43]/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(category.id)}
                        className="h-3.5 w-3.5 accent-[#006d43]"
                      />
                      {category.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Skill list */}
      <div className="overflow-hidden rounded-2xl border border-[#e5e2e1] bg-[#f6f3f2]">
        <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border">
          {filtered.length === 0 && (query || selectedCategoryIds.size > 0) && (
            <p className="py-10 text-center text-sm text-[#5f5e5e]">No matching skills found.</p>
          )}
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {filtered.map((s) => {
              const isAdded = selected.some((p) => p.skill_id === s.id);
              return (
                <button
                  key={s.id} type="button"
                  disabled={isAdded || isPending === s.id}
                  onClick={() => handleAdd(s)}
                  className="group flex items-center justify-between rounded-xl border border-transparent px-4 py-2.5 text-sm font-medium text-[#1c1b1b] transition-all hover:border-[#e5e2e1] hover:bg-white hover:shadow-sm disabled:cursor-default disabled:opacity-60"
                >
                  <span className="flex items-center gap-3">
                    {isAdded
                      ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#006d43]" />
                      : <PlusCircle className="h-4 w-4 shrink-0 text-[#5f5e5e] transition-colors group-hover:text-[#006d43]" />
                    }
                    <span className="truncate">{s.name}</span>
                  </span>
                  {isPending === s.id && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#006d43]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Feedback state={feedback} />

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} className={`${GHOST_BUTTON} gap-2`} disabled={finishing}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button size="lg" onClick={handleFinish} disabled={finishing} className={`${PRIMARY_BUTTON} gap-2`}>
          {finishing
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            : <>Finish setup <ArrowRight className="h-4 w-4" /></>
          }
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Done ─────────────────────────────────────────────────────────────
function StepDone({ username, firstName }: { username: string; firstName: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-8 py-4 text-center">
      {/* Animated ring */}
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-[#78fbb6]/20 [animation-duration:2.5s]" />
        <div className="absolute inset-2 rounded-full bg-[#78fbb6]/20" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#006d43]/30 bg-white">
          <Sparkles className="h-10 w-10 text-[#006d43]" />
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight text-[#1c1b1b]">You&apos;re all set{firstName ? `, ${firstName}` : ""}!</h2>
        <p className="text-sm leading-relaxed text-[#5f5e5e]">
          Your profile is live, and the strongest profiles stand out with real work behind them.
        </p>
      </div>

      {/* Primary CTA — complete profile */}
      <div className="w-full max-w-sm space-y-4">
        <div className="space-y-3 rounded-2xl border border-[#78fbb6]/40 bg-[#78fbb6]/15 px-5 py-4 text-left">
          <p className="text-sm font-semibold text-[#1c1b1b]">Make your profile shine</p>
          <p className="text-xs leading-relaxed text-[#3d4a41]">
            Head to your profile editor to add <span className="font-medium text-[#1c1b1b]">projects</span> and{" "}
            <span className="font-medium text-[#1c1b1b]">certifications & badges</span>. These are what employers look at first.
          </p>
          <div className="flex gap-3 text-xs text-[#3d4a41]">
            <span className="flex items-center gap-1.5">
              <FolderGit2 className="h-3.5 w-3.5 text-[#006d43]" /> Projects
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-[#006d43]" /> Badges & Certs
            </span>
          </div>
        </div>

        <Button
          size="lg"
          className={`${PRIMARY_BUTTON} w-full gap-2`}
          onClick={() => router.push(`/job-seeker/profile/${username}/edit`)}
        >
          Complete my profile
          <ArrowRight className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`${GHOST_BUTTON} w-full`}
          onClick={() => router.push(`/job-seeker/profile/${username}`)}
        >
          View my profile first
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = React.useState(true);
  const [step, setStep]       = React.useState<Step>(1);
  const [userId, setUserId]   = React.useState("");

  const [identity, setIdentity] = React.useState<IdentityData>({
    firstName: "", lastName: "", username: "", bio: "",
    location: "", website: "",
    avatarFile: null, avatarPreview: null,
    cvFile: null, cvName: null,
  });

  const [education, setEducation] = React.useState<EducationData>({
    institution: "", logo_url: "", degree: "", gpa: "", eduStart: "", eduEnd: "",
  });

  React.useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }
      setUserId(user.id);

      const [{ data: prof }, { data: jsProf }] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, avatar_url").eq("id", user.id).single(),
        supabase.from("job_seeker_profiles").select("bio, location, website").eq("id", user.id).single(),
      ]);

      if (prof) {
        setIdentity((prev) => ({
          ...prev,
          firstName:     prof.first_name    ?? "",
          lastName:      prof.last_name     ?? "",
          bio:           jsProf?.bio        ?? "",
          location:      jsProf?.location   ?? "",
          website:       jsProf?.website    ?? "",
          avatarPreview: prof.avatar_url    ?? null,
        }));
      }

      setLoading(false);
    }
    init();
  }, []);

  // ── Single DB write — fires only when user clicks "Finish setup" on step 3 ─
  async function commitProfile() {
    const fd = new FormData();

    // Identity
    fd.set("first_name", identity.firstName.trim());
    fd.set("last_name",  identity.lastName.trim());
    fd.set("username",   identity.username.trim());
    fd.set("bio",        identity.bio.trim());
    fd.set("location",   identity.location.trim());
    fd.set("website",    identity.website.trim());

    // Education — only if filled
    if (education.institution) fd.set("institution", education.institution);
    if (education.logo_url)    fd.set("logo_url",    education.logo_url);
    if (education.degree)      fd.set("degree",      education.degree.trim());
    if (education.gpa)         fd.set("gpa",         education.gpa.trim());
    if (education.eduStart.trim()) fd.set("edu_start", `${education.eduStart.trim()}-01-01`);
    if (education.eduEnd.trim())   fd.set("edu_end",   `${education.eduEnd.trim()}-01-01`);

    const result = await upsertProfile(fd);
    if (result?.error) throw new Error(result.error);

    const username = identity.username.trim();

    // Avatar upload
    if (identity.avatarFile) {
      const up = await uploadAvatar(userId, identity.avatarFile);
      if ("error" in up) throw new Error(up.error);
      await updateAvatarUrl(up.url, username);
    }

    // CV upload
    if (identity.cvFile) {
      const up = await uploadCV(userId, identity.cvFile);
      if ("error" in up) throw new Error(up.error);
      await updateCvUrl(up.url, username);
    }

    setStep(4);
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#fcf9f8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#006d43]" />
      </div>
    );
  }

  const cardTitles: Record<number, { title: string; subtitle: string }> = {
    1: { title: "Tell us about yourself",       subtitle: "This is how you'll appear to employers and collaborators." },
    2: { title: "Your education",               subtitle: "Add your academic background to strengthen your profile." },
    3: { title: "Skills & expertise",           subtitle: "Pick skills that represent you. You can always add more later." },
  };

  return (
    <div className="flex min-h-svh flex-col bg-[#fcf9f8]">
      <header className="flex h-14 items-center justify-between border-b border-[#e5e2e1] bg-white px-5 sm:px-8">
        <span className="font-headline font-semibold tracking-tight text-[#1c1b1b]">Complete your profile</span>
        <span className="rounded-full bg-[#f6f3f2] px-3 py-1 text-xs font-semibold tabular-nums text-[#3d4a41]">Step {step} of 4</span>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl space-y-8">

          {step < 4 && <StepIndicator current={step} />}

          <div className="overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white shadow-sm">
            {step < 4 && (
              <div className="border-b border-[#e5e2e1] bg-[#f6f3f2] px-5 py-5 sm:px-8">
                <h1 className="font-headline text-xl font-bold leading-tight tracking-tight text-[#1c1b1b]">{cardTitles[step]?.title}</h1>
                <p className="mt-1 text-sm text-[#5f5e5e]">{cardTitles[step]?.subtitle}</p>
              </div>
            )}

            <div className={step === 4 ? "px-5 py-10 sm:px-8" : "px-5 py-7 sm:px-8"}>
              {step === 1 && (
                <StepIdentity
                  data={identity}
                  onChange={(d) => setIdentity((prev) => ({ ...prev, ...d }))}
                  onNext={() => setStep(2)}
                  userId={userId}
                />
              )}
              {step === 2 && (
                <StepEducation
                  data={education}
                  onChange={(d) => setEducation((prev) => ({ ...prev, ...d }))}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <StepSkills
                  onFinish={commitProfile}
                  onBack={() => setStep(2)}
                  username={identity.username}
                />
              )}
              {step === 4 && (
                <StepDone username={identity.username} firstName={identity.firstName} />
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
