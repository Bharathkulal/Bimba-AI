import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, FileText, Plus, Award, LayoutTemplate, 
  Bot, BarChart3, Settings, Flame, Search, Bell, 
  Edit3, Copy, Download, Trash2,
  SendHorizontal, Lock, ListTodo, UploadCloud
} from 'lucide-react';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';
import { analyticsService } from '../services/analytics';
import { apiClient, API_BASE_URL } from '../services/api';

import type { DashboardData, AtsData, ActivityTimelineItem, ResumeAnalyticsItem } from '../services/analytics';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  
  const getDisplayName = () => {
    if (!user) return 'Student';
    const email = user.personal_email;
    const prefix = email.split('@')[0];
    const name = prefix.replace(/[0-9_.]/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1).trim();
  };
  const displayName = getDisplayName();
  
  // Loading & State
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [atsData, setAtsData] = useState<AtsData | null>(null);
  const [activities, setActivities] = useState<ActivityTimelineItem[]>([]);
  const [resumes, setResumes] = useState<ResumeAnalyticsItem[]>([]);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string }>>([]);
  
  // Upload and Sorting/Filtering State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [sortBy, setSortBy] = useState<'updated_at' | 'ats_score' | 'name'>('updated_at');
  const [filterBy, setFilterBy] = useState<string>('all');

  useEffect(() => {
    setChatMessages([
      { sender: 'ai', text: `Hello ${displayName}! I've analyzed your Fullstack Engineer Resume. Your ATS Score is a strong 96%, but you can reach 100% by adding metrics to your Stripe experience.` }
    ]);
  }, [displayName]);

  const [chatInput, setChatInput] = useState('');

  // Fetch all real-time analytics
  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const [dash, ats, act, resList, notifRes] = await Promise.all([
        analyticsService.getDashboard(),
        analyticsService.getAts(),
        analyticsService.getActivity(),
        analyticsService.getResumes(),
        apiClient.get('/api/analytics/notifications')
      ]);
      setDashboardData(dash);
      setAtsData(ats);
      setActivities(act);
      setResumes(resList);
      setNotificationCount(notifRes.data.unread_count || 0);
    } catch (err) {
      console.error("Error loading real-time user analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Track Action & Refresh helper
  const handleTrackAction = async (
    type: 'ai_use' | 'download' | 'edit' | 'session' | 'activity',
    detail: string,
    format?: string,
    score?: number
  ) => {
    try {
      await analyticsService.trackAction({
        action_type: type,
        detail,
        format,
        ats_score: score
      });
      // Silent refresh
      const [dash, ats, act, resList] = await Promise.all([
        analyticsService.getDashboard(),
        analyticsService.getAts(),
        analyticsService.getActivity(),
        analyticsService.getResumes()
      ]);
      setDashboardData(dash);
      setAtsData(ats);
      setActivities(act);
      setResumes(resList);
    } catch (err) {
      console.error("Action tracking failed:", err);
    }
  };

  const deleteResume = async (id: number) => {
    if (confirm("Are you sure you want to delete this resume?")) {
      try {
        await apiClient.delete(`/api/resume-studio/${id}`);
        await handleTrackAction('activity', `Deleted Resume ID: ${id}`);
        fetchAnalytics();
      } catch (err) {
        alert("Failed to delete resume.");
      }
    }
  };

  const duplicateResume = async (id: number) => {
    const original = resumes.find(r => r.id === id);
    if (original) {
      try {
        await apiClient.post(`/api/resume-studio/${id}/duplicate`);
        await handleTrackAction('activity', `Duplicated Resume: ${original.name}`);
        fetchAnalytics();
      } catch (err) {
        alert("Failed to duplicate resume.");
      }
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const promptText = chatInput;
    setChatInput('');

    // Track AI request in DB
    await handleTrackAction('ai_use', 'chat');

    // Simulated reply based on content
    setTimeout(() => {
      let replyText = "I'm ready to help you optimize that! Let's scan your keywords or write a professional summary.";
      if (promptText.toLowerCase().includes('ats') || promptText.toLowerCase().includes('score')) {
        replyText = "To optimize your ATS score, consider adding keywords like 'RESTful APIs', 'CI/CD pipeline', and 'System Design' under your experience.";
      } else if (promptText.toLowerCase().includes('skills')) {
        replyText = "I suggest adding technical skills like Docker, Kubernetes, and Tailwind CSS to match current industry demands.";
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: replyText }]);
    }, 1000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      alert("Unsupported file format. Please upload PDF or DOCX.");
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress('Uploading file to secure server...');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await apiClient.post('/api/resume-studio/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const parsedData = uploadRes.data.parsed_data;
      setUploadProgress('Extracting and parsing sections with Gemini AI...');
      
      const createRes = await apiClient.post('/api/resume-studio/create', {
        name: `AI Parsed - ${parsedData.personal_info?.name || 'Resume'}`,
        resume_type: parsedData.experience?.length > 0 ? 'Experienced' : 'Fresher',
        target_role: parsedData.personal_info?.title || parsedData.projects?.[0]?.role || 'Software Engineer',
        career_objective: parsedData.personal_info?.summary || 'ATS friendly resume.',
        preferred_industry: 'Technology',
        language: 'English',
        visibility: 'Private'
      });
      
      const newResumeId = createRes.data.id;
      setUploadProgress('Analyzing resume structure & creating details...');
      
      await apiClient.post(`/api/resume-studio/${newResumeId}/save-final`, {
        master: {
          name: `AI Parsed - ${parsedData.personal_info?.name || 'Resume'}`,
          resume_type: parsedData.experience?.length > 0 ? 'Experienced' : 'Fresher',
          target_role: parsedData.personal_info?.title || parsedData.projects?.[0]?.role || 'Software Engineer',
          career_objective: parsedData.personal_info?.summary || 'ATS friendly resume.',
          preferred_industry: 'Technology',
          language: 'English',
          visibility: 'Private',
          phone: parsedData.personal_info?.phone || '',
          address: parsedData.personal_info?.address || '',
          linkedin: parsedData.personal_info?.linkedin || '',
          github: parsedData.personal_info?.github || '',
          portfolio: parsedData.personal_info?.portfolio || '',
          website: parsedData.personal_info?.website || '',
          summary: parsedData.personal_info?.summary || '',
          achievements_list: JSON.stringify(parsedData.achievements || {})
        },
        personal_info: parsedData.personal_info,
        education: parsedData.education || [],
        experience: parsedData.experience || [],
        projects: parsedData.projects || [],
        skills: parsedData.skills || [],
        certifications: parsedData.certifications || parsedData.certificates || [],
        achievements: parsedData.achievements || {}
      });
      
      setUploadProgress('Conducting AI Resume Intelligence Audit...');
      await apiClient.post(`/api/resume-studio/${newResumeId}/analyze`);
      
      setIsUploading(false);
      navigate(`/resume-builder?id=${newResumeId}&is_parsed=true`);
    } catch (err) {
      console.error(err);
      alert("Failed to parse and save resume.");
      setIsUploading(false);
    }
  };

  // Quick Action Config
  const quickActions = [
    { label: 'Create Resume', icon: Plus, desc: 'Start a fresh resume', action: () => navigate('/resume-builder'), gradient: 'from-blue-600 to-cyan-500' },
    { label: 'Browse Templates', icon: LayoutTemplate, desc: 'Find modern layouts', action: () => {
      const el = document.getElementById('templates-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, gradient: 'from-purple-650 to-indigo-500' },
    { label: 'AI Resume Writer', icon: Bot, desc: 'Autofill with AI', action: () => {
      const el = document.getElementById('ai-assistant-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, gradient: 'from-emerald-600 to-teal-500' },
    { label: 'ATS Checker', icon: Award, desc: 'Check keyword density', action: () => {
      const el = document.getElementById('ats-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, gradient: 'from-pink-600 to-rose-500' },
    { label: 'Cover Letter', icon: Sparkles, desc: 'Generate cover letters', action: async () => {
      await handleTrackAction('ai_use', 'cover_letter');
      alert("AI Cover Letter generated and saved to history!");
    }, gradient: 'from-amber-500 to-orange-500' },
    { label: 'AI Interview', icon: Bot, desc: 'Practice mock interview', action: async () => {
      await handleTrackAction('ai_use', 'chat');
      alert("AI Mock Interview session loaded!");
    }, gradient: 'from-cyan-500 to-blue-500' },
    { label: 'Resume Analytics', icon: BarChart3, desc: 'View profile matches', action: () => {
      const el = document.getElementById('analytics-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, gradient: 'from-indigo-600 to-blue-750' },
    { label: 'Resume Optimizer', icon: Settings, desc: 'Improve layout flow', action: async () => {
      await handleTrackAction('ai_use', 'improvement');
      alert("ATS Optimization check finished!");
    }, gradient: 'from-slate-600 to-slate-750' },
  ];

  // Standard gamification badges
  const badges = [
    { name: 'First Resume', desc: 'Created first resume', icon: '🎓', unlocked: resumes.length > 0 },
    { name: 'ATS Master', desc: 'Score above 95%', icon: '🚀', unlocked: resumes.some(r => r.atsScore >= 95) },
    { name: 'Top Candidate', desc: '10+ Resume views', icon: '🔥', unlocked: true },
    { name: 'Weekly Warrior', desc: 'Active Streak', icon: '👑', unlocked: (dashboardData?.streak?.current || 0) >= 7 },
    { name: 'AI Explorer', desc: 'Use AI 5+ times', icon: '🏆', unlocked: (dashboardData?.timeSavedMinutes || 0) >= 25 }
  ];

  // Render Skeletons helper
  if (isLoading) {
    return (
      <div className="flex flex-col gap-10 min-h-screen pb-12">
        <div className="h-16 w-full bg-slate-200/50 rounded-3xl animate-pulse" />
        <div className="h-44 w-full bg-slate-200/50 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-72 bg-slate-200/50 rounded-3xl animate-pulse" />
          <div className="h-72 bg-slate-200/50 rounded-3xl animate-pulse" />
          <div className="h-72 bg-slate-200/50 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  const bestResume = resumes.find(r => r.atsScore === Math.max(...resumes.map(x => x.atsScore))) || resumes[0] || { id: 0, atsScore: 70, completion: 50, name: "My Resume", sections: {}, template: "modern", status: "Draft" };

  return (
    <div id="top" className="flex flex-col gap-10 min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-500/15 select-none pb-12 relative z-10 w-full">
      
      {/* 1. TOP HEADER - REAL DATA */}
      <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-200/60 rounded-3xl p-4.5 shadow-sm shadow-slate-100/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-650 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/10">
            B
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-base tracking-tight leading-none">Bimba AI</h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Workspace</span>
          </div>
        </div>

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

        <div className="flex items-center justify-end gap-3.5">
          {/* Notifications */}
          <button 
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-smooth relative cursor-pointer shadow-sm"
          >
            <Bell size={16} />
            {notificationCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 shadow-sm" />
            )}
          </button>

          {/* Ask AI Shortcut */}
          <button 
            onClick={() => {
              const el = document.getElementById('ai-assistant-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 h-10 rounded-xl bg-blue-50/60 border border-blue-200/60 hover:bg-blue-50 text-xs font-bold text-blue-600 flex items-center gap-1.5 transition-smooth cursor-pointer shadow-sm"
          >
            <Bot size={14} /> Ask Bimba AI
          </button>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <h5 className="font-extrabold text-xs text-slate-800">{displayName}</h5>
              <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Plus Plan</p>
            </div>
          </div>
        </div>
      </header>
 
      {/* 2. WELCOME HERO PANEL */}
      <section className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 w-[30%] h-[120%] bg-blue-500/5 blur-[80px] pointer-events-none rounded-full" />
        <div className="z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">👋 Good Morning, {displayName}</h2>
          <p className="text-slate-555 text-sm md:text-base leading-relaxed max-w-xl">
            Welcome to the AI Resume Studio. Launch your job search with high impact summaries, job description optimization, and circular ATS scoring.
          </p>
        </div>
        <div className="flex gap-3 text-xs font-bold text-slate-400">
          <div>Resumes: <span className="text-blue-600 font-extrabold">{resumes.length}</span></div>
          <span>•</span>
          <div>Avg ATS: <span className="text-blue-600 font-extrabold">{dashboardData?.resumes?.averageCompletion || 75}%</span></div>
        </div>
      </section>

      {/* 2b. DYNAMIC WORKSPACE ENTRY OPTIONS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Upload Existing Resume */}
        <div 
          onClick={() => document.getElementById('resume-upload-input')?.click()}
          className="group relative bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/80 rounded-3xl p-6.5 cursor-pointer flex flex-col justify-between gap-6 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full group-hover:scale-150 transition-all duration-500" />
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <UploadCloud size={22} className="group-hover:animate-bounce" />
            </div>
            <span className="bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.8 rounded-md uppercase tracking-wider">
              AI Powered
            </span>
          </div>

          <div>
            <h4 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-smooth">📄 Upload Existing Resume</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Upload your current resume and let AI analyze, improve, and convert it into an ATS-friendly professional resume in seconds.
            </p>
          </div>
        </div>

        {/* Card 2: Create New Resume */}
        <div 
          onClick={() => navigate('/resume-builder')}
          className="group relative bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/80 rounded-3xl p-6.5 cursor-pointer flex flex-col justify-between gap-6 shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full group-hover:scale-150 transition-all duration-500" />
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <Sparkles size={22} />
            </div>
            <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-black px-2 py-0.8 rounded-md uppercase tracking-wider">
              From Scratch
            </span>
          </div>

          <div>
            <h4 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-smooth">✨ Create New Resume</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Build a brand-new resume from scratch using high-compliance, recruiter-approved professional templates.
            </p>
          </div>
        </div>
      </section>

      {/* Hidden Upload File Input and Loader overlay */}
      <input 
        type="file" 
        id="resume-upload-input" 
        accept=".pdf,.docx" 
        className="hidden" 
        onChange={handleFileUpload} 
      />

      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-5">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
              <Bot size={24} className="text-blue-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">AI Resume Parsing</h3>
              <p className="text-xs text-slate-450 mt-2 font-semibold leading-relaxed">{uploadProgress}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. HERO STATS CARD ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between h-72 shadow-sm hover:shadow transition-all duration-250">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Best Resume Quality</span>
              <h4 className="text-2xl font-black text-slate-800 mt-1">{bestResume.completion}% Complete</h4>
            </div>
            <div className="w-11 h-11 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-center text-slate-500">
              <ListTodo size={18} />
            </div>
          </div>
          
          <div className="flex flex-col gap-2.5 mt-2 overflow-y-auto no-scrollbar max-h-36 pr-1">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Section Completion Analysis</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600">
              {bestResume.sections && Object.entries(bestResume.sections).map(([name, completed]) => (
                <div key={name} className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${completed ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-slate-50 text-slate-355 border border-slate-200/40'}`}>
                    {completed ? '✓' : '○'}
                  </div>
                  <span>{name}</span>
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
              <h4 className="text-2xl font-black text-slate-800 mt-1">{dashboardData?.streak?.current} Days Active</h4>
            </div>
            <div className="w-11 h-11 bg-orange-50 border border-orange-200/60 rounded-xl flex items-center justify-center text-orange-500">
              <Flame size={18} className="fill-orange-500" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4.5">
            <p className="text-[11px] text-orange-600 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
              🔥 {dashboardData?.streak?.current} Day Streak
            </p>
            <p className="text-xs text-slate-550 leading-relaxed">
              Log in daily to keep your streaks running. Longest streak: <span className="font-bold">{dashboardData?.streak?.longest} days</span>. Total active days: <span className="font-bold">{dashboardData?.streak?.activeDays}</span>.
            </p>
          </div>
        </div>

        {/* AI Recommendations Suggestion */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between h-72 shadow-sm hover:shadow transition-all duration-250">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black text-blue-600 tracking-wider uppercase">Bimba AI Suggests</span>
              <h4 className="text-md font-extrabold text-slate-850 mt-1 truncate max-w-[190px]">Optimize: {bestResume.name}</h4>
            </div>
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Sparkles size={16} />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2 overflow-y-auto no-scrollbar max-h-40 pr-1">
            {atsData?.recommendations?.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-[11px] text-slate-650 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-2.5 hover:bg-slate-100/50 transition-smooth">
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
                  {(act as any).isMock && (
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

      {/* 5. CONTINUE WORKING (REAL RESUMES LIST) */}
      <section id="resumes-section" className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Active Resumes</span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">My Resumes</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <input 
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 min-w-[120px]"
            />
            {/* Sort Control */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="updated_at">Last Updated</option>
              <option value="ats_score">ATS Score</option>
              <option value="name">Name</option>
            </select>
            
            {/* Filter Control */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            
            <span className="text-xs text-slate-400 font-semibold ml-auto sm:ml-0">
              {resumes.length} active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {resumes
            .filter(res => {
              const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesFilter = filterBy === 'all' || res.status.toLowerCase() === filterBy.toLowerCase();
              return matchesSearch && matchesFilter;
            })
            .sort((a, b) => {
              if (sortBy === 'ats_score') {
                return b.atsScore - a.atsScore;
              } else if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
              } else {
                return b.id - a.id;
              }
            })
            .map((res) => (
            <div 
              key={res.id} 
              className="group relative bg-white border border-slate-200/60 hover:border-slate-350 rounded-2xl p-5 flex flex-col justify-between gap-5 transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                    <FileText size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-blue-600 transition-smooth">{res.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Template: {res.template} • Status: {res.status}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-blue-655 text-[9.5px] font-bold bg-blue-50 border border-blue-100 px-2.5 py-0.8 rounded-md shadow-sm">
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
                    onClick={() => navigate(`/resume-builder?id=${res.id}`)}
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
                    onClick={async () => {
                      await handleTrackAction('download', 'download_pdf', 'PDF');
                      const token = localStorage.getItem('auth_token');
                      const url = `${API_BASE_URL}/api/resume-studio/${res.id}/pdf${token ? `?token=${token}` : ''}`;
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${res.name}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
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
      </section>

      {/* 6. ANALYTICS DIAGRAMS & HISTOGRAM HEATMAP */}
      <section id="analytics-section" className="flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Statistical Dashboard</span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">Analytics & History</h3>
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
                    <circle cx="48" cy="48" r="40" className="stroke-sky-400 fill-none" strokeWidth="8" strokeDasharray="251" strokeDashoffset={251 - (251 * (bestResume.atsScore || 0)) / 100} strokeLinecap="round" />
                  </svg>
                  <span className="text-base font-black text-slate-800">{bestResume.atsScore}%</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ATS Match Score</span>
              </div>

              {/* Completion Ring */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" className="stroke-slate-100 fill-none" strokeWidth="8" />
                    <circle cx="48" cy="48" r="40" className="stroke-blue-600 fill-none" strokeWidth="8" strokeDasharray="251" strokeDashoffset={251 - (251 * (dashboardData?.resumes?.averageCompletion || 0)) / 100} strokeLinecap="round" />
                  </svg>
                  <span className="text-base font-black text-slate-800">{dashboardData?.resumes?.averageCompletion}%</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Completion</span>
              </div>
            </div>
          </div>

          {/* Real Line Chart for Version history */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between min-h-[300px] shadow-sm">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-sm font-extrabold text-slate-800">ATS Progress History</h4>
              <span className="text-[10px] text-blue-600 font-bold">Line Chart</span>
            </div>

            {/* Simple Responsive SVG Line Chart */}
            <div className="w-full h-40 mt-2 relative">
              <svg className="w-full h-full" viewBox="0 0 300 120">
                {/* Horizontal grid lines */}
                <line x1="0" y1="20" x2="300" y2="20" className="stroke-slate-100" strokeWidth="1" />
                <line x1="0" y1="60" x2="300" y2="60" className="stroke-slate-100" strokeWidth="1" />
                <line x1="0" y1="100" x2="300" y2="100" className="stroke-slate-100" strokeWidth="1" />
                
                {/* Draw dynamic path */}
                {atsData?.history && atsData.history.length > 1 && (
                  <>
                    <path
                      d={`M ${atsData.history.map((h, i) => {
                        const x = (i / (atsData.history!.length - 1)) * 260 + 20;
                        const y = 100 - (h.atsScore - 50) * 1.5; // Map 50-100% score to chart height
                        return `${x} ${y}`;
                      }).join(' L ')}`}
                      className="fill-none stroke-blue-600"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Dots & Labels */}
                    {atsData.history.map((h, i) => {
                      const x = (i / (atsData.history!.length - 1)) * 260 + 20;
                      const y = 100 - (h.atsScore - 50) * 1.5;
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="5" className="fill-white stroke-blue-600" strokeWidth="2.5" />
                          <text x={x} y={y - 10} textAnchor="middle" className="text-[9px] font-extrabold fill-slate-800">{h.atsScore}%</text>
                          <text x={x} y="115" textAnchor="middle" className="text-[8px] font-bold fill-slate-450">{h.version}</text>
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Activity Timeline Card */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between min-h-[300px] shadow-sm">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-sm font-extrabold text-slate-800">Activity History</h4>
              <span className="text-[10px] text-slate-400 font-bold">Timeline</span>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar max-h-48 pr-1">
              {activities.slice(0, 4).map((act, idx) => {
                const dateText = new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={act.id} className="flex gap-3 text-left">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shadow-sm shadow-blue-500/30" />
                      {idx < activities.length - 1 && <div className="w-0.5 bg-slate-100 flex-grow my-1" />}
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 block">{dateText}</span>
                      <h5 className="font-extrabold text-xs text-slate-800 mt-0.5">{act.activity}</h5>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 7. GITHUB STYLE HEATMAP */}
      <section className="flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">User Productivity</span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">Productivity Heatmap</h3>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 justify-start">
            {dashboardData?.heatmap?.slice().reverse().map((day) => {
              const colors = [
                'bg-slate-50 border border-slate-200/30',
                'bg-blue-100 border border-blue-200/20',
                'bg-blue-300 border border-blue-400/20',
                'bg-blue-500 border border-blue-600/10 shadow shadow-blue-500/5',
                'bg-blue-600 border border-blue-700/10 shadow shadow-blue-600/10'
              ];
              const level = Math.min(day.count, 4);
              const dateStr = new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              return (
                <div 
                  key={day.date} 
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-extrabold text-slate-700 transition-all ${colors[level]}`}
                  title={`${day.count} activities on ${dateStr}`}
                >
                  {day.count > 0 ? day.count : ''}
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-slate-400 mt-3 font-semibold text-left">
            Displaying daily activity logs count for the past 30 days. Hover squares to inspect details.
          </p>
        </div>
      </section>

      {/* 8. AI ASSISTANT PANEL */}
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

          {/* Right prompt suggestions */}
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

      {/* 9. STREAKS & BADGES ACHIEVEMENTS */}
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
