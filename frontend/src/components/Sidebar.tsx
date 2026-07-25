import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, FileText, Briefcase, Building, 
  User, Settings, LogOut, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { useUserStore } from '../store/userStore';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useUserStore((state) => state.logout);

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

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full py-6 px-4 text-slate-300">
      <div className="flex flex-col gap-8">
        {/* Logo Section */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/20 shrink-0">
              B
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-white text-lg tracking-tight whitespace-nowrap">
                Bimba AI
              </span>
            )}
          </div>
          {/* Collapse toggle button for desktop/tablet */}
          <button 
            onClick={onToggleCollapse}
            className="hidden md:flex w-6 h-6 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Strict active check (must match location.pathname or be a subpath for jobs/resumes)
            const isActive = item.path === '/dashboard' 
              ? location.pathname === '/dashboard' 
              : location.pathname.startsWith(item.path);

            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.path)}
                className={`flex items-center w-full px-3.5 py-3 rounded-xl transition-all duration-200 relative group cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/10' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 font-medium'
                }`}
              >
                <div className="flex items-center shrink-0 justify-center w-5 h-5 relative z-10">
                  <Icon size={20} />
                </div>
                
                {!isCollapsed && (
                  <span className="text-[13px] tracking-wide ml-3 whitespace-nowrap z-10 transition-opacity duration-200">
                    {item.label}
                  </span>
                )}

                {/* Tooltip when collapsed */}
                {isCollapsed && (
                  <div className="absolute left-20 bg-slate-900 border border-slate-800 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
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
        className={`flex items-center px-3.5 py-3 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer font-semibold group overflow-hidden ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <div className="flex items-center shrink-0 justify-center w-5 h-5">
          <LogOut size={20} />
        </div>
        {!isCollapsed && (
          <span className="text-[13px] tracking-wide ml-3 whitespace-nowrap transition-opacity duration-200">
            Log Out
          </span>
        )}
        {isCollapsed && (
          <div className="absolute left-20 bg-slate-900 border border-slate-800 text-rose-400 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
            Log Out
          </div>
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Navigation Drawer (Fixed) */}
      <aside 
        className={`hidden md:block bg-[#111827] border-r border-slate-800 fixed left-4 top-4 bottom-4 z-40 rounded-[24px] shadow-2xl transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-[280px]'
        }`}
      >
        {sidebarContent}
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
        className={`md:hidden bg-[#111827] fixed top-0 bottom-0 left-0 w-[280px] z-50 shadow-2xl transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button 
          onClick={onCloseMobile}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
