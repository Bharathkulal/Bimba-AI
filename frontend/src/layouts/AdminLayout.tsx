import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Users, FileText, LayoutTemplate, Cpu, BarChart3, 
  Shield, FileSpreadsheet, Settings, LogOut,
  Database, Building2, BookOpen, Megaphone, Mail, DownloadCloud,
  UserCheck, Activity, Bell
} from 'lucide-react';
import { adminService } from '../services/admin';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate, location]);

  // Session timeout implementation (15 mins inactivity)
  useEffect(() => {
    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        adminService.logout();
        alert("Session expired due to inactivity. Please log in again.");
        navigate('/admin/login');
      }, 15 * 60 * 1000); // 15 minutes
    };

    // Listen to user interactions
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);

    resetTimer(); // initialize

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [navigate]);

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Resumes', path: '/admin/resumes', icon: FileText },
    { label: 'Datasets', path: '/admin/datasets', icon: Database },
    { label: 'Departments', path: '/admin/departments', icon: Building2 },
    { label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { label: 'Email Center', path: '/admin/email', icon: Mail },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Backups', path: '/admin/backups', icon: DownloadCloud },
    { label: 'Admin Roles', path: '/admin/admins', icon: UserCheck },
    { label: 'System Monitor', path: '/admin/monitor', icon: Activity },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Templates', path: '/admin/templates', icon: LayoutTemplate },
    { label: 'AI Management', path: '/admin/ai', icon: Cpu },
    { label: 'Security', path: '/admin/security', icon: Shield },
    { label: 'Logs', path: '/admin/logs', icon: FileSpreadsheet },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    adminService.logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex overflow-x-hidden font-sans relative selection:bg-blue-600/10 w-full">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none z-0" />

      {/* Floating Vertical Navigation Dock - DESKTOP */}
      <motion.aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ width: 84 }}
        animate={{ width: isHovered ? 240 : 84 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        className="hidden md:flex flex-col justify-between items-stretch py-6 px-4 bg-white/70 border-r border-slate-200/60 backdrop-blur-xl h-screen fixed left-0 top-0 z-40 origin-left shadow-lg shadow-slate-100/50"
      >
        <div className="flex flex-col gap-8">
          {/* Logo / Bimba Dock Header */}
          <div className="flex items-center gap-3.5 px-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
              A
            </div>
            <AnimatePresence>
              {isHovered && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="font-extrabold text-slate-800 text-base tracking-tight whitespace-nowrap"
                >
                  Admin Console
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Dock Navigation List */}
          <nav className="flex flex-col gap-1.5 overflow-y-auto no-scrollbar max-h-[calc(100vh-180px)] pr-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center w-full px-3 py-3 rounded-xl transition-all duration-250 relative group cursor-pointer ${
                    isActive 
                      ? 'text-blue-600' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                  }`}
                >
                  {/* Active Page Animated Glow Accent */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeGlowLightAdmin" 
                      className="absolute inset-0 rounded-xl bg-blue-50 border border-blue-200/50 shadow-sm pointer-events-none"
                    />
                  )}

                  <div className="flex items-center shrink-0 justify-center w-6 h-6 z-10 relative">
                    <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-650'} />
                  </div>
                  
                  <AnimatePresence>
                    {isHovered && (
                      <motion.span 
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="ml-3 text-xs font-bold tracking-wide whitespace-nowrap z-10"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Icon tooltip when collapsed */}
                  {!isHovered && (
                    <div className="absolute left-20 bg-slate-900 border border-slate-800 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dock Footer (Logout) */}
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-3 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-250 cursor-pointer relative group"
        >
          <div className="flex items-center shrink-0 justify-center w-6 h-6">
            <LogOut size={20} />
          </div>
          <AnimatePresence>
            {isHovered && (
              <motion.span 
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="ml-3 text-xs font-bold tracking-wide whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
          {!isHovered && (
            <div className="absolute left-20 bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>
      </motion.aside>

      {/* Main Workspace Frame */}
      <main className="flex-grow min-h-screen py-10 px-6 md:pl-28 transition-all duration-300 w-full relative z-10">
        <Outlet />
      </main>

    </div>
  );
};
export default AdminLayout;
