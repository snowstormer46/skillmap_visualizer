import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Search,
  FileText,
  Map as MapIcon,
  Briefcase,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { cn } from './lib/utils';
import { useTheme } from './context/ThemeContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarExpanded, setSidebarExpanded, targetRole, setTargetRole } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = () => {
      fetch('/api/user', { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && !data.error) setUser(data);
        })
        .catch(() => { });
    };

    fetchUser();

    const handleUserUpdate = (e: any) => {
      setUser(e.detail);
    };

    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Analyze', path: '/analyze', icon: Search },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Roadmap', path: '/roadmap', icon: MapIcon },
    { name: 'Projects', path: '/projects', icon: Briefcase },
    { name: 'Skills', path: '/skills', icon: BadgeCheck },
  ];

  // Auto-collapse sidebar on mobile when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
    // On mobile, keep sidebar collapsed if expanded by desktop
    if (window.innerWidth < 768) setSidebarExpanded(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      localStorage.removeItem('isLoggedIn');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-navy-800/50 backdrop-blur-xl transition-all duration-300 md:relative",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        sidebarExpanded ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <MapIcon size={20} />
            </div>
            {sidebarExpanded && <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SkillMap</h1>}
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white"
                )}
              >
                <Icon size={20} className={cn(isActive ? "text-white" : "group-hover:text-primary dark:group-hover:text-white")} />
                {sidebarExpanded && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-white/10">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white transition-all",
              location.pathname === '/settings' && "bg-slate-100 dark:bg-white/5 text-primary dark:text-white"
            )}
          >
            <Settings size={20} />
            {sidebarExpanded && <span className="font-medium text-sm">Settings</span>}
          </Link>

          <div className="mt-4 flex items-center gap-3 p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
            <div className="size-10 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden ring-2 ring-primary/20">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            {sidebarExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{user?.name || 'Loading...'}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Pro Plan</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 md:px-8 bg-white/80 dark:bg-black/10 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsMobileMenuOpen(true);
                  setSidebarExpanded(true); // Auto expand when opening mobile menu
                } else {
                  setSidebarExpanded(!sidebarExpanded);
                }
              }}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden md:block" />
            <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5 relative group min-w-0">
              <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">Target:</span>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-transparent text-[10px] md:text-sm font-semibold text-slate-900 dark:text-white outline-none cursor-pointer appearance-none pr-4 md:pr-6 max-w-[80px] sm:max-w-none truncate"
              >
                <option value="Backend Developer" className="bg-white dark:bg-navy-900">Backend Developer</option>
                <option value="Frontend Developer" className="bg-white dark:bg-navy-900">Frontend Developer</option>
                <option value="Fullstack Engineer" className="bg-white dark:bg-navy-900">Fullstack Engineer</option>
                <option value="Data Scientist" className="bg-white dark:bg-navy-900">Data Scientist</option>
                <option value="DevOps Engineer" className="bg-white dark:bg-navy-900">DevOps Engineer</option>
                <option value="Mobile Developer" className="bg-white dark:bg-navy-900">Mobile Developer</option>
                <option value="Artificial Intelligence / Machine Learning Engineer" className="bg-white dark:bg-navy-900">Artificial Intelligence / Machine Learning Engineer</option>
                <option value="Cybersecurity Engineer" className="bg-white dark:bg-navy-900">Cybersecurity Engineer</option>
                <option value="Cloud Engineer" className="bg-white dark:bg-navy-900">Cloud Engineer</option>
                <option value="Product Manager" className="bg-white dark:bg-navy-900">Product Manager</option>
                <option value="UI/UX Designer" className="bg-white dark:bg-navy-900">UI/UX Designer</option>
                <option value="Robotics Engineer" className="bg-white dark:bg-navy-900">Robotics Engineer</option>
                <option value="Blockchain Developer" className="bg-white dark:bg-navy-900">Blockchain Developer</option>
                <option value="AI Prompt Engineer" className="bg-white dark:bg-navy-900">AI Prompt Engineer</option>
                <option value="Digital Marketing Specialist" className="bg-white dark:bg-navy-900">Digital Marketing Specialist</option>
                <option value="Business Analyst" className="bg-white dark:bg-navy-900">Business Analyst</option>
                <option value="Data Engineer" className="bg-white dark:bg-navy-900">Data Engineer</option>
                <option value="IoT Engineer" className="bg-white dark:bg-navy-900">IoT Engineer</option>
              </select>
              <ChevronDown size={12} className="text-slate-500 absolute right-2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(o => !o)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
              >
                <Bell size={20} />
              </button>

              {notificationOpen && (
                <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-72 glass-panel rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl z-50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Notifications</span>
                    <button onClick={() => setNotificationOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-3">
                    <div className="size-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400">
                      <Bell size={22} />
                    </div>
                    <p className="text-sm font-bold text-slate-500">No new notifications</p>
                    <p className="text-xs text-slate-400">You're all caught up! 🎉</p>
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden md:block" />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
            >
              <LogOut size={20} />
              <span className="text-sm font-bold hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
