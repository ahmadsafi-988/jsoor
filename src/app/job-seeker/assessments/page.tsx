"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitAssessment } from "@/lib/company/actions";
import { ClipboardCheck, Building, ChevronDown, ChevronUp, CheckCircle, Clock } from "lucide-react";

type Question = { id: number; text: string };

function AssessmentCard({ assessment, onSubmitted }: { assessment: any; onSubmitted: () => void }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions: Question[] = assessment.questions ?? [];
  const app = assessment.application;
  const job = app?.job;
  const company = job?.company;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("assessment_id", assessment.id);
    formData.set("submission", JSON.stringify(answers));
    const result = await submitAssessment(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      onSubmitted();
    }
    setPending(false);
  }

  const statusColor = assessment.status === "pending"
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : assessment.status === "submitted"
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-[#78fbb6]/20 text-[#005232] border-[#78fbb6]/40";

  return (
    <div className="bg-white rounded-2xl border border-[#e5e2e1] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#f0edec] flex items-center justify-center shrink-0 overflow-hidden">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
            ) : (
              <Building className="w-5 h-5 text-[#006d43]" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-[#1c1b1b]">{assessment.title}</h3>
            <p className="text-sm text-[#5f5e5e] mt-0.5">{company?.name ?? "Company"} · {job?.title ?? "Role"}</p>
            {assessment.deadline && (
              <p className="text-xs text-[#3d4a41] flex items-center gap-1 mt-1">
                <Clock className="w-3.5 h-3.5" />
                Due {new Date(assessment.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColor}`}>
          {assessment.status === "pending" ? "Pending" : assessment.status === "submitted" ? "Submitted" : "Reviewed"}
        </span>
      </div>

      {/* Instructions */}
      <div className="px-6 pb-4">
        <p className="text-sm text-[#3d4a41] leading-relaxed">{assessment.description}</p>
      </div>

      {/* Score/feedback if reviewed */}
      {assessment.status === "reviewed" && (
        <div className="mx-6 mb-4 bg-[#78fbb6]/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-[#006d43]" />
            <span className="font-semibold text-[#005232] text-sm">
              Score: {assessment.score !== null ? `${assessment.score}/100` : "Not scored"}
            </span>
          </div>
          {assessment.feedback && (
            <p className="text-sm text-[#3d4a41]">{assessment.feedback}</p>
          )}
        </div>
      )}

      {/* Expand for questions (pending only) */}
      {assessment.status === "pending" && (
        <>
          <button
            onClick={() => setOpen(o => !o)}
            className="w-full flex items-center justify-between px-6 py-3 border-t border-[#f0edec] text-sm font-medium text-[#006d43] hover:bg-[#f6f3f2] transition-colors"
          >
            {open ? "Hide Questions" : "Start Assessment"}
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {open && (
            <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-5 border-t border-[#f0edec] pt-4">
              {questions.length === 0 ? (
                <p className="text-sm text-[#5f5e5e]">No specific questions — submit your response below.</p>
              ) : (
                questions.map((q, idx) => (
                  <div key={q.id} className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#1c1b1b]">
                      Q{idx + 1}: {q.text}
                    </label>
                    <textarea
                      rows={4}
                      value={answers[`q${q.id}`] ?? ""}
                      onChange={e => setAnswers(a => ({ ...a, [`q${q.id}`]: e.target.value }))}
                      placeholder="Your answer..."
                      className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
                    />
                  </div>
                ))
              )}

              {questions.length === 0 && (
                <textarea
                  rows={5}
                  value={answers["general"] ?? ""}
                  onChange={e => setAnswers(a => ({ ...a, general: e.target.value }))}
                  placeholder="Write your response here..."
                  className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
                />
              )}

              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="self-end inline-flex items-center gap-2 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold px-6 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[#00a86b]/20 text-sm disabled:opacity-60"
              >
                <CheckCircle className="w-4 h-4" />
                {pending ? "Submitting..." : "Submit Assessment"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default function JobSeekerAssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: myApps } = await supabase
      .from("job_applications")
      .select("id")
      .eq("applicant_id", user.id);

    const appIds = (myApps ?? []).map(a => a.id);
    if (appIds.length === 0) { setLoading(false); return; }

    const { data } = await supabase
      .from("assessments")
      .select(`*, application:job_applications!assessments_application_id_fkey(
        id, job_id,
        job:jobs!job_applications_job_id_fkey(title, company:companies!jobs_company_id_fkey(name, logo_url))
      )`)
      .in("application_id", appIds)
      .order("created_at", { ascending: false });

    setAssessments(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto w-full flex flex-col gap-8">
      <div>
        <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">
          My Assessments
        </h2>
        <p className="text-[#3d4a41] text-sm mt-1">Assessments sent to you by companies.</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-[#e5e2e1] p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#f0edec]" />
                <div className="flex-1">
                  <div className="h-4 bg-[#f0edec] rounded w-1/2 mb-2" />
                  <div className="h-3 bg-[#f0edec] rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e2e1] p-16 text-center">
          <ClipboardCheck className="w-12 h-12 text-[#3d4a41] mx-auto mb-4 opacity-40" />
          <h3 className="font-semibold text-[#1c1b1b] mb-2">No assessments yet</h3>
          <p className="text-[#3d4a41] text-sm">
            When a company sends you an assessment, it will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {assessments.map(a => (
            <AssessmentCard key={a.id} assessment={a} onSubmitted={load} />
          ))}
        </div>
      )}
    </div>
  );
}
