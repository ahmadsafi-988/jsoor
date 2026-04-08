import { Bookmark } from "lucide-react";
import { motion } from "motion/react";
import { Job } from "../types/jobs";

const JobCard = ({ job }: { job: Job; key?: string }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-xl hover:-translate-y-1 group ${
      job.isPromoted ? "border-primary/10 bg-slate-50/30" : "border-slate-100"
    }`}
  >
    <div className="flex justify-between items-start mb-5">
      <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center p-2 border border-slate-100 overflow-hidden">
        <img
          src={job.logo}
          alt={job.company}
          className="w-full h-full object-contain mix-blend-multiply"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex items-center gap-3">
        {job.isPromoted && (
          <span className="text-[10px] font-black uppercase tracking-widest bg-primary-fixed text-primary px-2 py-1 rounded-md">
            Promoted
          </span>
        )}
        <button className="text-slate-300 hover:text-red-500 transition-colors">
          <Bookmark size={20} />
        </button>
      </div>
    </div>

    <div className="mb-6">
      <h3 className="text-lg font-bold text-slate-900 font-headline group-hover:text-primary transition-colors">
        {job.title}
      </h3>
      <p className="text-sm font-semibold text-slate-500 mt-1">
        {job.company} • {job.location}
      </p>
      <p className="text-xs text-slate-400 mt-3 leading-relaxed line-clamp-2">
        {job.description}
      </p>
    </div>

    <div className="flex items-center justify-between pt-5 border-t border-slate-50">
      <span className="text-sm font-bold text-primary">{job.salary}</span>
      <div className="flex gap-2">
        <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
          Save
        </button>
        <button className="bg-primary text-white px-5 py-2 text-xs font-bold rounded-full hover:bg-primary-container transition-all shadow-md active:scale-95">
          Apply Now
        </button>
      </div>
    </div>
  </motion.div>
);

export default JobCard;
