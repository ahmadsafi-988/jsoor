"use client";

// app/job-seeker/profile/[username]/edit/page.tsx
// Profile editing page — tabbed layout.
// Tabs: Profile · Projects · Badges · Account
//
// RULES:
//  - Email change: triggers Supabase confirmation to the NEW address (not instant)
//  - Password change: requires current password re-auth
//  - Username/bio/etc: instant upsert, no confirmation
//  - Avatar/CV: re-uploaded to storage, URL updated in profiles table

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


import {
  upsertProfile,
  upsertProject,
  deleteProject,
  upsertBadge,
  deleteBadge,
  updateEmail,
  updatePassword,
  updateAvatarUrl,
  updateCvUrl,
} from "@/lib/profile/actions";
import { uploadAvatar, uploadCV } from "@/lib/storage/upload";


import type { user, project, badge } from "@/lib/global_types";


import {
  User,
  Lock,
  FolderGit2,
  Award,
  ImageIcon,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Save,
  AlertTriangle,
  Check,
  Search,
} from "lucide-react";

// ─── Tab shell ────────────────────────────────────────────────────────────────
type Tab = "profile" | "projects" | "badges" | "account";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "badges", label: "Badges", icon: Award },
  { id: "account", label: "Account", icon: Lock },
];

// ─── Feedback helper ─────────────────────────────────────────────────────────
function Feedback({ state }: { state: { error?: string; message?: string } | null }) {
  if (!state) return null;
  if (state.error)
    return <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>;
  if (state.message)
    return <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">{state.message}</p>;
  return null;
}

// ─── Tab: Profile ─────────────────────────────────────────────────────────────
type University = { id: number; name: string; logo_url: string };

function TabProfile({ profile, onSaved }: { profile: user; onSaved: (u: user) => void }) {
  const supabase = createClient();
  const [pending, setPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ error?: string; message?: string } | null>(null);

  // Avatar
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(profile.avatar_url);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);

  // CV
  const [cvFile, setCvFile] = React.useState<File | null>(null);
  const [cvName, setCvName] = React.useState<string | null>(null);

  // University search
  const [query, setQuery] = React.useState(profile.institution ?? "");
  const [uniResults, setUniResults] = React.useState<University[]>([]);
  const [selectedUni, setSelectedUni] = React.useState<University | null>(
    profile.institution ? { id: 0, name: profile.institution, logo_url: profile.logo_url ?? "" } : null
  );

  React.useEffect(() => {
    if (!query.trim() || selectedUni) { setUniResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from("universities").select("id,name,logo_url").ilike("name", `%${query}%`).limit(6);
      setUniResults(data ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [query, selectedUni]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    if (selectedUni) { fd.set("institution", selectedUni.name); fd.set("logo_url", selectedUni.logo_url); }

    // Save profile fields
    const result = await upsertProfile(fd);
    if (result?.error) { setFeedback({ error: result.error }); setPending(false); return; }

    const uname = fd.get("username") as string;

    // Upload avatar if changed
    if (avatarFile) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const up = await uploadAvatar(user.id, avatarFile);
        if ("error" in up) { setFeedback({ error: up.error }); setPending(false); return; }
        await updateAvatarUrl(up.url, uname);
      }
    }

    // Upload CV if changed
    if (cvFile) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const up = await uploadCV(user.id, cvFile);
        if ("error" in up) { setFeedback({ error: up.error }); setPending(false); return; }
        await updateCvUrl(up.url, uname);
      }
    }

    setFeedback({ message: "Profile saved successfully." });
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="space-y-2">
        <Label>Profile photo</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarImage src={avatarPreview ?? undefined} />
            <AvatarFallback><ImageIcon className="h-7 w-7 text-muted-foreground" /></AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <Label
              htmlFor="avatar_edit"
              className="cursor-pointer rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
            >
              Change photo
            </Label>
            <input
              id="avatar_edit"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setAvatarFile(f);
                setAvatarPreview(URL.createObjectURL(f));
              }}
            />
            <p className="text-xs text-muted-foreground">PNG, JPG or WEBP · Max 5 MB</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Basic fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" name="first_name" defaultValue={profile.first_name} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" name="last_name" defaultValue={profile.last_name} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <div className="flex items-center">
          <span className="flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">@</span>
          <Input id="username" name="username" defaultValue={profile.username ?? ""} required className="rounded-l-none" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={profile.bio} rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" defaultValue={profile.location ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" defaultValue={profile.website ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="github">GitHub</Label>
          <Input id="github" name="github" defaultValue={profile.github ?? ""} />
        </div>
      </div>

      <Separator />

      {/* Education */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Education</h3>
        <div className="space-y-1.5">
          <Label>Institution</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedUni(null); }}
              placeholder="Search universities…"
            />
          </div>
          {uniResults.length > 0 && !selectedUni && (
            <div className="rounded-md border bg-popover shadow-md">
              {uniResults.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { setSelectedUni(u); setQuery(u.name); setUniResults([]); }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted"
                >
                  <img src={u.logo_url} alt={u.name} className="h-6 w-6 rounded object-contain" />
                  {u.name}
                </button>
              ))}
            </div>
          )}
          <input type="hidden" name="institution" value={selectedUni?.name ?? query} />
          <input type="hidden" name="logo_url" value={selectedUni?.logo_url ?? profile.logo_url ?? ""} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="degree">Degree</Label>
          <Input id="degree" name="degree" defaultValue={profile.degree ?? ""} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="gpa">GPA</Label>
            <Input id="gpa" name="gpa" defaultValue={profile.gpa ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edu_start">Start</Label>
            <Input id="edu_start" name="edu_start" type="date" defaultValue={profile.edu_start ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edu_end">End</Label>
            <Input id="edu_end" name="edu_end" type="date" defaultValue={profile.edu_end ?? ""} />
          </div>
        </div>
      </div>

      <Separator />

      {/* CV */}
      <div className="space-y-2">
        <Label>CV / Résumé</Label>
        <div className="flex items-center gap-3">
          {profile.cv_url && !cvFile && (
            <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
              <FileText className="h-4 w-4" /> Current CV
            </a>
          )}
          {cvFile && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" /> {cvFile.name}
            </span>
          )}
          <Label
            htmlFor="cv_edit"
            className="cursor-pointer rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            {profile.cv_url ? "Replace CV" : "Upload CV"}
          </Label>
          <input
            id="cv_edit"
            type="file"
            accept="application/pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setCvFile(f); setCvName(f.name); }
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">PDF, DOC or DOCX · Max 10 MB. Stored privately — only accessible via a secure link.</p>
      </div>

      <Feedback state={feedback} />

      <Button type="submit" disabled={pending}>
        <Save className="mr-1.5 h-4 w-4" />
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

// ─── ProjectForm (hoisted — defining inside TabProjects caused remount on every keystroke) ──
type ProjectDraft = { name: string; description: string; status: string; url: string };

function ProjectForm({
  src,
  onChange,
  onSave,
  onCancel,
}: {
  src: ProjectDraft;
  onChange: (k: string, v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-md border bg-card p-4 space-y-3">
      <div className="space-y-1.5">
        <Label>Name *</Label>
        <Input value={src.name} onChange={(e) => onChange("name", e.target.value)} placeholder="My Project" />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={src.description} onChange={(e) => onChange("description", e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={src.status}
            onChange={(e) => onChange("status", e.target.value)}
          >
            <option>In Progress</option>
            <option>Live</option>
            <option>Archived</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>GitHub URL</Label>
          <Input value={src.url} onChange={(e) => onChange("url", e.target.value)} placeholder="https://github.com/…" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="button" className="flex-1" onClick={onSave} disabled={!src.name.trim()}>
          <Save className="mr-1.5 h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  );
}

// ─── Tab: Projects ────────────────────────────────────────────
function TabProjects({ projects, onProjectsChange }: {
  projects: project[];
  onProjectsChange: (p: project[]) => void;
}) {
  const [editing, setEditing] = React.useState<project | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ error?: string; message?: string } | null>(null);

  const blank: ProjectDraft = { name: "", description: "", status: "In Progress", url: "" };
  const [draft, setDraft] = React.useState<ProjectDraft>(blank);

  async function handleSave(isNew: boolean) {
    const fd = new FormData();
    const src = isNew ? draft : editing!;
    if (!isNew && editing?.id) fd.set("id", String(editing.id));
    fd.set("name", src.name);
    fd.set("description", src.description);
    fd.set("status", src.status);
    fd.set("url", src.url);
    const result = await upsertProject(fd);
    if (result?.error) { setFeedback({ error: result.error }); return; }
    setFeedback({ message: isNew ? "Project added." : "Project updated." });
    setAdding(false);
    setEditing(null);
    // Refresh list from server is handled by revalidatePath; re-fetch locally:
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("projects").select("*").eq("user_id", user.id);
      onProjectsChange(data ?? []);
    }
  }

  async function handleDelete(id: number) {
    const result = await deleteProject(id);
    if (result?.error) { setFeedback({ error: result.error }); return; }
    onProjectsChange(projects.filter((x) => x.id !== id));
    setFeedback({ message: "Project deleted." });
  }

  return (
    <div className="space-y-4">
      <Feedback state={feedback} />
      {projects.map((p) =>
        editing?.id === p.id ? (
          <ProjectForm
            key={p.id}
            src={editing}
            onChange={(k, v) => setEditing((e) => e ? { ...e, [k]: v } : e)}
            onSave={() => handleSave(false)}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div key={p.id} className="rounded-md border bg-card px-4 py-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{p.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant={p.status === "Live" ? "default" : "secondary"} className="text-xs">{p.status}</Badge>
                <button type="button" onClick={() => { setEditing(p); setAdding(false); }} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
          </div>
        )
      )}
      {adding ? (
        <ProjectForm
          src={draft}
          onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
          onSave={() => handleSave(true)}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => { setAdding(true); setEditing(null); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add project
        </Button>
      )}
    </div>
  );
}

// ─── BadgeForm (hoisted — defining inside TabBadges caused remount on every keystroke) ──
type BadgeDraft = { name: string; issuer: string; image: string; url: string; date: string };

function BadgeForm({
  src,
  onChange,
  onSave,
  onCancel,
}: {
  src: BadgeDraft;
  onChange: (k: string, v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-md border bg-card p-4 space-y-3">
      <div className="space-y-1.5">
        <Label>Badge name *</Label>
        <Input value={src.name} onChange={(e) => onChange("name", e.target.value)} placeholder="AWS Certified Developer" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Issuer</Label>
          <Input value={src.issuer} onChange={(e) => onChange("issuer", e.target.value)} placeholder="Amazon Web Services" />
        </div>
        <div className="space-y-1.5">
          <Label>Date earned</Label>
          <Input type="date" value={src.date} onChange={(e) => onChange("date", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Image URL</Label>
        <Input value={src.image} onChange={(e) => onChange("image", e.target.value)} placeholder="https://images.credly.com/…" />
      </div>
      <div className="space-y-1.5">
        <Label>Badge URL</Label>
        <Input value={src.url} onChange={(e) => onChange("url", e.target.value)} placeholder="https://www.credly.com/badges/…" />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="button" className="flex-1" onClick={onSave} disabled={!src.name.trim()}>
          <Save className="mr-1.5 h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  );
}

// ─── Tab: Badges ─────────────────────────────────────────────
function TabBadges({ badges, onBadgesChange }: {
  badges: badge[];
  onBadgesChange: (b: badge[]) => void;
}) {
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<badge | null>(null);
  const [feedback, setFeedback] = React.useState<{ error?: string; message?: string } | null>(null);
  const blank: BadgeDraft = { name: "", issuer: "", image: "", url: "", date: "" };
  const [draft, setDraft] = React.useState<BadgeDraft>(blank);

  async function refreshBadges() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("badges").select("*").eq("user_id", user.id);
      onBadgesChange(data ?? []);
    }
  }

  async function handleSave(isNew: boolean) {
    const fd = new FormData();
    const src = isNew ? draft : editing!;
    if (!isNew && editing?.id) fd.set("id", String(editing.id));
    Object.entries(src).forEach(([k, v]) => { if (k !== "id" && k !== "user_id" && k !== "created_at") fd.set(k, String(v)); });
    const result = await upsertBadge(fd);
    if (result?.error) { setFeedback({ error: result.error }); return; }
    setFeedback({ message: isNew ? "Badge added." : "Badge updated." });
    setAdding(false);
    setEditing(null);
    refreshBadges();
  }

  async function handleDelete(id: number) {
    const result = await deleteBadge(id);
    if (result?.error) { setFeedback({ error: result.error }); return; }
    onBadgesChange(badges.filter((x) => x.id !== id));
    setFeedback({ message: "Badge removed." });
  }

  return (
    <div className="space-y-4">
      <Feedback state={feedback} />
      {badges.map((b) =>
        editing?.id === b.id ? (
          <BadgeForm
            key={b.id}
            src={editing}
            onChange={(k, v) => setEditing((e) => e ? { ...e, [k]: v } : e)}
            onSave={() => handleSave(false)}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div key={b.id} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2.5">
            {b.image && <img src={b.image} alt={b.name} className="h-10 w-10 rounded object-contain border bg-muted shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{b.name}</p>
              <p className="text-xs text-muted-foreground truncate">{b.issuer} · {b.date}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => { setEditing(b); setAdding(false); }} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
              <button type="button" onClick={() => handleDelete(b.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        )
      )}
      {adding ? (
        <BadgeForm
          src={draft}
          onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
          onSave={() => handleSave(true)}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => { setAdding(true); setEditing(null); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add badge
        </Button>
      )}
    </div>
  );
}

// ─── Tab: Account ─────────────────────────────────────────────────────────────
function TabAccount({ currentEmail }: { currentEmail: string }) {
  const [emailFeedback, setEmailFeedback] = React.useState<{ error?: string; message?: string } | null>(null);
  const [passwordFeedback, setPasswordFeedback] = React.useState<{ error?: string; message?: string } | null>(null);
  const [emailPending, setEmailPending] = React.useState(false);
  const [passwordPending, setPasswordPending] = React.useState(false);

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailPending(true);
    setEmailFeedback(null);
    const result = await updateEmail(new FormData(e.currentTarget));
    setEmailFeedback(result ?? null);
    setEmailPending(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("newPassword") !== fd.get("confirmPassword")) {
      setPasswordFeedback({ error: "New passwords do not match." });
      return;
    }
    if ((fd.get("newPassword") as string).length < 8) {
      setPasswordFeedback({ error: "Password must be at least 8 characters." });
      return;
    }
    setPasswordPending(true);
    setPasswordFeedback(null);
    const result = await updatePassword(fd);
    setPasswordFeedback(result ?? null);
    setPasswordPending(false);
  }

  return (
    <div className="space-y-8">
      {/* Email */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Email address</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Current: <span className="font-medium text-foreground">{currentEmail}</span>
          </p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3 flex items-start gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-800 dark:text-amber-300">
            Changing your email requires confirmation. A verification link will be sent to your <strong>new</strong> address — your email won't change until you click it.
          </p>
        </div>
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">New email address</Label>
            <Input id="email" name="email" type="email" placeholder="new@example.com" required />
          </div>
          <Feedback state={emailFeedback} />
          <Button type="submit" variant="outline" disabled={emailPending}>
            {emailPending ? "Sending…" : "Send confirmation email"}
          </Button>
        </form>
      </div>

      <Separator />

      {/* Password */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Change password</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            You'll need to enter your current password to confirm.
          </p>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" name="newPassword" type="password" required placeholder="At least 8 characters" autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
          </div>
          <Feedback state={passwordFeedback} />
          <Button type="submit" variant="outline" disabled={passwordPending}>
            {passwordPending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EditProfilePage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [activeTab, setActiveTab] = React.useState<Tab>("profile");
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<user | null>(null);
  const [projects, setProjects] = React.useState<project[]>([]);
  const [badges, setBadges] = React.useState<badge[]>([]);
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }

      // Only the profile owner can access this page
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", params.username as string)
        .single();

      if (!prof || prof.id !== user.id) { router.replace("/"); return; }

      const [{ data: projs }, { data: bdgs }] = await Promise.all([
        supabase.from("projects").select("*").eq("user_id", user.id),
        supabase.from("badges").select("*").eq("user_id", user.id),
      ]);

      setProfile(prof);
      setProjects(projs ?? []);
      setBadges(bdgs ?? []);
      setEmail(user.email ?? "");
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your public profile and account settings
          </p>
        </div>
        <Button variant="outline" asChild>
            <Link href={`/job-seeker/profile/${profile.username}`}>
                View profile
            </Link>
        </Button>
      </div>

      {/* Tab nav */}
      <div className="flex border-b gap-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "profile" && <TabProfile profile={profile} onSaved={setProfile} />}
        {activeTab === "projects" && <TabProjects projects={projects} onProjectsChange={setProjects} />}
        {activeTab === "badges" && <TabBadges badges={badges} onBadgesChange={setBadges} />}
        {activeTab === "account" && <TabAccount currentEmail={email} />}
      </div>
    </div>
  );
}