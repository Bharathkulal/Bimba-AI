import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { DashboardNavbar } from '../components/DashboardNavbar';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex overflow-x-hidden font-sans relative">
      {/* Decorative subtle gradient background blur */}
      <div className="absolute top-[-10%] left-[-15%] w-[45%] h-[45%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none z-0" />

      {/* Floating Collapsible Sidebar */}
      <Sidebar 
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Content Area Wrapper */}
      <div 
        className={`flex-grow min-h-screen flex flex-col z-10 w-full transition-all duration-300 ${
          isCollapsed ? 'md:pl-24' : 'md:pl-[304px]'
        }`}
      >
        {/* Sticky Top Navbar */}
        <DashboardNavbar 
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />
        
        {/* Main Content Pane with Framer Motion Page Transition */}
        <main className="p-4 md:p-8 flex-grow pb-24 md:pb-8 w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
