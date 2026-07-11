import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Users, FileText, LayoutTemplate, Cpu, BarChart3, 
  Shield, FileSpreadsheet, Settings, LogOut, GraduationCap,
  Database, Building2, BookOpen, Megaphone, Mail, DownloadCloud,
  UserCheck, Activity, Bell, ChevronRight, User, ChevronDown
} from 'lucide-react';
import { adminService } from '../services/admin';
import { ThemeToggle } from '../components/ThemeToggle';


export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate, location]);

  // Session timeout implementation (15 mins inactivity)
  useEffect(() => {
    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        adminService.logout();
        alert("Session expired due to inactivity. Please log in again.");
        navigate('/admin/login');
      }, 15 * 60 * 1000); // 15 minutes
    };

    // Listen to user interactions
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);

    resetTimer(); // initialize

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [navigate]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'User Management': true, // Keep important ones expanded by default
    'Academic Management': true
  });

  const menuGroups = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: Home },
    {
      label: 'User Management',
      icon: Users,
      subItems: [
        { label: 'Students', path: '/admin/users' },
        { label: 'Admins', path: '/admin/admins' },
        { label: 'Detailed Profile Logs', path: '/admin/students' }
      ]
    },
    {
      label: 'Resume Management',
      icon: FileText,
      subItems: [
        { label: 'All Resumes', path: '/admin/resumes' },
        { label: 'Resume Templates', path: '/admin/templates' }
      ]
    },
    {
      label: 'Academic Management',
      icon: GraduationCap,
      subItems: [
        { label: 'Departments', path: '/admin/departments' },
        { label: 'Subjects', path: '/admin/subjects' },
        { label: 'Datasets Manager', path: '/admin/datasets' }
      ]
    },
    {
      label: 'AI Center',
      icon: Cpu,
      subItems: [
        { label: 'AI Configuration', path: '/admin/ai' }
      ]
    },
    {
      label: 'Communication',
      icon: Megaphone,
      subItems: [
        { label: 'Announcements', path: '/admin/announcements' },
        { label: 'Email Center', path: '/admin/email' }
      ]
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      subItems: [
        { label: 'Reports & Stats', path: '/admin/reports' },
        { label: 'System Monitor', path: '/admin/monitor' },
        { label: 'Audit Logs', path: '/admin/logs' }
      ]
    },
    {
      label: 'System Settings',
      icon: Settings,
      subItems: [
        { label: 'General Configuration', path: '/admin/settings' },
        { label: 'Security & Access', path: '/admin/security' },
        { label: 'Backups & Snapshots', path: '/admin/backups' }
      ]
    }
  ];

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }));
  };

  const handleLogout = () => {
    adminService.logout();
    navigate('/admin/login');
  };

  // Build breadcrumbs path array
  const pathParts = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex overflow-x-hidden font-sans relative selection:bg-blue-600/10 w-full">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none z-0" />

      {/* Floating Vertical Navigation Dock - DESKTOP */}
      <motion.aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ width: 84 }}
        animate={{ width: isHovered ? 240 : 84 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        className="hidden md:flex flex-col justify-between items-stretch py-6 px-4 bg-white/70 border-r border-slate-200/60 backdrop-blur-xl h-screen fixed left-0 top-0 z-40 origin-left shadow-lg shadow-slate-100/50"
      >
        <div className="flex flex-col gap-8">
          {/* Logo / Bimba Dock Header */}
          <div className="flex items-center gap-3.5 px-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
              A
            </div>
            <AnimatePresence>
              {isHovered && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="font-extrabold text-slate-800 text-base tracking-tight whitespace-nowrap"
                >
                  Admin Console
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Dock Navigation List */}
          <nav className="flex flex-col gap-1.5 overflow-y-auto no-scrollbar max-h-[calc(100vh-180px)] pr-1">
            {menuGroups.map((group) => {
              const Icon = group.icon;
              const hasSubItems = !!group.subItems;
              const isExpanded = !!expandedGroups[group.label];
              
              const isActive = group.path 
                ? location.pathname === group.path
                : group.subItems?.some(sub => location.pathname === sub.path);

              return (
                <div key={group.label} className="flex flex-col gap-0.5 w-full">
                  <button
                    onClick={() => {
                      if (!isHovered) {
                        setIsHovered(true);
                        if (hasSubItems) {
                          setExpandedGroups(prev => ({ ...prev, [group.label]: true }));
                        } else if (group.path) {
                          navigate(group.path);
                        }
                        return;
                      }
                      if (hasSubItems) {
                        toggleGroup(group.label);
                      } else if (group.path) {
                        navigate(group.path);
                      }
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-200 relative group cursor-pointer ${
                      isActive 
                        ? 'text-emerald-600 font-bold' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex items-center z-10">
                      <div className="flex items-center shrink-0 justify-center w-6 h-6 mr-3">
                        <Icon size={18} className={isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-655'} />
                      </div>
                      
                      {isHovered && (
                        <span className="text-xs font-bold tracking-wide whitespace-nowrap">
                          {group.label}
                        </span>
                      )}
                    </div>

                    {isHovered && hasSubItems && (
                      <ChevronDown 
                        size={12} 
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} text-slate-400`} 
                      />
                    )}

                    {!isHovered && (
                      <div className="absolute left-20 bg-slate-900 border border-slate-800 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
                        {group.label}
                      </div>
                    )}
                  </button>

                  {/* Render Sub Items if expanded */}
                  {hasSubItems && isExpanded && isHovered && (
                    <div className="pl-9 pr-1 flex flex-col gap-0.5 border-l border-slate-100 ml-6 mt-0.5">
                      {group.subItems.map((sub) => {
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <button
                            key={sub.label}
                            onClick={() => navigate(sub.path)}
                            className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-semibold transition-smooth ${
                              isSubActive 
                                ? 'text-emerald-600 bg-emerald-50/60 font-extrabold' 
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Dock Footer (Logout) */}
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-3 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-250 cursor-pointer relative group"
        >
          <div className="flex items-center shrink-0 justify-center w-6 h-6">
            <LogOut size={20} />
          </div>
          <AnimatePresence>
            {isHovered && (
              <motion.span 
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="ml-3 text-xs font-bold tracking-wide whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
          {!isHovered && (
            <div className="absolute left-20 bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>
      </motion.aside>

      {/* Main Workspace Frame with Sticky Header */}
      <div className="flex-grow flex flex-col min-h-screen md:pl-28 w-full relative z-10">
        {/* Sticky Header Topbar */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-16 flex items-center justify-between px-6 z-30 shadow-sm">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Bimba AI</span>
            {pathParts.map((part, index) => (
              <React.Fragment key={index}>
                <ChevronRight size={10} className="text-slate-350" />
                <span className={index === pathParts.length - 1 ? 'text-slate-800 font-extrabold' : ''}>{part}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Quick Info & Profile Info */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
              Super Admin
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
              <User size={14} />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow py-8 px-6 w-full">
          <Outlet />
        </main>
      </div>

    </div>
  );
};
export default AdminLayout;
