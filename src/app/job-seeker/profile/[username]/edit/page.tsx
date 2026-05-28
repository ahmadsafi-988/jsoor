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
  fetchBadgeMetadata,
  updateEmail,
  updatePassword,
  updateAvatarUrl,
  updateCvUrl,
  addProfileSkill,
  removeProfileSkill,
} from "@/lib/profile/actions";
import { uploadAvatar, uploadCV } from "@/lib/storage/upload";
import type { user, project, badge, ProjectSkill } from "@/lib/global_types";


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
  Wrench,
  XCircle, 
  CheckCircle2, 
  PlusCircle, 
  Loader2, 
} from "lucide-react";

// ─── Tab shell ────────────────────────────────────────────────────────────────
type Tab = "profile" | "projects" | "badges" | "account" | "skills"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "badges", label: "Badges", icon: Award },
  { id: "account", label: "Account", icon: Lock },
];

const HASH_TARGETS: Record<string, Tab> = {
  profile: "profile",
  bio: "profile",
  education: "profile",
  cv: "profile",
  projects: "projects",
  badges: "badges",
  account: "account",
  skills: "skills",
};

function targetFromHash() {
  const id = window.location.hash.replace("#", "").toLowerCase();
  if (!id) return null;

  const tab = HASH_TARGETS[id];
  return tab ? { id, tab } : null;
}

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
    profile.institution ? { id: 0, name: profile.institution, logo_url: "" } : null
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
    <form id="profile" onSubmit={handleSubmit} className="space-y-6 scroll-mt-24">
      {/* Avatar */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-[#1c1b1b]">Profile photo</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-[#f6f3f2] shadow-sm">
            <AvatarImage src={avatarPreview ?? undefined} />
            <AvatarFallback className="bg-[#e5e2e1]"><ImageIcon className="h-7 w-7 text-[#5f5e5e]" /></AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <Label
              htmlFor="avatar_edit"
              className="cursor-pointer rounded-lg border border-[#e5e2e1] bg-white px-3 py-1.5 text-sm text-[#3d4a41] hover:bg-[#f6f3f2] transition-colors"
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

      <Separator className="bg-[#e5e2e1]" />

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
          <span className="flex h-10 items-center rounded-l-lg border border-r-0 border-[#e5e2e1] bg-[#f6f3f2] px-3 text-sm text-[#5f5e5e]">@</span>
          <Input id="username" name="username" defaultValue={profile.username ?? ""} required className="rounded-l-none" />
        </div>
      </div>

      <div id="bio" className="space-y-1.5 scroll-mt-36">
        <Label htmlFor="bio_input">Bio</Label>
        <Textarea id="bio_input" name="bio" defaultValue={profile.bio} rows={3} />
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
          <Input id="github" name="github" defaultValue={profile.github ?? ""} placeholder="https://github.com/username" />
        </div>
      </div>

      <Separator className="bg-[#e5e2e1]" />

      {/* Education */}
      <div id="education" className="space-y-3 scroll-mt-24">
        <h3 className="text-sm font-semibold text-[#1c1b1b]">Education</h3>
        <div className="space-y-1.5">
          <Label>Institution</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5f5e5e]" />
            <Input
              className="pl-9"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedUni(null); }}
              placeholder="Search universities…"
            />
          </div>
          {uniResults.length > 0 && !selectedUni && (
            <div className="rounded-xl border border-[#e5e2e1] bg-white shadow-sm overflow-hidden">
              {uniResults.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { setSelectedUni(u); setQuery(u.name); setUniResults([]); }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[#3d4a41] hover:bg-[#f6f3f2]"
                >
                  <img src={u.logo_url} alt={u.name} className="h-6 w-6 rounded object-contain" />
                  {u.name}
                </button>
              ))}
            </div>
          )}
          <input type="hidden" name="institution" value={selectedUni?.name ?? query} />
          <input type="hidden" name="logo_url" value={selectedUni?.logo_url ?? ""} />
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

      <Separator className="bg-[#e5e2e1]" />

      {/* CV */}
      <div id="cv" className="space-y-2 scroll-mt-24">
        <Label>CV / Résumé</Label>
        <div className="flex items-center gap-3">
          {profile.cv_url && !cvFile && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" /> CV uploaded
            </span>
          )}
          {cvFile && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" /> {cvFile.name}
            </span>
          )}
          <Label
            htmlFor="cv_edit"
            className="cursor-pointer rounded-lg border border-[#e5e2e1] bg-white px-3 py-1.5 text-sm text-[#3d4a41] hover:bg-[#f6f3f2] transition-colors"
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

      <Button type="submit" disabled={pending} className="bg-[#006d43] text-white hover:bg-[#005232]">
        <Save className="mr-1.5 h-4 w-4" />
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

// ─── ProjectForm (hoisted — defining inside TabProjects caused remount on every keystroke) ──
type ProjectDraft = {
  name: string;
  description: string;
  status: string;
  url: string;
  skillEntries: ProjectSkill[];
};

function ProjectForm({
  src,
  availableSkills,
  onChange,
  onSave,
  onCancel,
}: {
  src: ProjectDraft;
  availableSkills: ProjectSkill[];
  onChange: (k: string, v: string | ProjectSkill[]) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [skillQuery, setSkillQuery] = React.useState("");
  const selectedSkillIds = new Set(src.skillEntries.map((skill) => skill.id));
  const filteredSkills = availableSkills.filter((skill) =>
    skill.name.toLowerCase().includes(skillQuery.trim().toLowerCase())
  );

  function addSkill(skill: ProjectSkill) {
    if (selectedSkillIds.has(skill.id)) return;
    onChange("skillEntries", [...src.skillEntries, skill]);
  }

  function removeSkill(skillId: number) {
    onChange("skillEntries", src.skillEntries.filter((skill) => skill.id !== skillId));
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] p-4">
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
            className="flex h-10 w-full rounded-lg border border-[#e5e2e1] bg-white px-3 py-2 text-sm text-[#1c1b1b]"
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
      <div className="space-y-2">
        <Label>Skills used</Label>
        <div className="flex min-h-9 flex-wrap items-center gap-2">
          {src.skillEntries.length === 0 ? (
            <p className="text-xs italic text-[#5f5e5e]">No project skills selected yet.</p>
          ) : (
            src.skillEntries.map((skill) => (
              <Badge
                key={skill.id}
                variant="secondary"
                className="gap-1.5 rounded-full border border-[#78fbb6]/40 bg-[#f0f9f5] px-3 py-1 text-xs text-[#005232]"
              >
                <span>{skill.name}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill.id)}
                  className="text-[#5f5e5e] hover:text-destructive"
                  aria-label={`Remove ${skill.name}`}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f5e5e]" />
          <Input
            className="pl-9"
            value={skillQuery}
            onChange={(event) => setSkillQuery(event.target.value)}
            placeholder="Search skills for this project..."
          />
        </div>
        <div className="max-h-40 overflow-y-auto rounded-xl border border-[#e5e2e1] bg-white p-1.5">
          {filteredSkills.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-[#5f5e5e]">No matching skills found.</p>
          ) : (
            filteredSkills.map((skill) => {
              const isSelected = selectedSkillIds.has(skill.id);
              return (
                <button
                  key={skill.id}
                  type="button"
                  disabled={isSelected}
                  onClick={() => addSkill(skill)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#1c1b1b] transition-colors hover:bg-[#f6f3f2] disabled:cursor-default disabled:text-[#5f5e5e] disabled:opacity-60"
                >
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <PlusCircle className="h-4 w-4 text-[#5f5e5e]" />
                  )}
                  {skill.name}
                </button>
              );
            })
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1 border-[#e5e2e1] bg-white text-[#3d4a41] hover:bg-[#e5e2e1]" onClick={onCancel}>Cancel</Button>
        <Button type="button" className="flex-1 bg-[#006d43] text-white hover:bg-[#005232]" onClick={onSave} disabled={!src.name.trim()}>
          <Save className="mr-1.5 h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  );
}

// ─── Tab: Projects ────────────────────────────────────────────
type ProjectWithSkillRelation = project & {
  project_to_skills?: Array<{ skill: ProjectSkill | null }>;
};

function normalizeProjectRows(rows: ProjectWithSkillRelation[] = []): project[] {
  return rows.map(({ project_to_skills, ...projectRow }) => {
    const skillEntries = (project_to_skills ?? [])
      .map((row) => row.skill)
      .filter((skill): skill is ProjectSkill => Boolean(skill));

    return {
      ...projectRow,
      skillEntries,
      skills: skillEntries.map((skill) => skill.name),
    };
  });
}

function TabProjects({ projects, onProjectsChange, username }: {
  projects: project[];
  onProjectsChange: (p: project[]) => void;
  username: string;
}) {
  const [editing, setEditing] = React.useState<project | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ error?: string; message?: string } | null>(null);
  const [availableSkills, setAvailableSkills] = React.useState<ProjectSkill[]>([]);

  const blank: ProjectDraft = { name: "", description: "", status: "In Progress", url: "", skillEntries: [] };
  const [draft, setDraft] = React.useState<ProjectDraft>(blank);

  React.useEffect(() => {
    async function loadSkills() {
      const supabase = createClient();
      const { data } = await supabase.from("skills").select("id, name").order("name", { ascending: true });
      setAvailableSkills(data ?? []);
    }

    loadSkills();
  }, []);

  async function refreshProjects() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("projects")
      .select("*, project_to_skills(skill:skills(id, name))")
      .eq("user_id", user.id);

    onProjectsChange(normalizeProjectRows((data ?? []) as ProjectWithSkillRelation[]));
  }

  async function handleSave(isNew: boolean) {
    const fd = new FormData();
    const src = isNew ? draft : editing!;
    if (!isNew && editing?.id) fd.set("id", String(editing.id));
    fd.set("name", src.name);
    fd.set("description", src.description);
    fd.set("status", src.status);
    fd.set("url", src.url);
    (src.skillEntries ?? []).forEach((skill) => fd.append("skill_ids", String(skill.id)));
    const result = await upsertProject(fd, username);
    if (result?.error) { setFeedback({ error: result.error }); return; }
    setFeedback({ message: isNew ? "Project added." : "Project updated." });
    setAdding(false);
    setEditing(null);
    if (isNew) setDraft(blank);
    await refreshProjects();
  }

  async function handleDelete(id: number) {
    const result = await deleteProject(id, username);
    if (result?.error) { setFeedback({ error: result.error }); return; }
    onProjectsChange(projects.filter((x) => x.id !== id));
    setFeedback({ message: "Project deleted." });
  }

  return (
    <div id="projects" className="space-y-4 scroll-mt-24">
      <Feedback state={feedback} />
      {projects.map((p) =>
        editing?.id === p.id ? (
          <ProjectForm
            key={p.id}
            src={{ ...editing, skillEntries: editing.skillEntries ?? [] }}
            availableSkills={availableSkills}
            onChange={(k, v) => setEditing((e) => e ? { ...e, [k]: v } : e)}
            onSave={() => handleSave(false)}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div key={p.id} className="space-y-1 rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#1c1b1b]">{p.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant={p.status === "Live" ? "default" : "secondary"} className="text-xs">{p.status}</Badge>
                <button type="button" onClick={() => { setEditing(p); setAdding(false); }} className="text-[#5f5e5e] hover:text-[#006d43]"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="line-clamp-2 text-sm text-[#5f5e5e]">{p.description}</p>
            {p.skillEntries && p.skillEntries.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {p.skillEntries.map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded-full border border-[#78fbb6]/40 bg-white px-2.5 py-1 text-[11px] font-medium text-[#005232]"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      )}
      {adding ? (
        <ProjectForm
          src={draft}
          availableSkills={availableSkills}
          onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
          onSave={() => handleSave(true)}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button type="button" variant="outline" className="w-full border-[#e5e2e1] bg-white text-[#3d4a41] hover:bg-[#f6f3f2] hover:text-[#006d43]" onClick={() => { setAdding(true); setEditing(null); }}>
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
  const [detailsOpen, setDetailsOpen] = React.useState(Boolean(src.name || src.issuer || src.image || src.date));
  const [lookupPending, setLookupPending] = React.useState(false);
  const [lookupError, setLookupError] = React.useState<string | null>(null);

  async function handleFetchDetails() {
    if (!src.url.trim()) return;

    setLookupPending(true);
    setLookupError(null);
    const result = await fetchBadgeMetadata(src.url);
    setLookupPending(false);

    if ("error" in result) {
      setLookupError(result.error);
      setDetailsOpen(true);
      return;
    }

    Object.entries(result.badge).forEach(([key, value]) => onChange(key, value));
    setDetailsOpen(true);
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] p-4">
      <div className="space-y-1.5">
        <Label>Public badge link *</Label>
        <Input value={src.url} onChange={(e) => onChange("url", e.target.value)} placeholder="https://www.credly.com/badges/..." />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="border-[#e5e2e1] bg-white text-[#3d4a41] hover:bg-[#e5e2e1]"
          onClick={handleFetchDetails}
          disabled={!src.url.trim() || lookupPending}
        >
          {lookupPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Fetch details
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-[#3d4a41] hover:bg-[#e5e2e1]"
          onClick={() => setDetailsOpen((value) => !value)}
        >
          {detailsOpen ? "Hide details" : "Edit details"}
        </Button>
      </div>
      {lookupError && <p className="text-xs text-destructive">{lookupError}</p>}
      {detailsOpen && (
        <div className="space-y-3 rounded-xl border border-[#e5e2e1] bg-white p-3">
          <div className="space-y-1.5">
            <Label>Badge name</Label>
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
        </div>
      )}
      {(src.name || src.issuer || src.image) && !detailsOpen && (
        <div className="flex items-center gap-3 rounded-xl border border-[#e5e2e1] bg-white px-3 py-2">
          {src.image && <img src={src.image} alt={src.name || "Badge"} className="h-10 w-10 shrink-0 rounded-lg border border-[#e5e2e1] bg-white object-contain" />}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#1c1b1b]">{src.name || "Badge"}</p>
            <p className="truncate text-xs text-[#5f5e5e]">{src.issuer}</p>
          </div>
        </div>
      )}
      <div className="space-y-1.5 hidden">
        <Label>Badge URL</Label>
        <Input value={src.url} onChange={(e) => onChange("url", e.target.value)} placeholder="https://www.credly.com/badges/…" />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1 border-[#e5e2e1] bg-white text-[#3d4a41] hover:bg-[#e5e2e1]" onClick={onCancel}>Cancel</Button>
        <Button type="button" className="flex-1 bg-[#006d43] text-white hover:bg-[#005232]" onClick={onSave} disabled={!src.url.trim()}>
          <Save className="mr-1.5 h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  );
}

// ─── Tab: Badges ─────────────────────────────────────────────
function TabBadges({ badges, onBadgesChange, username }: {
  badges: badge[];
  onBadgesChange: (b: badge[]) => void;
  username: string;
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
    const result = await upsertBadge(fd, username);
    if (result?.error) { setFeedback({ error: result.error }); return; }
    setFeedback({ message: isNew ? "Badge added." : "Badge updated." });
    setAdding(false);
    setEditing(null);
    if (isNew) setDraft(blank);
    await refreshBadges();
  }

  async function handleDelete(id: number) {
    const result = await deleteBadge(id, username);
    if (result?.error) { setFeedback({ error: result.error }); return; }
    onBadgesChange(badges.filter((x) => x.id !== id));
    setFeedback({ message: "Badge removed." });
  }

  return (
    <div id="badges" className="space-y-4 scroll-mt-24">
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
          <div key={b.id} className="flex items-center gap-3 rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2.5">
            {b.image && <img src={b.image} alt={b.name} className="h-10 w-10 shrink-0 rounded-lg border border-[#e5e2e1] bg-white object-contain" />}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[#1c1b1b]">{b.name}</p>
              <p className="text-xs text-muted-foreground truncate">{b.issuer} · {b.date}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => { setEditing(b); setAdding(false); }} className="text-[#5f5e5e] hover:text-[#006d43]"><Pencil className="h-4 w-4" /></button>
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
        <Button type="button" variant="outline" className="w-full border-[#e5e2e1] bg-white text-[#3d4a41] hover:bg-[#f6f3f2] hover:text-[#006d43]" onClick={() => { setAdding(true); setEditing(null); }}>
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
    <div id="account" className="space-y-8 scroll-mt-24">
      {/* Email */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Email address</h3>
          <p className="mt-0.5 text-xs text-[#5f5e5e]">
            Current: <span className="font-medium text-[#1c1b1b]">{currentEmail}</span>
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-amber-800">
            Changing your email requires confirmation. A verification link will be sent to your <strong>new</strong> address — your email won&apos;t change until you click it.
          </p>
        </div>
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">New email address</Label>
            <Input id="email" name="email" type="email" placeholder="new@example.com" required />
          </div>
          <Feedback state={emailFeedback} />
          <Button type="submit" variant="outline" disabled={emailPending} className="border-[#e5e2e1] bg-white text-[#3d4a41] hover:bg-[#f6f3f2] hover:text-[#006d43]">
            {emailPending ? "Sending…" : "Send confirmation email"}
          </Button>
        </form>
      </div>

      <Separator className="bg-[#e5e2e1]" />

      {/* Password */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Change password</h3>
          <p className="mt-0.5 text-xs text-[#5f5e5e]">
            You&apos;ll need to enter your current password to confirm.
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
          <Button type="submit" variant="outline" disabled={passwordPending} className="border-[#e5e2e1] bg-white text-[#3d4a41] hover:bg-[#f6f3f2] hover:text-[#006d43]">
            {passwordPending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}


// ─── Tab: skills ─────────────────────────────────────────────────────────────
type SkillEntry = { skill_id: number; skills: { id: number; name: string } }


function TabSkills({ profileSkills: initial = [], username }: { profileSkills: SkillEntry[]; username: string }) {
  const supabase = createClient();
  const [profileSkills, setProfileSkills] = React.useState<SkillEntry[]>(initial);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<{ id: number; name: string }[]>([]);
  const [feedback, setFeedback] = React.useState<{ error?: string; message?: string } | null>(null);
  const [isPending, setIsPending] = React.useState<number | null>(null);



  React.useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // Fetch results - Limit removed to show "all", scroll handles the UI
  React.useEffect(() => {
    const t = setTimeout(async () => {
      // Removed .limit(10) to show all skills
      let queryBuilder = supabase.from("skills").select("id, name").order('name', { ascending: true });
      
      if (query.trim()) {
        queryBuilder = queryBuilder.ilike("name", `%${query}%`);
      }
      const { data } = await queryBuilder;
      setResults(data ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [query, supabase]);

  async function handleAdd(skill: { id: number; name: string }) {
    if (profileSkills.some(s => s.skill_id === skill.id)) return;

    const optimisticEntry = { skill_id: skill.id, skills: skill };
    setProfileSkills(prev => [...prev, optimisticEntry]);
    setIsPending(skill.id);

    const result = await addProfileSkill(skill.id, username);
    if (result?.error) {
      setProfileSkills(prev => prev.filter(s => s.skill_id !== skill.id));
      setFeedback({ error: result.error });
    } else {
      setFeedback({ message: `Added ${skill.name}` });
    }
    setIsPending(null);
  }

  async function handleRemove(skillId: number) {
    const previousSkills = [...profileSkills];
    setProfileSkills(prev => prev.filter(s => s.skill_id !== skillId));
    const result = await removeProfileSkill(skillId, username);
    if (result?.error) {
      setProfileSkills(previousSkills);
      setFeedback({ error: result.error });
    }
  }

  return (
    <div id="skills" className="relative min-h-[500px] space-y-6 pb-20 scroll-mt-24">
      {/* 1. Selected Skills Area */}
<div className="mb-2 flex min-h-[2.25rem] flex-wrap items-center gap-3">
  {profileSkills.length === 0 && (
    <p className="py-1 text-sm italic text-[#5f5e5e]">No skills selected yet.</p>
  )}
  {profileSkills.map((s) => (
    <Badge 
      key={s.skill_id} 
      variant="secondary" 
      className="gap-2 rounded-full border border-[#78fbb6]/40 bg-[#f0f9f5] px-4 py-1.5 text-sm text-[#005232] transition-colors hover:bg-[#e5f7ee]"
    >
      <span className="font-semibold">{s.skills?.name}</span>
      <button
        type="button"
        onClick={() => handleRemove(s.skill_id)}
        className="ml-1 text-[#5f5e5e] transition-colors hover:text-destructive"
      >
        <XCircle className="h-4 w-4" /> 
      </button>
    </Badge>
  ))}
</div>

      <Separator className="bg-[#e5e2e1]" />

      {/* 2. Search & Scrollable List Area */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <Label className="text-lg font-bold tracking-tight text-[#1c1b1b]">Skills & Expertise</Label>
          <p className="text-xs text-[#5f5e5e]">Select from the list or search for specific skills.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5f5e5e]" />
          <Input
            className="h-12 pl-11 text-base shadow-sm focus-visible:ring-[#006d43]"
            placeholder="Search skills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* 3. SCROLLABLE Result List */}
        <div className="overflow-hidden rounded-xl border border-[#e5e2e1] bg-[#f6f3f2]">
          <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border">
            {results.length === 0 && query && (
               <p className="py-10 text-center text-sm text-[#5f5e5e]">No matching skills found.</p>
            )}
            <div className="grid grid-cols-1 gap-1">
              {results.map((s) => {
                const isAdded = profileSkills.some(p => p.skill_id === s.id);
                return (
                  <button
                    key={s.id}
                    disabled={isAdded || isPending === s.id}
                    onClick={() => handleAdd(s)}
                    className="group flex items-center justify-between rounded-lg border border-transparent px-4 py-3 text-sm font-medium text-[#1c1b1b] transition-all hover:border-[#e5e2e1] hover:bg-white hover:shadow-sm disabled:cursor-default disabled:opacity-50"
                  >
                    <span className="flex items-center gap-3">
                      {isAdded ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <PlusCircle className="h-5 w-5 text-[#5f5e5e] transition-colors group-hover:text-[#006d43]" />
                      )}
                      {s.name}
                    </span>
                    {isPending === s.id && (
                       <Loader2 className="h-4 w-4 animate-spin text-[#006d43]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Feedback Dock */}
      <div className="absolute bottom-0 left-0 w-full h-16 flex items-center justify-center pointer-events-none">
        {feedback && (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-300 w-full px-4">
             <Feedback state={feedback} />
          </div>
        )}
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
  const [profileSkills, setProfileSkills] = React.useState<SkillEntry[]>([])
  const [pendingTarget, setPendingTarget] = React.useState<string | null>(null);

  React.useEffect(() => {
    function applyHashTarget() {
      const target = targetFromHash();
      if (!target) return;

      setActiveTab(target.tab);
      setPendingTarget(target.id);
    }

    applyHashTarget();
    window.addEventListener("hashchange", applyHashTarget);
    return () => window.removeEventListener("hashchange", applyHashTarget);
  }, []);

  React.useEffect(() => {
    if (loading || !pendingTarget) return;

    const timer = window.setTimeout(() => {
      const element = document.getElementById(pendingTarget);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });

      const focusableSelector = "textarea, input:not([type='file']):not([type='hidden']), button, select";

      if (element instanceof HTMLElement && element.matches(focusableSelector)) {
        element.focus({ preventScroll: true });
      } else {
        const focusTarget = element?.querySelector<HTMLElement>(focusableSelector);
        focusTarget?.focus({ preventScroll: true });
      }

      setPendingTarget(null);
    }, 50);

    return () => window.clearTimeout(timer);
  }, [activeTab, loading, pendingTarget]);
  
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

      if (!prof || prof.id !== user.id) { router.replace(`/job-seeker/profile/${params.username}`); return; }

      const [{ data: jsProf }, { data: projs }, { data: bdgs }, { data: profSkills }] = await Promise.all([
        supabase.from("job_seeker_profiles").select("*").eq("id", user.id).single(),
        supabase.from("projects").select("*, project_to_skills(skill:skills(id, name))").eq("user_id", user.id),
        supabase.from("badges").select("*").eq("user_id", user.id),
        supabase.from("profile_to_skills").select("skill_id, skills(id, name)").eq("user_id", user.id),
      ]);

      setProfile({
        ...prof,
        bio:         jsProf?.bio         ?? "",
        cv_url:      jsProf?.cv_url       ?? null,
        degree:      jsProf?.degree       ?? null,
        edu_end:     jsProf?.edu_end      ?? null,
        edu_start:   jsProf?.edu_start    ?? null,
        github:      jsProf?.github       ?? null,
        gpa:         jsProf?.gpa          ?? null,
        institution: jsProf?.institution  ?? null,
        location:    jsProf?.location     ?? null,
        website:     jsProf?.website      ?? null,
      });
      setProjects(normalizeProjectRows((projs ?? []) as ProjectWithSkillRelation[]));
      setBadges(bdgs ?? []);
      setEmail(user.email ?? "");
      setProfileSkills(
        (profSkills ?? [])
        .filter((s) => s.skill_id !== null && s.skills !== null)
        .map((s) => ({ skill_id: s.skill_id!, skills: s.skills! }))
      )

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f6f3f2]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#78fbb6] border-t-[#006d43]" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#f6f3f2] p-6 xl:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[#006d43] via-[#008a55] to-[#00c47a]" />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1c1b1b]">Edit Profile</h1>
            <p className="mt-1 text-sm text-[#5f5e5e]">
              Manage your public profile and account settings
            </p>
          </div>
          <Button
            variant="outline"
            asChild
            className="border-[#e5e2e1] bg-white text-[#3d4a41] hover:bg-[#f6f3f2] hover:text-[#006d43]"
          >
            <Link href={`/job-seeker/profile/${profile.username}`}>
              View profile
            </Link>
          </Button>
        </div>
      </section>

      {/* Tab nav */}
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-[#e5e2e1] bg-white p-2 shadow-sm">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "border-[#78fbb6]/50 bg-[#f0f9f5] text-[#005232]"
                  : "border-transparent text-[#5f5e5e] hover:bg-[#f6f3f2] hover:text-[#1c1b1b]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <section className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
        {activeTab === "profile" && <TabProfile profile={profile} onSaved={setProfile} />}
        {activeTab === "projects" && <TabProjects projects={projects} onProjectsChange={setProjects} username={params.username as string} />}
        {activeTab === "badges" && <TabBadges badges={badges} onBadgesChange={setBadges} username={params.username as string} />}
        {activeTab === "account" && <TabAccount currentEmail={email} />}
        {activeTab === "skills" && <TabSkills profileSkills={profileSkills} username={params.username as string} />}
      </section>
      </div>
    </div>
  );
}
