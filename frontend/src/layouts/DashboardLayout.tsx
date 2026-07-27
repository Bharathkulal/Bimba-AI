import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, FileText, Briefcase, Building, 
  User, Settings 
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { DashboardNavbar } from '../components/DashboardNavbar';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Resume', path: '/resume', icon: FileText },
    { label: 'Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Companies', path: '/companies', icon: Building },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#111111] flex overflow-x-hidden font-sans relative">
      {/* Decorative subtle gradient background blur */}
      <div className="absolute top-[-10%] left-[-15%] w-[45%] h-[45%] rounded-full bg-[#111111]/3 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[40%] h-[40%] rounded-full bg-[#111111]/3 blur-[120px] pointer-events-none z-0" />

      {/* Floating Hover-Collapsible Sidebar (Desktop/Tablet) */}
      <Sidebar 
        isMobileOpen={false}
        onCloseMobile={() => {}}
      />

      {/* Content Area Wrapper - Stable Left Padding on Desktop, bottom padding on mobile */}
      <div className="flex-grow min-h-screen flex flex-col z-10 w-full md:pl-28 pb-16 md:pb-0 transition-all duration-350">
        
        {/* Sticky Top Navbar */}
        <DashboardNavbar 
          onToggleMobileSidebar={() => {}}
        />
        
        {/* Main Content Pane with Lightweight Page Transition */}
        <main className="p-4 md:p-8 flex-grow pb-20 md:pb-8 w-full overflow-hidden">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Premium Bottom Navigation Tab Bar - MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar/95 backdrop-blur-lg border-t border-border py-2 px-3 flex items-center justify-around z-45 shadow-2xl">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === '/dashboard' 
            ? location.pathname === '/dashboard' 
            : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center py-1.5 px-2.5 relative cursor-pointer flex-1"
            >
              <Icon 
                size={18} 
                className={`transition-colors duration-200 ${
                  isActive ? 'text-[#111111]' : 'text-[#9CA3AF]'
                }`}
              />
              <span className={`text-[8.5px] mt-1 tracking-wide transition-colors duration-200 ${
                isActive ? 'text-[#111111] font-extrabold' : 'text-[#6B7280] font-medium'
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
