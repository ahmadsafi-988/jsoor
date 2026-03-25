"use client"
import { UserPlus, FileText, Search, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Create Your Profile",
    description: "Sign up and build your professional profile in minutes. Add your education, skills, projects, and career goals.",
  },
  {
    icon: FileText,
    number: "02",
    title: "Get Matched",
    description: "Our smart algorithm analyzes your profile and matches you with relevant opportunities from top companies.",
  },
  {
    icon: Search,
    number: "03",
    title: "Connect & Apply",
    description: "Review matched opportunities, connect directly with recruiters, and apply to positions that excite you.",
  },
  {
    icon: CheckCircle,
    number: "04",
    title: "Land Your Dream Job",
    description: "Interview with companies, negotiate offers, and start your professional journey with confidence.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20" style={{ backgroundColor: '#EEF2FF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <span className="text-sm" style={{ color: '#8B5CF6' }}>
              How It Works
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl mb-4" style={{ color: '#312E81' }}>
            Your Path to Professional Success
          </h2>
          <p className="text-lg text-muted-foreground">
            Four simple steps to connect with your ideal employer and launch your career.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-[60%] w-full h-0.5 bg-border z-0"></div>
                )}
                
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border-2 mb-4" style={{ borderColor: '#06B6D4' }}>
                    <Icon className="w-8 h-8" style={{ color: '#06B6D4' }} />
                  </div>
                  
                  <div className="mb-2" style={{ color: '#06B6D4', fontSize: '14px', opacity: 0.6 }}>
                    STEP {step.number}
                  </div>
                  
                  <h3 className="text-xl mb-3" style={{ color: '#312E81' }}>
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm">
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