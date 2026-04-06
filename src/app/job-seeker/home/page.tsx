"use client";

import { useState } from "react";

import {
  Bell,
  Mail,
  Search,
  MapPin,
  Bookmark,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MOCK_JOBS } from "../../../../data/jobs";
import { Job } from "../../../../types/jobs";
import TopBar from "../../../../components/TopBar";
import JobCard from "../../../../components/JobCard";

export default function JobSeekerHomePage() {
  const [activeFilter, setActiveFilter] = useState("Full-time");
  const filters = ["Full-time", "Hybrid", "Remote"];

  return (
    <main className=" min-h-screen flex flex-col">
      <TopBar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-10 py-3">
        {/* Hero Section */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-10"
          >
            <h2 className="text-5xl font-extrabold text-primary font-headline tracking-tight mb-4 leading-tight">
              Discover Your Next Chapter.
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
              Tailored opportunities for executive leaders and specialized
              professionals, curated with editorial precision.
            </p>
          </motion.div>

          {/* Search Bar */}
          <div className="relative max-w-4xl bg-white p-2.5 rounded-3xl shadow-2xl shadow-primary/5 flex items-center gap-2 border border-slate-100">
            <div className="flex-1 flex items-center px-5 gap-4">
              <Search size={22} className="text-slate-300" />
              <input
                type="text"
                placeholder="Search for jobs, companies, or people"
                className="w-full border-none focus:ring-0 text-lg py-3 placeholder:text-slate-300 font-medium"
              />
            </div>
            <div className="h-10 w-px bg-slate-100 hidden md:block" />
            <div className="hidden md:flex items-center px-6 gap-3 text-slate-500">
              <MapPin size={20} className="text-slate-300" />
              <span className="text-sm font-semibold whitespace-nowrap">
                New York, NY
              </span>
            </div>
            <button className="bg-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-primary-container transition-all shadow-lg active:scale-95">
              Find Job
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">
              Job Type:
            </span>
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeFilter === filter
                    ? "bg-primary text-white shadow-md"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200/20"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        {/* Jobs Feed */}
        <section className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <span className="text-sm text-slate-400 font-bold tracking-wide">
              SHOWING 124 OPPORTUNITY MATCHES
            </span>
            <button className="flex items-center gap-2 text-sm font-bold text-primary hover:opacity-70 transition-opacity">
              Sort by: Relevance
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {MOCK_JOBS.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-16 flex justify-center">
            <button className="px-10 py-4 border-2 border-slate-100 text-primary font-bold rounded-full hover:bg-slate-50 transition-all flex items-center gap-3 group">
              Load More Opportunities
              <ChevronDown
                size={18}
                className="group-hover:translate-y-1 transition-transform"
              />
            </button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-100 bg-slate-50/50 py-12 px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h4 className="font-headline font-bold text-primary mb-1">
              Executive Curator
            </h4>
            <p className="text-xs text-slate-400">
              © 2024 Executive Curator. Editorial precision for your career.
            </p>
          </div>
          <div className="flex gap-8">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
              (link) => (
                <a
                  key={link}
                  href="#"
                  className="text-xs font-bold text-slate-400 hover:text-primary transition-colors"
                >
                  {link}
                </a>
              ),
            )}
          </div>
        </div>
      </footer>
    </main>
  );
}
