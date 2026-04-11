import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, GitFork,
  Database, ClipboardList, Brain, Activity, LogOut, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { path: '/ask', name: 'Ask AI', icon: MessageSquare },
  { path: '/graph', name: 'Knowledge Graph', icon: GitFork },
  { path: '/sources', name: 'Data Sources', icon: Database },
  { path: '/decisions', name: 'Decisions', icon: ClipboardList },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Get initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className="w-64 min-w-64 bg-dark-800 border-r border-white/5 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-purple to-accent-teal flex items-center justify-center pulse-glow">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">OrgMemory</h1>
            <p className="text-[11px] text-gray-500 font-medium tracking-wide uppercase">Reasoning Engine</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-accent-purple/15 text-accent-purple-light border border-accent-purple/20 shadow-lg shadow-accent-purple-glow'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="px-3 pb-3">
        <div className="p-4 rounded-xl bg-gradient-to-br from-accent-purple/10 to-accent-teal/5 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-accent-emerald" />
            <span className="text-xs font-semibold text-gray-300">System Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
            <span className="text-xs text-accent-emerald font-medium">All systems online</span>
          </div>
          <p className="text-[10px] text-gray-600 mt-2">AI Engine • Vector DB • Graph Store</p>
        </div>
      </div>

      {/* User section */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple/60 to-accent-teal/60 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-200 truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email || ''}</p>
          </div>
          {/* Logout */}
          <button
            id="logout-btn"
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-gray-600 hover:text-accent-rose hover:bg-accent-rose/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
