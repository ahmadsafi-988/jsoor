import { useState } from "react";
import { ArrowRight, Lightbulb, Rocket } from "lucide-react";




const RECENT_SETUPS = [
  { label: "Frontend Architecture", sub: "Senior · Technical" },
  { label: "Behavioral Panel",      sub: "Mid-Level · STAR Method" },
];

const INTERVIEW_TYPES = [
  "Technical / Coding",
  "System Design",
  "Behavioral (STAR Method)",
  "Mixed Panel",
];
const DIFFICULTY_LEVELS = [
  "Entry Level / Graduate",
  "Mid-Level",
  "Senior / Lead",
  "Principal / Staff",
];

export default function SetupForm({ onStart }: { onStart: (cfg: InterviewConfig) => void }) {
  const [role, setRole]           = useState("");
  const [skills, setSkills]       = useState("");
  const [iType, setIType]         = useState(INTERVIEW_TYPES[0]);
  const [difficulty, setDiff]     = useState(DIFFICULTY_LEVELS[1]);
  const [count]                   = useState(5);

  const handleStart = () => {
    if (!role.trim()) return;
    const jobDescription = `Skills: ${skills || "General"}\nType: ${iType}\nLevel: ${difficulty}`;
    onStart({ jobTitle: role.trim(), jobDescription, questionCount: count, interviewType: iType, level: difficulty });
  };

  const fillPreset = (label: string) => {
    setRole(label.split(" ")[0] + " Role");
    setSkills(label.includes("Frontend") ? "React, TypeScript, System Architecture" : "Communication, Leadership");
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full flex flex-col">
      {/* Page header */}
      <div className="mb-10 flex flex-col gap-2">
        <h2 className="font-headline text-[2.5rem] font-bold text-[#1c1b1b] tracking-tight leading-tight">
          Set Up Your Mock Interview
        </h2>
        <p className="text-[#3d4a41] text-base max-w-2xl leading-relaxed">
          Configure your AI-driven simulator. Tailor the environment to your
          target role to experience a realistic, high-pressure interview scenario.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Main form ──────────────────────────────────────────── */}
        <div className="lg:col-span-8 bg-white rounded-[1.5rem] p-8 md:p-10 flex flex-col gap-8 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#78fbb6] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 pointer-events-none" />

          <div className="flex flex-col gap-8 relative z-10">
            {/* Role */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#3d4a41] uppercase tracking-wider">
                Target Role
              </label>
              <div className="relative bg-[#f6f3f2] rounded-t-lg rounded-b-none border-b-2 border-[#e5e2e1] focus-within:border-[#006d43] transition-colors">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d4a41] opacity-60 text-lg">💼</span>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-[#1c1b1b] text-sm placeholder:text-[#3d4a41]/40 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            {/* Skills */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#3d4a41] uppercase tracking-wider">
                Key Technologies &amp; Skills
              </label>
              <div className="relative bg-[#f6f3f2] rounded-t-lg rounded-b-none border-b-2 border-[#e5e2e1] focus-within:border-[#006d43] transition-colors">
                <span className="absolute left-4 top-4 text-[#3d4a41] opacity-60 text-lg">💻</span>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, TypeScript, System Architecture, Performance Tuning..."
                  rows={3}
                  className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-[#1c1b1b] text-sm placeholder:text-[#3d4a41]/40 focus:ring-0 focus:outline-none resize-none"
                />
              </div>
              <p className="text-xs text-[#3d4a41]/60 pl-2">Separate skills with commas.</p>
            </div>

            {/* Interview type + difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#3d4a41] uppercase tracking-wider">
                  Interview Type
                </label>
                <div className="relative bg-[#f6f3f2] rounded-t-lg rounded-b-none border-b-2 border-[#e5e2e1] focus-within:border-[#006d43] transition-colors">
                  <select
                    value={iType}
                    onChange={(e) => setIType(e.target.value)}
                    className="w-full bg-transparent border-none py-4 pl-4 pr-10 text-[#1c1b1b] text-sm appearance-none focus:ring-0 focus:outline-none cursor-pointer"
                  >
                    {INTERVIEW_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3d4a41] pointer-events-none text-xs">▾</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#3d4a41] uppercase tracking-wider">
                  Difficulty Level
                </label>
                <div className="relative bg-[#f6f3f2] rounded-t-lg rounded-b-none border-b-2 border-[#e5e2e1] focus-within:border-[#006d43] transition-colors">
                  <select
                    value={difficulty}
                    onChange={(e) => setDiff(e.target.value)}
                    className="w-full bg-transparent border-none py-4 pl-4 pr-10 text-[#1c1b1b] text-sm appearance-none focus:ring-0 focus:outline-none cursor-pointer"
                  >
                    {DIFFICULTY_LEVELS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3d4a41] pointer-events-none text-xs">▾</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-2 pt-6 border-t border-[#e5e2e1] flex justify-end">
              <button
                onClick={handleStart}
                disabled={!role.trim()}
                className="hero-gradient-bg text-white font-semibold text-base py-4 px-10 rounded-xl hover:brightness-110 shadow-[0_20px_40px_rgba(0,108,67,0.15)] transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <span>Initialize Simulator</span>
                <Rocket className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Info panel ─────────────────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Pro tip */}
          <div className="bg-[#e5e2e1] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#006d43] rounded-l-2xl" />
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center shrink-0 text-[#006d43]">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline text-base font-bold text-[#1c1b1b] mb-2">
                  Pro-Tip for System Design
                </h3>
                <p className="text-sm text-[#3d4a41] leading-relaxed">
                  Include specific constraints in the Skills section (e.g.,
                  "High throughput, Low latency, Microservices") to make the
                  AI challenge your architecture choices.
                </p>
              </div>
            </div>
          </div>

          {/* Recent setups */}
          <div className="bg-[#f6f3f2] rounded-2xl p-6">
            <h3 className="text-xs font-semibold text-[#3d4a41] uppercase tracking-wider mb-4">
              Recent Setups
            </h3>
            <div className="flex flex-col gap-3">
              {RECENT_SETUPS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => fillPreset(s.label)}
                  className="w-full text-left bg-white hover:bg-white/80 rounded-xl p-4 transition-colors flex items-center justify-between border border-[#bccabe]/20 group"
                >
                  <div>
                    <p className="font-semibold text-[#1c1b1b] text-sm group-hover:text-[#006d43] transition-colors">
                      {s.label}
                    </p>
                    <p className="text-xs text-[#3d4a41] mt-0.5">{s.sub}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#6d7a70] group-hover:text-[#006d43]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
