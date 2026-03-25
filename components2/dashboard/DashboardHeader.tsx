import { Bell, Search, User } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search companies, positions..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all"
            style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}
          />
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4 ml-6">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5" style={{ color: '#1E1B4B' }} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#06B6D4' }} />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
          <div className="text-right">
            <p className="text-sm" style={{ color: '#312E81' }}>John Doe</p>
            <p className="text-xs text-muted-foreground">Computer Science</p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
            <User className="w-6 h-6" style={{ color: '#312E81' }} />
          </div>
        </div>
      </div>
    </header>
  );
}
