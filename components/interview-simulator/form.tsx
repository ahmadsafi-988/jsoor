import { useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Code2,
  Eye,
  History,
  Minus,
  Plus,
  Rocket,
} from "lucide-react";

export interface PreviousInterview {
  id: string;
  jobTitle: string;
  interviewType: string;
  level: string;
  questionCount: number;
  status: string;
  overallScore: number | null;
  createdAt: string;
  overallSummary: string | null;
}

interface SetupFormProps {
  onStart: (cfg: InterviewConfig) => void;
  previousInterviews?: PreviousInterview[];
  historyLoading?: boolean;
  onInterviewSelect?: (interview: PreviousInterview) => void;
}

const INTERVIEW_TYPES = [
  "Technical",
  "Behavioral (HR)",
  "Mixed",
];

const DIFFICULTY_LEVELS = [
  "Easy",
  "Mid",
  "Hard",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function scoreTone(score: number | null) {
  if (score === null) return "bg-[#eef3ef] text-[#3d4a41]";
  if (score >= 8) return "bg-emerald-100 text-emerald-800";
  if (score >= 5) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

function PreviousInterviewsPanel({
  interviews,
  loading,
  onInterviewSelect,
}: {
  interviews: PreviousInterview[];
  loading: boolean;
  onInterviewSelect?: (interview: PreviousInterview) => void;
}) {
  return (
    <aside className="lg:col-span-4 rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-headline text-base font-bold text-[#1c1b1b]">
            Previous Interviews
          </h3>
          <p className="mt-1 text-xs text-[#3d4a41]">
            Track your latest practice results.
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef8f2] text-[#006d43]">
          <History className="h-5 w-5" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-xl bg-[#f6f3f2]" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#bccabe] bg-[#f6f3f2] p-5 text-sm text-[#3d4a41]">
          Your completed interviews will appear here after you finish a session.
        </div>
      ) : (
        <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
          {interviews.map((interview) => (
            <button
              type="button"
              key={interview.id}
              onClick={() => onInterviewSelect?.(interview)}
              className="w-full rounded-xl border border-[#e5e2e1] bg-[#f9f8f7] p-4 text-left transition-colors hover:border-[#006d43] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1c1b1b]">
                    {interview.jobTitle}
                  </p>
                  <p className="mt-1 text-xs text-[#3d4a41]">
                    {interview.interviewType} · {interview.questionCount} questions
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${scoreTone(interview.overallScore)}`}>
                  {interview.overallScore === null ? "Pending" : `${interview.overallScore.toFixed(1)}/10`}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#3d4a41]">
                <span>{interview.level}</span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(interview.createdAt)}
                </span>
              </div>

              {interview.overallSummary && (
                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#3d4a41]">
                  {interview.overallSummary}
                </p>
              )}
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#006d43]">
                <Eye className="h-3.5 w-3.5" />
                View details
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

export default function SetupForm({
  onStart,
  previousInterviews = [],
  historyLoading = false,
  onInterviewSelect,
}: SetupFormProps) {
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [iType, setIType] = useState(INTERVIEW_TYPES[0]);
  const [difficulty, setDiff] = useState(DIFFICULTY_LEVELS[1]);
  const [count, setCount] = useState(5);

  const handleStart = () => {
    if (!role.trim()) return;
    const safeCount = Math.min(10, Math.max(1, count));
    const jobDescription = `Skills: ${skills || "General"}\nType: ${iType}\nLevel: ${difficulty}`;
    onStart({
      jobTitle: role.trim(),
      jobDescription,
      questionCount: safeCount,
      interviewType: iType,
      level: difficulty,
    });
  };

  const updateCount = (nextCount: number) => {
    setCount(Math.min(10, Math.max(1, nextCount)));
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col p-8">
      <div className="mb-10 flex flex-col gap-2">
        <h2 className="font-headline text-[2.5rem] font-bold leading-tight tracking-tight text-[#1c1b1b]">
          Set Up Your Mock Interview
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-[#3d4a41]">
          Configure your AI-driven simulator for the role, level, and practice length you want.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="relative flex flex-col gap-8 overflow-hidden rounded-2xl bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] md:p-10 lg:col-span-8">
          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#3d4a41]">
                Target Role
              </label>
              <div className="relative rounded-t-lg border-b-2 border-[#e5e2e1] bg-[#f6f3f2] transition-colors focus-within:border-[#006d43]">
                <BriefcaseBusiness className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#3d4a41]/60" />
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Graphic Designer"
                  className="w-full border-none bg-transparent py-4 pl-12 pr-4 text-sm text-[#1c1b1b] placeholder:text-[#3d4a41]/40 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#3d4a41]">
                Skills &amp; Technologies 
              </label>
              <div className="relative rounded-t-lg border-b-2 border-[#e5e2e1] bg-[#f6f3f2] transition-colors focus-within:border-[#006d43]">
                <Code2 className="absolute left-4 top-4 h-5 w-5 text-[#3d4a41]/60" />
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Python, Adobe Photoshop, Excel and Agile..."
                  rows={3}
                  className="w-full resize-none border-none bg-transparent py-4 pl-12 pr-4 text-sm text-[#1c1b1b] placeholder:text-[#3d4a41]/40 focus:outline-none focus:ring-0"
                />
              </div>
              <p className="pl-2 text-xs text-[#3d4a41]/60">Separate skills with commas.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#3d4a41]">
                  Interview Type
                </label>
                <div className="relative rounded-t-lg border-b-2 border-[#e5e2e1] bg-[#f6f3f2] transition-colors focus-within:border-[#006d43]">
                  <select
                    value={iType}
                    onChange={(e) => setIType(e.target.value)}
                    className="w-full cursor-pointer appearance-none border-none bg-transparent py-4 pl-4 pr-10 text-sm text-[#1c1b1b] focus:outline-none focus:ring-0"
                  >
                    {INTERVIEW_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3d4a41]" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#3d4a41]">
                  Difficulty Level
                </label>
                <div className="relative rounded-t-lg border-b-2 border-[#e5e2e1] bg-[#f6f3f2] transition-colors focus-within:border-[#006d43]">
                  <select
                    value={difficulty}
                    onChange={(e) => setDiff(e.target.value)}
                    className="w-full cursor-pointer appearance-none border-none bg-transparent py-4 pl-4 pr-10 text-sm text-[#1c1b1b] focus:outline-none focus:ring-0"
                  >
                    {DIFFICULTY_LEVELS.map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3d4a41]" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e5e2e1] bg-[#f6f3f2] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#3d4a41]">
                    Number of Questions
                  </label>
                  <p className="mt-1 text-sm text-[#1c1b1b]">
                    Choose between 1 and 10 questions.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateCount(count - 1)}
                    disabled={count <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#bccabe] bg-white text-[#3d4a41] transition-colors hover:border-[#006d43] hover:text-[#006d43] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Decrease question count"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={count}
                    onChange={(e) => updateCount(Number(e.target.value))}
                    className="h-11 w-16 rounded-xl border border-[#bccabe] bg-white text-center text-lg font-bold text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                    aria-label="Question count"
                  />
                  <button
                    type="button"
                    onClick={() => updateCount(count + 1)}
                    disabled={count >= 10}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#bccabe] bg-white text-[#3d4a41] transition-colors hover:border-[#006d43] hover:text-[#006d43] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Increase question count"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={count}
                onChange={(e) => updateCount(Number(e.target.value))}
                className="mt-5 w-full accent-[#006d43]"
                aria-label="Question count slider"
              />
            </div>

            <div className="mt-2 flex justify-end border-t border-[#e5e2e1] pt-6">
              <button
                onClick={handleStart}
                disabled={!role.trim()}
                className="hero-gradient-bg flex items-center gap-3 rounded-xl px-10 py-4 text-base font-semibold text-white shadow-[0_20px_40px_rgba(0,108,67,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <span>Initialize Simulator</span>
                <Rocket className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <PreviousInterviewsPanel
          interviews={previousInterviews}
          loading={historyLoading}
          onInterviewSelect={onInterviewSelect}
        />
      </div>
    </div>
  );
}
