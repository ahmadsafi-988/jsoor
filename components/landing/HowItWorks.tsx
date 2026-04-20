"use client";
import { UserPlus, FileText, Search, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Create Your Profile",
    description:
      "Sign up and build your professional profile in minutes. Add your education, skills, projects, and career goals.",
  },
  {
    icon: FileText,
    number: "02",
    title: "Get Matched",
    description:
      "Our smart algorithm analyzes your profile and matches you with relevant opportunities from top companies.",
  },
  {
    icon: Search,
    number: "03",
    title: "Connect & Apply",
    description:
      "Review matched opportunities, connect directly with recruiters, and apply to positions that excite you.",
  },
  {
    icon: CheckCircle,
    number: "04",
    title: "Land Your Dream Job",
    description:
      "Interview with companies, negotiate offers, and start your professional journey with confidence.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#78fbb6]/20 border border-[#bccabe] mb-4">
            <span className="text-sm font-medium text-[#006d43]">How It Works</span>
          </div>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold text-[#1c1b1b] mb-4 tracking-tight">
            Your Path to Professional Success
          </h2>
          <p className="text-lg text-[#3d4a41]">
            Four simple steps to connect with your ideal employer and launch your career.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative text-center">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(50%+2.5rem)] right-0 h-px bg-[#bccabe] z-0" />
                )}

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#f6f3f2] border border-[#e5e2e1] flex items-center justify-center mb-5">
                    <Icon className="w-8 h-8 text-[#006d43]" />
                  </div>
                  <div className="text-xs font-semibold text-[#006d43] tracking-widest uppercase mb-2 font-headline">
                    Step {step.number}
                  </div>
                  <h3 className="font-headline text-base font-semibold text-[#1c1b1b] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#3d4a41] leading-relaxed max-w-[200px]">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
