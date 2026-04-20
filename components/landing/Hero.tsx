"use client";
import { ArrowRight, Briefcase, CheckCircle } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32">
      {/* Green glow orb — top right */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-[#78fbb6] blur-[100px] rounded-full opacity-20 -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-16 items-center">

        {/* Left column — content */}
        <div className="lg:col-span-6 space-y-8">
          <h1 className="font-headline font-bold text-[3.5rem] leading-[1.1] tracking-[-0.02em] text-neutral-900">
            Your First Job <br />
            <span className="gradient-text">Starts Here.</span>
          </h1>

          <p className="text-xl text-[#3d4a41] leading-relaxed max-w-lg">
            The architectural bridge to your career in the Middle East. Connect
            with leading employers, master your interviews, and launch your
            future.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            {/* Primary CTA → sign-up */}
            <Link href="/auth/sign-up">
              <button className="hero-gradient-bg text-white px-8 py-4 rounded-xl font-semibold text-lg hover:brightness-110 transition-all shadow-[0_20px_40px_rgba(0,109,67,0.15)] flex items-center gap-2">
                Explore Opportunities
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>

            {/* Secondary CTA — placeholder until employer flow exists */}
            <button className="border border-[#6d7a70] text-[#006d43] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-neutral-100 transition-colors">
              Post a Job
            </button>
          </div>
        </div>

        {/* Right column — image card */}
        <div className="lg:col-span-6 relative">
          <div className="relative w-full aspect-square bg-[#e5e2e1] rounded-[2rem] overflow-hidden flex items-center justify-center">
            {/* Image with overlay blend */}
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB18MU5DDY9tIEJmTjJ87aRjkLL8LSHuFup2_IWwPVnPzf79smjskheE-rOvtsOcwkG5abzLwjrW4f6ynNHykiUniPejLACWSMPetHrlB6OwSz7W754xCvelqr8e5HvxBlHtFL3O4F64qVBUcNx2hdN-ywC7IpuQ8hGa9-TrREY4Ywc49zNnUrDc3lCxjQbrdVkJWTASCWEr_QCRBAB_zxVjWasNPqObGZ1ZwZ9BkE1Jdg0gcXSYCzpzu3CeT4OI6_YRbnvU6lUZZ6l"
              alt="Professional reviewing career opportunities"
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
            />

            {/* Floating card — top left */}
            <div className="absolute top-12 left-8 bg-white/80 backdrop-blur-xl p-4 rounded-xl shadow-[0_20px_40px_rgba(0,109,67,0.08)] border border-white/20 animate-bounce [animation-duration:4s]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00a86b] rounded-full flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-neutral-900">Junior Architect</p>
                  <p className="text-xs text-[#006d43]">Dubai, UAE</p>
                </div>
              </div>
            </div>

            {/* Floating card — bottom right */}
            <div className="absolute bottom-24 right-8 bg-white/80 backdrop-blur-xl p-4 rounded-xl shadow-[0_20px_40px_rgba(0,109,67,0.08)] border border-white/20 animate-bounce [animation-duration:5s] [animation-direction:reverse]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e5e2e1] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[#006d43]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-neutral-900">Interview Passed</p>
                  <p className="text-xs text-neutral-500">Top 5% Candidate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
