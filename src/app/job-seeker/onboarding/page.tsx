"use client";

// app/job-seeker/onboarding/page.tsx
// Multi-step profile completion wizard.
// Reached after the user clicks the email confirmation link:
//   /auth/confirm?token_hash=...&type=email&next=/job-seeker/onboarding
//
// Steps:
//  1. Basic info   — name, username, bio, location, website, github
//  2. Education    — institution (searched from universities table), degree, gpa, dates
//  3. Avatar       — upload to "avatars" bucket
//  4. CV           — upload to "cvs" bucket
//  5. Projects     — add one or more projects (skippable)
//  6. Badges       — add Credly / cert badges (skippable)

import React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  upsertProfile,
  upsertProject,
  deleteBadge,
  deleteProject,
  upsertBadge,
  updateAvatarUrl,
  updateCvUrl,
} from "@/lib/profile/actions";
import { uploadAvatar, uploadCV } from "@/lib/storage/upload";
import {
  User,
  GraduationCap,
  ImageIcon,
  FileText,
  FolderGit2,
  Award,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Search,
} from "lucide-react";

const STEPS = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "avatar", label: "Avatar", icon: ImageIcon },
  { id: "cv", label: "CV", icon: FileText },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "badges", label: "Badges", icon: Award },
];

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────
function StepBasicInfo({
  onNext,
}: {
  onNext: (data: { username: string }) => void;
}) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await upsertProfile(fd);
    if (result?.error) { setError(result.error); setPending(false); return; }
    onNext({ username: fd.get("username") as string });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">First name *</Label>
          <Input id="first_name" name="first_name" required placeholder="Jane" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">Last name *</Label>
          <Input id="last_name" name="last_name" required placeholder="Doe" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="username">Username *</Label>
        <div className="flex items-center gap-0">
          <span className="flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">@</span>
          <Input id="username" name="username" required placeholder="janedoe" className="rounded-l-none" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" placeholder="Tell employers a bit about yourself…" rows={3} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" placeholder="Amman, Jordan" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" placeholder="yoursite.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="github">GitHub username</Label>
          <Input id="github" name="github" placeholder="janedoe" />
        </div>
      </div>
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Continue"} <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </form>
  );
}

// ─── Step 2: Education ────────────────────────────────────────────────────────
type University = { id: number; name: string; logo_url: string };

function StepEducation({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<University[]>([]);
  const [selected, setSelected] = React.useState<University | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const supabase = createClient();

  async function searchUniversities(q: string) {
    if (!q.trim()) { setResults([]); return; }
    const { data } = await supabase
      .from("universities")
      .select("id, name, logo_url")
      .ilike("name", `%${q}%`)
      .limit(6);
    setResults(data ?? []);
  }

  React.useEffect(() => {
    const timer = setTimeout(() => searchUniversities(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (selected) {
      fd.set("institution", selected.name);
      fd.set("logo_url", selected.logo_url);
    }
    const result = await upsertProfile(fd);
    if (result?.error) { setError(result.error); setPending(false); return; }
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Institution</Label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search universities…"
            className="pl-9"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          />
        </div>
        {results.length > 0 && !selected && (
          <div className="rounded-md border bg-popover shadow-md">
            {results.map((uni) => (
              <button
                key={uni.id}
                type="button"
                onClick={() => { setSelected(uni); setQuery(uni.name); setResults([]); }}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted"
              >
                <img src={uni.logo_url} alt={uni.name} className="h-6 w-6 rounded object-contain" />
                {uni.name}
              </button>
            ))}
          </div>
        )}
        {selected && (
          <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm">
            <img src={selected.logo_url} alt={selected.name} className="h-6 w-6 rounded object-contain" />
            <span className="flex-1">{selected.name}</span>
            <button type="button" onClick={() => { setSelected(null); setQuery(""); }} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
        )}
        {/* Hidden fallback for manual entry if not in list */}
        {!selected && query && results.length === 0 && (
          <p className="text-xs text-muted-foreground">Not found — your typed name will be saved as-is.</p>
        )}
        <input type="hidden" name="institution" value={selected?.name ?? query} />
        <input type="hidden" name="logo_url" value={selected?.logo_url ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="degree">Degree</Label>
        <Input id="degree" name="degree" placeholder="BSc Computer Science" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="gpa">GPA</Label>
        <Input id="gpa" name="gpa" placeholder="3.8 / 4.0" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="edu_start">Start year</Label>
          <Input id="edu_start" name="edu_start" placeholder="2020" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edu_end">End year</Label>
          <Input id="edu_end" name="edu_end" placeholder="2024" />
        </div>
      </div>
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Saving…" : "Continue"} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={onNext}>
        Skip for now
      </Button>
    </form>
  );
}

// ─── Step 3: Avatar ───────────────────────────────────────────────────────────
function StepAvatar({
  userId,
  username,
  onNext,
  onBack,
}: {
  userId: string;
  username: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError("File must be under 5 MB."); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }

  async function handleUpload() {
    if (!file) { onNext(); return; }
    setPending(true);
    const result = await uploadAvatar(userId, file);
    if ("error" in result) { setError(result.error); setPending(false); return; }
    await updateAvatarUrl(result.url, username);
    onNext();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-28 w-28 border-4 border-border shadow">
          <AvatarImage src={preview ?? undefined} />
          <AvatarFallback className="text-2xl bg-muted"><ImageIcon className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
        </Avatar>
        <Label
          htmlFor="avatar_file"
          className="cursor-pointer rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          {preview ? "Change photo" : "Upload photo"}
        </Label>
        <input
          id="avatar_file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground">PNG, JPG or WEBP · Max 5 MB</p>
      </div>
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button type="button" className="flex-1" disabled={pending} onClick={handleUpload}>
          {pending ? "Uploading…" : "Continue"} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={onNext}>
        Skip for now
      </Button>
    </div>
  );
}

// ─── Step 4: CV ───────────────────────────────────────────────────────────────
function StepCV({
  userId,
  username,
  onNext,
  onBack,
}: {
  userId: string;
  username: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [file, setFile] = React.useState<File | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError("File must be under 10 MB."); return; }
    setFile(f);
    setError(null);
  }

  async function handleUpload() {
    if (!file) { onNext(); return; }
    setPending(true);
    const result = await uploadCV(userId, file);
    if ("error" in result) { setError(result.error); setPending(false); return; }
    await updateCvUrl(result.url, username);
    onNext();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-dashed border-border bg-muted">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        {file ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="max-w-[200px] truncate">{file.name}</span>
            <button type="button" onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
        ) : (
          <Label
            htmlFor="cv_file"
            className="cursor-pointer rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
          >
            Upload CV / Résumé
          </Label>
        )}
        <input
          id="cv_file"
          type="file"
          accept="application/pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground">PDF, DOC or DOCX · Max 10 MB</p>
      </div>
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button type="button" className="flex-1" disabled={pending} onClick={handleUpload}>
          {pending ? "Uploading…" : "Continue"} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={onNext}>
        Skip for now
      </Button>
    </div>
  );
}

// ─── Step 5: Projects ─────────────────────────────────────────────────────────
type ProjectDraft = { name: string; description: string; status: string; url: string };

function StepProjects({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [projects, setProjects] = React.useState<ProjectDraft[]>([]);
  const [adding, setAdding] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [draft, setDraft] = React.useState<ProjectDraft>({ name: "", description: "", status: "In Progress", url: "" });

  function addDraft() {
    if (!draft.name.trim()) return;
    setProjects((p) => [...p, draft]);
    setDraft({ name: "", description: "", status: "In Progress", url: "" });
    setAdding(false);
  }

  async function handleNext() {
    setPending(true);
    for (const p of projects) {
      const fd = new FormData();
      fd.set("name", p.name);
      fd.set("description", p.description);
      fd.set("status", p.status);
      fd.set("url", p.url);
      await upsertProject(fd);
    }
    onNext();
  }

  return (
    <div className="space-y-4">
      {projects.map((p, i) => (
        <div key={i} className="rounded-md border bg-card px-4 py-3 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">{p.name}</span>
            <Badge variant={p.status === "Live" ? "default" : "secondary"} className="text-xs">{p.status}</Badge>
          </div>
          <p className="text-muted-foreground line-clamp-2">{p.description}</p>
          <button type="button" onClick={() => setProjects((prev) => prev.filter((_, j) => j !== i))} className="flex items-center gap-1 text-xs text-destructive hover:underline">
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        </div>
      ))}

      {adding ? (
        <div className="rounded-md border bg-card p-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Project name *</Label>
            <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="My Awesome App" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={2} placeholder="What does it do?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
              >
                <option>In Progress</option>
                <option>Live</option>
                <option>Archived</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>GitHub URL</Label>
              <Input value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="https://github.com/…" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAdding(false)}>Cancel</Button>
            <Button type="button" className="flex-1" onClick={addDraft} disabled={!draft.name.trim()}>Add project</Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add a project
        </Button>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button type="button" className="flex-1" disabled={pending} onClick={handleNext}>
          {pending ? "Saving…" : "Continue"} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={onNext}>
        Skip for now
      </Button>
    </div>
  );
}

// ─── Step 6: Badges ───────────────────────────────────────────────────────────
type BadgeDraft = { name: string; issuer: string; image: string; url: string; date: string };

function StepBadges({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [badges, setBadges] = React.useState<BadgeDraft[]>([]);
  const [adding, setAdding] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [draft, setDraft] = React.useState<BadgeDraft>({ name: "", issuer: "", image: "", url: "", date: "" });

  function addDraft() {
    if (!draft.name.trim()) return;
    setBadges((b) => [...b, draft]);
    setDraft({ name: "", issuer: "", image: "", url: "", date: "" });
    setAdding(false);
  }

  async function handleFinish() {
    setPending(true);
    for (const b of badges) {
      const fd = new FormData();
      Object.entries(b).forEach(([k, v]) => fd.set(k, v));
      await upsertBadge(fd);
    }
    onNext();
  }

  return (
    <div className="space-y-4">
      {badges.map((b, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm">
          {b.image && <img src={b.image} alt={b.name} className="h-10 w-10 rounded object-contain border bg-muted" />}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{b.name}</p>
            <p className="text-xs text-muted-foreground truncate">{b.issuer} · {b.date}</p>
          </div>
          <button type="button" onClick={() => setBadges((prev) => prev.filter((_, j) => j !== i))} className="text-destructive hover:text-destructive/80">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="rounded-md border bg-card p-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Badge name *</Label>
            <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="AWS Certified Developer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Issuer</Label>
              <Input value={draft.issuer} onChange={(e) => setDraft((d) => ({ ...d, issuer: e.target.value }))} placeholder="Amazon Web Services" />
            </div>
            <div className="space-y-1.5">
              <Label>Date earned</Label>
              <Input type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Badge image URL</Label>
            <Input value={draft.image} onChange={(e) => setDraft((d) => ({ ...d, image: e.target.value }))} placeholder="https://images.credly.com/…" />
          </div>
          <div className="space-y-1.5">
            <Label>Badge URL (Credly etc.)</Label>
            <Input value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="https://www.credly.com/badges/…" />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAdding(false)}>Cancel</Button>
            <Button type="button" className="flex-1" onClick={addDraft} disabled={!draft.name.trim()}>Add badge</Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add a certification / badge
        </Button>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button type="button" className="flex-1" disabled={pending} onClick={handleFinish}>
          {pending ? "Saving…" : "Finish"} <CheckCircle2 className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={onNext}>
        Skip for now
      </Button>
    </div>
  );
}

// ─── Wizard Shell ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = React.useState(0);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/auth/login"); return; }
      setUserId(user.id);
      setLoading(false);
    });
  }, []);

  function next() { setStep((s) => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  function finish() {
    if (username) router.replace(`/job-seeker/profile/${username}`);
    else router.replace("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const StepIcon = STEPS[step].icon;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="space-y-1 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <StepIcon className="h-5 w-5 text-primary" />
            {STEPS[step].label}
          </h1>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-1.5" />

        {/* Step indicators */}
        <div className="flex justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                    i < step
                      ? "border-primary bg-primary text-primary-foreground"
                      : i === step
                      ? "border-primary bg-background text-primary"
                      : "border-muted bg-background text-muted-foreground"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {step === 0 && (
            <StepBasicInfo
              onNext={({ username: u }) => { setUsername(u); next(); }}
            />
          )}
          {step === 1 && <StepEducation onNext={next} onBack={back} />}
          {step === 2 && userId && (
            <StepAvatar userId={userId} username={username} onNext={next} onBack={back} />
          )}
          {step === 3 && userId && (
            <StepCV userId={userId} username={username} onNext={next} onBack={back} />
          )}
          {step === 4 && <StepProjects onNext={next} onBack={back} />}
          {step === 5 && <StepBadges onNext={finish} onBack={back} />}
        </div>
      </div>
    </div>
  );
}