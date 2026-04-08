import { Bell, Mail } from "lucide-react";

const TopBar = () => (
  <header className="h-16 sticky top-0 bg-white backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-end z-40">
    <div className="flex items-center gap-5">
      <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-full transition-all relative">
        <Bell size={20} />
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
      </button>
      <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-full transition-all">
        <Mail size={20} />
      </button>
      <div className="flex items-center gap-3 pl-2">
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80"
            alt="Profile"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  </header>
);

export default TopBar;
