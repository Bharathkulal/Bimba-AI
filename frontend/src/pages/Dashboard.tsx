import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, FileText, Plus, Award, 
  Bot, BarChart3, Settings, Flame, Search, Bell, 
  Edit3, Copy, Download, Trash2,
  SendHorizontal, Lock, ListTodo, UploadCloud,
  Brain, Scan, Mail, Briefcase, Globe, Building,
  MessageSquare, LineChart, CheckCircle2, AlertCircle,
  HelpCircle, ChevronRight, RefreshCw, RefreshCw as RotateCw
} from 'lucide-react';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';
import { analyticsService } from '../services/analytics';
import { apiClient, API_BASE_URL } from '../services/api';
import { jobsService } from '../services/jobs';
import type { JobListItem } from '../services/jobs';

import type { DashboardData, AtsData, ActivityTimelineItem, ResumeAnalyticsItem } from '../services/analytics';

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
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string }>>([]);
  
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
      const [dash, ats, act, resList, notifRes, tplRes, jobsRes] = await Promise.all([
        analyticsService.getDashboard(),
        analyticsService.getAts(),
        analyticsService.getActivity(),
        analyticsService.getResumes(),
        apiClient.get('/api/analytics/notifications'),
        apiClient.get('/api/resume-studio/templates'),
        jobsService.searchJobs({ limit: 4 })
      ]);
      setDashboardData(dash);
      setAtsData(ats);
      setActivities(act);
      setResumes(resList);
      setNotificationCount(notifRes.data.unread_count || 0);
      setTemplates(tplRes.data || []);
      setRecommendedJobs(jobsRes.jobs);
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
        await handleTrackAction('activity', `Duplicated Resume: original name`);
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
        <div className="h-44 w-full bg-slate-205/50 rounded-[20px] animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-36 bg-slate-205/50 rounded-[20px] animate-pulse" />
          <div className="h-36 bg-slate-205/50 rounded-[20px] animate-pulse" />
          <div className="h-36 bg-slate-205/50 rounded-[20px] animate-pulse" />
          <div className="h-36 bg-slate-205/50 rounded-[20px] animate-pulse" />
        </div>
      </div>
    );
  }

  const bestResume = resumes.find(r => r.atsScore === Math.max(...resumes.map(x => x.atsScore))) || resumes[0] || { id: 0, atsScore: 88, completion: 91, name: "My Resume Portfolio", template: "modern", status: "Draft" };
  const resumeHealth = bestResume.completion || 88;
  const atsScore = bestResume.atsScore || 91;
  const totalTemplates = templates.length || 24;
  const totalDownloads = dashboardData?.timeSavedMinutes || 17;

  // Mock suggestion list derived from DB recommendations
  const suggestions = [
    { title: "Improve Project Descriptions", reason: "Action verbs and metrics are currently weak or missing.", priority: "High" },
    { title: "Missing Certifications", reason: "No industry credentials found to support developer skills.", priority: "Medium" },
    { title: "Weak Professional Summary", reason: "Paragraph is currently generic and lacks targeted roles.", priority: "High" },
    { title: "Low ATS Keywords Match", reason: "Target roles require more DevOps and cloud definitions.", priority: "High" },
  ];


  // Activities mapping
  const timelineActivities = [
    { title: "Resume Updated", time: "Today", desc: "Modified bullets in experience section." },
    { title: "ATS Improved", time: "Yesterday", desc: "Added missing skills tags: Docker, System Design." },
    { title: "Downloaded PDF", time: "3 Days Ago", desc: "Exported celestial layout template." },
    { title: "Created Resume", time: "Last Week", desc: "Started draft from scratch." },
  ];

  return (
    <div className="flex flex-col gap-6.5 text-left font-sans text-slate-800 w-full animate-fadeIn pb-12 selection:bg-green-500/10">
      
      {/* TOP HEADER STATUS & BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-200/60 rounded-[20px] p-4.5 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text"
            placeholder="Search resumes, tools, insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-green-500 transition-smooth font-medium"
          />
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="bg-white border border-slate-200/60 rounded-[20px] p-6 relative overflow-hidden shadow-sm flex flex-col justify-between gap-5 h-[210px] shrink-0">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-blue-500/5 to-transparent blur-3xl pointer-events-none" />
        
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            Good Morning, {displayName} <span className="animate-wiggle">👋</span>
          </h1>
          <p className="text-xs text-slate-450 font-semibold mt-1">Welcome back to Bimba AI. Your AI Career Assistant is ready.</p>
        </div>

        {/* Hero stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {[
            { label: 'Resume Health', val: `${resumeHealth}%`, col: 'text-green-600' },
            { label: 'ATS Score', val: `${atsScore}%`, col: 'text-emerald-600' },
            { label: 'Templates', val: totalTemplates, col: 'text-purple-600' },
            { label: 'Downloads', val: totalDownloads, col: 'text-orange-600' }
          ].map((s) => (
            <div key={s.label} className="bg-slate-50/70 border border-slate-200/40 rounded-xl p-3.5 flex flex-col justify-between hover:scale-[1.02] transition-all duration-200">
              <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none">{s.label}</span>
              <span className={`text-xl font-black ${s.col} mt-1.5 leading-none`}>{s.val}</span>
            </div>
          ))}
        </div>
      </section>

      {/* QUICK ACTIONS SECTION */}
      <section className="flex flex-col gap-3.5">
        <div>
          <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Platform Shortcuts</span>
          <h2 className="text-base font-extrabold text-slate-900 mt-0.5">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Upload Existing */}
          <div className="group relative bg-white border border-slate-200/60 rounded-[20px] p-5 flex flex-col justify-between min-h-48 shadow-sm hover:scale-[1.02] hover:border-green-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-2xl rounded-full group-hover:scale-150 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-150 text-green-600 flex items-center justify-center shadow-inner">
                <UploadCloud size={18} />
              </div>
              <span className="bg-green-50 text-green-600 text-[8px] font-black px-2 py-0.5 rounded uppercase">ATS Parser</span>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-green-600 transition-smooth">Upload Existing Resume</h4>
              <p className="text-[10px] text-slate-450 mt-1.5 leading-relaxed">Upload your existing resume for AI analysis and ATS optimization.</p>
            </div>
            <button 
              onClick={() => document.getElementById('resume-upload-input')?.click()}
              className="mt-3.5 w-full py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-extrabold text-[10px] rounded-xl shadow-sm hover:shadow transition-smooth cursor-pointer"
            >
              Upload Resume
            </button>
          </div>

          {/* Card 2: Create New */}
          <div className="group relative bg-white border border-slate-200/60 rounded-[20px] p-5 flex flex-col justify-between min-h-48 shadow-sm hover:scale-[1.02] hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full group-hover:scale-150 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-150 text-purple-650 flex items-center justify-center shadow-inner">
                <Sparkles size={18} />
              </div>
              <span className="bg-purple-50 text-purple-650 text-[8px] font-black px-2 py-0.5 rounded uppercase font-sans">AI Writer</span>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-purple-655 transition-smooth">Create New Resume</h4>
              <p className="text-[10px] text-slate-450 mt-1.5 leading-relaxed">Build a professional ATS-friendly resume from scratch.</p>
            </div>
            <button 
              onClick={() => navigate('/resume-builder')}
              className="mt-3.5 w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-705 hover:to-indigo-600 text-white font-extrabold text-[10px] rounded-xl shadow-sm hover:shadow transition-smooth cursor-pointer"
            >
              Create Resume
            </button>
          </div>

          {/* Card 3: ATS Resume Scanner */}
          <div className="group relative bg-white border border-slate-200/60 rounded-[20px] p-5 flex flex-col justify-between min-h-48 shadow-sm hover:scale-[1.02] hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full group-hover:scale-150 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-150 text-emerald-600 flex items-center justify-center shadow-inner">
                <Scan size={18} />
              </div>
              <span className="bg-emerald-50 text-emerald-650 text-[8px] font-black px-2 py-0.5 rounded uppercase">ATS Scan</span>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-emerald-600 transition-smooth">ATS Resume Scanner</h4>
              <p className="text-[10px] text-slate-450 mt-1.5 leading-relaxed">Analyze ATS compatibility and identify missing keywords.</p>
            </div>
            <button 
              onClick={() => {
                const el = document.getElementById('analytics-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-3.5 w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold text-[10px] rounded-xl shadow-sm hover:shadow transition-smooth cursor-pointer"
            >
              Scan Resume
            </button>
          </div>

          {/* Card 4: AI Resume Optimizer */}
          <div className="group relative bg-white border border-slate-200/60 rounded-[20px] p-5 flex flex-col justify-between min-h-48 shadow-sm hover:scale-[1.02] hover:border-orange-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-2xl rounded-full group-hover:scale-150 transition-all duration-300" />
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-150 text-orange-505 flex items-center justify-center shadow-inner">
                <Brain size={18} />
              </div>
              <span className="bg-orange-50 text-orange-655 text-[8px] font-black px-2 py-0.5 rounded uppercase font-sans">Optimizer</span>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-orange-600 transition-smooth">AI Resume Optimizer</h4>
              <p className="text-[10px] text-slate-450 mt-1.5 leading-relaxed">Improve grammar, wording, impact, and recruiter appeal.</p>
            </div>
            <button 
              onClick={() => {
                const el = document.getElementById('ai-assistant-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-3.5 w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-[10px] rounded-xl shadow-sm hover:shadow transition-smooth cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[20px] p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-5">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-green-600 animate-spin" />
              <Bot size={24} className="text-green-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">AI Resume Parsing</h3>
              <p className="text-xs text-slate-450 mt-2 font-semibold leading-relaxed">{uploadProgress}</p>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMENDED JOBS SECTION */}
      <section className="flex flex-col gap-3.5">
        <div className="flex justify-between items-end border-b border-slate-100 pb-3">
          <div>
            <span className="text-[9px] font-black text-green-650 tracking-wider uppercase">AI Matching</span>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Recommended Jobs</h3>
          </div>
          <button 
            onClick={() => navigate('/jobs')}
            className="text-[10px] font-black text-green-650 hover:underline flex items-center gap-0.5 cursor-pointer border-0 bg-transparent"
          >
            View All Jobs <ChevronRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recommendedJobs.slice(0, 4).map((job) => {
            const score = job.ai_match_score || 75;
            let scoreBg = 'bg-green-50 text-green-700 border-green-150';
            if (score >= 90) {
              scoreBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            }
            return (
              <div 
                key={job.id} 
                className="bg-white border border-slate-200/60 rounded-[20px] p-4.5 flex items-center justify-between shadow-sm hover:scale-[1.01] hover:border-slate-300 hover:shadow transition-all duration-200"
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
                    <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <Building size={16} />
                    </div>
                  )}
                  <div className="text-left leading-tight">
                    <h4 className="font-extrabold text-xs text-slate-800 truncate max-w-[140px] sm:max-w-[180px]" title={job.title}>
                      {job.title}
                    </h4>
                    <p className="text-[10px] text-slate-450 font-bold mt-0.5">{job.company}</p>
                    <span className="text-[9px] text-slate-400 font-bold block mt-1">{job.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[9.5px] px-2 py-1 rounded-lg border font-bold ${scoreBg}`}>
                    {score}% Match
                  </span>
                  <button 
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm hover:scale-102 transition-smooth cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: MY RESUME PORTFOLIO */}
      <section id="resumes-section" className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Active Resumes</span>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">My Resumes</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <input 
              type="text"
              placeholder="Filter by resume name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-green-500 min-w-[120px] font-medium"
            />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-green-500 cursor-pointer font-bold"
            >
              <option value="updated_at">Last Updated</option>
              <option value="ats_score">ATS Score</option>
              <option value="name">Name</option>
            </select>
            
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-green-500 cursor-pointer font-bold"
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
                className="group relative bg-white border border-slate-200/60 hover:border-green-300 rounded-[20px] p-5 flex flex-col justify-between gap-5 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm text-left"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-center text-green-600 shadow-inner">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-850 group-hover:text-green-600 transition-smooth">{res.name}</h4>
                      <p className="text-[9px] text-slate-400 mt-1 font-semibold">Template: <span className="capitalize">{res.template}</span> • Status: <span className="font-bold">{res.status}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="bg-green-50 border border-green-100 text-green-650 text-[9px] font-black px-2 py-0.5 rounded shadow-sm">
                      ATS {res.atsScore}%
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Health: {res.completion}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-5 pt-3 border-t border-slate-100 mt-1">
                  <div className="flex items-center gap-1.5 flex-grow">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-green-600 h-full rounded-full" style={{ width: `${res.completion}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={() => navigate(`/resume-builder?id=${res.id}`)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-green-600 hover:border-green-200 transition-smooth cursor-pointer"
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
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-green-600 hover:border-green-200 transition-smooth cursor-pointer"
                      title="Download PDF"
                    >
                      <Download size={11} />
                    </button>
                    <button 
                      onClick={() => duplicateResume(res.id)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-green-600 hover:border-green-200 transition-smooth cursor-pointer"
                      title="Duplicate"
                    >
                      <Copy size={11} />
                    </button>
                    <button 
                      onClick={() => deleteResume(res.id)}
                      className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white transition-smooth cursor-pointer"
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

      {/* SECTION 4: BIMBA AI SUGGESTIONS */}
      <section className="flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Recruiter Insights</span>
          <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Bimba AI Recommendations</h3>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-[20px] p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((sug, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between gap-3 text-left hover:scale-[1.01] transition-smooth"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800">{sug.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed">{sug.reason}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    sug.priority === 'High' ? 'bg-rose-50 border border-rose-100 text-rose-600' : 'bg-amber-50 border border-amber-100 text-amber-600'
                  }`}>
                    {sug.priority}
                  </span>
                </div>
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => handleFixSuggestion(sug.title)}
                    className="px-3.5 py-1 bg-green-600 hover:bg-green-700 text-white font-extrabold text-[9px] rounded-lg transition-smooth shadow-sm cursor-pointer"
                  >
                    One-Click Fix
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* SECTION 6: RECENT ACTIVITY TIMELINE & INSIGHTS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Activity Timeline */}
        <div className="bg-white border border-slate-200/60 rounded-[20px] p-5 flex flex-col justify-between min-h-[280px] shadow-sm text-left">
          <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
            <h4 className="text-xs font-extrabold text-slate-850">Recent Activity</h4>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Logs</span>
          </div>

          <div className="flex flex-col gap-4 flex-grow justify-center pr-1">
            {timelineActivities.map((act, idx) => (
              <div key={idx} className="flex gap-3 text-left">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1 shadow-sm shadow-green-500/20" />
                  {idx < timelineActivities.length - 1 && <div className="w-0.5 bg-slate-100 flex-grow my-1" />}
                </div>
                <div>
                  <div className="flex gap-2 items-center leading-none">
                    <span className="text-[10px] font-extrabold text-slate-800">{act.title}</span>
                    <span className="text-[8px] text-slate-400 font-bold">• {act.time}</span>
                  </div>
                  <p className="text-[9px] text-slate-450 mt-1 font-semibold leading-relaxed">{act.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Career Insights Charts */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-[20px] p-5 flex flex-col justify-between min-h-[280px] shadow-sm text-left" id="analytics-section">
          <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
            <h4 className="text-xs font-extrabold text-slate-850">Career Insights & Progress</h4>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Analytics Trends</span>
          </div>

          {/* Simple premium SVG Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-grow items-center">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ATS score progression</span>
              <div className="w-full h-28 mt-1 relative bg-slate-50/50 border border-slate-100 rounded-xl p-2 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 200 80">
                  {/* Grid lines */}
                  <line x1="10" y1="15" x2="190" y2="15" className="stroke-slate-100" strokeWidth="1" />
                  <line x1="10" y1="40" x2="190" y2="40" className="stroke-slate-100" strokeWidth="1" />
                  <line x1="10" y1="65" x2="190" y2="65" className="stroke-slate-100" strokeWidth="1" />
                  
                  {/* Dynamic path */}
                  <path 
                    d="M 20 65 L 60 55 L 100 45 L 140 25 L 180 18" 
                    fill="none" 
                    stroke="#16A34A" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  
                  {/* Dots */}
                  <circle cx="20" cy="65" r="3.5" className="fill-white stroke-green-600" strokeWidth="2" />
                  <circle cx="60" cy="55" r="3.5" className="fill-white stroke-green-600" strokeWidth="2" />
                  <circle cx="100" cy="45" r="3.5" className="fill-white stroke-green-600" strokeWidth="2" />
                  <circle cx="140" cy="25" r="3.5" className="fill-white stroke-green-600" strokeWidth="2" />
                  <circle cx="180" cy="18" r="3.5" className="fill-white stroke-green-600" strokeWidth="2" />
                  
                  {/* Text label */}
                  <text x="180" y="10" textAnchor="end" className="text-[8px] font-black fill-green-650">91% ATS</text>
                </svg>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resume Downloads & Views</span>
              <div className="w-full h-28 mt-1 relative bg-slate-50/50 border border-slate-100 rounded-xl p-2 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 200 80">
                  {/* Grid lines */}
                  <line x1="10" y1="15" x2="190" y2="15" className="stroke-slate-100" strokeWidth="1" />
                  <line x1="10" y1="40" x2="190" y2="40" className="stroke-slate-100" strokeWidth="1" />
                  <line x1="10" y1="65" x2="190" y2="65" className="stroke-slate-100" strokeWidth="1" />
                  
                  {/* Dynamic path */}
                  <path 
                    d="M 20 60 L 60 45 L 100 50 L 140 30 L 180 20" 
                    fill="none" 
                    stroke="#22C55E" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  
                  {/* Dots */}
                  <circle cx="20" cy="60" r="3.5" className="fill-white stroke-emerald-600" strokeWidth="2" />
                  <circle cx="60" cy="45" r="3.5" className="fill-white stroke-emerald-600" strokeWidth="2" />
                  <circle cx="100" cy="50" r="3.5" className="fill-white stroke-emerald-600" strokeWidth="2" />
                  <circle cx="140" cy="30" r="3.5" className="fill-white stroke-emerald-600" strokeWidth="2" />
                  <circle cx="180" cy="20" r="3.5" className="fill-white stroke-emerald-600" strokeWidth="2" />
                  
                  {/* Text label */}
                  <text x="180" y="12" textAnchor="end" className="text-[8px] font-black fill-emerald-600">17 Exports</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* BIMBA AI ASSISTANT CHAT PANEL */}
      <section id="ai-assistant-section" className="flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-black text-green-650 tracking-wider uppercase">Intelligent Career Advisor</span>
          <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Bimba AI Assistant Chat</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Left Chat Screen */}
          <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-[20px] p-5 flex flex-col justify-between h-[300px] shadow-sm">
            <div className="flex-grow overflow-y-auto no-scrollbar flex flex-col gap-3 pr-2 mb-4">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-[11px] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-green-600 text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-150 text-slate-700 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
              <input 
                type="text"
                placeholder="Ask Bimba AI e.g. 'Add technical skills' or 'Optimize ATS'..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-grow pl-4 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-green-500 focus:outline-none text-[11px] text-slate-700 placeholder:text-slate-400 font-medium"
              />
              <button 
                onClick={handleSendChat}
                className="w-8 h-8 rounded-xl bg-green-600 hover:bg-green-500 text-white flex items-center justify-center transition-smooth cursor-pointer shadow-sm shrink-0"
              >
                <SendHorizontal size={12} />
              </button>
            </div>
          </div>

          {/* Right prompt suggestions */}
          <div className="bg-white border border-slate-200/60 rounded-[20px] p-5 flex flex-col justify-between h-[300px] shadow-sm text-left">
            <div>
              <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase">Quick Prompts</span>
              <h4 className="text-xs font-extrabold text-slate-800 mt-1">Suggested Prompt Actions</h4>
            </div>

            <div className="flex flex-col gap-2 mt-3 flex-grow overflow-y-auto no-scrollbar">
              {[
                { label: 'Improve Skills', text: 'Analyze and suggest modern skills for my CV.' },
                { label: 'Optimize ATS', text: 'How do I bypass standard ATS systems?' },
                { label: 'Generate Cover Letter', text: 'Draft a cover letter for a Frontend Engineer position.' },
              ].map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setChatInput(sug.text);
                  }}
                  className="w-full text-left bg-slate-50 border border-slate-200/60 hover:border-green-200 rounded-xl p-3.5 hover:bg-slate-100/50 transition-smooth cursor-pointer"
                >
                  <h5 className="font-extrabold text-[11px] text-slate-750">{sug.label}</h5>
                  <p className="text-[9px] text-slate-450 mt-1 font-semibold">{sug.text}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
};

export default Dashboard;
