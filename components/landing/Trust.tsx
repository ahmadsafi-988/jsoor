"use client"
import { Shield, Lock, FileCheck, Eye } from "lucide-react";

export function Trust() {
  const features = [
    {
      icon: Lock,
      title: "Privacy First",
      description: "We never sell your data. Your information is only shared with companies you apply to.",
    },
    {
      icon: Eye,
      title: "Verified Companies",
      description: "Every company on our platform is thoroughly vetted to ensure legitimacy and quality.",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <Shield className="w-4 h-4" style={{ color: '#8B5CF6' }} />
            <span className="text-sm" style={{ color: '#8B5CF6' }}>Trust & Security</span>
          </div>
          <h2 className="text-3xl sm:text-4xl mb-4" style={{ color: '#312E81' }}>
            Your Security is Our Priority
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We take data protection seriously with industry-leading security measures
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 justify-items-center">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="text-center max-w-sm w-full"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#EEF2FF' }}
                >
                  <Icon className="w-8 h-8" style={{ color: '#312E81' }} />
                </div>
                <h3 className="text-lg mb-2" style={{ color: '#312E81' }}>
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
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
