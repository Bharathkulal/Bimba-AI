import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Settings, LogOut, Menu } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useThemeStore } from '../store/themeStore';
import { apiClient } from '../services/api';

interface DashboardNavbarProps {
  onToggleSidebar: () => void;
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const logout = useUserStore((state) => state.logout);
  const user = useUserStore((state) => state.user);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [notificationCount, setNotificationCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getDisplayName = () => {
    if (!user) return 'Student';
    const email = user.personal_email || '';
    const prefix = email.split('@')[0];
    const name = prefix.replace(/[0-9_.]/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1).trim();
  };
  const displayName = getDisplayName();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifRes = await apiClient.get('/api/analytics/notifications');
        setNotificationCount(notifRes.data.unread_count || 0);
      } catch (err) {
        console.error("Error loading notification count:", err);
      }
    };
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Robust Outside Click Handler to close Profile Dropdown when user clicks anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className={`h-16 w-full flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shadow-sm border-b transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0F172A]/90 backdrop-blur-xl border-white/10 text-white shadow-black/20' 
        : 'bg-white/90 backdrop-blur-md border-slate-200/80 text-slate-900 shadow-slate-100'
    }`}>
      {/* Left Section: 3-line Hamburger Menu Toggle + Brand Logo */}
      <div className="flex items-center gap-3">
        {/* 3-line Hamburger Menu Toggle Button (Desktop/Tablet Only) */}
        <button
          onClick={onToggleSidebar}
          className={`hidden md:flex p-2.5 rounded-xl transition-all duration-200 cursor-pointer items-center justify-center border ${
            isDark 
              ? 'bg-white/5 border-white/10 text-slate-200 hover:text-white hover:bg-white/10 hover:border-white/20' 
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
          }`}
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        {/* Integrated Brand Logo */}
        <div 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg text-white bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            B
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight leading-none bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Bimba AI
            </span>
            <span className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase leading-none mt-0.5">
              Placement Portal
            </span>
          </div>
        </div>
      </div>

      {/* Right Side Options */}
      <div className="flex items-center gap-4">
        {/* Notifications Button */}
        <button 
          onClick={() => navigate('/notifications')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative cursor-pointer border ${
            isDark 
              ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10' 
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
          }`}
          title="Notifications"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
          )}
        </button>
        
        <div className={`w-[1px] h-5 transition-colors duration-300 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

        {/* User Account Profile with Dropdown (wrapped with dropdownRef) */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 pl-1 cursor-pointer focus:outline-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left leading-none">
              <h5 className={`font-bold text-xs transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-800'}`}>{displayName}</h5>
              <span className="text-[9.5px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block tracking-wide uppercase">
                Plus Member
              </span>
            </div>
          </button>

          {/* Profile Dropdown Card */}
          {isDropdownOpen && (
            <div className={`absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl py-2 z-50 border transition-all duration-300 ${
              isDark 
                ? 'bg-[#0F172A] border-white/10 text-white' 
                : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                <p className="text-xs font-extrabold">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.personal_email}</p>
              </div>
              <button
                onClick={() => {
                  navigate('/profile');
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2.5 font-semibold cursor-pointer transition-colors duration-200 ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                }`}
              >
                <User size={15} className="text-emerald-500" />
                My Profile
              </button>
              <button
                onClick={() => {
                  navigate('/settings');
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2.5 font-semibold cursor-pointer transition-colors duration-200 ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                }`}
              >
                <Settings size={15} className="text-emerald-500" />
                Account Settings
              </button>
              <div className="border-t border-slate-100 dark:border-white/5 my-1" />
              <button
                onClick={() => {
                  logout();
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2.5 font-bold cursor-pointer"
              >
                <LogOut size={15} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
