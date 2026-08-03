import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, FileText, Briefcase, Building, 
  User, Settings, Clock
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { DashboardNavbar } from '../components/DashboardNavbar';
import { useThemeStore } from '../store/themeStore';
import { NotificationToastContainer } from '../components/notifications/NotificationToast';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Resume', path: '/resume', icon: FileText },
    { label: 'Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Companies', path: '/companies', icon: Building },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const mobileMenuItems = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Resume', path: '/resume', icon: FileText },
    { label: 'Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Applications', path: '/jobs/applications', icon: Clock },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div 
      className={`min-h-screen flex flex-col font-sans relative transition-colors duration-300 bg-background ${
        isDark ? 'text-white' : 'text-slate-900'
      }`}
    >
      {/* Drawer Overlay Sidebar (Controlled by 3-line Hamburger Menu) */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Page Layout */}
      <div className="flex-grow min-h-screen flex flex-col w-full pb-16 md:pb-0">
        
        {/* Full-Width Sticky Top Header Navbar */}
        <DashboardNavbar 
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />
        
        {/* Full-Width Dashboard Content Container */}
        <main className="w-full flex-grow p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Notification Toasts (fixed bottom-right) */}
      <NotificationToastContainer />

      {/* Mobile Bottom Navigation Tab Bar */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t py-2 px-3 flex items-center justify-around z-30 shadow-2xl transition-colors duration-300 ${
        isDark 
          ? 'bg-[#0F172A]/95 border-white/10' 
          : 'bg-white/95 border-slate-200'
      }`}>
        {mobileMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === '/dashboard' 
            ? location.pathname === '/dashboard' 
            : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center py-1.5 px-2 cursor-pointer flex-1"
            >
              <Icon 
                size={18} 
                className={`transition-colors duration-200 ${
                  isActive 
                    ? 'text-slate-900 dark:text-white' 
                    : 'text-slate-400'
                }`}
              />
              <span className={`text-[9px] mt-1 tracking-wide transition-colors duration-200 ${
                isActive 
                  ? 'text-slate-900 dark:text-white font-extrabold' 
                  : 'text-slate-500 font-medium'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

    </div>
  );
};

export default DashboardLayout;
