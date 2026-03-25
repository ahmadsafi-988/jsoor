"use client"
import { Building2 } from "lucide-react";

export function Partners() {
  const partners = [
    { name: "TechCorp", industry: "Technology" },
    { name: "FinanceHub", industry: "Finance" },
    { name: "MediCare Plus", industry: "Healthcare" },
    { name: "EduTech", industry: "Education" },
    { name: "RetailMax", industry: "Retail" },
    { name: "LogiFlow", industry: "Logistics" },
    { name: "GreenEnergy", industry: "Energy" },
    { name: "DesignStudio", industry: "Creative" },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <Building2 className="w-4 h-4" style={{ color: '#8B5CF6' }} />
            <span className="text-sm" style={{ color: '#8B5CF6' }}>Trusted Partners</span>
          </div>
          <h2 className="text-3xl sm:text-4xl mb-4" style={{ color: '#312E81' }}>
            Leading Companies Trust Us
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join over 500+ top companies already finding exceptional talent through our platform
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="group bg-white border rounded-xl p-6 hover:shadow-xl transition-all duration-300"
              style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: '#EEF2FF' }}
                >
                  <Building2 className="w-8 h-8" style={{ color: '#312E81' }} />
                </div>
                <div>
                  <h3 className="mb-1" style={{ color: '#312E81' }}>{partner.name}</h3>
                  <p className="text-sm text-muted-foreground">{partner.industry}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
