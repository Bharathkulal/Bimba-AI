import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, Users, FileText, GraduationCap, Briefcase, Building2, 
  ClipboardList, Megaphone, BarChart3, User, Settings, LogOut, ChevronRight, Menu
} from 'lucide-react';
import { adminService } from '../services/admin';
import { useThemeStore } from '../store/themeStore';

export const PlacementLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const role = localStorage.getItem('admin_role');
    if (!token || role !== 'placement_officer') {
      navigate('/placement/login');
    }
  }, [navigate, location]);

  const menuGroups = [
    { label: 'Dashboard', path: '/placement', icon: Home },
    { label: 'Students', path: '/placement/students', icon: GraduationCap },
    { label: 'Campus Drives', path: '/placement/drives', icon: Briefcase },
    { label: 'Companies', path: '/placement/companies', icon: Building2 },
    { label: 'Resumes', path: '/placement/resume-verification', icon: FileText },
    { label: 'Applications', path: '/placement/applications', icon: ClipboardList },
    { label: 'Announcements', path: '/placement/announcements', icon: Megaphone },
    { label: 'Reports & Export', path: '/placement/reports', icon: BarChart3 },
    { label: 'Profile', path: '/placement/profile', icon: User },
    { label: 'Settings', path: '/placement/settings', icon: Settings }
  ];

  const handleLogout = () => {
    adminService.logout();
    localStorage.removeItem('admin_role');
    navigate('/placement/login');
  };

  const breadcrumbs = location.pathname.split('/').filter(Boolean);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0F172A] text-white shadow-black/20' : 'bg-slate-50 text-slate-900'} flex overflow-x-hidden font-sans relative w-full`}>
      {/* Collapsible Left Sidebar */}
      <aside 
        className={`hidden md:flex flex-col justify-between items-stretch py-6 px-4 border-r h-screen fixed left-0 top-0 z-40 transition-all duration-300 ${
          isDark ? 'bg-[#0B0F19] border-white/10' : 'bg-white border-slate-200'
        } ${
          isCollapsed ? 'w-20' : 'w-[260px]'
        }`}
      >
        <div className="flex flex-col gap-6 overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 overflow-hidden">
            <div className="w-8.5 h-8.5 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow shrink-0">
              P
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-sm tracking-tight whitespace-nowrap">
                Placement Officer
              </span>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-160px)] pr-1">
            {menuGroups.map((group) => {
              const Icon = group.icon;
              const isActive = location.pathname === group.path;

              return (
                <div key={group.label} className="flex flex-col gap-0.5 w-full">
                  <button
                    onClick={() => {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                      }
                      navigate(group.path);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-200 relative group cursor-pointer ${
                      isActive 
                        ? (isDark ? 'bg-emerald-600/20 text-emerald-400 font-bold border-l-4 border-emerald-500 pl-2' : 'bg-emerald-50 text-emerald-600 font-bold border-l-4 border-emerald-600 pl-2') 
                        : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5 font-bold' : 'text-slate-450 hover:text-slate-950 hover:bg-slate-50 font-bold')
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex items-center shrink-0 justify-center w-5 h-5 mr-3">
                        <Icon size={16} className={isActive ? 'text-emerald-500' : 'text-slate-450'} />
                      </div>
                      {!isCollapsed && (
                        <span className="text-xs font-bold tracking-wide whitespace-nowrap">
                          {group.label}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Logout button at bottom */}
        <button
          onClick={handleLogout}
          className={`flex items-center px-3 py-2.5 rounded-xl text-rose-450 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer font-bold ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={16} className="shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold ml-3">Log Out</span>}
        </button>
      </aside>

      {/* Main Content Area */}
      <div 
        className={`flex-grow min-h-screen flex flex-col z-10 w-full transition-all duration-300 ${
          isCollapsed ? 'md:pl-20' : 'md:pl-[260px]'
        }`}
      >
        {/* Top Navbar */}
        <header className={`border-b h-15 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm ${
          isDark ? 'bg-[#0B0F19]/85 border-white/10 backdrop-blur-md' : 'bg-white/85 border-slate-200 backdrop-blur-md'
        }`}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <Menu size={16} />
            </button>
            <nav className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 tracking-wide uppercase">
              <span>Placement Portal</span>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb}>
                  <ChevronRight size={10} className="text-slate-450" />
                  <span className={idx === breadcrumbs.length - 1 ? (isDark ? 'text-white' : 'text-slate-900') : ''}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Bimba AI
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow p-6 w-full max-w-7xl mx-auto flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default PlacementLayout;
