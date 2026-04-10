import { Search, Bell, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/ask', { state: { initialQuery: searchQuery } });
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Get initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="h-16 min-h-16 bg-dark-800/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decisions, documents, or ask a question..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700/40 border border-white/5 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-purple/40 focus:ring-1 focus:ring-accent-purple/20 transition-all interactive-element"
          />
        </div>
      </form>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-6">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl bg-dark-700/50 border border-white/5 text-gray-400 hover:text-white hover:border-white/10 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent-rose rounded-full border-2 border-dark-800" />
        </button>

        {/* Profile + Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-white/5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-200">{user?.name || 'User'}</p>
            <p className="text-[11px] text-gray-500 truncate max-w-32">{user?.email || ''}</p>
          </div>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-teal flex items-center justify-center">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
          {/* Logout button */}
          <button
            id="topbar-logout-btn"
            onClick={handleLogout}
            title="Sign out"
            className="p-2 rounded-xl bg-dark-700/50 border border-white/5 text-gray-500 hover:text-accent-rose hover:border-accent-rose/20 hover:bg-accent-rose/10 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
