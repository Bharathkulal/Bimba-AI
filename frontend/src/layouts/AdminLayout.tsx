import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Users, FileText, Cpu, GraduationCap, Megaphone, 
  Settings, LogOut, ChevronDown, Search, RefreshCw, Bell, ChevronRight,
  Briefcase, Building2, BarChart3
} from 'lucide-react';
import { adminService } from '../services/admin';
import { AdminCommandPalette } from '../components/AdminCommandPalette';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Resume Center': true,
    'Academic': false
  });

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate, location]);

  // Session timeout (15 mins inactivity)
  useEffect(() => {
    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        adminService.logout();
        alert("Session expired due to inactivity.");
        navigate('/admin/login');
      }, 15 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [navigate]);

  // Command Palette (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setToastMessage("Data synced successfully!");
      setTimeout(() => setToastMessage(null), 3000);
    }, 1200);
  };

  // Core Admin Sidebar modules
  const menuGroups = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Resumes', path: '/admin/resumes', icon: FileText },
    { label: 'Jobs', path: '/admin/jobs', icon: Briefcase },
    { label: 'Companies', path: '/admin/companies', icon: Building2 },
    { label: 'AI Center', path: '/admin/ai', icon: Cpu },
    { label: 'Communication', path: '/admin/announcements', icon: Megaphone },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'System Settings', path: '/admin/settings', icon: Settings }
  ];

  const handleLogout = () => {
    adminService.logout();
    navigate('/admin/login');
  };

  const breadcrumbs = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-slate-900 flex overflow-x-hidden font-sans relative selection:bg-slate-600/25 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border border-slate-200 bg-sidebar text-slate-900 animate-fadeIn text-xs font-semibold">
          <RefreshCw size={14} className="animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Command Palette */}
      <AdminCommandPalette 
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
      />

      {/* Collapsible Left Sidebar */}
      <aside 
        className={`hidden md:flex flex-col justify-between items-stretch py-6 px-4 bg-sidebar border-r border-border h-screen fixed left-0 top-0 z-40 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-[260px]'
        }`}
      >
        <div className="flex flex-col gap-6 overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 overflow-hidden">
            <div className="w-8.5 h-8.5 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow shrink-0">
              B
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-slate-900 text-sm tracking-tight whitespace-nowrap">
                Bimba Admin
              </span>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-160px)] pr-1">
            {menuGroups.map((group) => {
              const Icon = group.icon;
              const isActive = location.pathname === group.path;

              return (
                <div key={group.label} className="flex flex-col gap-0.5 w-full">
                  <button
                    onClick={() => {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                      }
                      navigate(group.path);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-200 relative group cursor-pointer ${
                      isActive 
                        ? 'bg-slate-900 text-white font-bold border-l-4 border-slate-900 pl-2' 
                        : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50 font-bold'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex items-center shrink-0 justify-center w-5 h-5 mr-3">
                        <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                      </div>
                      {!isCollapsed && (
                        <span className="text-xs font-bold tracking-wide whitespace-nowrap">
                          {group.label}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Logout button at bottom */}
        <button
          onClick={handleLogout}
          className={`flex items-center px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer font-bold ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={16} className="shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold ml-3">Log Out</span>}
        </button>
      </aside>

      {/* Main Content Area */}
      <div 
        className={`flex-grow min-h-screen flex flex-col z-10 w-full transition-all duration-300 ${
          isCollapsed ? 'md:pl-20' : 'md:pl-[260px]'
        }`}
      >
        {/* Top Navbar */}
        <header className="bg-sidebar/85 backdrop-blur-md border-b border-border h-15 flex items-center justify-between px-6 sticky top-0 z-30 shadow-md">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:block p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            </button>
            <nav className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 tracking-wide uppercase">
              <span>Admin Console</span>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb}>
                  <ChevronRight size={10} className="text-slate-650" />
                  <span className={idx === breadcrumbs.length - 1 ? 'text-slate-900 font-extrabold' : ''}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Quick Actions & Profile */}
          <div className="flex items-center gap-4">
            {/* Command Palette Trigger */}
            <button 
              onClick={() => setIsPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/50 border border-border text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <Search size={12} />
              <span className="text-[10px] font-bold">Search...</span>
              <kbd className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-border">Ctrl+K</kbd>
            </button>

            <button 
              onClick={triggerSync}
              className="p-1.8 bg-slate-100/50 hover:bg-slate-100 border border-border text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
              title="Sync Platform Databases"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            </button>

            <button className="p-1.8 bg-slate-100/50 hover:bg-slate-100 border border-border text-slate-400 hover:text-slate-900 relative cursor-pointer">
              <Bell size={13} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#111111]" />
            </button>

            <div className="w-[1px] h-4 bg-border" />

            {/* Profile badge */}
            <div className="flex items-center gap-2">
              <div className="w-7.5 h-7.5 rounded-xl bg-gradient-to-tr from-[#111111] to-[#111111] flex items-center justify-center text-white font-extrabold text-xs shadow">
                A
              </div>
              <div className="hidden xl:block text-left leading-none">
                <h5 className="font-extrabold text-xs text-slate-900">Administrator</h5>
                <span className="text-[9px] text-[#111111] block mt-0.5">Console Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 md:p-8 flex-grow w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
