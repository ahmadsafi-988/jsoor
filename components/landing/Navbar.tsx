"use client";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to close menu on mobile after clicking a link
  const closeMenu = () => setMobileMenuOpen(false);

  // Clean scroll to top without adding '#' to the URL
  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    // Ensure URL is clean if a hash was already there
    if (window.location.hash) {
      window.history.pushState({}, document.title, window.location.pathname);
    }
    closeMenu();
  };

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Blog", href: "#blog" },
    { name: "For Students", href: "#students" },
    { name: "For Companies", href: "#companies" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo - Now a button to prevent URL hash issues */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#312E81" }}
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span
              className="text-xl font-semibold"
              style={{ color: "#312E81" }}
            >
              JSOOR
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-foreground hover:text-primary transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <button
                className="px-4 py-2 rounded-lg transition-colors"
                style={{ color: "#312E81" }}
              >
                Sign In
              </button>
            </Link>
            <Link href="/register">
              <button
                className="px-6 py-2 rounded-lg text-white transition-all hover:shadow-lg"
                style={{ backgroundColor: "#06B6D4" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#0891B2")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#06B6D4")
                }
              >
                Get Started
              </button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" style={{ color: "#312E81" }} />
            ) : (
              <Menu className="w-6 h-6" style={{ color: "#312E81" }} />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={closeMenu}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4">
                <Link href="/login" onClick={closeMenu}>
                  <button
                    className="w-full px-4 py-2 rounded-lg transition-colors text-left"
                    style={{ color: "#312E81" }}
                  >
                    Sign In
                  </button>
                </Link>
                <Link href="/register" onClick={closeMenu}>
                  <button
                    className="w-full px-6 py-2 rounded-lg text-white transition-all"
                    style={{ backgroundColor: "#06B6D4" }}
                  >
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}