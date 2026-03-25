import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JSOOR | Smart Internship & Skills Matching",
  description: "Connecting fresh graduates with top companies through AI and skill assessments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Added font-sans to utilize your Geist font, flex col keeps the footer at bottom */}
      <body className="min-h-full flex flex-col font-sans">
        
        {/* GLOBAL HEADER (Trust & Navigation) */}
        <header className="bg-primary text-primary-foreground py-4 px-8 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
            {/* Logo / Brand */}
            <h1 className="text-2xl font-bold tracking-wider">JSOOR</h1>
            
            {/* Navigation Links */}
            <nav className="space-x-6 flex items-center text-sm font-medium">
              <a href="/job-seeker" className="hover:opacity-80 transition">Find Internships</a>
              <a href="/login" className="hover:opacity-80 transition">Log In</a>
              
              {/* Accent Button (Directing Action) */}
              <a 
                href="/signup" 
                className="bg-accent text-accent-foreground px-5 py-2 rounded-md font-semibold hover:opacity-90 transition shadow-sm"
              >
                Sign Up
              </a>
            </nav>
          </div>
        </header>

        {/* MAIN CONTENT AREA (Where your individual pages will render) */}
        <main className="flex-grow max-w-7xl mx-auto w-full p-8">
          {children}
        </main>

        {/* GLOBAL FOOTER */}
        <footer className="bg-surface border-t border-gray-200 dark:border-gray-800 py-6 text-center text-sm text-muted">
          <p>© {new Date().getFullYear()} JSOOR Platform. All rights reserved.</p>
        </footer>

      </body>
    </html>
  );
}