import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, FileText, Plus, Award, 
  Bot, BarChart3, Settings, Flame, Search, Bell, 
  Edit3, Copy, Download, Trash2,
  SendHorizontal, Lock, ListTodo, UploadCloud,
  Brain, Scan, Mail, Briefcase, Globe, Building,
  MessageSquare, LineChart, CheckCircle2, AlertCircle,
  HelpCircle, ChevronRight, ChevronLeft, RefreshCw, 
  Star, Compass, MapPin, DollarSign, Calendar, 
  TrendingUp, UserCheck, ArrowUpRight, Zap, Play, Folder
} from 'lucide-react';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';
import { analyticsService } from '../services/analytics';
import type { DashboardData, AtsData, ActivityTimelineItem, ResumeAnalyticsItem } from '../services/analytics';
import { apiClient, API_BASE_URL } from '../services/api';
import { jobsService } from '../services/jobs';
import type { JobListItem } from '../services/jobs';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [atsData, setAtsData] = useState<AtsData | null>(null);
  const [activities, setActivities] = useState<ActivityTimelineItem[]>([]);
  const [resumes, setResumes] = useState<ResumeAnalyticsItem[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<JobListItem[]>([]);
  
  // UI Actions & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated_at' | 'ats_score' | 'name'>('updated_at');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  
  // Today's Missions State
  const [missions, setMissions] = useState([
    { id: 1, label: 'Increase ATS Score to 95', completed: false, xp: 40 },
    { id: 2, label: 'Apply for 2 recommended jobs', completed: false, xp: 30 },
    { id: 3, label: 'Complete 10m Interview Practice', completed: false, xp: 30 },
    { id: 4, label: 'Optimize LinkedIn Headline', completed: false, xp: 20 },
  ]);
  const [missionCelebration, setMissionCelebration] = useState(false);

  // Template Carousel index
  const [templateIndex, setTemplateIndex] = useState(0);

  const getDisplayName = () => {
    if (!user) return 'Career Builder';
    const email = user.personal_email;
    const prefix = email.split('@')[0];
    const name = prefix.replace(/[0-9_.]/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1).trim();
  };
  const displayName = getDisplayName();

  // Fetch all analytics and data
  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const [dash, ats, act, resList, tplRes, jobsRes] = await Promise.all([
        analyticsService.getDashboard().catch(() => null),
        analyticsService.getAts().catch(() => null),
        analyticsService.getActivity().catch(() => []),
        analyticsService.getResumes().catch(() => []),
        apiClient.get('/api/resume-studio/templates').catch(() => ({ data: [] })),
        jobsService.searchJobs({ limit: 6 }).catch(() => ({ jobs: [] }))
      ]);

      if (dash) setDashboardData(dash);
      if (ats) setAtsData(ats);
      setActivities(act);
      setResumes(resList);
      setTemplates(tplRes.data || []);
      setRecommendedJobs(jobsRes.jobs || []);
    } catch (err) {
      console.error("Error loading real-time user analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
      // Silent refresh of metrics
      const [dash, ats, act, resList] = await Promise.all([
        analyticsService.getDashboard().catch(() => null),
        analyticsService.getAts().catch(() => null),
        analyticsService.getActivity().catch(() => []),
        analyticsService.getResumes().catch(() => [])
      ]);
      if (dash) setDashboardData(dash);
      if (ats) setAtsData(ats);
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

  const toggleMission = (id: number) => {
    const updated = missions.map(m => m.id === id ? { ...m, completed: !m.completed } : m);
    setMissions(updated);

    const allDone = updated.every(m => m.completed);
    if (allDone) {
      setMissionCelebration(true);
      setTimeout(() => setMissionCelebration(false), 4000);
    }
  };

  const getCompletedMissionsCount = () => missions.filter(m => m.completed).length;
  const missionProgressPercent = Math.round((getCompletedMissionsCount() / missions.length) * 100);

  // Fallbacks and stats calculation
  const bestResume = resumes.find(r => r.atsScore === Math.max(...resumes.map(x => x.atsScore))) || resumes[0] || { id: 0, atsScore: 91, completion: 88, name: "My Resume Portfolio", template: "modern", status: "Draft" };
  const atsScore = bestResume.atsScore || 91;
  const resumeCompletion = bestResume.completion || 88;
  const careerScore = Math.round((atsScore + resumeCompletion + 85 + 92) / 4); // Avg profile score

  // 9 Premium Templates Mock Previews for Carousel
  const templateItems = [
    { id: 'cosmos', name: 'Cosmos Pro', style: 'Modern & Elegant', ats: 98, color: 'bg-green-600' },
    { id: 'celestial', name: 'Celestial Minimal', style: 'Sleek & Clean', ats: 96, color: 'bg-emerald-500' },
    { id: 'linear', name: 'Linear Dark', style: 'Tech Focused', ats: 97, color: 'bg-[#15803D]' },
    { id: 'executive', name: 'Executive Suite', style: 'Corporate Professional', ats: 95, color: 'bg-teal-650' },
    { id: 'ats-standard', name: 'ATS Standard V1', style: 'Ultra readable', ats: 99, color: 'bg-green-700' },
    { id: 'notion', name: 'Notion Core', style: 'Minimal Workspace', ats: 94, color: 'bg-gray-800' },
  ];

  // AI recommendations mock
  const aiRecommendations = [
    {
      icon: <Brain className="text-[#16A34A]" size={16} />,
      title: "Improve Resume Summary",
      desc: "Incorporate performance metrics in your Cosmos resume introduction.",
      time: "10 mins",
      impact: "High Impact",
      impactColor: "bg-green-100 text-green-800 dark:bg-green-950/45 dark:text-green-300",
      actionLabel: "Optimize Summary",
      action: () => navigate(`/resume-builder?id=${bestResume.id}`)
    },
    {
      icon: <Award className="text-[#22C55E]" size={16} />,
      title: "Add Missing Skills",
      desc: "ATS identified 'CI/CD' and 'Kubernetes' as missing skills based on your profile.",
      time: "5 mins",
      impact: "High Impact",
      impactColor: "bg-green-100 text-green-800 dark:bg-green-950/45 dark:text-green-300",
      actionLabel: "Add Skills",
      action: () => navigate(`/resume-builder?id=${bestResume.id}`)
    },
    {
      icon: <Scan className="text-amber-500" size={16} />,
      title: "Optimize Keywords for Vercel Role",
      desc: "Tailor your project descriptions to match the Vercel Frontend Engineer role.",
      time: "15 mins",
      impact: "Critical Impact",
      impactColor: "bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-300",
      actionLabel: "Match Resume",
      action: () => navigate(`/resume-builder?id=${bestResume.id}`)
    },
    {
      icon: <MessageSquare className="text-purple-500" size={16} />,
      title: "Prepare React Performance Interview",
      desc: "Practice answering questions on Next.js server actions and memoization.",
      time: "20 mins",
      impact: "Medium Impact",
      impactColor: "bg-purple-100 text-purple-800 dark:bg-purple-955/20 dark:text-purple-300",
      actionLabel: "Start Practice",
      action: () => {
        const el = document.getElementById('interview-practice-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  ];

  // Company insights mock
  const companyInsightsList = [
    { name: "Vercel", rating: 4.8, diff: "Hard", salary: "$140k - $190k", trend: "Hiring Fast", culture: "96%", skills: ["Next.js", "React", "TailwindCSS"] },
    { name: "Linear", rating: 4.9, diff: "Very Hard", salary: "$160k - $210k", trend: "Selective", culture: "98%", skills: ["TypeScript", "Electron", "Node.js"] },
    { name: "Stripe", rating: 4.7, diff: "Hard", salary: "$150k - $200k", trend: "Steady", culture: "94%", skills: ["React", "Ruby", "System Design"] }
  ];

  // Circular progress helper
  const CircularRing: React.FC<{ value: number; size?: number; label: string; stroke?: string }> = ({ value, size = 70, label, stroke = "stroke-[#16A34A] dark:stroke-[#22C55E]" }) => {
    const strokeWidth = 5.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="flex flex-col items-center gap-1.5 p-3.5 bg-[#F8FAF8] dark:bg-[#111F17]/50 rounded-2xl border border-[#E5E7EB] dark:border-green-950/20 hover:scale-[1.03] transition-all duration-200 shrink-0">
        <div className="relative" style={{ width: size, height: size }}>
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="stroke-gray-150 dark:stroke-green-950/20"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={`${stroke} transition-all duration-700 ease-out`}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-800 dark:text-white">
            {value}%
          </span>
        </div>
        <span className="text-[9.5px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest block mt-0.5 text-center truncate w-20" title={label}>{label}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 min-h-screen pb-12 text-left">
        <div className="h-40 w-full bg-green-50/50 dark:bg-green-950/10 rounded-[24px] animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-green-50/40 dark:bg-green-950/10 rounded-[20px] animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-green-50/40 dark:bg-green-950/10 rounded-[24px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 text-left w-full pb-20 select-none animate-fadeIn">
      
      {/* SECTION 1: WELCOME HEADER */}
      <section id="welcome-section" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/20 rounded-[24px] p-6.5 shadow-sm relative overflow-hidden transition-all duration-300">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-[#16A34A]/5 to-transparent blur-3xl pointer-events-none" />
        <div className="text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Welcome back, {displayName} <span className="animate-wiggle">👋</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-[#A7B5AA] font-bold mt-1.5">
            Here is your AI Career Operating System progress for today.
          </p>
        </div>
        <div className="px-4 py-2 bg-[#F8FAF8] dark:bg-[#1A2D22] border border-[#E5E7EB] dark:border-green-900/30 rounded-xl flex items-center gap-2 shadow-inner shrink-0">
          <Calendar size={13} className="text-[#16A34A] dark:text-[#22C55E]" />
          <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </section>

      {/* SECTION 2: CAREER COMMAND CENTER */}
      <section id="ats-analyzer-section" className="flex flex-col gap-3">
        <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Career Command Center</h3>
        <div className="bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/20 rounded-[24px] p-6 shadow-sm flex flex-col justify-between gap-6 transition-all duration-300">
          
          {/* Grid of progress rings */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 w-full">
            <CircularRing value={careerScore} label="Career Score" stroke="stroke-[#16A34A] dark:stroke-[#22C55E]" />
            <CircularRing value={resumeCompletion} label="Resume Progress" stroke="stroke-[#22C55E]" />
            <CircularRing value={atsScore} label="ATS Score" stroke="stroke-[#16A34A]" />
            <CircularRing value={85} label="LinkedIn Score" stroke="stroke-emerald-500" />
            <CircularRing value={90} label="Interview Ready" stroke="stroke-[#22C55E]" />
            <CircularRing value={72} label="Profile Complete" stroke="stroke-[#16A34A]" />
            <CircularRing value={80} label="App Success" stroke="stroke-[#22C55E]" />
            <CircularRing value={92} label="Skill Density" stroke="stroke-emerald-500" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E5E7EB] dark:border-green-950/30 pt-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-ping" />
              <span className="text-[11px] font-bold text-slate-600 dark:text-[#A7B5AA]">
                Your ATS Score is in the top <span className="text-[#16A34A] dark:text-[#22C55E] font-black">5%</span> for software engineer applicants.
              </span>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <button 
                onClick={() => navigate(`/resume-builder?id=${bestResume.id}`)}
                className="flex-grow sm:flex-grow-0 px-4 py-2.2 bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-[11px] rounded-xl transition-all cursor-pointer shadow-md shadow-green-500/10 flex items-center justify-center gap-1.5"
              >
                <Edit3 size={12} /> Continue Resume
              </button>
              <button 
                onClick={() => navigate('/jobs')}
                className="flex-grow sm:flex-grow-0 px-4 py-2.2 bg-[#DCFCE7] dark:bg-green-950 text-[#16A34A] dark:text-[#22C55E] hover:bg-green-200 dark:hover:bg-green-900/60 font-extrabold text-[11px] border border-[#16A34A]/10 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Briefcase size={12} /> Find AI Job Matches
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: TODAY'S MISSION & SECTION 4: AI RECOMMENDATIONS (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        
        {/* Today's Mission (2 cols) */}
        <section className="lg:col-span-2 flex flex-col gap-3">
          <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">🎯 Today's Mission</h3>
          <div className="bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/20 rounded-[24px] p-6 shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden transition-all duration-300 min-h-[360px] hover:border-[#16A34A]/30">
            {missionCelebration && (
              <div className="absolute inset-0 bg-[#DCFCE7]/90 dark:bg-green-950/95 flex flex-col items-center justify-center text-center p-4 z-20 animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-[#16A34A] text-white flex items-center justify-center mb-3 shadow-lg shadow-green-500/20 animate-bounce">
                  <Award size={28} />
                </div>
                <h4 className="font-extrabold text-slate-800 dark:text-white text-lg">Missions Cleared!</h4>
                <p className="text-xs text-[#16A34A] dark:text-[#22C55E] font-bold mt-1">You earned +120 XP • Career Level +5%</p>
              </div>
            )}
            
            <div className="text-left">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-[#16A34A] dark:text-[#22C55E] bg-[#DCFCE7] dark:bg-green-950/40 px-2 py-0.5 rounded border border-[#16A34A]/10">DAILY OBJECTIVES</span>
                <span className="text-xs font-extrabold text-gray-400">XP: +120 XP</span>
              </div>
              <h4 className="font-black text-lg text-slate-800 dark:text-white mt-1">Accelerate Profile Visibility</h4>
            </div>

            {/* Checklist */}
            <div className="flex flex-col gap-2.5">
              {missions.map((m) => (
                <div 
                  key={m.id} 
                  onClick={() => toggleMission(m.id)}
                  className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all cursor-pointer ${
                    m.completed 
                      ? 'bg-green-50/50 dark:bg-green-950/15 border-green-200 dark:border-green-900/30 opacity-70' 
                      : 'bg-[#F8FAF8] dark:bg-[#0F1A13] border-transparent hover:border-gray-200 dark:hover:border-green-905/30'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                    m.completed 
                      ? 'bg-[#16A34A] border-[#16A34A] text-white' 
                      : 'border-gray-300 dark:border-green-900 bg-white dark:bg-[#111F17]'
                  }`}>
                    {m.completed && <CheckCircle2 size={12} className="stroke-[3.5]" />}
                  </div>
                  <div className="text-left flex-grow leading-none">
                    <span className={`text-[11px] font-bold ${m.completed ? 'line-through text-gray-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {m.label}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-slate-400">+{m.xp} XP</span>
                </div>
              ))}
            </div>

            {/* Progress bar at bottom */}
            <div className="border-t border-[#E5E7EB] dark:border-green-950/30 pt-4 mt-auto">
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold mb-2">
                <span>PROGRESS: {getCompletedMissionsCount()}/{missions.length} COMPLETED</span>
                <span>{missionProgressPercent}%</span>
              </div>
              <div className="w-full bg-[#F8FAF8] dark:bg-green-950/30 border border-[#E5E7EB] dark:border-green-900/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#16A34A] to-[#22C55E] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${missionProgressPercent}%` }} 
                />
              </div>
            </div>

          </div>
        </section>

        {/* AI Recommendations (3 cols) */}
        <section className="lg:col-span-3 flex flex-col gap-3">
          <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">⚡ AI Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100%-1.8rem)]">
            {aiRecommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/20 rounded-[20px] p-4.5 flex flex-col justify-between gap-3 shadow-sm hover:scale-[1.01] hover:border-[#16A34A]/30 transition-all duration-200 text-left"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F8FAF8] dark:bg-[#0F1A13] border border-[#E5E7EB] dark:border-green-900/30 flex items-center justify-center shrink-0 shadow-inner">
                      {rec.icon}
                    </div>
                    <div className="leading-tight">
                      <h4 className="font-extrabold text-[11.5px] text-slate-850 dark:text-white truncate max-w-[140px] md:max-w-[160px]">{rec.title}</h4>
                      <p className="text-[10px] text-gray-400 dark:text-[#A7B5AA] mt-1 leading-normal font-semibold">
                        {rec.desc}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB] dark:border-green-950/10 mt-auto">
                  <div className="flex items-center gap-1.5 text-[8.5px] font-black tracking-wide text-gray-400">
                    <span>Est: {rec.time}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] ${rec.impactColor}`}>
                      {rec.impact}
                    </span>
                  </div>
                  <button 
                    onClick={rec.action}
                    className="px-3.5 py-1 bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-[9.5px] rounded-lg transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    {rec.actionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* SECTION 5: CONTINUE WHERE YOU LEFT OFF */}
      <section id="documents-section" className="flex flex-col gap-3">
        <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">📂 Continue Where You Left Off</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: "Cosmos CV Draft", tag: "Resume Builder", icon: <FileText size={16} />, path: `/resume-builder?id=${bestResume.id}` },
            { title: "React Dev prep", tag: "Interview Practice", icon: <MessageSquare size={16} />, path: "#interview-practice-section", scroll: true },
            { title: "Vercel Front Engineer", tag: "Saved Jobs", icon: <Briefcase size={16} />, path: "/jobs" },
            { title: "Headline revamp", tag: "LinkedIn Optimizer", icon: <Sparkles size={16} />, path: "/profile" },
            { title: "Cover_Letter_V1.pdf", tag: "Recent Document", icon: <Folder size={16} />, path: `/resume-builder?id=${bestResume.id}` },
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/20 rounded-[20px] p-4 flex flex-col justify-between min-h-[140px] shadow-sm hover:scale-[1.02] hover:border-[#16A34A]/30 transition-all duration-200 text-left"
            >
              <div className="flex justify-between items-start">
                <div className="w-8.5 h-8.5 rounded-lg bg-[#F8FAF8] dark:bg-[#0F1A13] border border-[#E5E7EB] dark:border-green-900/30 text-[#16A34A] dark:text-[#22C55E] flex items-center justify-center shrink-0 shadow-inner">
                  {item.icon}
                </div>
                <span className="text-[8px] bg-green-50 dark:bg-green-950/40 text-[#16A34A] dark:text-[#22C55E] px-2 py-0.5 rounded font-black border border-[#16A34A]/10 uppercase tracking-wider">
                  {item.tag}
                </span>
              </div>
              <div className="mt-4">
                <h5 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-100 truncate w-full">{item.title}</h5>
                <button
                  onClick={() => {
                    if (item.scroll) {
                      document.getElementById(item.path.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      navigate(item.path);
                    }
                  }}
                  className="mt-2 text-[9px] font-black text-[#16A34A] dark:text-[#22C55E] hover:underline flex items-center gap-0.5 border-0 bg-transparent cursor-pointer"
                >
                  Continue Action <ChevronRight size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: RECOMMENDED JOBS */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-end border-b border-[#E5E7EB] dark:border-green-950/20 pb-3">
          <div>
            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">💼 Recommended Jobs</h3>
          </div>
          <button 
            onClick={() => navigate('/jobs')}
            className="text-[10px] font-black text-[#16A34A] dark:text-[#22C55E] hover:underline flex items-center gap-0.5 cursor-pointer border-0 bg-transparent"
          >
            Explore Jobs <ChevronRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recommendedJobs.slice(0, 3).map((job) => {
            const score = job.ai_match_score || 88;
            return (
              <div 
                key={job.id} 
                className="bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/20 rounded-[24px] p-5 flex flex-col justify-between gap-5 shadow-sm hover:scale-[1.01] hover:border-slate-350 dark:hover:border-green-905/30 transition-all duration-200 text-left"
              >
                {/* Job Header */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 border border-[#16A34A]/10 flex items-center justify-center text-[#16A34A] shrink-0 font-extrabold shadow-inner">
                      {job.company.charAt(0)}
                    </div>
                    <div className="leading-tight">
                      <h4 className="font-extrabold text-[12px] text-slate-800 dark:text-slate-100 truncate w-36" title={job.title}>
                        {job.title}
                      </h4>
                      <p className="text-[10px] text-gray-450 dark:text-[#A7B5AA] font-bold block mt-0.5">{job.company}</p>
                    </div>
                  </div>

                  {/* AI Match Circular Ring */}
                  <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="22" cy="22" r="18" className="stroke-gray-100 dark:stroke-green-950/20" strokeWidth="3" fill="transparent" />
                      <circle 
                        cx="22" 
                        cy="22" 
                        r="18" 
                        className="stroke-[#16A34A] dark:stroke-[#22C55E]" 
                        strokeWidth="3" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 18} 
                        strokeDashoffset={2 * Math.PI * 18 - (score / 100) * (2 * Math.PI * 18)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-[#16A34A] dark:text-[#22C55E]">
                      {score}%
                    </span>
                  </div>
                </div>

                {/* Job details tags */}
                <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-gray-500 dark:text-gray-400">
                  <span className="px-2 py-1 bg-[#F8FAF8] dark:bg-[#0F1A13] border border-[#E5E7EB] dark:border-green-950/20 rounded-lg flex items-center gap-1 shadow-sm">
                    <MapPin size={10} className="text-[#16A34A]" /> {job.location}
                  </span>
                  <span className="px-2 py-1 bg-[#F8FAF8] dark:bg-[#0F1A13] border border-[#E5E7EB] dark:border-green-950/20 rounded-lg flex items-center gap-1 shadow-sm">
                    <DollarSign size={10} className="text-amber-500" /> {job.salary || '$120k - $160k'}
                  </span>
                  <span className="px-2 py-1 bg-[#DCFCE7] dark:bg-green-950/40 text-[#16A34A] dark:text-[#22C55E] rounded-lg font-black border border-[#16A34A]/10">
                    Remote
                  </span>
                </div>

                {/* Apply/Save triggers */}
                <div className="flex items-center justify-between border-t border-[#E5E7EB] dark:border-green-950/10 pt-4 mt-1">
                  <button className="text-[10px] font-extrabold text-gray-400 dark:text-gray-400 hover:text-[#16A34A] flex items-center gap-1 cursor-pointer border-0 bg-transparent">
                    <Star size={12} /> Save Job
                  </button>
                  <button 
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="px-4 py-1.8 bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-[10px] rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Apply Now
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 7: COMPANY INSIGHTS */}
      <section id="company-insights-section" className="flex flex-col gap-3">
        <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">🏢 Premium Company Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {companyInsightsList.map((comp, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/20 rounded-[24px] p-5 shadow-sm flex flex-col justify-between gap-4 hover:border-slate-350 dark:hover:border-green-905/30 transition-all duration-200 text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-8.5 h-8.5 rounded-lg bg-green-50 border border-[#16A34A]/10 flex items-center justify-center font-extrabold text-[#16A34A] shrink-0">
                    {comp.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-white leading-none">{comp.name}</h4>
                    <span className="text-[9px] text-[#16A34A] dark:text-[#22C55E] font-black uppercase tracking-wider block mt-1 leading-none">{comp.trend}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-black">
                  <Star size={12} className="fill-amber-500 stroke-amber-500" /> {comp.rating}
                </div>
              </div>

              {/* Stats detail list */}
              <div className="flex flex-col gap-2 border-t border-b border-[#E5E7EB] dark:border-green-950/10 py-3 text-[10px] font-bold text-gray-550 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Interview Difficulty:</span>
                  <span className="font-extrabold text-red-500">{comp.diff}</span>
                </div>
                <div className="flex justify-between">
                  <span>Salary Estimate:</span>
                  <span className="font-extrabold text-[#16A34A] dark:text-green-300">{comp.salary}</span>
                </div>
                <div className="flex justify-between">
                  <span>Culture Score:</span>
                  <span className="font-extrabold text-teal-650 dark:text-teal-350">{comp.culture}</span>
                </div>
              </div>

              {/* Popular skills tag */}
              <div className="flex flex-wrap gap-1">
                {comp.skills.map((s, sIdx) => (
                  <span key={sIdx} className="text-[8px] font-black uppercase px-2 py-0.5 bg-[#F8FAF8] dark:bg-[#0F1A13] border border-[#E5E7EB] dark:border-green-950/20 text-[#6B7280] rounded">
                    {s}
                  </span>
                ))}
              </div>

              <button className="w-full mt-1.5 py-1.8 bg-[#F0FDF4] dark:bg-green-955 text-[#16A34A] dark:text-[#22C55E] hover:bg-green-100 dark:hover:bg-green-900 border border-[#16A34A]/10 font-extrabold text-[9.5px] rounded-xl transition-all cursor-pointer text-center block">
                View Details
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 8: RESUME TEMPLATES */}
      <section id="templates-section" className="flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-[#E5E7EB] dark:border-green-950/20 pb-3">
          <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">📑 Resume Templates</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setTemplateIndex(prev => Math.max(0, prev - 1))}
              disabled={templateIndex === 0}
              className="p-1 rounded bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/30 text-gray-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setTemplateIndex(prev => Math.min(templateItems.length - 3, prev + 1))}
              disabled={templateIndex >= templateItems.length - 3}
              className="p-1 rounded bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/30 text-gray-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Carousel Slider */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 transition-all duration-300">
          {templateItems.slice(templateIndex, templateIndex + 3).map((tpl) => (
            <div 
              key={tpl.id} 
              className="group bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/20 rounded-[24px] p-5 shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(22,163,74,0.06)] hover:border-[#16A34A]/40"
            >
              {/* Miniature Layout Preview */}
              <div className="w-full h-36 bg-[#F8FAF8] dark:bg-[#0F1A13] border border-[#E5E7EB] dark:border-green-950/15 rounded-xl p-3 flex flex-col gap-1.5 relative overflow-hidden">
                
                {/* Miniature CV content */}
                <div className="w-full h-2 rounded bg-gray-250 dark:bg-green-900/40 w-1/3" />
                <div className="w-full h-1.5 rounded bg-gray-150 dark:bg-green-950/30 w-1/2" />
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  <div className="col-span-2 flex flex-col gap-1">
                    <div className="w-full h-1.5 rounded bg-gray-200 dark:bg-green-900/30" />
                    <div className="w-full h-1.5 rounded bg-gray-100 dark:bg-green-950/30" />
                    <div className="w-full h-1.5 rounded bg-gray-100 dark:bg-green-950/30" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="w-full h-1.5 rounded bg-gray-200 dark:bg-green-900/30" />
                    <div className="w-full h-1.5 rounded bg-gray-100 dark:bg-green-950/30" />
                  </div>
                </div>

                {/* Dark Glow layer on Hover */}
                <div className="absolute inset-0 bg-[#000000]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-2 p-2">
                  <button className="px-3 py-1 bg-white hover:bg-gray-100 text-slate-800 font-extrabold text-[9px] rounded-lg shadow cursor-pointer">
                    Quick Preview
                  </button>
                  <button 
                    onClick={() => navigate('/resume-builder')}
                    className="px-3 py-1 bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-[9px] rounded-lg shadow cursor-pointer"
                  >
                    Use Layout
                  </button>
                </div>
              </div>

              {/* Template Labels */}
              <div className="flex justify-between items-center text-left">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-850 dark:text-white leading-none">{tpl.name}</h4>
                  <span className="text-[9px] text-[#16A34A] dark:text-[#22C55E] font-black uppercase tracking-wider mt-1 block">{tpl.style}</span>
                </div>
                <span className="bg-[#DCFCE7] dark:bg-green-950 text-[#16A34A] dark:text-[#22C55E] text-[8.5px] font-black px-2 py-0.5 rounded border border-[#16A34A]/10">
                  ATS {tpl.ats}%
                </span>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* SECTION 9: CAREER ANALYTICS */}
      <section id="analytics-section" className="flex flex-col gap-3">
        <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">📊 Career Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Chart 1: Resume Views */}
          <div className="bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/20 rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:border-[#16A34A]/30">
            <div className="flex justify-between items-center border-b border-[#E5E7EB] dark:border-green-950/10 pb-2.5">
              <span className="text-[9.5px] font-black text-slate-750 dark:text-slate-200 tracking-wider uppercase">Resume Views</span>
              <span className="text-[9.5px] font-black text-[#16A34A] dark:text-[#22C55E]">+24% wk</span>
            </div>
            <div className="w-full h-32 mt-3 flex items-end">
              <svg className="w-full h-full" viewBox="0 0 200 80">
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 10 70 Q 40 50 70 58 T 130 35 T 190 20 L 190 80 L 10 80 Z" fill="url(#viewsGradient)" />
                <path d="M 10 70 Q 40 50 70 58 T 130 35 T 190 20" fill="none" stroke="#16A34A" strokeWidth="2.8" strokeLinecap="round" />
                <circle cx="190" cy="20" r="3.5" className="fill-white stroke-[#16A34A]" strokeWidth="2" />
              </svg>
            </div>
            <span className="text-[8px] font-black text-slate-400 block mt-2 text-center uppercase tracking-widest">Views over last 7 days</span>
          </div>

          {/* Chart 2: ATS Score Progress */}
          <div className="bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/20 rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:border-[#16A34A]/30">
            <div className="flex justify-between items-center border-b border-[#E5E7EB] dark:border-green-950/10 pb-2.5">
              <span className="text-[9.5px] font-black text-slate-750 dark:text-slate-200 tracking-wider uppercase">ATS Progress</span>
              <span className="text-[9.5px] font-black text-[#22C55E]">Goal 95%</span>
            </div>
            <div className="w-full h-32 mt-3 flex items-end justify-between px-2">
              {[68, 74, 82, 88, 91].map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 flex-grow">
                  <div className="w-4 bg-gradient-to-t from-[#16A34A] to-[#22C55E] rounded-t-md transition-all duration-500" style={{ height: `${val * 0.8}px` }} />
                  <span className="text-[9px] font-black text-slate-800 dark:text-slate-200">{val}%</span>
                  <span className="text-[8px] text-gray-400 font-bold">V{idx + 1}</span>
                </div>
              ))}
            </div>
            <span className="text-[8px] font-black text-slate-400 block mt-2 text-center uppercase tracking-widest">Score increase by Version</span>
          </div>

          {/* Chart 3: Weekly Activity */}
          <div className="bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/20 rounded-[24px] p-5 shadow-sm flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:border-[#16A34A]/30">
            <div className="flex justify-between items-center border-b border-[#E5E7EB] dark:border-green-950/10 pb-2.5">
              <span className="text-[9.5px] font-black text-slate-750 dark:text-slate-200 tracking-wider uppercase">Skill Growth</span>
              <span className="text-[9.5px] font-black text-[#16A34A] dark:text-[#22C55E]">+8 Items</span>
            </div>
            <div className="w-full h-32 mt-3 flex items-end">
              <svg className="w-full h-full" viewBox="0 0 200 80">
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 10 65 L 45 40 L 80 50 L 115 25 L 150 35 L 190 10 L 190 80 L 10 80 Z" fill="url(#activityGradient)" />
                <path d="M 10 65 L 45 40 L 80 50 L 115 25 L 150 35 L 190 10" fill="none" stroke="#22C55E" strokeWidth="2.8" strokeLinecap="round" />
                <circle cx="190" cy="10" r="3.5" className="fill-white stroke-[#22C55E]" strokeWidth="2" />
              </svg>
            </div>
            <span className="text-[8px] font-black text-slate-400 block mt-2 text-center uppercase tracking-widest">Skill density level history</span>
          </div>

        </div>
      </section>

      {/* Hidden File Input for Resume Upload shortcut card in Section 5/others if they trigger it */}
      <input 
        type="file" 
        id="resume-upload-input" 
        accept=".pdf,.docx" 
        className="hidden" 
        onChange={handleFileUpload} 
      />

      {isUploading && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white dark:bg-[#111F17] border border-[#E5E7EB] dark:border-green-950/20 rounded-[24px] p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-5">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-[#16A34A] animate-spin" />
              <Bot size={24} className="text-[#16A34A] animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">AI Resume Parsing</h3>
              <p className="text-xs text-[#16A34A] dark:text-[#22C55E] mt-2 font-semibold leading-relaxed">{uploadProgress}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
