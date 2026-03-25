"use client"
import { Check, X } from "lucide-react";

export function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "0",
      description: "Perfect for exploring the platform",
      features: [
        "Create basic profile",
        "Apply to 5 jobs/month",
        "Basic matching algorithm",
        "Email support",
      ],
      limitations: [
        "No AI-powered recommendations",
        "No priority support",
        "Limited profile visibility",
      ],
      highlighted: false,
    },
    {
      name: "Professional",
      price: "29",
      description: "For serious job seekers",
      features: [
        "Everything in Free",
        "Unlimited job applications",
        "AI-powered job matching",
        "Priority profile visibility",
        "Resume builder & templates",
        "Interview preparation tools",
        "24/7 Priority support",
      ],
      limitations: [],
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For companies hiring at scale",
      features: [
        "Unlimited candidate access",
        "Advanced AI screening",
        "Dedicated account manager",
        "Custom integrations",
        "Analytics dashboard",
        "Bulk hiring tools",
        "API access",
        "White-label options",
      ],
      limitations: [],
      highlighted: false,
    },
  ];

  return (
    <section className="py-20" style={{ backgroundColor: '#EEF2FF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <span className="text-sm" style={{ color: '#8B5CF6' }}>Simple Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl mb-4" style={{ color: '#312E81' }}>
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're a graduate looking for your first role or a company building your team
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl p-8 ${
                plan.highlighted ? 'ring-2 shadow-2xl' : 'border'
              } transition-all duration-300 hover:shadow-xl`}
              style={
                plan.highlighted
                  ? { borderColor: '#8B5CF6', ringColor: '#8B5CF6' }
                  : { borderColor: 'rgba(49, 46, 129, 0.1)' }
              }
            >
              {plan.highlighted && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm text-white"
                  style={{ backgroundColor: '#8B5CF6' }}
                >
                  Most Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl mb-2" style={{ color: '#312E81' }}>
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  {plan.price === "Custom" ? (
                    <span className="text-4xl" style={{ color: '#312E81' }}>Custom</span>
                  ) : (
                    <>
                      <span className="text-5xl" style={{ color: '#312E81' }}>${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </>
                  )}
                </div>
              </div>

              <button
                className="w-full py-3 rounded-lg mb-8 transition-all"
                style={
                  plan.highlighted
                    ? { backgroundColor: '#06B6D4', color: 'white' }
                    : { backgroundColor: '#EEF2FF', color: '#312E81' }
                }
              >
                {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
              </button>

              <div className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#8B5CF6' }} />
                    <span className="text-sm" style={{ color: '#1E1B4B' }}>{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation, idx) => (
                  <div key={idx} className="flex items-start gap-3 opacity-50">
                    <X className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#6B7280' }} />
                    <span className="text-sm text-muted-foreground">{limitation}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
