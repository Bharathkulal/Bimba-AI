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
import { UploadResumeWizard } from '../components/UploadResumeWizard';

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
  const [showWizard, setShowWizard] = useState(false);
  const [wizardFile, setWizardFile] = useState<File | null>(null);

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

    setWizardFile(file);
    setShowWizard(true);
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
    <div className={`flex flex-col gap-6 text-left w-full max-w-[1440px] mx-auto px-4 py-6 transition-all duration-300 ease-in-out relative ${isDark ? 'bg-transparent' : 'bg-[#FAFAFA]'}`}>
      {/* Subtle radial green glow in corners — dark mode only */}
      {isDark && (
        <>
          <div className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)' }} />
          <div className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.02) 0%, transparent 70%)' }} />
        </>
      )}

      {/* Uploader Progress Backdrop Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6 transition-all duration-300">
          <div className="bg-[#FFFFFF] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-white/10 p-6 rounded-3xl max-w-md w-full shadow-xl flex flex-col items-center gap-4 text-center animate-scale">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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

      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Good morning, {displayName} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Here's your career progress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => document.getElementById('dashboard-resume-upload-input')?.click()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
          >
            <UploadCloud size={14} /> Upload Resume
          </button>
        </div>
      </header>

      {/* TOP STATISTICS GRID */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* ATS Score */}
        <div className="bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 p-5 md:p-6 rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ATS Score</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">{atsScore}/100</span>
            <span className="text-[10px] md:text-xs text-emerald-500 font-bold block mt-1">Ready for Applications</span>
          </div>
        </div>

        {/* Profile Completion */}
        <div className="bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 p-5 md:p-6 rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Profile Completion</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400">
              <User size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">{profileCompletion}%</span>
            <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-400 font-medium block mt-1">Keep details updated</span>
          </div>
        </div>

        {/* Applications */}
        <div className="bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 p-5 md:p-6 rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Applications</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">{applications.length}</span>
            <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-400 font-medium block mt-1">Active Tracker</span>
          </div>
        </div>

        {/* Job Matches */}
        <div className="bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 p-5 md:p-6 rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Job Matches</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <Zap size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">{latestJobs.length || 8}</span>
            <span className="text-[10px] md:text-xs text-emerald-500 font-bold block mt-1">Matched with your skills</span>
          </div>
        </div>
      </section>

      {/* TWO COLUMN GRID: CAREER READINESS vs QUICK ACTIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Career Readiness (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 p-6 rounded-[20px] shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Career Readiness</h2>
            <span className="text-sm font-extrabold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg">
              Overall: {Math.round(((atsScore || 75) + profileCompletion + (user?.skills ? 85 : 45) + (applications.length > 0 ? 80 : 60)) / 4)}%
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Resume Meter */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-350">Resume Score</span>
                <span className="text-slate-900 dark:text-white">{atsScore || 75}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${atsScore || 75}%` }} />
              </div>
            </div>

            {/* Profile Meter */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-350">Profile Completion</span>
                <span className="text-slate-900 dark:text-white">{profileCompletion}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${profileCompletion}%` }} />
              </div>
            </div>

            {/* Skills Meter */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-350">Skills Match Readiness</span>
                <span className="text-slate-900 dark:text-white">{user?.skills ? 85 : 45}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${user?.skills ? 85 : 45}%` }} />
              </div>
            </div>

            {/* Job Search Meter */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-350">Job Search Activity</span>
                <span className="text-slate-900 dark:text-white">{applications.length > 0 ? 80 : 60}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${applications.length > 0 ? 80 : 60}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Quick Actions (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 p-6 rounded-[20px] shadow-sm hover:shadow-md transition-all">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => document.getElementById('dashboard-resume-upload-input')?.click()}
              className="flex flex-col items-center justify-center text-center p-4 border border-slate-100 dark:border-white/5 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/5 dark:hover:bg-emerald-500/5 transition-all group cursor-pointer"
            >
              <UploadCloud size={24} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Upload Resume</span>
            </button>

            <button
              onClick={() => navigate('/resume-builder')}
              className="flex flex-col items-center justify-center text-center p-4 border border-slate-100 dark:border-white/5 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/5 dark:hover:bg-emerald-500/5 transition-all group cursor-pointer"
            >
              <Plus size={24} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Create Resume</span>
            </button>

            <button
              onClick={() => {
                if (bestResume) {
                  navigate(`/resume-builder?id=${bestResume.id}`);
                } else {
                  navigate('/resume');
                }
              }}
              className="flex flex-col items-center justify-center text-center p-4 border border-slate-100 dark:border-white/5 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/5 dark:hover:bg-emerald-500/5 transition-all group cursor-pointer"
            >
              <Sparkles size={24} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Optimize Resume</span>
            </button>

            <button
              onClick={() => navigate('/jobs')}
              className="flex flex-col items-center justify-center text-center p-4 border border-slate-100 dark:border-white/5 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/5 dark:hover:bg-emerald-500/5 transition-all group cursor-pointer"
            >
              <Briefcase size={24} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Find Jobs</span>
            </button>
          </div>
        </div>
      </section>

      {/* RECOMMENDED JOBS SECTION */}
      <section className="bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 p-6 rounded-[20px] shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-white/5 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Recommended Jobs</h2>
          <button
            onClick={() => navigate('/jobs')}
            className="text-xs font-bold text-emerald-500 hover:text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
          >
            View All Jobs <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {latestJobs.length === 0 ? (
            <div className="col-span-full text-center py-8 text-slate-400 text-xs font-medium">
              No recommended jobs found. Update your profile to get matches.
            </div>
          ) : (
            latestJobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="border border-slate-100 dark:border-white/5 p-4 rounded-2xl hover:border-emerald-500/30 hover:bg-emerald-50/5 dark:hover:bg-emerald-500/5 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex gap-3 text-left">
                  {job.logo ? (
                    <img
                      src={job.logo}
                      alt={job.company}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-100 dark:border-white/10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg border border-slate-100 dark:border-white/10 flex items-center justify-center shrink-0 bg-slate-50 dark:bg-[#111827] text-slate-500">
                      <Building size={16} />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{job.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{job.company}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{job.location}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 dark:border-white/5 pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">
                      {job.ai_match_score || 80}% Match
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-500 px-2 py-0.5 rounded truncate max-w-[80px]">
                      {job.salary || 'Full-time'}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="text-xs font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer"
                  >
                    View Job
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* RECENT RESUME SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Resume (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 p-6 rounded-[20px] shadow-sm hover:shadow-md transition-all">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">Recent Resume</h2>
          {bestResume ? (
            <div className="flex flex-col sm:flex-row gap-5 p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
              <div className="w-full sm:w-28 bg-white dark:bg-[#1F2937] border border-slate-200 dark:border-white/10 rounded-lg p-3 shrink-0 flex flex-col gap-1.5 shadow-sm">
                <div className="w-8 h-1 bg-emerald-500 rounded" />
                <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded" />
                <div className="w-5/6 h-1 bg-slate-100 dark:bg-white/5 rounded" />
                <hr className="border-slate-100 dark:border-white/5 my-1" />
                <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded" />
                <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{bestResume.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Updated {formatTimeAgo((bestResume as any).created_at || (bestResume as any).updated_at || (bestResume as any).timestamp)}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 px-2.5 py-1 rounded-lg">
                    ATS Score: <span className="text-emerald-500 font-extrabold">{bestResume.atsScore || 75}%</span>
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/resume-builder?id=${bestResume.id}`)}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/resume-builder?id=${bestResume.id}`)}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-lg transition-all cursor-pointer"
                  >
                    Optimize
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs font-medium border border-dashed rounded-xl">
              No resumes found. Click Create Resume to start.
            </div>
          )}
        </div>

        {/* Right: Recent Activity Timeline (1 col) */}
        <div className="bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 p-6 rounded-[20px] shadow-sm hover:shadow-md transition-all">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="flex flex-col gap-4">
            {activities.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                No recent activity recorded.
              </div>
            ) : (
              activities.slice(0, 3).map((act, idx) => (
                <div key={idx} className="flex gap-3 text-left items-start">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{act.activity}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{formatTimeAgo(act.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {showWizard && (
        <UploadResumeWizard 
          initialFile={wizardFile}
          onClose={() => {
            setShowWizard(false);
            setWizardFile(null);
            fetchDashboardOverview();
          }}
          onSuccess={() => {
            setShowWizard(false);
            setWizardFile(null);
            fetchDashboardOverview();
          }}
          isDark={isDark}
        />
      )}
    </div>
  );
};

export default Dashboard;
