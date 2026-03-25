import { NavLink, Link } from "react-router";
import { User, FileText, Briefcase, Home, LogOut, Settings, ArrowLeft, Video } from "lucide-react";

export function DashboardSidebar() {
  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard", exact: true },
    { path: "/dashboard/profile", icon: User, label: "Profile" },
    { path: "/dashboard/assessments", icon: FileText, label: "Assessments" },
    { path: "/dashboard/matches", icon: Briefcase, label: "Job Matches" },
    { path: "/interview", icon: Video, label: "Interview Practice" },
  ];

  return (
    <aside className="w-64 bg-white border-r flex flex-col" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
        <Link to="/" className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#312E81' }}>
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold" style={{ color: '#312E81' }}>The Professional</h1>
            <p className="text-xs text-muted-foreground">Bridge</p>
          </div>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-foreground hover:bg-secondary'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { backgroundColor: '#312E81', color: 'white' }
                      : { color: '#1E1B4B' }
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t space-y-2" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-secondary"
          style={{ color: '#1E1B4B' }}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-red-50"
          style={{ color: '#EF4444' }}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}