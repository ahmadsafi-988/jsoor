"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does the JSOOR matching algorithm work?",
    answer:
      "Our AI-powered algorithm analyzes your skills, experience, education, and career preferences to match you with the most suitable opportunities. We consider factors like company culture, growth potential, and job requirements to ensure the best fit for both graduates and employers.",
  },
  {
    question: "Is JSOOR free for graduates?",
    answer:
      "Yes! Our basic plan is completely free for graduates. You can create a profile, apply to jobs, and access our matching algorithm at no cost. For advanced features like AI-powered recommendations and priority support, we offer a Professional plan.",
  },
  {
    question: "How long does it typically take to get hired?",
    answer:
      "On average, our graduates receive their first interview within 2 weeks and secure a position within 4–6 weeks. Our success rate shows that 95% of active users receive job offers within 3 months.",
  },
  {
    question: "What types of companies use your platform?",
    answer:
      "We partner with over 500 leading companies across various industries including technology, finance, healthcare, education, and more. Our partners range from fast-growing startups to Fortune 500 companies.",
  },
  {
    question: "Can I apply to multiple positions at once?",
    answer:
      "Absolutely! You can apply to multiple positions and track all your applications in one place, receiving real-time updates on your application status.",
  },
  {
    question: "How do you ensure the quality of job postings?",
    answer:
      "All companies on our platform are thoroughly vetted. We verify company credentials, review their hiring practices, and ensure they meet our standards for workplace culture and compensation.",
  },
  {
    question: "What happens after I create my profile?",
    answer:
      "Once you complete your profile, our AI algorithm starts working immediately. You'll receive personalized job recommendations, and your profile becomes visible to relevant employers.",
  },
  {
    question: "Do you offer support for resume writing and interview prep?",
    answer:
      "Yes! Members get access to our interview simulator, resume tips, and preparation resources built directly into the platform.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-[#f6f3f2]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#78fbb6]/20 border border-[#bccabe] mb-4">
            <span className="text-sm font-medium text-[#006d43]">FAQ</span>
          </div>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold text-[#1c1b1b] mb-4 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-[#3d4a41]">
            Everything you need to know about JSOOR.
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-[#e5e2e1] overflow-hidden"
            >
              <button
                className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
                  openIndex === index
                    ? "bg-white"
                    : "bg-white hover:bg-[#f6f3f2]"
                }`}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-sm font-medium text-[#1c1b1b] pr-6 font-headline">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#006d43] shrink-0 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? "max-h-64" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-5 pt-1 text-sm text-[#3d4a41] leading-relaxed bg-white">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[#3d4a41] mb-4">Still have questions?</p>
          <a
            href="mailto:ahmadmadisafi9@ieee.org"
            className="inline-flex px-6 py-2.5 text-sm font-semibold text-white bg-[#006d43] hover:bg-[#00a86b] rounded-xl transition-colors shadow-[0_8px_16px_rgba(0,109,67,0.15)]"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
