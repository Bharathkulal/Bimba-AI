import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Users, FileText, Cpu, GraduationCap, Megaphone, 
  Settings, LogOut, ChevronDown, Search, RefreshCw, Bell, ChevronRight
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

  // 7 Core Sidebar modules ONLY
  const menuGroups = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { label: 'Students', path: '/admin/students', icon: Users },
    {
      label: 'Resume Center',
      icon: FileText,
      subItems: [
        { label: 'All Resumes', path: '/admin/resumes' },
        { label: 'Resume Templates', path: '/admin/templates' }
      ]
    },
    {
      label: 'Academic',
      icon: GraduationCap,
      subItems: [
        { label: 'Departments', path: '/admin/departments' },
        { label: 'Subjects', path: '/admin/subjects' }
      ]
    },
    { label: 'AI Center', path: '/admin/ai', icon: Cpu },
    { label: 'Communication', path: '/admin/announcements', icon: Megaphone },
    { label: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }));
  };

  const handleLogout = () => {
    adminService.logout();
    navigate('/admin/login');
  };

  const breadcrumbs = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-[#08130D] text-white flex overflow-x-hidden font-sans relative selection:bg-emerald-600/25 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/20 bg-[#102117] text-[#22C55E] animate-fadeIn text-xs font-semibold">
          <RefreshCw size={14} className="animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Command Palette */}
      <AdminCommandPalette 
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
      />

      {/* Collapsible Vercel-style Left Sidebar */}
      <aside 
        className={`hidden md:flex flex-col justify-between items-stretch py-6 px-4 bg-[#102117] border-r border-white/5 h-screen fixed left-0 top-0 z-40 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-[260px]'
        }`}
      >
        <div className="flex flex-col gap-6 overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 overflow-hidden">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#22C55E] flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0">
              B
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-white text-sm tracking-tight whitespace-nowrap">
                Bimba Admin
              </span>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-160px)] pr-1">
            {menuGroups.map((group) => {
              const Icon = group.icon;
              const hasSubItems = !!group.subItems;
              const isExpanded = !!expandedGroups[group.label];
              
              const isActive = group.path 
                ? location.pathname === group.path
                : group.subItems?.some(sub => location.pathname === sub.path);

              return (
                <div key={group.label} className="flex flex-col gap-0.5 w-full">
                  <button
                    onClick={() => {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                      }
                      if (hasSubItems) {
                        toggleGroup(group.label);
                      } else if (group.path) {
                        navigate(group.path);
                      }
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-200 relative group cursor-pointer ${
                      isActive 
                        ? 'bg-[#16A34A]/10 text-[#22C55E] font-bold' 
                        : 'text-[#B3B3B3] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex items-center shrink-0 justify-center w-5 h-5 mr-3">
                        <Icon size={16} className={isActive ? 'text-[#22C55E]' : 'text-[#B3B3B3]'} />
                      </div>
                      {!isCollapsed && (
                        <span className="text-xs font-bold tracking-wide whitespace-nowrap">
                          {group.label}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && hasSubItems && (
                      <ChevronDown 
                        size={12} 
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} text-slate-500`} 
                      />
                    )}
                  </button>

                  {/* Render Nested Submenus */}
                  {hasSubItems && isExpanded && !isCollapsed && (
                    <div className="pl-6 mt-1 flex flex-col gap-0.5 border-l border-white/5 ml-5">
                      {group.subItems?.map((sub) => {
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <button
                            key={sub.label}
                            onClick={() => navigate(sub.path)}
                            className={`w-full text-left py-2 px-3 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              isSubActive 
                                ? 'text-[#22C55E] bg-[#16A34A]/5 font-extrabold' 
                                : 'text-[#B3B3B3] hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
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
        <header className="bg-[#102117]/85 backdrop-blur-md border-b border-white/5 h-15 flex items-center justify-between px-6 sticky top-0 z-30 shadow-md">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:block p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            </button>
            <nav className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 tracking-wide uppercase">
              <span>Admin Console</span>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb}>
                  <ChevronRight size={10} className="text-slate-650" />
                  <span className={idx === breadcrumbs.length - 1 ? 'text-white font-extrabold' : ''}>
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
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[#B3B3B3] hover:text-white cursor-pointer"
            >
              <Search size={12} />
              <span className="text-[10px] font-bold">Search...</span>
              <kbd className="text-[9px] font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/5">Ctrl+K</kbd>
            </button>

            <button 
              onClick={triggerSync}
              className="p-1.8 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Sync Platform Databases"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            </button>

            <button className="p-1.8 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-slate-400 hover:text-white relative cursor-pointer">
              <Bell size={13} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            </button>

            <div className="w-[1px] h-4 bg-white/10" />

            {/* Profile badge */}
            <div className="flex items-center gap-2">
              <div className="w-7.5 h-7.5 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#22C55E] flex items-center justify-center text-white font-extrabold text-xs shadow">
                A
              </div>
              <div className="hidden xl:block text-left leading-none">
                <h5 className="font-extrabold text-xs text-white">Administrator</h5>
                <span className="text-[9px] text-[#22C55E] block mt-0.5">Console Admin</span>
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
