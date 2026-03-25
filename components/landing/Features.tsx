"use client"
import { Briefcase, Users, Target, Award, Shield, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Smart Matching",
    description: "Our AI-powered algorithm matches you with opportunities that align with your skills, experience, and career goals.",
  },
  {
    icon: Users,
    title: "Profile Building",
    description: "Create a comprehensive professional profile that showcases your education, projects, and achievements.",
  },
  {
    icon: Briefcase,
    title: "Direct Connections",
    description: "Connect directly with hiring managers and recruiters from top companies looking for fresh talent.",
  },
  {
    icon: Award,
    title: "Verified Companies",
    description: "All companies on our platform are thoroughly verified to ensure legitimate opportunities.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is protected with enterprise-grade security. Control who sees your profile.",
  },
  {
    icon: TrendingUp,
    title: "Career Insights",
    description: "Get real-time market insights, salary data, and career progression paths in your field.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <span className="text-sm" style={{ color: '#8B5CF6' }}>
              Features
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl mb-4" style={{ color: '#312E81' }}>
            Everything You Need to Launch Your Career
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful tools designed to help graduates and companies find their perfect match.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-xl border border-border hover:shadow-lg transition-all hover:border-primary/20 bg-white"
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#DBEAFE' }}
                >
                  <Icon className="w-6 h-6" style={{ color: '#06B6D4' }} />
                </div>
                <h3 className="text-xl mb-2" style={{ color: '#312E81' }}>
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
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