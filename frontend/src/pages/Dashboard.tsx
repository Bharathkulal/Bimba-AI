import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Briefcase, User, Settings, ArrowRight,
  UploadCloud, Sparkles, Clock, CheckCircle2, ChevronRight, Building,
  ArrowUpRight, Award, Plus, Layers, Play, Zap, Compass, Download, Eye, FileEdit,
  Terminal, Code
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';
import { useThemeStore } from '../store/themeStore';
import { analyticsService } from '../services/analytics';
import { jobsService } from '../services/jobs';
import type { JobListItem, JobApplication } from '../services/jobs';
import type { DashboardData, AtsData, ActivityTimelineItem, ResumeAnalyticsItem } from '../services/analytics';

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch (e) {
    return 'Just now';
  }
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const getDisplayName = () => {
    if (!user) return 'Student';
    const email = user.personal_email;
    const prefix = email.split('@')[0];
    const name = prefix.replace(/[0-9_.]/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1).trim();
  };
  const displayName = getDisplayName();

  // Core Data States
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [atsData, setAtsData] = useState<AtsData | null>(null);
  const [activities, setActivities] = useState<ActivityTimelineItem[]>([]);
  const [resumes, setResumes] = useState<ResumeAnalyticsItem[]>([]);
  const [latestJobs, setLatestJobs] = useState<JobListItem[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);

  // Fetch dashboard summary analytics
  const fetchDashboardOverview = async () => {
    const cached = (window as any).__dashboardCache;
    if (cached) {
      setDashboardData(cached.dash);
      setAtsData(cached.ats);
      setActivities(cached.act);
      setResumes(cached.resList);
      setLatestJobs(cached.latestJobs);
      setApplications(cached.appsRes);
      setIsLoading(false);
    }

    try {
      const [dash, ats, act, resList, jobsRes, appsRes] = await Promise.all([
        analyticsService.getDashboard(),
        analyticsService.getAts(),
        analyticsService.getActivity(),
        analyticsService.getResumes(),
        jobsService.searchJobs({ limit: 3 }),
        jobsService.getApplications()
      ]);
      setDashboardData(dash);
      setAtsData(ats);
      setActivities(act);
      setResumes(resList);
      setLatestJobs(jobsRes.jobs);
      setApplications(appsRes);

      (window as any).__dashboardCache = {
        dash, ats, act, resList, latestJobs: jobsRes.jobs, appsRes
      };
    } catch (err) {
      console.error("Error loading dashboard overview:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  // Derived statistics
  const bestResume = resumes.find(r => r.atsScore === Math.max(...resumes.map(x => x.atsScore))) || resumes[0];
  const resumeHealth = bestResume?.completion || 0;
  const atsScore = bestResume?.atsScore || 0;

  // Profile completion percentage
  const getProfileCompletion = () => {
    if (!user) return 0;
    const fields = [
      user.student_name, user.phone, user.gender, user.dob, user.address,
      user.bio, user.linkedin, user.github, user.portfolio_website,
      user.skills, user.languages, user.career_objective, user.profile_photo
    ];
    const completed = fields.filter(f => f && f.trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  };
  const profileCompletion = getProfileCompletion();

  // Uploader & Actions
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'txt') {
      alert("Unsupported file format. Please upload PDF, DOCX or TXT.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds limit of 10MB.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress('Uploading file to secure server...');

      const formData = new FormData();
      formData.append('file', file);

      const { apiClient } = await import('../services/api');
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
    } catch (err: any) {
      console.error(err);
      let errMsg = "Failed to parse and save resume.";
      if (err.response && err.response.data) {
        const d = err.response.data;
        if (d.step && d.provider && d.error) {
          errMsg = `Parsing failed at: ${d.provider} API\n\nReason: ${d.error}`;
        } else if (d.detail) {
          errMsg = `Upload Failed: ${d.detail}`;
        }
      } else if (err.message) {
        errMsg = `Upload Failed: ${err.message}`;
      }
      alert(errMsg);
      setIsUploading(false);
    }
  };

  const handleCoachAction = (action: string) => {
    if (!bestResume) {
      alert("Please upload or create a resume first.");
      return;
    }
    if (action === 'improve' || action === 'ats') {
      navigate(`/resume-builder?id=${bestResume.id}`);
    } else {
      navigate('/jobs');
    }
  };

  return (
    <div className={`flex flex-col gap-6 text-left w-full max-w-[1440px] mx-auto px-4 py-6 transition-all duration-300 ease-in-out relative ${isDark ? 'bg-transparent' : 'bg-[#F8F8F8]'}`}>
      {/* Subtle radial green glow in corners — dark mode only */}
      {isDark && (
        <>
          <div className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)' }} />
          <div className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)' }} />
        </>
      )}
      {/* Uploader Progress Backdrop Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-[#111111]/30 dark:bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6 transition-all duration-300">
          <div className="bg-[#FFFFFF] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-white/10 p-6 rounded-3xl max-w-md w-full shadow-lg flex flex-col items-center gap-4 text-center animate-scale transition-colors duration-300">
            <div className="w-12 h-12 border-4 border-[#111111] dark:border-[#FFFFFF] border-t-transparent rounded-full animate-spin" />
            <div className="leading-normal">
              <h3 className="font-extrabold text-slate-900 dark:text-[#FFFFFF] text-sm">Parsing with Gemini AI</h3>
              <p className="text-[11px] text-[#9CA3AF] dark:text-[#9CA3AF] font-bold mt-1 uppercase tracking-wider">{uploadProgress}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        id="dashboard-resume-upload-input"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* SECTION 1: WELCOME HERO */}
      <section
        style={isDark ? { background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02), rgba(255,255,255,0.01))', boxShadow: '0 10px 40px rgba(0,0,0,0.35)' } : {}}
        className={`border rounded-[20px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden transition-all duration-300 ${isDark
          ? 'border-white/[0.08] backdrop-blur-[18px]'
          : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-sm hover:shadow-md'
          }`}
      >
        <div className="flex-1 text-left relative z-10">
          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 inline-block transition-colors duration-300 ${isDark ? 'text-[#FFFFFF] bg-white/10 border border-white/10' : 'text-slate-900 bg-[#F3F4F6]'
            }`}>Welcome Back</span>
          <h1 className={`text-3xl md:text-[36px] font-bold leading-tight transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Good Morning, {displayName}
          </h1>
          <p className={`text-sm md:text-base mt-2 max-w-xl transition-colors duration-300 ${isDark ? 'text-[#D1D5DB]' : 'text-[#4B5563]'}`}>
            Welcome back to Bimba AI. Continue building your professional career, parsing your profiles with AI and matching key local roles.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => {
                if (bestResume) {
                  navigate(`/resume-builder?id=${bestResume.id}`);
                } else {
                  navigate('/resume');
                }
              }}
              className={`font-bold py-2.5 px-5 rounded-[14px] flex items-center gap-2 cursor-pointer shadow-sm transition-all duration-250 btn-glow-green ${isDark
                ? 'bg-[#FFFFFF] hover:bg-[#E5E7EB] text-[#111827] shadow-white/5'
                : 'bg-[#111111] hover:bg-[#000000] text-[#FFFFFF]'
                }`}
            >
              Continue Resume <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/jobs')}
              className={`font-semibold py-2.5 px-5 rounded-[14px] cursor-pointer transition-all duration-250 ${isDark
                ? 'bg-transparent border border-white/10 hover:bg-white/5 text-[#D1D5DB]'
                : 'bg-[#FFFFFF] border border-[#E5E7EB] text-slate-900 hover:bg-[#F3F4F6]'
                }`}
            >
              Find Jobs
            </button>
          </div>
        </div>
        <div className={`hidden lg:flex items-center justify-center shrink-0 w-48 h-48 rounded-2xl relative transition-all duration-300 ${isDark ? 'bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.03)]' : 'bg-gradient-to-tr from-slate-50 to-slate-100/50 border border-slate-100'
          }`}>
          {/* Floating Document/Resume Illustration */}
          <div className="flex flex-col gap-2 w-32 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-lg transform rotate-6 hover:rotate-0 transition-transform duration-300">
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#FFFFFF]' : 'bg-[#111111]'}`} />
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded" />
            </div>
            <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded" />
            <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded" />
            <div className="w-5/6 h-1 bg-slate-100 dark:bg-white/5 rounded" />
            <div className={`w-full h-1.5 rounded mt-1 ${isDark ? 'bg-white/15' : 'bg-[#111111]/10'}`} />
          </div>
        </div>
      </section>

      {/* SECTION 2: STATISTICS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Resume Score */}
        <div className={`border rounded-[20px] p-6 flex items-center justify-between hover:-translate-y-1 transition-all duration-300 ${isDark ? 'bg-[rgba(31,41,55,0.75)] backdrop-blur-[18px] border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.35)] hover:border-white/[0.15]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-sm hover:shadow-md'
          }`}>
          <div className="text-left">
            <span className={`text-xs font-bold uppercase tracking-wider block transition-colors duration-300 ${isDark ? 'text-[#9CA3AF]' : 'text-[#9CA3AF]'}`}>ATS Resume Score</span>
            <span className={`text-[28px] font-bold mt-1 block transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{atsScore}%</span>
            <span className={`text-xs font-medium mt-1 block flex items-center gap-0.5 transition-colors duration-300 ${isDark ? 'text-[#D1D5DB]' : 'text-slate-900'}`}>
              <span className="font-bold">↑ 2.4%</span> vs last week
            </span>
          </div>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${isDark ? 'bg-white/10 text-[#FFFFFF] border-white/10' : 'bg-[#F3F4F6] text-slate-900 border-[#E5E7EB]'
            }`}>
            <Award size={22} />
          </div>
        </div>

        {/* Card 2: Profile Completion */}
        <div className={`border rounded-[20px] p-6 flex items-center justify-between hover:-translate-y-1 transition-all duration-300 ${isDark ? 'bg-[rgba(31,41,55,0.75)] backdrop-blur-[18px] border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.35)] hover:border-white/[0.15]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-sm hover:shadow-md'
          }`}>
          <div className="text-left">
            <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider block">Profile Completion</span>
            <span className={`text-[28px] font-bold mt-1 block transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{profileCompletion}%</span>
            <span className={`text-xs font-medium mt-1 block transition-colors duration-300 ${isDark ? 'text-[#D1D5DB]' : 'text-[#6B7280]'}`}>Keep details up to date</span>
          </div>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${isDark ? 'bg-white/10 text-[#FFFFFF] border-white/10' : 'bg-[#F3F4F6] text-slate-900 border-[#E5E7EB]'
            }`}>
            <User size={22} />
          </div>
        </div>

        {/* Card 3: Jobs Matched */}
        <div className={`border rounded-[20px] p-6 flex items-center justify-between hover:-translate-y-1 transition-all duration-300 ${isDark ? 'bg-[rgba(31,41,55,0.75)] backdrop-blur-[18px] border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.35)] hover:border-white/[0.15]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-sm hover:shadow-md'
          }`}>
          <div className="text-left">
            <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider block">Jobs Matched</span>
            <span className={`text-[28px] font-bold mt-1 block transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{latestJobs.length || 3}</span>
            <span className={`text-xs font-medium mt-1 block flex items-center gap-0.5 transition-colors duration-300 ${isDark ? 'text-[#D1D5DB]' : 'text-slate-900'}`}>
              <span className="font-bold">New</span> recommendations ready
            </span>
          </div>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${isDark ? 'bg-white/10 text-[#FFFFFF] border-white/10' : 'bg-[#F3F4F6] text-slate-900 border-[#E5E7EB]'
            }`}>
            <Zap size={22} />
          </div>
        </div>

        {/* Card 4: Applications */}
        <div className={`border rounded-[20px] p-6 flex items-center justify-between hover:-translate-y-1 transition-all duration-300 ${isDark ? 'bg-[rgba(31,41,55,0.75)] backdrop-blur-[18px] border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.35)] hover:border-white/[0.15]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-sm hover:shadow-md'
          }`}>
          <div className="text-left">
            <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider block">Applications Submitted</span>
            <span className={`text-[28px] font-bold mt-1 block transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{applications.length}</span>
            <span className={`text-xs font-medium mt-1 block transition-colors duration-300 ${isDark ? 'text-[#D1D5DB]' : 'text-[#6B7280]'}`}>Active application tracker</span>
          </div>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${isDark ? 'bg-white/10 text-[#FFFFFF] border-white/10' : 'bg-[#F3F4F6] text-slate-900 border-[#E5E7EB]'
            }`}>
            <Briefcase size={22} />
          </div>
        </div>
      </section>

      {/* SECTION 3: MAIN CONTENT */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Resume Card (65%) */}
        <div className="lg:col-span-2">
          <div className={`border rounded-[20px] p-6 transition-all duration-300 ${isDark ? 'bg-[rgba(31,41,55,0.75)] backdrop-blur-[18px] border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.35)] hover:border-white/[0.15]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-sm hover:shadow-md'
            }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-lg font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Active Resume Profile</h2>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors duration-300 ${isDark ? 'text-[#FFFFFF] bg-white/10 border-white/10' : 'text-slate-900 bg-[#FFFFFF] border-[#111111]'
                }`}>Live & Ready</span>
            </div>

            {bestResume ? (
              <div className="flex flex-col gap-6">
                {/* Resume Layout Preview container instead of empty container */}
                <div className={`flex flex-col md:flex-row gap-4 p-5 rounded-2xl border transition-colors duration-300 ${isDark ? 'bg-[#111827] border-white/5' : 'bg-[#F8F8F8] border-[#E5E7EB]'
                  }`}>
                  {/* Left Column: Visual Miniature Preview of a Resume Layout */}
                  <div className="w-full md:w-32 bg-white dark:bg-[#1F2937] border border-slate-200 dark:border-white/10 rounded-lg p-3 shrink-0 flex flex-col gap-2">
                    <div className={`w-10 h-1.5 rounded ${isDark ? 'bg-[#FFFFFF]' : 'bg-[#111111]'}`} />
                    <div className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded" />
                    <div className="w-5/6 h-1 bg-slate-200 dark:bg-white/10 rounded" />
                    <hr className="border-slate-100 dark:border-white/5 my-1" />
                    <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded" />
                    <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded" />
                  </div>

                  {/* Right Column: Actual Metadata */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className={`font-bold text-base transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{bestResume.name}</h3>
                      <p className={`text-xs font-semibold mt-1 transition-colors duration-300 ${isDark ? 'text-[#D1D5DB]' : 'text-[#6B7280]'}`}>
                        Updated {formatTimeAgo((bestResume as any).created_at || (bestResume as any).updated_at || (bestResume as any).timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`text-sm font-bold bg-white border px-3 py-1.5 rounded-lg shadow-sm transition-all duration-300 ${isDark ? 'bg-[#1F2937] border-white/10 text-white' : 'bg-white border-[#E5E7EB] text-slate-900'
                        }`}>
                        ATS Score: {bestResume.atsScore || 75}%
                      </span>
                      <span className={`text-sm font-bold border px-3 py-1.5 rounded-lg transition-colors duration-300 ${isDark ? 'bg-white/10 border-white/10 text-[#FFFFFF]' : 'bg-[#F3F4F6] border-[#E5E7EB] text-slate-900'
                        }`}>
                        Completeness: {bestResume.completion || 80}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Completeness Score</span>
                    <span className={`text-xs font-extrabold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{bestResume.completion || 80}%</span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-550 ${isDark ? 'bg-[#FFFFFF]' : 'bg-[#111111]'}`}
                      style={{ width: `${bestResume.completion || 80}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => navigate(`/resume-builder?id=${bestResume.id}`)}
                    className={`font-bold py-2 px-4 rounded-[14px] flex items-center gap-1.5 cursor-pointer text-sm transition-all duration-200 btn-glow-green ${isDark
                      ? 'bg-[#FFFFFF] hover:bg-[#E5E7EB] text-[#111827] shadow-sm'
                      : 'bg-[#111111] hover:bg-[#000000] text-[#FFFFFF]'
                      }`}
                  >
                    <FileEdit size={14} /> Continue Editing
                  </button>
                  <button
                    onClick={() => navigate(`/resume-builder?id=${bestResume.id}`)}
                    className={`font-semibold py-2 px-4 rounded-[14px] cursor-pointer text-sm flex items-center gap-1.5 transition-all duration-200 ${isDark
                      ? 'bg-[#1F2937] hover:bg-[#111827] text-white border border-white/10'
                      : 'bg-[#FFFFFF] border border-[#E5E7EB] text-slate-900 hover:bg-[#F3F4F6]'
                      }`}
                  >
                    <Eye size={14} /> Preview
                  </button>
                  <button
                    onClick={() => navigate(`/resume-builder?id=${bestResume.id}`)}
                    className={`font-semibold py-2 px-4 rounded-[14px] cursor-pointer text-sm flex items-center gap-1.5 transition-all duration-200 ${isDark
                      ? 'bg-[#1F2937] hover:bg-[#111827] text-white border border-white/10'
                      : 'bg-[#FFFFFF] border border-[#E5E7EB] text-slate-900 hover:bg-[#F3F4F6]'
                      }`}
                  >
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center py-10 border border-dashed rounded-2xl transition-colors duration-300 ${isDark ? 'bg-[#111827] border-white/10' : 'bg-[#F8F8F8] border-[#E5E7EB]'
                }`}>
                <FileText className="text-[#6B7280] mb-3" size={32} />
                <p className={`text-sm font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>No resumes created yet</p>
                <p className="text-xs text-[#6B7280] mt-1 max-w-xs text-center">Upload an existing resume or build a new one using our premium builder.</p>
                <button
                  onClick={() => navigate('/resume')}
                  className={`font-bold py-2 px-4 rounded-[14px] mt-4 cursor-pointer text-xs transition-all duration-200 ${isDark ? 'bg-[#FFFFFF] hover:bg-[#E5E7EB] text-[#111827]' : 'bg-[#111111] hover:bg-[#000000] text-[#FFFFFF]'
                    }`}
                >
                  Create Your First Resume
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: AI Career Coach (35%) */}
        <div className="lg:col-span-1">
          <div className={`border rounded-[20px] p-6 transition-all duration-300 ${isDark ? 'bg-[rgba(31,41,55,0.75)] backdrop-blur-[18px] border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.35)] hover:border-white/[0.15]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-sm hover:shadow-md'
            }`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 transition-colors duration-300 ${isDark ? 'bg-white/10 text-[#FFFFFF] border-white/10' : 'bg-[#F3F4F6] text-slate-900 border-[#E5E7EB]'
                }`}>
                <Sparkles size={16} />
              </div>
              <h2 className={`text-lg font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Career Coach</h2>
            </div>

            {/* ChatGPT Dialogue layout design */}
            <div className="flex flex-col gap-3 mb-5 border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex gap-2.5 items-start text-xs">
                <div
                  className="w-6 h-6 rounded-full bg-[#111111] flex items-center justify-center text-[10px] shrink-0 font-extrabold"
                  style={{ color: '#FFFFFF' }}
                >
                  AI
                </div>

                <div className="bg-slate-50 dark:bg-[#111827] p-2.5 rounded-2xl rounded-tl-none border border-slate-100 dark:border-white/5">
                  <p className={`leading-normal transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Hello! How can I optimize your career applications and resume keyword coverage today?
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => handleCoachAction('improve')}
                className={`w-full text-left p-3.5 border rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs font-bold ${isDark
                  ? 'border-white/10 hover:border-white/30 hover:bg-white/5 text-white'
                  : 'border-[#E5E7EB] hover:border-[#111111] hover:bg-[#F3F4F6]/5 text-slate-900'
                  }`}
              >
                <span>Improve Resume Quality</span>
                <ArrowUpRight size={14} className="text-[#6B7280]" />
              </button>
              <button
                onClick={() => handleCoachAction('ats')}
                className={`w-full text-left p-3.5 border rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs font-bold ${isDark
                  ? 'border-white/10 hover:border-white/30 hover:bg-white/5 text-white'
                  : 'border-[#E5E7EB] hover:border-[#111111] hover:bg-[#F3F4F6]/5 text-slate-900'
                  }`}
              >
                <span>ATS Optimization Check</span>
                <ArrowUpRight size={14} className="text-[#6B7280]" />
              </button>
              <button
                onClick={() => handleCoachAction('jobs')}
                className={`w-full text-left p-3.5 border rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs font-bold ${isDark
                  ? 'border-white/10 hover:border-white/30 hover:bg-white/5 text-white'
                  : 'border-[#E5E7EB] hover:border-[#111111] hover:bg-[#F3F4F6]/5 text-slate-900'
                  }`}
              >
                <span>Find Matched Job Listings</span>
                <ArrowUpRight size={14} className="text-[#6B7280]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Recommended Jobs */}
      <section className={`border rounded-[20px] p-6 transition-all duration-300 ${isDark ? 'bg-[rgba(31,41,55,0.75)] backdrop-blur-[18px] border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.35)] hover:border-white/[0.15]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-sm hover:shadow-md'
        }`}>
        <div className={`flex justify-between items-center mb-6 border-b pb-2 transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-[#F1F5F9]'
          }`}>
          <h2 className={`text-lg font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Recommended Local Placements</h2>
          <button
            onClick={() => navigate('/jobs')}
            className={`text-xs font-bold hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0 transition-colors duration-300 ${isDark ? 'text-[#FFFFFF]' : 'text-slate-900'
              }`}
          >
            Explore All Listings <ArrowRight size={12} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {latestJobs.length === 0 ? (
            <div className={`text-center py-10 border border-dashed rounded-2xl text-xs font-semibold transition-colors duration-300 ${isDark ? 'bg-[#111827] border-white/10 text-[#9CA3AF]' : 'bg-[#F8F8F8] border-[#E5E7EB] text-[#9CA3AF]'
              }`}>
              No job recommendations matched. Update your skills or resume to unlock personalized listings.
            </div>
          ) : (
            latestJobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-2xl transition-all duration-300 gap-4 ${isDark ? 'border-white/5 hover:border-white/20' : 'border-[#E5E7EB] hover:border-[#111111]'
                  }`}
              >
                <div className="flex items-center gap-4 text-left">
                  {job.logo ? (
                    <img
                      src={job.logo}
                      alt={job.company}
                      className={`w-12 h-12 rounded-xl object-cover border shrink-0 transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-[#E5E7EB]'
                        }`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60';
                      }}
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-300 ${isDark ? 'bg-[#111827] border-white/10 text-[#FFFFFF]' : 'bg-[#F3F4F6] border-[#E5E7EB] text-slate-900'
                      }`}>
                      <Building size={20} />
                    </div>
                  )}
                  <div>
                    <h3 className={`font-bold text-sm transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{job.title}</h3>
                    <p className={`text-xs font-semibold mt-0.5 transition-colors duration-300 ${isDark ? 'text-[#D1D5DB]' : 'text-[#6B7280]'}`}>{job.company} • {job.location}</p>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-4 w-full md:w-auto justify-between md:justify-end border-t border-slate-50 md:border-t-0 pt-3 md:pt-0 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold border px-2.5 py-1 rounded-lg transition-colors duration-300 ${isDark ? 'bg-[#111827] border-white/10 text-[#D1D5DB]' : 'bg-[#F8F8F8] border-[#E5E7EB] text-[#6B7280]'
                      }`}>
                      {job.salary || 'Competitive'}
                    </span>
                    <span className={`text-xs font-bold border px-2.5 py-1 rounded-lg transition-colors duration-300 ${isDark ? 'bg-transparent border-white/20 text-[#FFFFFF]' : 'bg-white border-[#111111] text-slate-900'
                      }`}>
                      {job.ai_match_score || 80}% Match
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className={`font-bold py-2 px-4 rounded-[14px] text-xs cursor-pointer transition-all duration-200 btn-glow-green ${isDark
                      ? 'bg-[#FFFFFF] hover:bg-[#E5E7EB] text-[#111827] shadow-sm'
                      : 'bg-[#111111] hover:bg-[#000000] text-[#FFFFFF]'
                      }`}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* SECTION 5: BOTTOM TIMELINE & ACTIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Recent Activity */}
        <div className={`border rounded-[20px] p-6 transition-all duration-300 ${isDark ? 'bg-[rgba(31,41,55,0.75)] backdrop-blur-[18px] border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.35)] hover:border-white/[0.15]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-sm hover:shadow-md'
          }`}>
          <h3 className={`text-base font-bold mb-4 border-b pb-2 transition-colors duration-300 ${isDark ? 'border-white/10 text-white' : 'border-[#F1F5F9] text-slate-900'
            }`}>
            Timeline Actions
          </h3>
          <div className="flex flex-col gap-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-[#6B7280] text-xs font-semibold">
                No recent workspace timeline actions found.
              </div>
            ) : (
              activities.slice(0, 4).map((act, index) => (
                <div key={index} className="flex gap-3 text-left items-start text-xs">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 transition-colors duration-300 ${isDark ? 'bg-[#FFFFFF]' : 'bg-[#111111]'}`} />
                  <div>
                    <p className={`font-bold leading-tight transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{act.activity}</p>
                    <p className={`text-[10px] mt-0.5 transition-colors duration-300 ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>{formatTimeAgo(act.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Quick Action Buttons */}
        <div className={`border rounded-[20px] p-6 transition-all duration-300 ${isDark ? 'bg-[rgba(31,41,55,0.75)] backdrop-blur-[18px] border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.35)] hover:border-white/[0.15]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-sm hover:shadow-md'
          }`}>
          <h3 className={`text-base font-bold mb-4 border-b pb-2 transition-colors duration-300 ${isDark ? 'border-white/10 text-white' : 'border-[#F1F5F9] text-slate-900'
            }`}>
            Workspace Hub
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => document.getElementById('dashboard-resume-upload-input')?.click()}
              className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${isDark
                ? 'border-white/10 hover:border-white/20 hover:bg-[#111827]'
                : 'border-[#E5E7EB] hover:border-[#111111] hover:bg-[#F3F4F6]'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-300 ${isDark ? 'bg-white/10 text-[#FFFFFF] border-white/10' : 'bg-[#F3F4F6] text-slate-900 border-[#E5E7EB]'
                }`}>
                <UploadCloud size={20} />
              </div>
              <span className={`text-xs font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Upload Resume</span>
            </button>

            <button
              onClick={() => navigate('/resume-builder')}
              className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${isDark
                ? 'border-white/10 hover:border-white/20 hover:bg-[#111827]'
                : 'border-[#E5E7EB] hover:border-[#111111] hover:bg-[#F3F4F6]'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-300 ${isDark ? 'bg-white/10 text-[#FFFFFF] border-white/10' : 'bg-[#F3F4F6] text-slate-900 border-[#E5E7EB]'
                }`}>
                <Sparkles size={20} />
              </div>
              <span className={`text-xs font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Create Resume</span>
            </button>

            <button
              onClick={() => navigate('/jobs')}
              className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${isDark
                ? 'border-white/10 hover:border-white/20 hover:bg-[#111827]'
                : 'border-[#E5E7EB] hover:border-[#111111] hover:bg-[#F3F4F6]'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-300 ${isDark ? 'bg-white/10 text-[#FFFFFF] border-white/10' : 'bg-[#F3F4F6] text-slate-900 border-[#E5E7EB]'
                }`}>
                <Compass size={20} />
              </div>
              <span className={`text-xs font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Explore Jobs</span>
            </button>

            <button
              onClick={() => navigate('/profile')}
              className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${isDark
                ? 'border-white/10 hover:border-white/20 hover:bg-[#111827]'
                : 'border-[#E5E7EB] hover:border-[#111111] hover:bg-[#F3F4F6]'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-300 ${isDark ? 'bg-white/10 text-[#FFFFFF] border-white/10' : 'bg-[#F3F4F6] text-slate-900 border-[#E5E7EB]'
                }`}>
                <User size={20} />
              </div>
              <span className={`text-xs font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Edit Profile</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
