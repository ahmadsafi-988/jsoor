"use client";
import { Shield, Lock, Eye } from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Privacy First",
    description:
      "We never sell your data. Your information is only shared with companies you apply to.",
  },
  {
    icon: Eye,
    title: "Verified Companies",
    description:
      "Every company on our platform is thoroughly vetted to ensure legitimacy and quality.",
  },
];

export function Trust() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#78fbb6]/20 border border-[#bccabe] mb-4">
            <Shield className="w-3.5 h-3.5 text-[#006d43]" />
            <span className="text-sm font-medium text-[#006d43]">Trust & Security</span>
          </div>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold text-[#1c1b1b] mb-4 tracking-tight">
            Your Security is Our Priority
          </h2>
          <p className="text-lg text-[#3d4a41] max-w-xl mx-auto">
            We take data protection seriously with industry-leading security measures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-8 rounded-2xl border border-[#e5e2e1] bg-[#f6f3f2]"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#78fbb6]/20 flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-[#006d43]" />
                </div>
                <h3 className="text-base font-semibold text-[#1c1b1b] mb-2">
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
