"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendAssessment, updateApplicationStatus, reviewAssessment } from "@/lib/company/actions";
import {
  ArrowLeft, User, MapPin, Globe, GraduationCap,
  FileText, ClipboardCheck, CheckCircle, ChevronDown, ChevronUp, Star, Code2
} from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "applied",              label: "Applied" },
  { value: "under_review",         label: "Under Review" },
  { value: "assessment_sent",      label: "Assessment Sent" },
  { value: "assessment_completed", label: "Assessment Done" },
  { value: "shortlisted",          label: "Shortlisted" },
  { value: "rejected",             label: "Rejected" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  applied:               "bg-blue-50 text-blue-700 border-blue-200",
  under_review:          "bg-amber-50 text-amber-700 border-amber-200",
  assessment_sent:       "bg-purple-50 text-purple-700 border-purple-200",
  assessment_completed:  "bg-[#78fbb6]/20 text-[#005232] border-[#78fbb6]/40",
  shortlisted:           "bg-[#006d43]/10 text-[#006d43] border-[#006d43]/20",
  rejected:              "bg-red-50 text-red-600 border-red-200",
};

export default function ApplicantDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [data, setData] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("applied");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [appRes, assessRes] = await Promise.all([
        supabase
          .from("job_applications")
          .select(`
            *,
            profile:profiles!job_applications_applicant_id_fkey(
              id, first_name, last_name, avatar_url, username, bio, degree,
              institution, location, github, website, cv_url
            ),
            job:jobs!job_applications_job_id_fkey(title, type, location)
          `)
          .eq("id", applicationId)
          .single(),
        supabase
          .from("assessments")
          .select("*")
          .eq("application_id", applicationId)
          .maybeSingle(),
      ]);

      if (appRes.data) {
        setData(appRes.data);
        setCurrentStatus(appRes.data.status);

        if ((appRes.data as any).profile?.id) {
          const { data: skillData } = await supabase
            .from("profile_to_skills")
            .select("skills(name)")
            .eq("user_id", (appRes.data as any).profile.id);
          setSkills((skillData ?? []).map((s: any) => s.skills?.name).filter(Boolean));
        }
      }
      setAssessment(assessRes.data ?? null);
      setLoading(false);
    };
    load();
  }, [applicationId]);

  async function handleStatusChange(status: string) {
    setStatusChanging(true);
    await updateApplicationStatus(applicationId, status as any);
    setCurrentStatus(status);
    setStatusChanging(false);
  }

  async function handleSendAssessment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("application_id", applicationId);

    const questionsRaw = formData.get("questions_text") as string;
    if (questionsRaw.trim()) {
      const questions = questionsRaw.split("\n").filter(q => q.trim()).map((q, i) => ({ id: i + 1, text: q.trim() }));
      formData.set("questions", JSON.stringify(questions));
    }

    const result = await sendAssessment(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowAssessmentForm(false);
      setCurrentStatus("assessment_sent");
      const supabase = createClient();
      const { data: a } = await supabase.from("assessments").select("*").eq("application_id", applicationId).maybeSingle();
      setAssessment(a);
    }
    setPending(false);
  }

  async function handleReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("assessment_id", assessment.id);
    const result = await reviewAssessment(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowReviewForm(false);
      const supabase = createClient();
      const { data: a } = await supabase.from("assessments").select("*").eq("application_id", applicationId).maybeSingle();
      setAssessment(a);
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

  if (!data) {
    return (
      <div className="p-8 text-center py-24">
        <p className="text-[#3d4a41]">Application not found.</p>
        <Link href="/company/jobs" className="text-[#006d43] underline text-sm mt-2 inline-block">Back to Jobs</Link>
      </div>
    );
  }

  const profile = (data as any).profile;
  const job = (data as any).job;
  const name = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "Unknown";

  return (
    <div className="p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
      <div>
        <Link
          href={`/company/jobs/${data.job_id}/applicants`}
          className="inline-flex items-center gap-1.5 text-sm text-[#3d4a41] hover:text-[#006d43] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Applicants
        </Link>
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">{name}</h2>
          <div className="flex items-center gap-2">
            <select
              value={currentStatus}
              disabled={statusChanging}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none ${STATUS_STYLES[currentStatus] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        {job && (
          <p className="text-[#3d4a41] text-sm mt-1">
            Applying for: <span className="font-semibold text-[#1c1b1b]">{job.title}</span>
            {job.type && ` · ${job.type}`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: profile */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-[#e5e2e1] p-6 flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#f0edec] overflow-hidden shrink-0 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-[#3d4a41]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#1c1b1b] text-lg">{name}</h3>
              {profile?.degree && (
                <p className="text-[#3d4a41] text-sm flex items-center gap-1.5 mt-1">
                  <GraduationCap className="w-4 h-4" />
                  {profile.degree}{profile.institution ? ` at ${profile.institution}` : ""}
                </p>
              )}
              {profile?.location && (
                <p className="text-[#5f5e5e] text-sm flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4" /> {profile.location}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {profile?.github && (
                  <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" className="text-[#3d4a41] hover:text-[#006d43] transition-colors">
                    <Code2 className="w-4 h-4" />
                  </a>
                )}
                {profile?.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#3d4a41] hover:text-[#006d43] transition-colors">
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {profile?.cv_url && (
                  <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#006d43] border border-[#006d43]/30 px-3 py-1 rounded-full hover:bg-[#006d43]/5 transition-colors">
                    <FileText className="w-3.5 h-3.5" /> View CV
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] p-6">
              <h4 className="font-semibold text-[#1c1b1b] mb-3">About</h4>
              <p className="text-[#3d4a41] text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] p-6">
              <h4 className="font-semibold text-[#1c1b1b] mb-3">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="px-3 py-1 rounded-full bg-[#f6f3f2] border border-[#e5e2e1] text-sm text-[#3d4a41] font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cover letter */}
          {data.cover_letter && (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] p-6">
              <h4 className="font-semibold text-[#1c1b1b] mb-3">Cover Letter</h4>
              <p className="text-[#3d4a41] text-sm leading-relaxed whitespace-pre-wrap">{data.cover_letter}</p>
            </div>
          )}
        </div>

        {/* Right column: assessment panel */}
        <div className="flex flex-col gap-4">
          {/* Assessment status */}
          {assessment ? (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-[#1c1b1b]">Assessment</h4>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  assessment.status === "pending" ? "bg-amber-50 text-amber-700" :
                  assessment.status === "submitted" ? "bg-blue-50 text-blue-700" :
                  "bg-[#78fbb6]/20 text-[#005232]"
                }`}>
                  {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                </span>
              </div>

              <div>
                <p className="font-medium text-[#1c1b1b] text-sm">{assessment.title}</p>
                <p className="text-[#5f5e5e] text-xs mt-1">{assessment.description}</p>
                {assessment.deadline && (
                  <p className="text-xs text-[#3d4a41] mt-1">
                    Due: {new Date(assessment.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Submitted answers */}
              {assessment.status !== "pending" && assessment.submission && (
                <div>
                  <button
                    onClick={() => setShowReviewForm(s => !s)}
                    className="w-full flex items-center justify-between text-sm font-medium text-[#006d43] py-2"
                  >
                    View Submission {showReviewForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showReviewForm && (
                    <div className="mt-2 flex flex-col gap-3">
                      {assessment.questions && (assessment.questions as any[]).map((q: any, idx: number) => (
                        <div key={q.id ?? idx} className="bg-[#f6f3f2] rounded-xl p-3">
                          <p className="text-xs font-semibold text-[#1c1b1b] mb-1">Q{idx + 1}: {q.text}</p>
                          <p className="text-xs text-[#3d4a41]">
                            {(assessment.submission as any)?.[`q${q.id ?? idx + 1}`] ?? "No answer provided"}
                          </p>
                        </div>
                      ))}

                      {assessment.status === "submitted" && (
                        <form onSubmit={handleReview} className="flex flex-col gap-3 mt-2">
                          <div>
                            <label className="text-xs font-semibold text-[#1c1b1b] mb-1 block">Score (0–100)</label>
                            <input
                              name="score"
                              type="number"
                              min="0"
                              max="100"
                              defaultValue={assessment.score ?? ""}
                              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-[#1c1b1b] mb-1 block">Feedback</label>
                            <textarea
                              name="feedback"
                              rows={3}
                              defaultValue={assessment.feedback ?? ""}
                              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={pending}
                            className="w-full bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold py-2.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-60"
                          >
                            {pending ? "Saving..." : "Submit Review"}
                          </button>
                        </form>
                      )}

                      {assessment.status === "reviewed" && (
                        <div className="bg-[#78fbb6]/10 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="w-4 h-4 text-[#006d43]" />
                            <span className="text-sm font-semibold text-[#005232]">Score: {assessment.score ?? "—"}/100</span>
                          </div>
                          {assessment.feedback && (
                            <p className="text-xs text-[#3d4a41]">{assessment.feedback}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] p-6">
              <h4 className="font-semibold text-[#1c1b1b] mb-1">Assessment</h4>
              <p className="text-[#5f5e5e] text-sm mb-4">No assessment sent yet.</p>
              <button
                onClick={() => setShowAssessmentForm(s => !s)}
                className="w-full bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold py-2.5 rounded-xl text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                Send Assessment
              </button>
            </div>
          )}

          {/* Assessment form */}
          {showAssessmentForm && !assessment && (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] p-6">
              <h4 className="font-semibold text-[#1c1b1b] mb-4">New Assessment</h4>
              <form onSubmit={handleSendAssessment} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1c1b1b]">Title *</label>
                  <input
                    name="title"
                    required
                    placeholder="e.g. Technical Assessment"
                    className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1c1b1b]">Instructions *</label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    placeholder="Describe the task or what the applicant should do..."
                    className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1c1b1b]">Questions (one per line)</label>
                  <textarea
                    name="questions_text"
                    rows={4}
                    placeholder={"What is your approach to X?\nDescribe a time when you..."}
                    className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1c1b1b]">Deadline (optional)</label>
                  <input
                    name="deadline"
                    type="date"
                    className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold py-2.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-60"
                >
                  {pending ? "Sending..." : "Send Assessment"}
                </button>
              </form>
            </div>
          )}

          {/* Application meta */}
          <div className="bg-white rounded-2xl border border-[#e5e2e1] p-6">
            <h4 className="font-semibold text-[#1c1b1b] mb-3">Application Details</h4>
            <div className="flex flex-col gap-2 text-sm text-[#3d4a41]">
              <div className="flex justify-between">
                <span>Applied</span>
                <span className="font-medium text-[#1c1b1b]">{new Date(data.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>
                <span className="font-medium text-[#1c1b1b]">{new Date(data.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
