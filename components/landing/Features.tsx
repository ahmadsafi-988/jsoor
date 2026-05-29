"use client";
import { Briefcase, Users, Target, Award, Shield, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Smart Matching",
    description:
      "Our AI-powered algorithm matches you with opportunities that align with your skills, experience, and career goals.",
  },
  {
    icon: Users,
    title: "Profile Building",
    description:
      "Create a comprehensive professional profile that showcases your education, projects, and achievements.",
  },
  {
    icon: Briefcase,
    title: "Direct Connections",
    description:
      "Connect directly with hiring managers and recruiters from top companies looking for fresh talent.",
  },
  {
    icon: Award,
    title: "Verified Companies",
    description:
      "All companies on our platform are thoroughly verified to ensure legitimate opportunities.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your data is protected with enterprise-grade security. Control who sees your profile.",
  },
  {
    icon: TrendingUp,
    title: "Career Insights",
    description:
      "Get real-time market insights, salary data, and career progression paths in your field.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-[#f6f3f2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#78fbb6]/20 border border-[#bccabe] mb-4">
            <span className="text-sm font-medium text-[#006d43]">Features</span>
          </div>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold text-[#1c1b1b] mb-4 tracking-tight">
            Everything You Need to Launch Your Career
          </h2>
          <p className="text-lg text-[#3d4a41]">
            Powerful tools designed to help graduates and companies find their perfect match.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 rounded-2xl border border-[#e5e2e1] hover:border-[#006d43]/30 hover:shadow-[0_20px_40px_rgba(0,109,67,0.08)] bg-white transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-[#78fbb6]/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#006d43]" />
                </div>
                <h3 className="font-headline text-base font-semibold text-[#1c1b1b] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#3d4a41] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
