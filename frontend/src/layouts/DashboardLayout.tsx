import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, FileText, Bot, Settings, 
  LogOut, Sparkles, BarChart3
} from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { ThemeToggle } from '../components/ThemeToggle';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useUserStore((state) => state.logout);

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', sectionId: 'top', icon: Home },
    { label: 'Resume', path: '/dashboard', sectionId: 'resumes-section', icon: FileText },
    { label: 'AI Tools', path: '/dashboard', sectionId: 'ai-assistant-section', icon: Bot },
    { label: 'Career', path: '/dashboard', sectionId: 'career-tools-section', icon: Sparkles },
    { label: 'Analytics', path: '/dashboard', sectionId: 'analytics-section', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleNavClick = (item: typeof menuItems[0]) => {
    if (item.sectionId) {
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
        setTimeout(() => {
          const el = document.getElementById(item.sectionId!);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.getElementById(item.sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex overflow-x-hidden font-sans relative selection:bg-blue-600/10">
      {/* Decorative blurred glow elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0" />

      {/* Floating Vertical Navigation Dock - DESKTOP (Permanently Expanded) */}
      <aside className="hidden md:flex flex-col justify-between items-stretch py-7 px-5 bg-white border-r border-slate-200/60 h-screen fixed left-0 top-0 w-64 shadow-sm z-40">
        <div className="flex flex-col gap-8">
          {/* Logo / Bimba Dock Header */}
          <div className="flex items-center gap-3.5 px-1 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20 shrink-0">
              B
            </div>
            <span className="font-extrabold text-slate-900 text-xl tracking-tight whitespace-nowrap">
              Bimba AI
            </span>
          </div>

          {/* Dock Navigation List */}
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.sectionId 
                ? (location.pathname === '/dashboard' && !item.path.includes('/settings'))
                : location.pathname === item.path;

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className={`flex items-center w-full px-4 py-3.5 rounded-xl transition-all duration-250 relative group cursor-pointer ${
                    isActive 
                      ? 'text-blue-600 font-extrabold' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 font-bold'
                  }`}
                >
                  {/* Active Page Accent - Blue Pill Background */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-blue-50 border border-blue-200/50 shadow-sm pointer-events-none" />
                  )}

                  <div className="flex items-center shrink-0 justify-center w-6 h-6 z-10 relative">
                    <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-655'} />
                  </div>
                  
                  <span className="ml-3 text-[13px] tracking-wide whitespace-nowrap z-10">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dock Footer (Logout) */}
        <button
          onClick={() => logout()}
          className="flex items-center w-full px-4 py-3.5 rounded-xl text-red-650 hover:text-red-700 hover:bg-red-50 transition-all duration-250 cursor-pointer font-bold"
        >
          <div className="flex items-center shrink-0 justify-center w-6 h-6">
            <LogOut size={20} />
          </div>
          <span className="ml-3 text-[13px] tracking-wide whitespace-nowrap">
            Log Out
          </span>
        </button>
      </aside>

      {/* Floating Bottom Navigation Bar - MOBILE */}
      <nav className="md:hidden fixed bottom-4 inset-x-4 bg-white/80 border border-slate-200/60 backdrop-blur-xl rounded-2xl py-2.5 px-4 flex items-center justify-around z-40 shadow-xl shadow-slate-100/50">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = item.sectionId 
            ? (location.pathname === '/dashboard' && !item.path.includes('/settings'))
            : location.pathname === item.path;

          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className="flex flex-col items-center justify-center p-2 relative cursor-pointer"
            >
              <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
              {isActive && (
                <span className="absolute bottom-[-2px] w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
        {/* Mobile Settings Shortcut */}
        <button
          onClick={() => navigate('/settings')}
          className="flex flex-col items-center justify-center p-2 cursor-pointer"
        >
          <Settings size={18} className={location.pathname === '/settings' ? 'text-blue-600' : 'text-slate-400'} />
        </button>
      </nav>

      {/* Content wrapper */}
      <div className="flex-grow pl-0 md:pl-64 min-h-screen flex flex-col z-10 w-full">
        {/* Improved Top Navigation */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-16 flex items-center justify-between px-6 z-30 shadow-sm sticky top-0">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 tracking-tight uppercase">
            <span>Bimba AI Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>
        <main className="p-4 md:p-8 flex-grow pb-24 md:pb-8 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
