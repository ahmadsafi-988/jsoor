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
import {
  ImageIcon, Search, CheckCircle2, PlusCircle, Loader2,
  XCircle, ArrowRight, ArrowLeft, Sparkles, User,
  GraduationCap, Wrench, Check, FileText, Upload,
  FolderGit2, Award,
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
  github: string;
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
type SkillRow   = { id: number; name: string };
type University = { id: number; name: string; logo_url: string };

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS: { label: string; icon: React.ElementType }[] = [
  { label: "Identity",  icon: User          },
  { label: "Education", icon: GraduationCap },
  { label: "Skills",    icon: Wrench        },
  { label: "Done",      icon: Sparkles      },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((s, i) => {
        const stepNum  = (i + 1) as Step;
        const isDone   = current > stepNum;
        const isActive = current === stepNum;
        const Icon = s.icon;
        return (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={[
                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                isDone   ? "border-amber-500 bg-amber-500 text-white" : "",
                isActive ? "border-amber-500 bg-background text-amber-600 shadow-[0_0_0_4px_rgba(245,158,11,0.15)]" : "",
                !isDone && !isActive ? "border-border bg-muted text-muted-foreground" : "",
              ].join(" ")}>
                {isDone ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-xs font-medium tracking-wide ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-[2px] w-16 mb-6 mx-2 rounded-full transition-all duration-500 ${current > stepNum ? "bg-amber-500" : "bg-border"}`} />
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
    return <p className="rounded-md bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{state.error}</p>;
  if (state.message)
    return <p className="rounded-md bg-green-500/10 px-4 py-2.5 text-sm text-green-700 dark:text-green-400">{state.message}</p>;
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (usernameStatus === "taken" || usernameStatus === "checking") return;
    onNext();
  }

  const UsernameIcon = () => {
    if (usernameStatus === "checking")  return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (usernameStatus === "taken")     return <XCircle className="h-4 w-4 text-destructive" />;
    if (usernameStatus === "available") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7">

      {/* Avatar + CV upload row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Avatar */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Profile photo</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-border shrink-0">
              <AvatarImage src={data.avatarPreview ?? undefined} />
              <AvatarFallback><ImageIcon className="h-7 w-7 text-muted-foreground" /></AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <Label
                htmlFor="avatar_onboard"
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
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
              <p className="text-xs text-muted-foreground">PNG, JPG or WEBP · Max 5 MB</p>
            </div>
          </div>
        </div>

        {/* CV */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Curriculum Vitae</Label>
          <div className={[
            "flex flex-col gap-2 rounded-lg border-2 border-dashed px-4 py-4 transition-colors",
            data.cvFile ? "border-amber-500/40 bg-amber-500/5" : "border-border hover:border-muted-foreground/40",
          ].join(" ")}>
            {data.cvFile ? (
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{data.cvName}</p>
                  <p className="text-xs text-muted-foreground">Ready to upload</p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ cvFile: null, cvName: null })}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
                <div>
                  <Label
                    htmlFor="cv_onboard"
                    className="cursor-pointer text-sm font-medium text-primary hover:underline"
                  >
                    Click to upload your CV
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">PDF · Max 10 MB · Optional</p>
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

      <Separator />

      {/* Name */}
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="first_name">First name <span className="text-destructive">*</span></Label>
          <Input id="first_name" value={data.firstName} required onChange={(e) => onChange({ firstName: e.target.value })} placeholder="Ada" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last name <span className="text-destructive">*</span></Label>
          <Input id="last_name" value={data.lastName} required onChange={(e) => onChange({ lastName: e.target.value })} placeholder="Lovelace" />
        </div>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center">
            <span className="flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">@</span>
            <Input
              id="username" value={data.username} required minLength={3}
              onChange={(e) => onChange({ username: e.target.value.toLowerCase().replace(/\s/g, "") })}
              placeholder="ada_lovelace"
              className="rounded-l-none"
            />
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            <UsernameIcon />
          </div>
        </div>
        {usernameStatus === "taken"     && <p className="text-xs text-destructive">That username is already taken.</p>}
        {usernameStatus === "available" && <p className="text-xs text-green-600 dark:text-green-400">Looks good!</p>}
        {usernameStatus === "idle"      && <p className="text-xs text-muted-foreground">Your public profile URL · At least 3 characters</p>}
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Short bio</Label>
        <Textarea
          id="bio" value={data.bio} rows={3} maxLength={300} className="resize-none"
          onChange={(e) => onChange({ bio: e.target.value })}
          placeholder="A few words about yourself…"
        />
        <p className="text-right text-xs text-muted-foreground">{data.bio.length}/300</p>
      </div>

      {/* Location / Website / GitHub */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={data.location} onChange={(e) => onChange({ location: e.target.value })} placeholder="Amman, JO" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" value={data.website} onChange={(e) => onChange({ website: e.target.value })} placeholder="yoursite.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="github">GitHub handle</Label>
          <Input id="github" value={data.github} onChange={(e) => onChange({ github: e.target.value })} placeholder="octocat" />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={usernameStatus === "taken" || usernameStatus === "checking"}
          className="gap-2 px-8"
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
    <div className="space-y-7">
      <p className="text-sm text-muted-foreground -mt-1">
        Tell us about your academic background. You can always fill this in later.
      </p>

      {/* University search */}
      <div className="space-y-2">
        <Label>University / Institution</Label>
        {selectedUni ? (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
            {selectedUni.logo_url && (
              <img src={selectedUni.logo_url} alt={selectedUni.name} className="h-9 w-9 rounded object-contain" />
            )}
            <span className="flex-1 text-sm font-medium">{selectedUni.name}</span>
            <button type="button" onClick={clearUni} className="text-muted-foreground hover:text-destructive transition-colors">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-11" placeholder="Search your university…" value={query} onChange={(e) => setQuery(e.target.value)} />
            {uniResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden">
                {uniResults.map((u) => (
                  <button key={u.id} type="button" onClick={() => selectUni(u)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors">
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
      <div className="space-y-2">
        <Label htmlFor="degree">Degree</Label>
        <Input id="degree" value={data.degree} onChange={(e) => onChange({ degree: e.target.value })} placeholder="B.Sc. Computer Science" className="h-11" />
      </div>

      {/* GPA + years */}
      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-2">
          <Label htmlFor="gpa">GPA</Label>
          <Input id="gpa" value={data.gpa} onChange={(e) => onChange({ gpa: e.target.value })} placeholder="3.8" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edu_start">Start year</Label>
          <Input
            id="edu_start" value={data.eduStart} placeholder="2020" maxLength={4} className="h-11"
            onChange={(e) => onChange({ eduStart: e.target.value.replace(/\D/g, "").slice(0, 4) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edu_end">End year</Label>
          <Input
            id="edu_end" value={data.eduEnd} placeholder="2024" maxLength={4} className="h-11"
            onChange={(e) => onChange({ eduEnd: e.target.value.replace(/\D/g, "").slice(0, 4) })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" size="lg" onClick={onNext}>Skip for now</Button>
          <Button type="button" size="lg" onClick={onNext} className="gap-2 px-8">
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
}: {
  onFinish: () => Promise<void>;
  onBack: () => void;
}) {
  const supabase = createClient();
  const [query, setQuery]         = React.useState("");
  const [results, setResults]     = React.useState<SkillRow[]>([]);
  const [selected, setSelected]   = React.useState<SkillEntry[]>([]);
  const [isPending, setIsPending] = React.useState<number | null>(null);
  const [finishing, setFinishing] = React.useState(false);
  const [feedback, setFeedback]   = React.useState<{ error?: string } | null>(null);

  React.useEffect(() => {
    supabase.from("skills").select("id,name").order("name").then(({ data }) => setResults(data ?? []));
  }, []);

  const filtered = query.trim()
    ? results.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : results;

  async function handleAdd(skill: SkillRow) {
    if (selected.some((s) => s.skill_id === skill.id)) return;
    setIsPending(skill.id);
    const result = await addProfileSkill(skill.id);
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
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground -mt-1">
        Add skills that best represent your expertise. You can refine these anytime.
      </p>

      {/* Selected chips */}
      <div className="min-h-[3rem] flex flex-wrap gap-2">
        {selected.length === 0
          ? <p className="text-sm text-muted-foreground italic py-1">No skills selected yet.</p>
          : selected.map((s) => (
            <Badge key={s.skill_id} variant="secondary" className="text-sm py-1.5 px-3 gap-2 border border-primary/20 bg-secondary/60">
              <span className="font-medium">{s.name}</span>
              <button type="button" onClick={() => handleRemove(s.skill_id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))
        }
      </div>

      <Separator />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9 h-11" placeholder="Search skills…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {/* Skill list */}
      <div className="rounded-lg border bg-muted/5 overflow-hidden">
        <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border">
          {filtered.length === 0 && query && (
            <p className="text-center py-10 text-sm text-muted-foreground">No matching skills found.</p>
          )}
          <div className="grid grid-cols-2 gap-0.5">
            {filtered.map((s) => {
              const isAdded = selected.some((p) => p.skill_id === s.id);
              return (
                <button
                  key={s.id} type="button"
                  disabled={isAdded || isPending === s.id}
                  onClick={() => handleAdd(s)}
                  className="group flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-md hover:bg-background hover:shadow-sm transition-all border border-transparent hover:border-border disabled:opacity-60 disabled:cursor-default"
                >
                  <span className="flex items-center gap-3">
                    {isAdded
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      : <PlusCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    }
                    <span className="truncate">{s.name}</span>
                  </span>
                  {isPending === s.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Feedback state={feedback} />

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} className="gap-2" disabled={finishing}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button size="lg" onClick={handleFinish} disabled={finishing} className="gap-2 px-8">
          {finishing
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
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
        <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping [animation-duration:2.5s]" />
        <div className="absolute inset-2 rounded-full bg-amber-500/10" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-amber-500 bg-background">
          <Sparkles className="h-10 w-10 text-amber-500" />
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-3xl font-bold">You're all set{firstName ? `, ${firstName}` : ""}!</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your profile is live — but the best profiles stand out with real work behind them.
        </p>
      </div>

      {/* Primary CTA — complete profile */}
      <div className="w-full max-w-sm space-y-4">
        <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 px-5 py-4 text-left space-y-3">
          <p className="text-sm font-semibold text-foreground">Make your profile shine ✨</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Head to your profile editor to add <span className="font-medium text-foreground">projects</span> and{" "}
            <span className="font-medium text-foreground">certifications & badges</span> — these are what employers look at first.
          </p>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FolderGit2 className="h-3.5 w-3.5 text-amber-500" /> Projects
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-amber-500" /> Badges & Certs
            </span>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full gap-2"
          onClick={() => router.push(`/job-seeker/profile/${username}/edit`)}
        >
          Complete my profile
          <ArrowRight className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-foreground"
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
    location: "", website: "", github: "",
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
        supabase.from("job_seeker_profiles").select("bio, location, website, github").eq("id", user.id).single(),
      ]);

      if (prof) {
        setIdentity((prev) => ({
          ...prev,
          firstName:     prof.first_name    ?? "",
          lastName:      prof.last_name     ?? "",
          bio:           jsProf?.bio        ?? "",
          location:      jsProf?.location   ?? "",
          website:       jsProf?.website    ?? "",
          github:        jsProf?.github     ?? "",
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
    fd.set("github",     identity.github.trim());

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
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cardTitles: Record<number, { title: string; subtitle: string }> = {
    1: { title: "Tell us about yourself",       subtitle: "This is how you'll appear to employers and collaborators." },
    2: { title: "Your education",               subtitle: "Add your academic background to strengthen your profile." },
    3: { title: "Skills & expertise",           subtitle: "Pick skills that represent you. You can always add more later." },
  };

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="flex h-14 items-center justify-between border-b bg-background px-8">
        <span className="font-semibold tracking-tight">Complete your profile</span>
        <span className="text-xs text-muted-foreground tabular-nums">Step {step} of 4</span>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">

          {step < 4 && <StepIndicator current={step} />}

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            {step < 4 && (
              <div className="border-b bg-muted/20 px-8 py-5">
                <h1 className="text-xl font-bold leading-tight">{cardTitles[step]?.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{cardTitles[step]?.subtitle}</p>
              </div>
            )}

            <div className={step === 4 ? "px-8 py-10" : "px-8 py-7"}>
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