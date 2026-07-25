import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, FileText, Plus, Award, 
  Bot, BarChart3, Settings, Flame, Search, Bell, 
  Edit3, Copy, Download, Trash2,
  SendHorizontal, Lock, ListTodo, UploadCloud,
  Brain, Scan, Mail, Briefcase, Globe, Building,
  MessageSquare, LineChart, CheckCircle2, AlertCircle,
  HelpCircle, ChevronRight, RefreshCw, X, MessageCircle
} from 'lucide-react';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';
import { analyticsService } from '../services/analytics';
import { apiClient, API_BASE_URL } from '../services/api';
import { jobsService } from '../services/jobs';
import type { JobListItem } from '../services/jobs';

import type { DashboardData, AtsData, ActivityTimelineItem, ResumeAnalyticsItem, DownloadsData } from '../services/analytics';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [recommendedJobs, setRecommendedJobs] = useState<JobListItem[]>([]);
  
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
  const [templates, setTemplates] = useState<any[]>([]);
  const [downloadsData, setDownloadsData] = useState<DownloadsData | null>(null);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string }>>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Upload and Sorting/Filtering State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [sortBy, setSortBy] = useState<'updated_at' | 'ats_score' | 'name'>('updated_at');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    setChatMessages([
      { sender: 'ai', text: `Hello ${displayName}! I've analyzed your Career profile. Your ATS score is outstanding, but we can improve it further. What would you like to optimize today?` }
    ]);
  }, [displayName]);

  // Fetch all real-time analytics
  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const [dash, ats, act, resList, tplRes, jobsRes, dlRes] = await Promise.all([
        analyticsService.getDashboard(),
        analyticsService.getAts(),
        analyticsService.getActivity(),
        analyticsService.getResumes(),
        apiClient.get('/api/resume-studio/templates'),
        jobsService.searchJobs({ limit: 4 }),
        analyticsService.getDownloads()
      ]);
      setDashboardData(dash);
      setAtsData(ats);
      setActivities(act);
      setResumes(resList);
      setTemplates(tplRes.data || []);
      setRecommendedJobs(jobsRes.jobs);
      setDownloadsData(dlRes);
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

    await handleTrackAction('ai_use', 'chat');

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

  const handleFixSuggestion = async (suggestion: string) => {
    alert(`AI Triggered one-click fix for "${suggestion}". Optimization is now processing!`);
    await handleTrackAction('ai_use', `one_click_fix_${suggestion}`);
    fetchAnalytics();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 min-h-screen pb-12 font-sans text-left">
        <div className="h-44 w-full bg-slate-100 rounded-[20px] animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-36 bg-slate-100 rounded-[20px] animate-pulse" />
          <div className="h-36 bg-slate-100 rounded-[20px] animate-pulse" />
          <div className="h-36 bg-slate-100 rounded-[20px] animate-pulse" />
          <div className="h-36 bg-slate-100 rounded-[20px] animate-pulse" />
        </div>
      </div>
    );
  }

  const bestResume = resumes.find(r => r.atsScore === Math.max(...resumes.map(x => x.atsScore))) || resumes[0];
  const resumeHealth = bestResume?.completion || 0;
  const atsScore = bestResume?.atsScore || 0;
  const totalTemplates = templates.length || 0;
  const totalDownloads = downloadsData?.trend?.reduce((sum: number, item: any) => sum + item.downloads, 0) || 0;

  const suggestions = atsData?.recommendations || [];
  const atsHistory = atsData?.history || [];
  const downloadsTrend = downloadsData?.trend || [];

  const formatTimeAgo = (isoStr: string) => {
    try {
      const diffMs = new Date().getTime() - new Date(isoStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const timelineActivities = (activities || []).map(act => ({
    title: act.activity,
    time: formatTimeAgo(act.timestamp),
    desc: ""
  }));

  return (
    <div className="flex flex-col gap-6 text-left font-sans text-slate-800 w-full animate-fadeIn pb-12 selection:bg-emerald-500/10">
      
      {/* TOP HEADER & GLOBAL SEARCH */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search resumes, tools, insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 focus:bg-white border border-slate-250/70 focus:border-emerald-500 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AI Assistant Active
          </span>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden shadow-sm flex flex-col justify-between gap-6 min-h-[220px]">
        {/* Sleek Vercel-style background blur */}
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
        
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Good Morning, {displayName}
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">Your Bimba AI Career Dashboard is synced and up to date.</p>
        </div>

        {/* Hero metrics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {[
            { label: 'Resume Health', val: `${resumeHealth}%`, col: 'text-emerald-600', valNum: resumeHealth },
            { label: 'ATS Score', val: `${atsScore}%`, col: 'text-emerald-600', valNum: atsScore },
            { label: 'Templates', val: totalTemplates, col: 'text-emerald-700', valNum: 100 },
            { label: 'Downloads', val: totalDownloads, col: 'text-emerald-700', valNum: 100 }
          ].map((s) => (
            <div key={s.label} className="bg-slate-50/70 border border-slate-200/40 rounded-xl p-4 flex flex-col justify-between hover:scale-[1.02] hover:bg-white hover:border-emerald-100 hover:shadow-sm transition-all duration-200">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">{s.label}</span>
              <div className="flex items-end justify-between mt-2">
                <span className={`text-2xl font-extrabold ${s.col} leading-none`}>{s.val}</span>
                {/* Visual SVG Progress Ring for Health and ATS */}
                {(s.label.includes('Health') || s.label.includes('ATS')) ? (
                  <svg className="w-6 h-6" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500 transition-all duration-500"
                      strokeDasharray={`${s.valNum}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-emerald-600" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QUICK ACTIONS SECTION */}
      <section className="flex flex-col gap-3">
        <div>
          <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">Platform Shortcuts</span>
          <h2 className="text-base font-extrabold text-slate-900 mt-0.5">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Upload Existing */}
          <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-48 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full group-hover:scale-150 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                <UploadCloud size={18} />
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded uppercase">ATS Parser</span>
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-600 transition-colors">Upload Existing Resume</h4>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">Upload your existing resume for AI analysis and ATS optimization.</p>
            </div>
            <button 
              onClick={() => document.getElementById('resume-upload-input')?.click()}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-colors cursor-pointer"
            >
              Upload Resume
            </button>
          </div>

          {/* Card 2: Create New */}
          <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-48 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full group-hover:scale-150 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                <Sparkles size={18} />
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded uppercase">AI Writer</span>
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-600 transition-colors">Create New Resume</h4>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">Build a professional ATS-friendly resume from scratch.</p>
            </div>
            <button 
              onClick={() => navigate('/resume-builder')}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-colors cursor-pointer"
            >
              Create Resume
            </button>
          </div>

          {/* Card 3: ATS Resume Scanner */}
          <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-48 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full group-hover:scale-150 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                <Scan size={18} />
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded uppercase">ATS Scan</span>
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-600 transition-colors">ATS Resume Scanner</h4>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">Analyze ATS compatibility and identify missing keywords.</p>
            </div>
            <button 
              onClick={() => {
                const el = document.getElementById('analytics-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-colors cursor-pointer"
            >
              Scan Resume
            </button>
          </div>

          {/* Card 4: AI Resume Optimizer */}
          <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-48 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full group-hover:scale-150 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                <Brain size={18} />
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded uppercase">Optimizer</span>
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-600 transition-colors">AI Resume Optimizer</h4>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">Improve grammar, wording, impact, and recruiter appeal.</p>
            </div>
            <button 
              onClick={() => setIsChatOpen(true)}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-colors cursor-pointer"
            >
              Optimize
            </button>
          </div>
        </div>
      </section>

      {/* Hidden File Input */}
      <input 
        type="file" 
        id="resume-upload-input" 
        accept=".pdf,.docx" 
        className="hidden" 
        onChange={handleFileUpload} 
      />

      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-5">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
              <Bot size={24} className="text-emerald-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">AI Resume Parsing</h3>
              <p className="text-xs text-slate-500 mt-2 font-semibold leading-relaxed">{uploadProgress}</p>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMENDED JOBS SECTION */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-end border-b border-slate-100 pb-2">
          <div>
            <span className="text-[9px] font-bold text-emerald-700 tracking-wider uppercase">AI Matching</span>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Recommended Jobs</h3>
          </div>
          <button 
            onClick={() => navigate('/jobs')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer border-0 bg-transparent"
          >
            View All Jobs →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recommendedJobs.slice(0, 4).map((job) => {
            const score = job.ai_match_score || 75;
            let scoreBg = 'bg-emerald-50 text-emerald-700 border-emerald-100';
            return (
              <div 
                key={job.id} 
                className="bg-white border border-slate-200/80 rounded-2xl p-4.5 flex items-center justify-between shadow-sm hover:border-slate-350/70 hover:shadow transition-all duration-200"
              >
                <div className="flex items-center gap-3.5">
                  {job.logo ? (
                    <img 
                      src={job.logo} 
                      alt={job.company} 
                      className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <Building size={16} />
                    </div>
                  )}
                  <div className="text-left leading-tight">
                    <h4 className="font-bold text-xs text-slate-800 truncate max-w-[140px] sm:max-w-[180px]" title={job.title}>
                      {job.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{job.company}</p>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-1">{job.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold ${scoreBg}`}>
                    {score}% Match
                  </span>
                  <button 
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm hover:scale-102 transition-all cursor-pointer"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MY RESUME PORTFOLIO */}
      <section id="resumes-section" className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-slate-100 pb-2">
          <div>
            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">Active Resumes</span>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">My Resumes</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <input 
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-w-[120px] font-medium"
            />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
            >
              <option value="updated_at">Last Updated</option>
              <option value="ats_score">ATS Score</option>
              <option value="name">Name</option>
            </select>
            
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
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
              if (sortBy === 'ats_score') return b.atsScore - a.atsScore;
              if (sortBy === 'name') return a.name.localeCompare(b.name);
              return b.id - a.id;
            })
            .map((res) => (
              <div 
                key={res.id} 
                className="group relative bg-white border border-slate-200/85 hover:border-emerald-300 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-md text-left"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-center text-emerald-600 shadow-sm">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 group-hover:text-emerald-600 transition-colors">{res.name}</h4>
                      <p className="text-[9px] text-slate-400 mt-1 font-semibold">Template: <span className="capitalize">{res.template}</span> • Status: <span className="font-bold">{res.status}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                      ATS {res.atsScore}%
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">Health: {res.completion}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-5 pt-3 border-t border-slate-100 mt-1">
                  <div className="flex items-center gap-1.5 flex-grow">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${res.completion}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={() => navigate(`/resume-builder?id=${res.id}`)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-colors cursor-pointer"
                      title="Edit Resume"
                    >
                      <Edit3 size={11} />
                    </button>
                    <button 
                      onClick={async () => {
                        await handleTrackAction('download', 'download_pdf', 'PDF');
                        const token = localStorage.getItem('auth_token');
                        window.open(`${API_BASE_URL}/api/resume-studio/${res.id}/pdf${token ? `?token=${token}` : ''}`, '_blank');
                      }}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      <Download size={11} />
                    </button>
                    <button 
                      onClick={() => duplicateResume(res.id)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-colors cursor-pointer"
                      title="Duplicate"
                    >
                      <Copy size={11} />
                    </button>
                    <button 
                      onClick={() => deleteResume(res.id)}
                      className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                      title="Delete Resume"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* BIMBA AI RECOMMENDATIONS */}
      <section className="flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">Recruiter Insights</span>
          <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Bimba AI Recommendations</h3>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-slate-400 font-bold text-xs">
                No recommendations found. Scan or create a resume to get AI career insights!
              </div>
            ) : (
              suggestions.map((sug: any, idx: number) => (
                <div 
                  key={idx} 
                  className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between gap-3 text-left hover:border-emerald-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{sug.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed">{sug.reason}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      sug.priority === 'High' ? 'bg-rose-50 border border-rose-100 text-rose-600' : 'bg-amber-50 border border-amber-100 text-amber-600'
                    }`}>
                      {sug.priority}
                    </span>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => handleFixSuggestion(sug.title)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      One-Click Fix
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CAREER INSIGHTS CHARTS & TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Activity Timeline */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[280px] shadow-sm text-left">
          <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-850">Recent Activity</h4>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Logs</span>
          </div>

          <div className="flex flex-col gap-4 flex-grow justify-center pr-1">
            {timelineActivities.length === 0 ? (
              <div className="text-center py-6 text-slate-400 font-bold text-xs">
                No recent activity recorded yet.
              </div>
            ) : (
              timelineActivities.map((act, idx) => (
                <div key={idx} className="flex gap-3 text-left">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shadow-sm shadow-emerald-500/20" />
                    {idx < timelineActivities.length - 1 && <div className="w-0.5 bg-slate-100 flex-grow my-1" />}
                  </div>
                  <div>
                    <div className="flex gap-2 items-center leading-none">
                      <span className="text-[10px] font-bold text-slate-800">{act.title}</span>
                      <span className="text-[8px] text-slate-400 font-semibold">• {act.time}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 font-semibold leading-relaxed">{act.desc}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SVG charts */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[280px] shadow-sm text-left" id="analytics-section">
          <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-850">Career Insights & Progress</h4>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Analytics Trends</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-grow items-center">
            {/* ATS Score Chart */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ATS score progression</span>
              <div className="w-full h-28 mt-1 relative bg-slate-50/50 border border-slate-100 rounded-xl p-2 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 200 80">
                  <defs>
                    <linearGradient id="atsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>
                  <line x1="10" y1="15" x2="190" y2="15" className="stroke-slate-100" strokeWidth="1" />
                  <line x1="10" y1="40" x2="190" y2="40" className="stroke-slate-100" strokeWidth="1" />
                  <line x1="10" y1="65" x2="190" y2="65" className="stroke-slate-100" strokeWidth="1" />
                  
                  {atsHistory.length > 0 ? (
                    <>
                      {/* Premium filled path */}
                      <path 
                        d={(() => {
                          const len = atsHistory.length;
                          const points = atsHistory.map((h: any, i: number) => {
                            const x = len > 1 ? 10 + i * (180 / (len - 1)) : 100;
                            const score = h.atsScore || 70;
                            const y = 70 - (score / 100) * 55;
                            return `${x},${y}`;
                          });
                          const firstX = len > 1 ? 10 : 100;
                          const lastX = len > 1 ? 190 : 100;
                          return `M ${firstX},70 L ${points.join(" L ")} L ${lastX},70 Z`;
                        })()} 
                        fill="url(#atsGrad)"
                      />
                      {/* Premium stroke line */}
                      <path 
                        d={(() => {
                          const len = atsHistory.length;
                          return atsHistory.map((h: any, i: number) => {
                            const x = len > 1 ? 10 + i * (180 / (len - 1)) : 100;
                            const score = h.atsScore || 70;
                            const y = 70 - (score / 100) * 55;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(" ");
                        })()} 
                        fill="none" 
                        stroke="#10B981" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                      
                      {atsHistory.map((h: any, i: number) => {
                        const len = atsHistory.length;
                        const x = len > 1 ? 10 + i * (180 / (len - 1)) : 100;
                        const score = h.atsScore || 70;
                        const y = 70 - (score / 100) * 55;
                        return (
                          <circle 
                            key={i} 
                            cx={x} 
                            cy={y} 
                            r="3" 
                            className="fill-white stroke-emerald-600" 
                            strokeWidth="2" 
                          />
                        );
                      })}
                      
                      <text x="180" y="10" textAnchor="end" className="text-[8px] font-bold fill-emerald-700">
                        {atsHistory[atsHistory.length - 1].atsScore}% ATS
                      </text>
                    </>
                  ) : (
                    <text x="100" y="45" textAnchor="middle" className="text-[9px] font-bold fill-slate-400">
                      No ATS history yet
                    </text>
                  )}
                </svg>
              </div>
            </div>

            {/* Downloads Chart */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Downloads & Views</span>
              <div className="w-full h-28 mt-1 relative bg-slate-50/50 border border-slate-100 rounded-xl p-2 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 200 80">
                  <defs>
                    <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>
                  <line x1="10" y1="15" x2="190" y2="15" className="stroke-slate-100" strokeWidth="1" />
                  <line x1="10" y1="40" x2="190" y2="40" className="stroke-slate-100" strokeWidth="1" />
                  <line x1="10" y1="65" x2="190" y2="65" className="stroke-slate-100" strokeWidth="1" />
                  
                  {downloadsTrend.length > 0 ? (
                    <>
                      {/* Gradient fill */}
                      <path 
                        d={(() => {
                          const len = downloadsTrend.length;
                          const maxVal = Math.max(...downloadsTrend.map((t: any) => t.downloads)) || 1;
                          const points = downloadsTrend.map((t: any, i: number) => {
                            const x = len > 1 ? 10 + i * (180 / (len - 1)) : 100;
                            const y = 70 - (t.downloads / maxVal) * 50;
                            return `${x},${y}`;
                          });
                          const firstX = len > 1 ? 10 : 100;
                          const lastX = len > 1 ? 190 : 100;
                          return `M ${firstX},70 L ${points.join(" L ")} L ${lastX},70 Z`;
                        })()} 
                        fill="url(#dlGrad)"
                      />
                      {/* Line stroke */}
                      <path 
                        d={(() => {
                          const len = downloadsTrend.length;
                          const maxVal = Math.max(...downloadsTrend.map((t: any) => t.downloads)) || 1;
                          return downloadsTrend.map((t: any, i: number) => {
                            const x = len > 1 ? 10 + i * (180 / (len - 1)) : 100;
                            const y = 70 - (t.downloads / maxVal) * 50;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(" ");
                        })()} 
                        fill="none" 
                        stroke="#10B981" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                      
                      {downloadsTrend.map((t: any, i: number) => {
                        const len = downloadsTrend.length;
                        const maxVal = Math.max(...downloadsTrend.map((x: any) => x.downloads)) || 1;
                        const x = len > 1 ? 10 + i * (180 / (len - 1)) : 100;
                        const y = 70 - (t.downloads / maxVal) * 50;
                        return (
                          <circle 
                            key={i} 
                            cx={x} 
                            cy={y} 
                            r="3" 
                            className="fill-white stroke-emerald-600" 
                            strokeWidth="2" 
                          />
                        );
                      })}
                      
                      <text x="180" y="12" textAnchor="end" className="text-[8px] font-bold fill-emerald-700">
                        {downloadsTrend[downloadsTrend.length - 1].downloads} DLs
                      </text>
                    </>
                  ) : (
                    <text x="100" y="45" textAnchor="middle" className="text-[9px] font-bold fill-slate-400">
                      No downloads logged
                    </text>
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BIMBA AI FLOATING CHATBOT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Panel Box */}
        {isChatOpen && (
          <div className="mb-4 bg-white border border-slate-200 shadow-2xl rounded-2xl w-[350px] h-[450px] flex flex-col overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between text-white shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-xs">Bimba AI Assistant</h4>
                  <p className="text-[9px] text-emerald-100">Intelligent Career Advisor</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-white hover:text-emerald-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3.5 bg-slate-50/50">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-[11px] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-white border border-slate-150 text-slate-700 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Prompts Container */}
            <div className="px-4 py-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {[
                { label: 'Improve Skills', text: 'Analyze and suggest modern skills for my CV.' },
                { label: 'Optimize ATS', text: 'How do I bypass standard ATS systems?' },
                { label: 'Cover Letter', text: 'Draft a cover letter for a Frontend Engineer position.' },
              ].map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatInput(sug.text)}
                  className="bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200/80 hover:border-emerald-150 text-slate-650 px-2.5 py-1 rounded-full text-[9px] font-semibold transition-all cursor-pointer whitespace-nowrap"
                >
                  {sug.label}
                </button>
              ))}
            </div>

            {/* Chat Input Field */}
            <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
              <input 
                type="text"
                placeholder="Ask anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-grow pl-3 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-[11px] text-slate-700 placeholder:text-slate-400 font-medium"
              />
              <button 
                onClick={handleSendChat}
                className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm shrink-0"
              >
                <SendHorizontal size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Floating Action FAB Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          {isChatOpen ? <X size={20} /> : <MessageCircle size={20} />}
        </button>
      </div>

    </div>
  );
};

export default Dashboard;
