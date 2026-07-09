import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, User, Settings, LogOut } from 'lucide-react';
import { useUserStore } from '../store/userStore';

export const Sidebar: React.FC = () => {
  const logout = useUserStore((state) => state.logout);

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Resume Builder', path: '/resume-builder', icon: FileText },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-200/80 min-h-screen p-6 flex flex-col justify-between fixed left-0 top-0 z-20">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-500/20">
            B
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">Bimba AI</span>
        </div>

        {/* Menu Navigation */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-smooth ${
                    isActive
                      ? 'bg-primary text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-smooth cursor-pointer w-full text-left"
      >
        <LogOut size={18} />
        <span>Log Out</span>
      </button>
    </aside>
  );
};
