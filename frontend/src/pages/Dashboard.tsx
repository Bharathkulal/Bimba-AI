import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, FileText, Plus, Award, LayoutTemplate, 
  Bot, BarChart3, Settings, Flame, Search, Bell, Sun, 
  ChevronRight, Edit3, Copy, Download, Trash2, Check,
  SendHorizontal, Lock, ListTodo
} from 'lucide-react';
import { Button } from '../components/Button';

// Mock resumes list for the "Continue Working" section
const initialMockResumes = [
  {
    id: '1',
    name: 'Fullstack Engineer Resume',
    atsScore: 96,
    completion: 85,
    lastEdited: '2 hours ago',
    template: 'Celestial'
  },
  {
    id: '2',
    name: 'Product Designer CV',
    atsScore: 92,
    completion: 72,
    lastEdited: 'Yesterday',
    template: 'Astral'
  }
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState(initialMockResumes);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);
  const [streakCount] = useState(8);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Hello Bharath! I've analyzed your Fullstack Engineer Resume. Your ATS Score is a strong 96%, but you can reach 100% by adding metrics to your Stripe experience." }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Goals checklist
  const [goals, setGoals] = useState([
    { id: 'edu', text: 'Education', completed: true },
    { id: 'skills', text: 'Skills', completed: true },
    { id: 'exp', text: 'Experience', completed: false },
    { id: 'projects', text: 'Projects', completed: false },
  ]);

  const toggleGoal = (id: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const deleteResume = (id: string) => {
    setResumes(resumes.filter(r => r.id !== id));
  };

  const duplicateResume = (id: string) => {
    const original = resumes.find(r => r.id === id);
    if (original) {
      const copy = {
        ...original,
        id: Math.random().toString(),
        name: `${original.name} (Copy)`,
        lastEdited: 'Just now'
      };
      setResumes([copy, ...resumes]);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // Simulated reply
    setTimeout(() => {
      let replyText = "I'm ready to help you optimize that! Let's scan your keywords or write a professional summary.";
      if (chatInput.toLowerCase().includes('ats') || chatInput.toLowerCase().includes('score')) {
        replyText = "To optimize your ATS score, consider adding keywords like 'RESTful APIs', 'CI/CD pipeline', and 'System Design' under your experience.";
      } else if (chatInput.toLowerCase().includes('skills')) {
        replyText = "I suggest adding technical skills like Docker, Kubernetes, and Tailwind CSS to match current industry demands.";
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: replyText }]);
    }, 1000);
  };

  const quickActions = [
    { label: 'Create Resume', icon: Plus, desc: 'Start a fresh resume', action: () => navigate('/resume-builder'), gradient: 'from-blue-600 to-cyan-500' },
    { label: 'Browse Templates', icon: LayoutTemplate, desc: 'Find modern layouts', action: () => {
      const el = document.getElementById('templates-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, gradient: 'from-purple-600 to-indigo-500' },
    { label: 'AI Resume Writer', icon: Bot, desc: 'Autofill with AI', action: () => {
      const el = document.getElementById('ai-assistant-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, gradient: 'from-emerald-600 to-teal-500' },
    { label: 'ATS Checker', icon: Award, desc: 'Check keyword density', action: () => {
      const el = document.getElementById('ats-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, gradient: 'from-pink-600 to-rose-500' },
    { label: 'Cover Letter', icon: Sparkles, desc: 'Generate cover letters', action: () => {}, gradient: 'from-amber-500 to-orange-500', isMock: true },
    { label: 'AI Interview', icon: Bot, desc: 'Practice mock interview', action: () => {}, gradient: 'from-cyan-500 to-blue-500', isMock: true },
    { label: 'Resume Analytics', icon: BarChart3, desc: 'View profile matches', action: () => {
      const el = document.getElementById('analytics-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, gradient: 'from-indigo-600 to-blue-750' },
    { label: 'Resume Optimizer', icon: Settings, desc: 'Improve layout flow', action: () => {}, gradient: 'from-slate-600 to-slate-750', isMock: true },
  ];

  const badges = [
    { name: 'First Resume', desc: 'Created first resume', icon: '🎓', unlocked: true },
    { name: 'ATS master', desc: 'Score above 95%', icon: '🚀', unlocked: true },
    { name: 'Top Candidate', desc: '10+ Resume views', icon: '🔥', unlocked: true },
    { name: 'Interview Ready', desc: 'Complete 5 goals', icon: '🏆', unlocked: false },
    { name: 'Weekly Warrior', desc: '7 Day Active Streak', icon: '👑', unlocked: true },
  ];

  return (
    <div id="top" className="flex flex-col gap-10 min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-500/15 select-none pb-12 relative z-10">
      
      {/* 1. TOP HEADER OVERHAUL - LIGHT THEME */}
      <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-200/60 rounded-3xl p-4.5 shadow-sm shadow-slate-100/50">
        {/* Left Logo Side */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-650 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/10">
            B
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-base tracking-tight leading-none">Bimba AI</h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Workspace</span>
          </div>
        </div>

        {/* Middle Search bar */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" size={16} />
          <input 
            type="text"
            placeholder="Search resumes, templates, tips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:outline-none text-xs text-slate-700 placeholder:text-slate-400 transition-smooth"
          />
        </div>

        {/* Right Info Controls */}
        <div className="flex items-center justify-end gap-3.5">
          {/* Notifications */}
          <button 
            onClick={() => setNotificationCount(0)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-smooth relative cursor-pointer shadow-sm"
          >
            <Bell size={16} />
            {notificationCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 shadow-sm" />
            )}
          </button>

          {/* AI Shortcut Button */}
          <button 
            onClick={() => {
              const el = document.getElementById('ai-assistant-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 h-10 rounded-xl bg-blue-50/60 border border-blue-200/60 hover:bg-blue-50 text-xs font-bold text-blue-600 flex items-center gap-1.5 transition-smooth cursor-pointer shadow-sm"
          >
            <Bot size={14} /> Ask Bimba AI
          </button>

          {/* Theme Toggle */}
          <button 
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-550 hover:text-slate-800 hover:bg-slate-50 transition-smooth cursor-pointer shadow-sm"
          >
            <Sun size={15} />
          </button>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              B
            </div>
            <div className="hidden lg:block text-left">
              <h5 className="font-extrabold text-xs text-slate-800">Bharath</h5>
              <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Plus Plan</p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. WELCOME HERO CTA PANEL - LIGHT PROFESSIONAL */}
      <section className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 w-[30%] h-[120%] bg-blue-500/5 blur-[80px] pointer-events-none rounded-full" />
        <div className="z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">👋 Good Morning, Bharath</h2>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-xl">
            Ready to build your next professional resume? Your AI career assistant is ready to help you optimize keywords and layouts.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/resume-builder')} 
          variant="primary" 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 font-bold gap-2 shrink-0 z-10"
        >
          <Plus size={18} /> Create Resume
        </Button>
      </section>

      {/* 3. HERO TRACKERS & GOALS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress & Goals Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between h-72 shadow-sm hover:shadow transition-all duration-250">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Resume Progress</span>
              <h4 className="text-2xl font-black text-slate-800 mt-1">72% Complete</h4>
            </div>
            <div className="w-11 h-11 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-center text-slate-500">
              <ListTodo size={18} />
            </div>
          </div>

          {/* Daily Goals Checklist */}
          <div className="flex flex-col gap-2 mt-4">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Today's Goal Checklist</span>
            <div className="flex flex-col gap-2.5">
              {goals.map((g) => (
                <div 
                  key={g.id} 
                  onClick={() => toggleGoal(g.id)}
                  className="flex items-center gap-2.5 cursor-pointer text-slate-600 hover:text-slate-900 transition-smooth"
                >
                  <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-smooth ${
                    g.completed 
                      ? 'bg-blue-50 border-blue-500 text-blue-600' 
                      : 'border-slate-200 bg-slate-50 text-transparent'
                  }`}>
                    <Check size={10} strokeWidth={4} />
                  </div>
                  <span className={`text-xs font-semibold ${g.completed ? 'line-through text-slate-400' : ''}`}>{g.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between h-72 shadow-sm hover:shadow transition-all duration-250">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Current Streak</span>
              <h4 className="text-2xl font-black text-slate-800 mt-1">{streakCount} Days Active</h4>
            </div>
            <div className="w-11 h-11 bg-orange-50 border border-orange-200/60 rounded-xl flex items-center justify-center text-orange-500">
              <Flame size={18} className="fill-orange-500" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4.5">
            <p className="text-[11px] text-orange-600 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
              🔥 {streakCount} Day Resume Building Streak
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Keep updating your resumes daily! Completing your weekly profile check triggers an automatic ATS booster.
            </p>
          </div>
        </div>

        {/* AI Recommendations Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between h-72 shadow-sm hover:shadow transition-all duration-250">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black text-blue-600 tracking-wider uppercase">Bimba AI Suggests</span>
              <h4 className="text-lg font-extrabold text-slate-850 mt-1">Optimize Your Fullstack CV</h4>
            </div>
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Sparkles size={16} />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mt-2">
            {[
              "Add measurable achievements to Linear role.",
              "Improve ATS density for frontend frameworks.",
              "Complete remaining Skills certifications."
            ].map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-2.5 hover:bg-slate-100/50 transition-smooth">
                <span className="text-blue-500 font-bold shrink-0">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. QUICK ACTIONS */}
      <section className="flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Workspace Utility</span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">Quick Action Studio</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.label}
                onClick={act.action}
                className="group relative bg-white border border-slate-200/60 rounded-2xl p-4.5 cursor-pointer flex flex-col justify-between gap-4 transition-all duration-250 ease-out hover:-translate-y-1.5 hover:border-blue-500/40 hover:shadow-md h-34 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${act.gradient} flex items-center justify-center text-white shadow-sm`}>
                    <Icon size={18} />
                  </div>
                  {act.isMock && (
                    <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                      PRO
                    </span>
                  )}
                </div>

                <div>
                  <h5 className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-smooth">{act.label}</h5>
                  <p className="text-[10px] text-slate-450 mt-1 leading-snug">{act.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. CONTINUE WORKING (LATEST RESUMES) */}
      <section id="resumes-section" className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Active Drafts</span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">Continue Editing</h3>
          </div>
          {resumes.length > 0 && (
            <span className="text-xs text-slate-405 font-semibold">{resumes.length} active resume(s)</span>
          )}
        </div>

        {resumes.length === 0 ? (
          <div className="bg-white border border-slate-200/65 rounded-3xl p-16 text-center max-w-xl mx-auto flex flex-col items-center gap-4.5 w-full shadow-sm">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
              <FileText size={24} />
            </div>
            <h4 className="text-lg font-bold text-slate-850">Let's build your first professional resume.</h4>
            <p className="text-slate-550 text-xs leading-relaxed">
              Create ATS-friendly templates optimized by our intelligent writing assistant to guarantee layout compliance.
            </p>
            <div className="flex gap-3 mt-1.5">
              <Button onClick={() => navigate('/resume-builder')} variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5 font-bold">
                Create Resume <Plus size={14} />
              </Button>
              <Button 
                onClick={() => {
                  const el = document.getElementById('templates-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }} 
                variant="outline" 
                size="sm" 
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Browse Templates
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {resumes.map((res) => (
              <div 
                key={res.id} 
                className="group relative bg-white border border-slate-200/60 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between gap-5 transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                      <FileText size={20} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-extrabold text-sm text-slate-850 group-hover:text-blue-600 transition-smooth">{res.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Edited {res.lastEdited} • Template: {res.template}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-blue-650 text-[9.5px] font-bold bg-blue-50 border border-blue-100 px-2.5 py-0.8 rounded-md shadow-sm">
                    <Award size={10} /> ATS {res.atsScore}%
                  </div>
                </div>

                <div className="flex items-center justify-between gap-8 pt-2.5 border-t border-slate-100">
                  <div className="flex-grow flex items-center gap-2">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/30">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${res.completion}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400">{res.completion}%</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => navigate('/resume-builder')}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-350 transition-smooth cursor-pointer shadow-sm"
                      title="Continue Editing"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button 
                      onClick={() => duplicateResume(res.id)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-350 transition-smooth cursor-pointer shadow-sm"
                      title="Duplicate"
                    >
                      <Copy size={12} />
                    </button>
                    <button 
                      onClick={() => alert(`Downloading ${res.name} PDF`)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-350 transition-smooth cursor-pointer shadow-sm"
                      title="Download PDF"
                    >
                      <Download size={12} />
                    </button>
                    <button 
                      onClick={() => deleteResume(res.id)}
                      className="w-8 h-8 rounded-lg bg-red-50 border border-red-200/60 flex items-center justify-center text-red-650 hover:bg-red-500 hover:text-white transition-smooth cursor-pointer"
                      title="Delete Resume"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. TEMPLATES CAROUSEL OVERVIEW */}
      <section id="templates-section" className="flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Design Layouts</span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">Premium Resume Templates</h3>
        </div>

        <div className="overflow-x-auto no-scrollbar flex gap-6 pb-2.5">
          {[
            { name: 'Cosmos Pro', type: 'Modern & Compact', badge: 'PRO', badgeColor: 'bg-purple-600', score: 98, desc: 'Best for Tech' },
            { name: 'Celestial ATS', type: 'Recruiter Approved', badge: 'AI Optimized', badgeColor: 'bg-emerald-600', score: 99, desc: 'Clean Formatting' },
            { name: 'Galaxy Professional', type: 'Technical Density', badge: 'Popular', badgeColor: 'bg-blue-605', score: 97, desc: 'Engineering Heavy' },
            { name: 'Astral Creative', type: 'Bold & Colorful Accent', badge: 'New', badgeColor: 'bg-pink-600', score: 95, desc: 'Design Standard' },
          ].map((item, idx) => (
            <div 
              key={idx}
              className="bg-white border border-slate-200/60 hover:border-slate-300 rounded-2xl p-4.5 w-64 shrink-0 flex flex-col justify-between h-48 hover:-translate-y-1 transition-all duration-250 cursor-pointer shadow-sm"
              onClick={() => navigate('/resume-builder')}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[9px] font-black uppercase text-white px-2 py-0.5 rounded ${item.badgeColor}`}>
                  {item.badge}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">ATS {item.score}%</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 my-3 flex flex-col gap-1.5">
                <div className="h-2 bg-slate-250 rounded w-1/3" />
                <div className="h-1 bg-slate-200 rounded w-3/4" />
                <div className="h-1 bg-slate-200 rounded w-1/2" />
              </div>

              <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                <h5 className="font-extrabold text-xs text-slate-800">{item.name}</h5>
                <ChevronRight size={14} className="text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. AI ASSISTANT PANEL */}
      <section id="ai-assistant-section" className="flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-black text-blue-600 tracking-wider uppercase">Intelligent Helper</span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">Bimba AI Assistant</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Left Chat Screen */}
          <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between h-[360px] shadow-sm">
            <div className="flex-grow overflow-y-auto no-scrollbar flex flex-col gap-3.5 pr-2 mb-4">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-150 text-slate-700 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 pt-3.5">
              <input 
                type="text"
                placeholder="Ask Bimba AI e.g. 'Add technical skills' or 'Optimize ATS'..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-grow pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:outline-none text-xs text-slate-700 placeholder:text-slate-400"
              />
              <button 
                onClick={handleSendChat}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-smooth cursor-pointer shadow-sm"
              >
                <SendHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* Right suggestions list */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between h-[360px] shadow-sm">
            <div>
              <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Quick Actions</span>
              <h4 className="text-sm font-extrabold text-slate-800 mt-1">Suggested Prompt Actions</h4>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              {[
                { label: 'Improve Skills', text: 'Analyze and suggest modern skills for my CV.' },
                { label: 'Optimize ATS', text: 'How do I bypass standard ATS systems?' },
                { label: 'Generate Cover Letter', text: 'Draft a cover letter for a Frontend Engineer position.' },
                { label: 'Find Missing Keywords', text: 'What key technical terms are missing from my resume?' },
                { label: 'Career Advice', text: 'What credentials should I highlight for Senior roles?' },
              ].map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setChatInput(sug.text);
                  }}
                  className="w-full text-left bg-slate-50 border border-slate-200/60 hover:border-slate-350 rounded-xl p-3.5 hover:bg-slate-100 transition-smooth cursor-pointer"
                >
                  <h5 className="font-bold text-xs text-slate-750">{sug.label}</h5>
                  <p className="text-[10px] text-slate-400 mt-1">{sug.text}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. ANALYTICS & TIMELINE SECTION */}
      <section id="analytics-section" className="flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Statistical Dashboard</span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">Analytics Overview</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Ring Metrics */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between min-h-[300px] shadow-sm">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-sm font-extrabold text-slate-800">Score Rings</h4>
              <span className="text-[10px] text-blue-600 font-bold">All-time High</span>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              {/* ATS Ring */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" className="stroke-slate-100 fill-none" strokeWidth="8" />
                    <circle cx="48" cy="48" r="40" className="stroke-sky-400 fill-none" strokeWidth="8" strokeDasharray="251" strokeDashoffset="10" strokeLinecap="round" />
                  </svg>
                  <span className="text-base font-black text-slate-800">96%</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ATS Match Score</span>
              </div>

              {/* Completion Ring */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" className="stroke-slate-100 fill-none" strokeWidth="8" />
                    <circle cx="48" cy="48" r="40" className="stroke-blue-600 fill-none" strokeWidth="8" strokeDasharray="251" strokeDashoffset="70" strokeLinecap="round" />
                  </svg>
                  <span className="text-base font-black text-slate-800">72%</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion</span>
              </div>
            </div>
          </div>

          {/* Application Tracker Card */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between min-h-[300px] shadow-sm">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-sm font-extrabold text-slate-800">Application Tracker</h4>
              <span className="text-[10px] text-emerald-600 font-bold">+12% This Week</span>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { label: 'PDF Downloads', value: 48, total: 100, color: 'bg-blue-500' },
                { label: 'Recruiter Views', value: 86, total: 100, color: 'bg-indigo-500' },
                { label: 'Interview Rate', value: 34, total: 100, color: 'bg-emerald-500' },
                { label: 'Keyword Match %', value: 92, total: 100, color: 'bg-pink-500' },
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-405">{stat.label}</span>
                    <span className="text-slate-700">{stat.value}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/10">
                    <div className={`${stat.color} h-full rounded-full`} style={{ width: `${stat.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Timeline Card */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between min-h-[300px] shadow-sm">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-sm font-extrabold text-slate-800">Activity History</h4>
              <span className="text-[10px] text-slate-400 font-bold">Latest Changes</span>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar max-h-48 pr-1">
              {[
                { time: '10:15 AM', event: 'Resume Updated', desc: 'Added Fullstack design metrics' },
                { time: 'Yesterday', event: 'Cover Letter Generated', desc: 'Tailored for Stripe Developer position' },
                { time: '2 Days Ago', event: 'ATS Improved', desc: 'Resolved keyword spacing warning' },
              ].map((act, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                    {idx < 2 && <div className="w-0.5 bg-slate-200 flex-grow my-1" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400">{act.time}</span>
                    <h5 className="font-extrabold text-xs text-slate-800 mt-0.5">{act.event}</h5>
                    <p className="text-[10px] text-slate-450 mt-0.5">{act.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. GAMIFICATION ACHIEVEMENTS ROW */}
      <section className="flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Gamification Achievements</span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">Streaks & Badges</h3>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {badges.map((badge, idx) => (
              <div 
                key={idx}
                className={`relative rounded-2xl p-4.5 text-center flex flex-col items-center justify-between gap-3 transition-all duration-300 ${
                  badge.unlocked 
                    ? 'bg-slate-50/50 border border-blue-500/10 hover:border-blue-500/20 hover:-translate-y-1 shadow-sm' 
                    : 'bg-slate-100/30 border border-slate-200/40 opacity-40'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow border border-slate-200/60">
                  {badge.icon}
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-slate-800 leading-tight">{badge.name}</h5>
                  <p className="text-[9px] text-slate-400 mt-0.8">{badge.desc}</p>
                </div>

                {!badge.unlocked && (
                  <div className="absolute top-2.5 right-2.5 text-slate-405">
                    <Lock size={10} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      
    </div>
  );
};
export default Dashboard;
