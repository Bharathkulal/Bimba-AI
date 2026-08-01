import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, FileText, Briefcase, Building, 
  User, Settings, LogOut, X, Sparkles
} from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useThemeStore } from '../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useUserStore((state) => state.logout);
  const user = useUserStore((state) => state.user);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Resume Studio', path: '/resume', icon: FileText },
    { label: 'Job Recommendations', path: '/jobs', icon: Briefcase },
    { label: 'Companies', path: '/companies', icon: Building },
    { label: 'My Profile', path: '/profile', icon: User },
    { label: 'Account Settings', path: '/settings', icon: Settings },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose();
  };

  const getDisplayName = () => {
    if (!user) return 'Student';
    const email = user.personal_email || '';
    const prefix = email.split('@')[0];
    const name = prefix.replace(/[0-9_.]/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1).trim();
  };
  const displayName = getDisplayName();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Backdrop Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
          />

          {/* Drawer Sidebar Menu */}
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed top-0 bottom-0 left-0 w-80 z-50 shadow-2xl flex flex-col justify-between border-r overflow-y-auto ${
              isDark 
                ? 'bg-[#0F172A] border-white/10 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div>
              {/* Header inside Sidebar */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl text-white bg-slate-900 dark:bg-white dark:text-slate-900 shadow-sm shrink-0">
                    B
                  </div>
                  <div>
                    <h2 className="font-black text-lg tracking-tight leading-none text-slate-900 dark:text-white">
                      Bimba AI
                    </h2>
                    <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase block mt-1">
                      Reflect Your Best Self
                    </span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isDark 
                      ? 'text-slate-400 hover:text-white hover:bg-white/10' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  aria-label="Close sidebar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="p-4 flex flex-col gap-1.5">
                <div className="px-3 py-2 text-[10px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                  Navigation
                </div>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.path === '/dashboard' 
                    ? location.pathname === '/dashboard' 
                    : location.pathname.startsWith(item.path);

                  let activeStyle = 'bg-slate-900 text-white font-semibold shadow-sm';
                  let inactiveStyle = 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium';

                  if (isDark) {
                    activeStyle = 'bg-white text-slate-900 font-semibold shadow-sm';
                    inactiveStyle = 'text-slate-400 hover:text-white hover:bg-white/5 font-medium';
                  }

                  return (
                    <button
                      key={item.label}
                      onClick={() => handleNavClick(item.path)}
                      className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-sm ${
                        isActive ? activeStyle : inactiveStyle
                      }`}
                    >
                      <Icon size={20} className={isActive ? (isDark ? 'text-slate-900' : 'text-white') : ''} />
                      <span className="font-semibold tracking-wide">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* User Account & Logout Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3">
              <div className={`p-3 rounded-2xl flex items-center gap-3 border ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden text-left">
                  <p className="font-bold text-xs truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.personal_email}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-xs transition-colors cursor-pointer"
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
