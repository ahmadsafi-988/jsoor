"use client"
import { Shield, Lock, FileCheck, Eye } from "lucide-react";

export function Trust() {
  const features = [
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your data is protected with 256-bit SSL encryption, the same security used by financial institutions.",
    },
    {
      icon: Lock,
      title: "Privacy First",
      description: "We never sell your data. Your information is only shared with companies you apply to.",
    },
    {
      icon: FileCheck,
      title: "GDPR Compliant",
      description: "Fully compliant with international data protection regulations and privacy laws.",
    },
    {
      icon: Eye,
      title: "Verified Companies",
      description: "Every company on our platform is thoroughly vetted to ensure legitimacy and quality.",
    },
  ];

  const certifications = [
    "ISO 27001 Certified",
    "SOC 2 Type II",
    "GDPR Compliant",
    "CCPA Compliant",
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="text-center"
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

        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-2xl mb-4" style={{ color: '#312E81' }}>
                Certified & Trusted
              </h3>
              <p className="text-muted-foreground mb-6">
                We maintain the highest standards of security and compliance to protect your information.
              </p>
              <div className="flex flex-wrap gap-3">
                {certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 rounded-lg bg-white border"
                    style={{ borderColor: 'rgba(49, 46, 129, 0.2)' }}
                  >
                    <span className="text-sm" style={{ color: '#312E81' }}>{cert}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#8B5CF6' }}
              >
                <Shield className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
