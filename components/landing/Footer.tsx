import { JsoorLogo } from "@/components/JsoorLogo";

const footerLinks = [
  [
    { label: "Find Jobs",    href: "#features" },
    { label: "For Employers", href: "#companies" },
  ],
  [
    { label: "Community",           href: "#testimonials" },
    { label: "Interview Simulator", href: "#how-it-works" },
  ],
  [
    { label: "Privacy Policy", href: "#" },
    { label: "Contact",        href: "#" },
  ],
];

export function Footer() {
  return (
    <footer className="bg-neutral-950 w-full py-12">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-start gap-8">

        {/* Brand */}
        <div>
          <JsoorLogo variant="white" className="mb-4 h-9 w-auto" />
          <p className="text-neutral-400 text-sm leading-relaxed max-w-xs">
            © 2024 JSOOR. The Architectural Bridge to Your Career.
          </p>
        </div>

        {/* Link columns */}
        <div className="flex flex-wrap gap-8 md:gap-12">
          {footerLinks.map((col, i) => (
            <div key={i} className="flex flex-col space-y-3">
              {col.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-neutral-400 text-sm hover:text-white transition-colors opacity-80 hover:opacity-100"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
