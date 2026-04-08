"use client"
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does The Professional Bridge matching algorithm work?",
      answer: "Our AI-powered algorithm analyzes your skills, experience, education, and career preferences to match you with the most suitable opportunities. We consider factors like company culture, growth potential, and job requirements to ensure the best fit for both graduates and employers."
    },
    {
      question: "Is The Professional Bridge free for graduates?",
      answer: "Yes! Our basic plan is completely free for graduates. You can create a profile, apply to jobs, and access our matching algorithm at no cost. For advanced features like AI-powered recommendations and priority support, we offer a Professional plan at $29/month."
    },
    {
      question: "How long does it typically take to get hired?",
      answer: "On average, our graduates receive their first interview within 2 weeks and secure a position within 4-6 weeks. However, this varies based on your field, location, and the current job market. Our success rate shows that 95% of active users receive job offers within 3 months."
    },
    {
      question: "What types of companies use your platform?",
      answer: "We partner with over 500 leading companies across various industries including technology, finance, healthcare, education, and more. Our partners range from fast-growing startups to Fortune 500 companies, all committed to hiring fresh talent."
    },
    {
      question: "Can I apply to multiple positions at once?",
      answer: "Absolutely! With our Professional plan, you can apply to unlimited positions. Our platform also allows you to track all your applications in one place and receive real-time updates on your application status."
    },
    {
      question: "How do you ensure the quality of job postings?",
      answer: "All companies on our platform are thoroughly vetted. We verify company credentials, review their hiring practices, and ensure they meet our standards for workplace culture and compensation. We also monitor feedback from graduates to maintain high-quality partnerships."
    },
    {
      question: "What happens after I create my profile?",
      answer: "Once you complete your profile, our AI algorithm starts working immediately. You'll receive personalized job recommendations, and your profile becomes visible to relevant employers. You can also browse and apply to positions directly."
    },
    {
      question: "Do you offer support for resume writing and interview prep?",
      answer: "Yes! Professional plan members get access to our resume builder with industry-specific templates, interview preparation resources, and tips from career experts. Enterprise clients receive dedicated coaching and support."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <span className="text-sm" style={{ color: '#8B5CF6' }}>FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl mb-4" style={{ color: '#312E81' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about The Professional Bridge
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border rounded-xl overflow-hidden transition-all"
              style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-opacity-50 transition-colors"
                style={{ backgroundColor: openIndex === index ? '#EEF2FF' : 'white' }}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="pr-8" style={{ color: '#312E81' }}>
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  style={{ color: '#8B5CF6' }}
                />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-5 text-muted-foreground">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <button
            className="px-6 py-3 rounded-lg text-white transition-all hover:shadow-lg"
            style={{ backgroundColor: '#06B6D4' }}
          >
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
}
