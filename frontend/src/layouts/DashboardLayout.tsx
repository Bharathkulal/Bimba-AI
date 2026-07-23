import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, FileText, Sparkles, Briefcase, Building, 
  MessageSquare, BarChart3, Folder, Bell, Settings, 
  LogOut, Search, Moon, Sun, ArrowLeft, ArrowRight, 
  Send, CheckCircle2, User, ChevronRight, Menu, X,
  BadgeAlert, ChevronDown, Mail, ShieldAlert, Award
} from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useThemeStore } from '../store/themeStore';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const { theme, toggleTheme } = useThemeStore();
  
  // Navigation & UI States
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Search input and dropdown refs for closing on click outside
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    { 
      sender: 'ai', 
      text: "👋 Hi there! I'm Bimba, your AI Career OS Assistant. I've audited your career profile. Your ATS score is looking good, but we can optimize it further. What would you like to build or find today?", 
      time: 'Just Now' 
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const getDisplayName = () => {
    if (!user) return 'Career Builder';
    const email = user.personal_email;
    const prefix = email.split('@')[0];
    const name = prefix.replace(/[0-9_.]/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1).trim();
  };
  const displayName = getDisplayName();

  const menuItems = [
    { label: 'Home', path: '/dashboard', sectionId: 'welcome-section', icon: Home },
    { label: 'Resume Builder', path: '/resume-builder', icon: FileText },
    { label: 'Resume Templates', path: '/dashboard', sectionId: 'templates-section', icon: Folder },
    { label: 'ATS Analyzer', path: '/dashboard', sectionId: 'ats-analyzer-section', icon: CheckCircle2 },
    { label: 'AI Job Search', path: '/jobs', icon: Briefcase },
    { label: 'Company Insights', path: '/dashboard', sectionId: 'company-insights-section', icon: Building },
    { label: 'LinkedIn Optimizer', path: '/profile', icon: Sparkles },
    { label: 'Interview AI', path: '/dashboard', sectionId: 'interview-practice-section', icon: MessageSquare },
    { label: 'Career Analytics', path: '/dashboard', sectionId: 'analytics-section', icon: BarChart3 },
    { label: 'Documents', path: '/dashboard', sectionId: 'documents-section', icon: Folder },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleNavClick = (item: typeof menuItems[0]) => {
    setIsMobileMenuOpen(false);
    if (item.sectionId) {
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
        setTimeout(() => {
          const el = document.getElementById(item.sectionId!);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        const el = document.getElementById(item.sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate(item.path);
    }
  };

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  const handleSendChat = (textToSubmit?: string) => {
    const text = textToSubmit || chatInput;
    if (!text.trim()) return;

    // Add user message
    const newMsg = { sender: 'user' as const, text, time: 'Just Now' };
    setChatMessages(prev => [...prev, newMsg]);
    if (!textToSubmit) setChatInput('');

    // Trigger AI typing
    setIsAiTyping(true);

    // AI smart reply logic
    setTimeout(() => {
      let replyText = "I can help with that! Let's check your current resume keywords, formatting structure, or drafts.";
      const query = text.toLowerCase();
      if (query.includes('ats') || query.includes('score')) {
        replyText = "Based on my analysis of your default resume, you score **91%**. To reach 95%, you need to incorporate keywords like **'Kubernetes'**, **'CI/CD Pipelines'**, and **'Microservices Architecture'** in your project descriptions.";
      } else if (query.includes('job') || query.includes('find')) {
        replyText = "I found 4 new matching jobs for you today! The best matches are **Frontend Engineer at Vercel** (98% match) and **React Developer at Linear** (94% match). Would you like me to tailor your resume for Vercel?";
      } else if (query.includes('interview') || query.includes('practice')) {
        replyText = "Let's prepare! I can start a simulated interview for **Senior Frontend Engineer**. I'll ask questions about React performance optimization and system design. Ready to start?";
      } else if (query.includes('linkedin') || query.includes('optimize')) {
        replyText = "Your LinkedIn profile has a solid summary, but your headline needs revision. Try changing it to: *'Senior Frontend Engineer | React & Next.js Expert | Building Scale at Bimba AI'* to increase recruiter views by 40%.";
      } else if (query.includes('resume') || query.includes('cv') || query.includes('review')) {
        replyText = "I reviewed your resume 'My Resume Portfolio'. I suggest strengthening your bullet points under **Stripe** by adding metrics (e.g., *'Increased conversion by 14%'*).";
      }

      setChatMessages(prev => [...prev, { sender: 'ai' as const, text: replyText, time: 'Just Now' }]);
      setIsAiTyping(false);
    }, 1200);
  };

  // Mock global search options
  const searchSuggestions = [
    { type: 'resume', label: 'My Resume Portfolio (ATS 91%)', path: '/resume-builder' },
    { type: 'job', label: 'Frontend Engineer at Vercel (98% Match)', path: '/jobs' },
    { type: 'job', label: 'Product UI Designer at Linear (92% Match)', path: '/jobs' },
    { type: 'company', label: 'Vercel Inc. Culture & Salary Insights', path: '/dashboard', sectionId: 'company-insights-section' },
    { type: 'company', label: 'Linear App Interview Difficulty & Difficulty', path: '/dashboard', sectionId: 'company-insights-section' },
    { type: 'template', label: 'Cosmos Pro Resume Template', path: '/dashboard', sectionId: 'templates-section' },
  ].filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#07120A] text-[#111827] dark:text-[#FFFFFF] flex flex-col font-sans transition-all duration-300">
      
      {/* STICKY NAVBAR */}
      <header className="bg-white dark:bg-[#08110A] border-b border-[#E5E7EB] dark:border-green-950/30 h-16 flex items-center justify-between px-4 md:px-6 z-40 sticky top-0 transition-all duration-300">
        
        {/* Left: Logo & Toggle */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#6B7280] dark:text-[#A7B5AA] hover:bg-green-55 dark:hover:bg-[#111F17] transition-all cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-tr from-[#16A34A] to-[#22C55E] flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-green-500/10">
              B
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-base text-[#111827] dark:text-white leading-none tracking-tight">Bimba AI</span>
              <span className="text-[9px] font-bold text-[#16A34A] tracking-wider uppercase mt-0.5">Career OS</span>
            </div>
          </div>
        </div>

        {/* Center: Global Search Suggestions Dropdown */}
        <div ref={searchContainerRef} className="hidden md:block relative w-96 max-w-lg z-50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-[#A7B5AA]" size={15} />
            <input 
              type="text"
              placeholder="Search resumes, jobs, companies..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchSuggestions(true);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              className="w-full pl-10 pr-4 py-2.2 bg-[#F8FAF8] dark:bg-[#0F1A13] border border-[#E5E7EB] dark:border-green-900/30 rounded-xl text-xs text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A] dark:focus:border-[#22C55E] transition-all font-medium placeholder-[#6B7280] dark:placeholder-[#7E8C83]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          {/* Instant Search Suggestions Box */}
          {showSearchSuggestions && (
            <div className="absolute top-13 left-0 right-0 bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/40 rounded-2xl shadow-xl p-3 text-left animate-fadeIn max-h-80 overflow-y-auto no-scrollbar">
              <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block px-2 mb-2">Search Suggestions</span>
              {searchSuggestions.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {searchSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setShowSearchSuggestions(false);
                        if (item.sectionId) {
                          if (location.pathname !== '/dashboard') {
                            navigate('/dashboard');
                            setTimeout(() => {
                              document.getElementById(item.sectionId!)?.scrollIntoView({ behavior: 'smooth' });
                            }, 150);
                          } else {
                            document.getElementById(item.sectionId)?.scrollIntoView({ behavior: 'smooth' });
                          }
                        } else {
                          navigate(item.path);
                        }
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-green-50/50 dark:hover:bg-[#1A2D22] rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {item.type === 'resume' && <FileText size={13} className="text-[#16A34A]" />}
                        {item.type === 'job' && <Briefcase size={13} className="text-[#22C55E]" />}
                        {item.type === 'company' && <Building size={13} className="text-amber-500" />}
                        {item.type === 'template' && <Folder size={13} className="text-purple-500" />}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
                      </div>
                      <ChevronRight size={11} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-500">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions, Badges, Dark Toggle */}
        <div className="flex items-center gap-3">
          
          {/* Premium Badge */}
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DCFCE7] dark:bg-green-950/40 border border-[#16A34A]/20 text-[10px] font-black text-[#16A34A] dark:text-[#22C55E] uppercase tracking-wide">
            <Award size={10} /> PRO MEMBER
          </span>

          {/* Quick Chat toggler on tablets/mobiles */}
          <button 
            onClick={() => setIsAiDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl border border-[#E5E7EB] dark:border-green-900/30 hover:bg-[#F0FDF4] dark:hover:bg-green-950/20 text-[#6B7280] dark:text-[#22C55E] relative cursor-pointer"
            title="AI Assistant Chat"
          >
            <Sparkles size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-ping" />
          </button>

          {/* Message Indicator */}
          <button className="p-2 rounded-xl border border-[#E5E7EB] dark:border-green-900/30 hover:bg-slate-50 dark:hover:bg-green-950/10 text-[#6B7280] dark:text-[#A7B5AA] cursor-pointer relative">
            <Mail size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          </button>

          {/* Settings */}
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl border border-[#E5E7EB] dark:border-green-900/30 hover:bg-slate-50 dark:hover:bg-green-950/10 text-[#6B7280] dark:text-[#A7B5AA] cursor-pointer"
          >
            <Settings size={16} />
          </button>

          {/* Dark Mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[#E5E7EB] dark:border-green-900/30 hover:bg-[#F8FAF8] dark:hover:bg-green-950/20 text-[#6B7280] dark:text-[#22C55E] cursor-pointer flex items-center justify-center"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Profile Quick Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E5E7EB] dark:border-green-950/30 cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900 text-[#16A34A] dark:text-white font-extrabold flex items-center justify-center text-xs border border-[#16A34A]/10">
              {displayName.charAt(0)}
            </div>
          </div>
        </div>

      </header>

      {/* THREE-COLUMN WORKSPACE CONTAINER */}
      <div className="flex flex-grow relative overflow-x-hidden min-h-[calc(100vh-4rem)]">
        
        {/* COLUMN 1: SIDEBAR */}
        <aside 
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          className={`
            fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] z-30
            bg-white dark:bg-[#08110A] border-r border-[#E5E7EB] dark:border-green-950/30
            flex flex-col justify-between py-6 px-4
            transition-all duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0 w-70' : '-translate-x-full md:translate-x-0'}
            ${isSidebarCollapsed && !isSidebarHovered ? 'md:w-20' : 'md:w-70'}
          `}
        >
          <div className="flex flex-col gap-6 overflow-y-auto no-scrollbar flex-grow">
            
            {/* Sidebar header toggle icon for desktop */}
            <div className="hidden md:flex justify-end px-2">
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1 rounded bg-[#F8FAF8] dark:bg-[#111F17] hover:bg-green-50 dark:hover:bg-green-950/20 text-[#6B7280] dark:text-[#A7B5AA] cursor-pointer"
              >
                {isSidebarCollapsed ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              </button>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex flex-col gap-1 px-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.sectionId 
                  ? location.pathname === '/dashboard' && !item.path.includes('/settings')
                  : location.pathname === item.path;

                const isWide = !isSidebarCollapsed || isSidebarHovered;

                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item)}
                    className={`
                      flex items-center w-full px-3 py-2.8 rounded-xl transition-all duration-205 
                      relative group cursor-pointer overflow-hidden text-left
                      ${isActive 
                        ? 'text-[#16A34A] dark:text-[#22C55E] font-bold' 
                        : 'text-[#6B7280] dark:text-[#A7B5AA] hover:text-[#111827] dark:hover:text-white hover:bg-green-50/40 dark:hover:bg-[#111F17]/60 font-medium'
                      }
                    `}
                  >
                    {/* Active green active indicator */}
                    {isActive && (
                      <div className="absolute inset-y-2 left-0 w-1 rounded-r bg-[#16A34A] dark:bg-[#22C55E]" />
                    )}
                    
                    {/* Background pill */}
                    {isActive && (
                      <div className="absolute inset-0 bg-[#DCFCE7]/45 dark:bg-green-950/20 pointer-events-none rounded-xl" />
                    )}

                    <div className="flex items-center justify-center w-5 h-5 shrink-0 z-10">
                      <Icon size={16} className={isActive ? 'text-[#16A34A] dark:text-[#22C55E]' : 'text-slate-400 dark:text-[#7E8C83] group-hover:text-slate-700 dark:group-hover:text-slate-200'} />
                    </div>

                    <span className={`
                      text-xs tracking-wide whitespace-nowrap ml-3 z-10 transition-all duration-305
                      ${isWide ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden pointer-events-none'}
                    `}>
                      {item.label}
                    </span>

                    {/* Tooltip when sidebar collapsed */}
                    {!isWide && (
                      <div className="absolute left-16 bg-[#111827] dark:bg-green-950 text-white dark:text-green-300 text-[10px] font-bold tracking-wider px-2 py-1 rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Section */}
          <div className="flex flex-col gap-4 border-t border-[#E5E7EB] dark:border-green-950/30 pt-4 mt-auto">
            
            {/* User Profile Card */}
            <div className={`flex items-center gap-3 px-2 ${(!isSidebarCollapsed || isSidebarHovered) ? 'justify-start' : 'justify-center'}`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#22C55E] text-white flex items-center justify-center font-black text-xs shadow-md shadow-green-500/10 shrink-0">
                {displayName.charAt(0)}
              </div>
              {(!isSidebarCollapsed || isSidebarHovered) && (
                <div className="flex flex-col text-left leading-tight overflow-hidden">
                  <h5 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-100 truncate w-32">{displayName}</h5>
                  <span className="text-[9px] text-[#16A34A] dark:text-[#22C55E] font-black uppercase tracking-wider block mt-0.5">Plus Member</span>
                </div>
              )}
            </div>

            {/* Logout Trigger */}
            <button
              onClick={() => logout()}
              className="flex items-center w-full px-3 py-2.5 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-all font-bold cursor-pointer group"
            >
              <LogOut size={16} className="text-red-400 shrink-0" />
              {(!isSidebarCollapsed || isSidebarHovered) && (
                <span className="text-xs ml-3 text-red-500 font-bold">Log Out</span>
              )}
            </button>
          </div>
        </aside>

        {/* COLUMN 2: MAIN WORKSPACE */}
        <main className="flex-grow min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-y-auto w-full max-w-full">
          <Outlet />
        </main>

        {/* COLUMN 3: PERSISTENT AI CAREER ASSISTANT (DESKTOP ONLY) */}
        <aside className="hidden lg:flex flex-col w-[360px] h-[calc(100vh-4rem)] border-l border-[#E5E7EB] dark:border-green-950/30 bg-white dark:bg-[#08110A] sticky top-16 right-0 z-30 transition-all duration-305">
          
          {/* Assistant Header */}
          <div className="p-4 border-b border-[#E5E7EB] dark:border-green-950/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-[#111F17] flex items-center justify-center text-[#16A34A] border border-[#16A34A]/10 shadow-inner">
                <Sparkles size={16} />
              </div>
              <div className="text-left">
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">AI Career Assistant</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[8px] font-bold text-gray-405 dark:text-[#A7B5AA] uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <span className="text-[9px] bg-green-55 dark:bg-[#111F17] text-[#16A34A] dark:text-[#22C55E] px-2 py-0.5 rounded font-black border border-[#16A34A]/10">Gemini 3.5</span>
          </div>

          {/* Quick Prompts Suggestions */}
          <div className="p-3 bg-[#F8FAF8] dark:bg-[#0B1810] border-b border-[#E5E7EB] dark:border-green-950/30 flex flex-wrap gap-1.5 shrink-0">
            {[
              { label: 'Review Resume', text: 'Review my active resume wording.' },
              { label: 'Find Jobs', text: 'Find developer job matches.' },
              { label: 'Practice Interview', text: 'Start an interview prep session.' },
              { label: 'Career Advice', text: 'Give me career path recommendations.' },
              { label: 'LinkedIn Tips', text: 'How can I improve my LinkedIn visibility?' }
            ].map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChat(sug.text)}
                className="text-[9.5px] font-bold text-slate-600 dark:text-[#A7B5AA] bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-900/20 hover:border-[#16A34A] dark:hover:border-[#22C55E] hover:text-[#16A34A] dark:hover:text-[#22C55E] px-2 py-1 rounded-lg transition-all cursor-pointer shadow-sm"
              >
                {sug.label}
              </button>
            ))}
          </div>

          {/* Chat message list container */}
          <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
              >
                <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs text-left leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-[#16A34A] text-white rounded-tr-none'
                    : 'bg-[#F8FAF8] dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/40 text-slate-700 dark:text-slate-200 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[8px] text-gray-400 dark:text-gray-500 font-medium mt-1 px-1">
                  {msg.sender === 'user' ? 'You' : 'Bimba AI'} • {msg.time}
                </span>
              </div>
            ))}

            {isAiTyping && (
              <div className="flex flex-col items-start animate-fadeIn">
                <div className="bg-[#F8FAF8] dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/40 rounded-2xl p-3.5 rounded-tl-none flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[8px] text-gray-450 font-medium mt-1">Bimba is typing...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-[#E5E7EB] dark:border-green-950/30 bg-white dark:bg-[#08110A] shrink-0">
            <div className="flex items-center gap-2">
              <input 
                type="text"
                placeholder="Ask Bimba anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-grow pl-4 pr-4 py-2.5 rounded-xl bg-[#F8FAF8] dark:bg-[#0F1A13] border border-[#E5E7EB] dark:border-green-900/30 focus:border-[#16A34A] dark:focus:border-[#22C55E] focus:outline-none text-xs text-slate-800 dark:text-white placeholder-[#6B7280] dark:placeholder-[#7E8C83] font-medium"
              />
              <button 
                onClick={() => handleSendChat()}
                className="w-9 h-9 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-green-500/10 shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </aside>

      </div>

      {/* MOBILE FLOATING AI BUTTON & DRAWER */}
      <div className="lg:hidden">
        
        {/* Floating Bubble */}
        <button 
          onClick={() => setIsAiDrawerOpen(true)}
          className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-[#16A34A] to-[#22C55E] text-white flex items-center justify-center shadow-lg shadow-green-500/20 cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          <Sparkles size={20} className="animate-pulse" />
        </button>

        {/* Floating Drawer Modal */}
        {isAiDrawerOpen && (
          <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm z-50 flex justify-end">
            <div className="w-full max-w-md h-full bg-white dark:bg-[#08110A] flex flex-col shadow-2xl animate-slideIn">
              
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#E5E7EB] dark:border-green-950/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-[#111F17] flex items-center justify-center text-[#16A34A]">
                    <Sparkles size={16} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">Bimba AI Assistant</h4>
                    <span className="text-[8px] text-[#10B981] font-bold uppercase tracking-wider block">Online</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsAiDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-green-950/20 text-gray-505"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Chat list */}
              <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs text-left leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-[#16A34A] text-white rounded-tr-none'
                        : 'bg-[#F8FAF8] dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/40 text-slate-700 dark:text-slate-200 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-gray-405 font-medium mt-1 px-1">
                      {msg.sender === 'user' ? 'You' : 'Bimba AI'} • {msg.time}
                    </span>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex items-center gap-1 p-3 bg-slate-50 dark:bg-[#111F17] rounded-xl self-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <div className="p-4 border-t border-[#E5E7EB] dark:border-green-950/30 bg-white dark:bg-[#08110A] shrink-0">
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="Ask Bimba anything..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    className="flex-grow pl-4 pr-4 py-2.5 rounded-xl bg-[#F8FAF8] dark:bg-[#0F1A13] border border-[#E5E7EB] dark:border-green-900/30 focus:border-[#16A34A] dark:focus:border-[#22C55E] focus:outline-none text-xs text-slate-800 dark:text-white placeholder-[#6B7280] font-medium"
                  />
                  <button 
                    onClick={() => handleSendChat()}
                    className="w-9 h-9 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default DashboardLayout;
