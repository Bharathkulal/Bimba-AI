import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, FileText, Briefcase, Building, 
  User, Settings, LogOut, X
} from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useThemeStore } from '../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useUserStore((state) => state.logout);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Resume', path: '/resume', icon: FileText },
    { label: 'Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Companies', path: '/companies', icon: Building },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const sidebarContent = (isDesktop: boolean) => {
    const showExpanded = isDesktop ? isHovered : true;
    const springConfig = { type: 'spring', stiffness: 200, damping: 25 };

    return (
      <div className={`flex flex-col justify-between h-full py-6 px-4 transition-colors duration-300 ${
        isDark ? 'text-[#D1D5DB]' : 'text-[#4B5563]'
      }`}>
        <div className="flex flex-col gap-8">
          {/* Logo Section */}
          <div className="flex items-center px-2 overflow-hidden shrink-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-2xl shrink-0 transition-colors duration-300 ${
              isDark ? 'bg-[#FFFFFF] text-[#111827]' : 'bg-[#111111] text-[#FFFFFF]'
            }`}>
              B
            </div>
            <motion.span 
              initial={false}
              animate={{ 
                opacity: showExpanded ? 1 : 0, 
                x: showExpanded ? 0 : -12, 
                scale: showExpanded ? 1 : 0.96,
                maxWidth: showExpanded ? 150 : 0,
                marginLeft: showExpanded ? 14 : 0,
              }}
              transition={springConfig}
              className={`font-extrabold text-lg tracking-tight whitespace-nowrap overflow-hidden ${isDark ? 'text-white' : 'text-[#111111]'}`}
            >
              Bimba AI
            </motion.span>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = item.path === '/dashboard' 
                ? location.pathname === '/dashboard' 
                : location.pathname.startsWith(item.path);

              let activeClass = 'bg-[#111111] text-[#FFFFFF] font-semibold shadow-sm';
              let inactiveClass = 'text-[#4B5563] hover:text-[#111111] hover:bg-[#F3F4F6] font-medium';

              if (isDark) {
                activeClass = 'bg-[#FFFFFF] text-[#111827] font-semibold shadow-sm rounded-2xl';
                inactiveClass = 'text-[#D1D5DB] hover:text-white hover:bg-white/10 font-medium rounded-2xl';
              }

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center w-full px-3.5 py-3 transition-colors duration-200 relative group cursor-pointer ${
                    isActive ? activeClass : inactiveClass
                  }`}
                >
                  <div className="flex items-center shrink-0 justify-center w-5 h-5 relative z-10">
                    <Icon size={20} />
                  </div>
                  
                  <motion.span 
                    initial={false}
                    animate={{ 
                      opacity: showExpanded ? 1 : 0, 
                      x: showExpanded ? 0 : -12, 
                      scale: showExpanded ? 1 : 0.96,
                      maxWidth: showExpanded ? 180 : 0,
                      marginLeft: showExpanded ? 12 : 0,
                    }}
                    transition={{ 
                      ...springConfig, 
                      delay: showExpanded ? index * 0.05 + 0.05 : 0 
                    }}
                    className="text-[13px] tracking-wide whitespace-nowrap z-10 overflow-hidden"
                  >
                    {item.label}
                  </motion.span>

                  {/* Tooltip when collapsed */}
                  {!showExpanded && (
                    <div className="absolute left-20 bg-[#111111] dark:bg-[#FFFFFF] dark:text-[#111827] text-[#FFFFFF] px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Footer */}
        <button
          onClick={() => logout()}
          className={`flex items-center px-3.5 py-3 rounded-xl transition-colors duration-200 cursor-pointer font-semibold relative group overflow-hidden ${
            isDark 
              ? 'text-[#D1D5DB] hover:bg-white/10 hover:text-white' 
              : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111111]'
          }`}
        >
          <div className="flex items-center shrink-0 justify-center w-5 h-5">
            <LogOut size={20} />
          </div>
          <motion.span 
            initial={false}
            animate={{ 
              opacity: showExpanded ? 1 : 0, 
              x: showExpanded ? 0 : -12, 
              scale: showExpanded ? 1 : 0.96,
              maxWidth: showExpanded ? 180 : 0,
              marginLeft: showExpanded ? 12 : 0,
            }}
            transition={{ 
              ...springConfig, 
              delay: showExpanded ? menuItems.length * 0.05 + 0.05 : 0 
            }}
            className="text-[13px] tracking-wide whitespace-nowrap overflow-hidden"
          >
            Log Out
          </motion.span>
          {!showExpanded && (
            <div className="absolute left-20 bg-[#111111] dark:bg-[#FFFFFF] dark:text-[#111827] text-[#FFFFFF] px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
              Log Out
            </div>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Navigation Drawer (Fixed + Hover Expand) */}
      <motion.aside 
        layout
        initial={false}
        animate={{ width: isHovered ? 280 : 80 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:block fixed left-4 top-4 bottom-4 z-40 rounded-[24px] shadow-sm border overflow-hidden ${
          isDark 
            ? 'bg-[#111827]/80 backdrop-blur-xl border-white/5 shadow-2xl' 
            : 'bg-[#FFFFFF] border-[#E5E7EB]'
        }`}
      >
        {sidebarContent(true)}
      </motion.aside>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onCloseMobile}
            className="md:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-45"
          />
        )}
      </AnimatePresence>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside 
            initial={{ x: '-100%', opacity: 0, scale: 0.96 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: '-100%', opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className={`md:hidden fixed top-0 bottom-0 left-0 w-[280px] z-50 shadow-2xl border-r overflow-hidden ${
              isDark 
                ? 'bg-[#111827]/90 backdrop-blur-xl border-white/5' 
                : 'bg-[#FFFFFF] border-[#E5E7EB]'
            }`}
            style={{ borderTopRightRadius: 24, borderBottomRightRadius: 24 }}
          >
            <button 
              onClick={onCloseMobile}
              className={`absolute top-4 right-4 cursor-pointer z-50 ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              <X size={20} />
            </button>
            {sidebarContent(false)}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
