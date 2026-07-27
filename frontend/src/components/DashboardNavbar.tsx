import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, User, Settings, LogOut, Menu } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useThemeStore } from '../store/themeStore';
import { ThemeToggle } from './ThemeToggle';
import { apiClient } from '../services/api';

interface DashboardNavbarProps {
  onToggleMobileSidebar: () => void;
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ onToggleMobileSidebar }) => {
  const navigate = useNavigate();
  const logout = useUserStore((state) => state.logout);
  const user = useUserStore((state) => state.user);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [notificationCount, setNotificationCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getDisplayName = () => {
    if (!user) return 'Student';
    const email = user.personal_email;
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

  return (
    <header className={`h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm transition-all duration-300 border-b ${
      isDark 
        ? 'bg-[#111827]/80 backdrop-blur-xl border-white/5' 
        : 'bg-white/80 backdrop-blur-md border-slate-200/80'
    }`}>
      {/* Logo Header */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 text-xs font-black tracking-wider uppercase transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          <span>Bimba AI</span>
        </div>
      </div>

      {/* Right Side Options */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button 
          onClick={() => navigate('/notifications')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative cursor-pointer border ${
            isDark 
              ? 'bg-[#1F2937]/50 border-white/5 text-slate-355 hover:text-white' 
              : 'bg-slate-50 border-slate-200/50 text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell size={16} />
          {notificationCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#111111] dark:bg-[#FFFFFF] shadow-sm" />
          )}
        </button>
        
        <div className={`w-[1px] h-5 transition-colors duration-300 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
        
        {/* Theme Toggle */}
        <ThemeToggle />
        
        <div className={`w-[1px] h-5 transition-colors duration-300 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

        {/* User Account Profile with Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 pl-1 cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-[#111111] dark:bg-[#FFFFFF] dark:text-[#111827] text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left leading-none">
              <h5 className={`font-bold text-xs transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-800'}`}>{displayName}</h5>
              <span className="text-[9px] font-semibold text-[#111111] dark:text-[#D1D5DB] mt-0.5 block">Plus Member</span>
            </div>
          </button>

          {/* Profile Dropdown Card */}
          {isDropdownOpen && (
            <>
              <div 
                onClick={() => setIsDropdownOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div className={`absolute right-0 mt-3 w-52 rounded-2xl shadow-xl py-2 z-50 border transition-all duration-300 ${
                isDark 
                  ? 'bg-[#1F2937] border-white/5 text-white' 
                  : 'bg-white border-slate-200/80 text-slate-855'
              }`}>
                <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5">
                  <p className="text-xs font-bold">{displayName}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.personal_email}</p>
                </div>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2.5 font-medium cursor-pointer transition-colors duration-200 ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <User size={14} className="text-slate-400" />
                  My Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2.5 font-medium cursor-pointer transition-colors duration-200 ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <Settings size={14} className="text-slate-400" />
                  Account Settings
                </button>
                <div className="border-t border-slate-100 dark:border-white/5 my-1" />
                <button
                  onClick={() => {
                    logout();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2.5 font-semibold cursor-pointer"
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
