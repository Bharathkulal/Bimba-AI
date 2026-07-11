import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, FileText, LayoutTemplate, Bot, Award, BarChart3, Settings, 
  User, LogOut
} from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { ThemeToggle } from '../components/ThemeToggle';


export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useUserStore((state) => state.logout);
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { label: 'Home', path: '/dashboard', sectionId: 'top', icon: Home },
    { label: 'My Resumes', path: '/dashboard', sectionId: 'resumes-section', icon: FileText },
    { label: 'Templates', path: '/dashboard', sectionId: 'templates-section', icon: LayoutTemplate },
    { label: 'AI Assistant', path: '/dashboard', sectionId: 'ai-assistant-section', icon: Bot },
    { label: 'ATS Checker', path: '/dashboard', sectionId: 'ats-section', icon: Award },
    { label: 'Analytics', path: '/dashboard', sectionId: 'analytics-section', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleNavClick = (item: typeof menuItems[0]) => {
    if (item.sectionId) {
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
        setTimeout(() => {
          const el = document.getElementById(item.sectionId!);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.getElementById(item.sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex overflow-x-hidden font-sans relative selection:bg-blue-600/10">
      {/* Decorative blurred glow elements */}
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20 shrink-0">
              B
            </div>
            <AnimatePresence>
              {isHovered && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="font-extrabold text-slate-800 text-lg tracking-tight whitespace-nowrap"
                >
                  Bimba AI
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Dock Navigation List */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.sectionId 
                ? (location.pathname === '/dashboard' && !item.path.includes('/profile') && !item.path.includes('/settings'))
                : location.pathname === item.path;

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className={`flex items-center w-full px-3 py-3 rounded-xl transition-all duration-250 relative group cursor-pointer ${
                    isActive 
                      ? 'text-emerald-600' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                  }`}
                >
                  {/* Active Page Animated Glow Accent */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeGlowLight" 
                      className="absolute inset-0 rounded-xl bg-emerald-50 border border-emerald-200/50 shadow-sm pointer-events-none"
                    />
                  )}

                  <div className="flex items-center shrink-0 justify-center w-6 h-6 z-10 relative">
                    <Icon size={20} className={isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-655'} />
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
          onClick={() => logout()}
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
                Log Out
              </motion.span>
            )}
          </AnimatePresence>

          {!isHovered && (
            <div className="absolute left-20 bg-slate-900 border border-slate-800 text-red-500 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
              Log Out
            </div>
          )}
        </button>
      </motion.aside>

      {/* Floating Bottom Navigation Bar - MOBILE */}
      <nav className="md:hidden fixed bottom-4 inset-x-4 bg-white/80 border border-slate-200/60 backdrop-blur-xl rounded-2xl py-2.5 px-4 flex items-center justify-around z-40 shadow-xl shadow-slate-100/50">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = item.sectionId 
            ? (location.pathname === '/dashboard' && !item.path.includes('/profile') && !item.path.includes('/settings'))
            : location.pathname === item.path;

          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className="flex flex-col items-center justify-center p-2 relative cursor-pointer"
            >
              <Icon size={18} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
              {isActive && (
                <span className="absolute bottom-[-2px] w-1.5 h-1.5 rounded-full bg-emerald-600" />
              )}
            </button>
          );
        })}
        {/* Mobile Settings Shortcut */}
        <button
          onClick={() => navigate('/settings')}
          className="flex flex-col items-center justify-center p-2 cursor-pointer"
        >
          <Settings size={18} className={location.pathname === '/settings' ? 'text-emerald-600' : 'text-slate-400'} />
        </button>
      </nav>

      {/* Content wrapper */}
      <div className="flex-grow pl-0 md:pl-[84px] min-h-screen flex flex-col z-10 w-full">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-16 flex items-center justify-between px-6 z-30 shadow-sm sticky top-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span>Student Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>
        <main className="p-4 md:p-8 flex-grow pb-24 md:pb-8 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
