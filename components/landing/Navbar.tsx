"use client";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { JsoorLogo } from "@/components/JsoorLogo";

const navLinks = [
  { name: "Find Jobs", href: "#features" },
  { name: "For Employers", href: "#companies" },
  { name: "Community", href: "#testimonials" },
  { name: "Interview Simulator", href: "#how-it-works" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,168,107,0.08)] border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center py-4">

        {/* Logo */}
        <Link href="/" className="inline-flex items-center">
          <JsoorLogo className="h-10 w-auto" priority />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-neutral-600 font-medium font-headline tracking-tight hover:text-emerald-500 transition-colors duration-300"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/auth/sign-up"
            className="text-[#006d43] font-semibold font-headline tracking-tight hover:text-[#00a86b] transition-colors duration-300"
          >
            Sign Up
          </Link>
          <Link
            href="/auth/login"
            className="bg-[#006d43] text-white px-6 py-2 rounded-md font-semibold font-headline tracking-tight hover:bg-[#00a86b] transition-colors duration-300"
          >
            Log In
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white px-6 py-4">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={closeMenu}
                className="px-3 py-2.5 text-sm font-medium text-neutral-600 hover:text-[#006d43] hover:bg-emerald-50 rounded-lg transition-colors font-headline"
              >
                {link.name}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-neutral-100">
              <Link
                href="/auth/sign-up"
                onClick={closeMenu}
                className="px-4 py-2.5 text-sm font-semibold text-[#006d43] rounded-lg hover:bg-emerald-50 transition-colors font-headline"
              >
                Sign Up
              </Link>
              <Link
                href="/auth/login"
                onClick={closeMenu}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-[#006d43] hover:bg-[#00a86b] rounded-md transition-colors text-center font-headline"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
