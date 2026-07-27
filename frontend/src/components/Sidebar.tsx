import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, FileText, Briefcase, Building, 
  User, Settings, LogOut, X
} from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useThemeStore } from '../store/themeStore';

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
    return (
      <div className={`flex flex-col justify-between h-full py-6 px-4 transition-colors duration-300 ${
        isDark ? 'text-[#D1D5DB]' : 'text-[#4B5563]'
      }`}>
        <div className="flex flex-col gap-8">
          {/* Logo Section */}
          <div className="flex items-center px-2 overflow-hidden shrink-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[#FFFFFF] font-black text-2xl shrink-0 transition-colors duration-300 ${
              isDark ? 'bg-[#10B981]' : 'bg-[#111111]'
            }`}>
              B
            </div>
            <span className={`font-extrabold text-lg tracking-tight ml-3.5 whitespace-nowrap transition-all duration-300 ease-in-out ${
              showExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 overflow-hidden pointer-events-none'
            } ${isDark ? 'text-white' : 'text-[#111111]'}`}>
              Bimba AI
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/dashboard' 
                ? location.pathname === '/dashboard' 
                : location.pathname.startsWith(item.path);

              let activeClass = 'bg-[#111111] text-[#FFFFFF] font-semibold shadow-sm';
              let inactiveClass = 'text-[#4B5563] hover:text-[#111111] hover:bg-[#F3F4F6] font-medium';

              if (isDark) {
                activeClass = 'bg-[#10B981] text-[#FFFFFF] font-semibold shadow-sm rounded-2xl';
                inactiveClass = 'text-[#D1D5DB] hover:text-white hover:bg-[#10B981]/15 font-medium rounded-2xl';
              }

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center w-full px-3.5 py-3 transition-all duration-200 relative group cursor-pointer ${
                    isActive ? activeClass : inactiveClass
                  }`}
                >
                  <div className="flex items-center shrink-0 justify-center w-5 h-5 relative z-10">
                    <Icon size={20} />
                  </div>
                  
                  <span className={`text-[13px] tracking-wide whitespace-nowrap z-10 transition-all duration-350 ease-in-out ${
                    showExpanded ? 'opacity-100 max-w-[180px] ml-3' : 'opacity-0 max-w-0 overflow-hidden pointer-events-none'
                  }`}>
                    {item.label}
                  </span>

                  {/* Tooltip when collapsed */}
                  {!showExpanded && (
                    <div className="absolute left-20 bg-[#111111] dark:bg-[#10B981] text-[#FFFFFF] px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
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
          className={`flex items-center px-3.5 py-3 rounded-xl transition-all duration-200 cursor-pointer font-semibold relative group overflow-hidden ${
            isDark 
              ? 'text-[#D1D5DB] hover:bg-[#10B981]/10 hover:text-white' 
              : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111111]'
          }`}
        >
          <div className="flex items-center shrink-0 justify-center w-5 h-5">
            <LogOut size={20} />
          </div>
          <span className={`text-[13px] tracking-wide whitespace-nowrap transition-all duration-350 ease-in-out ${
            showExpanded ? 'opacity-100 max-w-[180px] ml-3' : 'opacity-0 max-w-0 overflow-hidden pointer-events-none'
          }`}>
            Log Out
          </span>
          {!showExpanded && (
            <div className="absolute left-20 bg-[#111111] dark:bg-[#10B981] text-[#FFFFFF] px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
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
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:block fixed left-4 top-4 bottom-4 z-40 rounded-[24px] shadow-sm transition-all duration-300 ease-in-out border ${
          isDark 
            ? 'bg-[#111827]/80 backdrop-blur-xl border-white/5 shadow-2xl' 
            : 'bg-[#FFFFFF] border-[#E5E7EB]'
        } ${isHovered ? 'w-[280px]' : 'w-20'}`}
      >
        {sidebarContent(true)}
      </aside>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-45"
        />
      )}

      {/* Mobile Navigation Drawer */}
      <aside 
        className={`md:hidden fixed top-0 bottom-0 left-0 w-[280px] z-50 shadow-2xl transition-transform duration-300 ease-in-out border-r ${
          isDark 
            ? 'bg-[#111827]/90 backdrop-blur-xl border-white/5' 
            : 'bg-[#FFFFFF] border-[#E5E7EB]'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button 
          onClick={onCloseMobile}
          className={`absolute top-4 right-4 cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          <X size={20} />
        </button>
        {sidebarContent(false)}
      </aside>
    </>
  );
};

export default Sidebar;
