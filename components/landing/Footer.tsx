import { GraduationCap } from "lucide-react";
import { FaLinkedin, FaTwitter, FaFacebook, FaInstagram } from "react-icons/fa";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#312E81' }}>
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold" style={{ color: '#312E81' }}>
                JSOOR
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Connecting talented graduates with leading companies worldwide.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                <FaLinkedin className="w-4 h-4" style={{ color: '#312E81' }} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                <FaTwitter className="w-4 h-4" style={{ color: '#312E81' }} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                <FaFacebook className="w-4 h-4" style={{ color: '#312E81' }} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                <FaInstagram className="w-4 h-4" style={{ color: '#312E81' }} />
              </a>
            </div>
          </div>

          {/* For Students */}
          <div>
            <h4 className="mb-4 font-semibold" style={{ color: '#312E81' }}>For Students</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#students" className="hover:text-primary transition-colors">Create Profile</a></li>
              <li><a href="#hero" className="hover:text-primary transition-colors">Browse Jobs</a></li>
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">Career Resources</a></li>
              <li><a href="#testimonials" className="hover:text-primary transition-colors">Success Stories</a></li>
            </ul>
          </div>

          {/* For Companies */}
          <div>
            <h4 className="mb-4 font-semibold" style={{ color: '#312E81' }}>For Companies</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#companies" className="hover:text-primary transition-colors">Post Jobs</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Find Talent</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Enterprise</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 font-semibold" style={{ color: '#312E81' }}>Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} JSOOR. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}