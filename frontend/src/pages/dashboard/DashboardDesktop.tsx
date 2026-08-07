import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Briefcase, User, Settings, ArrowRight,
  UploadCloud, Sparkles, Clock, CheckCircle2, ChevronRight, Building,
  ArrowUpRight, Award, Plus, Layers, Play, Zap, Compass, Download, Eye, FileEdit,
  Terminal, Code, RotateCcw
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useUserStore } from '../../store/userStore';
import { useThemeStore } from '../../store/themeStore';
import { analyticsService } from '../../services/analytics';
import { jobsService } from '../../services/jobs';
import type { JobListItem, JobApplication } from '../../services/jobs';
import type { DashboardData, AtsData, ActivityTimelineItem, ResumeAnalyticsItem } from '../../services/analytics';
import { UploadResumeWizard } from '../../components/UploadResumeWizard';
import { DisplayHeading } from '../../components/DisplayHeading';
import { CreateFromScratchWizard } from '../../components/resume/CreateFromScratchWizard';

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

export const DashboardDesktop: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const getDisplayName = () => {
    if (!user) return 'Student';
    if (user.student_name) return user.student_name;
    const email = user.personal_email || '';
    const prefix = email.split('@')[0];
    const name = prefix.replace(/[0-9_.]/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1).trim();
  };
  const displayName = getDisplayName();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  const greeting = getGreeting();

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
  const [showScratchWizard, setShowScratchWizard] = useState(false);
  const [wizardFile, setWizardFile] = useState<File | null>(null);
  const [wizardInitialStep, setWizardInitialStep] = useState<number>(2);

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

  return (
    <div className={`flex flex-col gap-6 text-left w-full max-w-[1440px] mx-auto px-6 py-6 transition-all duration-300 ease-in-out relative ${isDark ? 'bg-transparent' : 'bg-[#F7F4EE]'}`}>
      {/* Subtle radial green glow in corners — dark mode only */}
      {isDark && (
        <>
          <div className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(151,196,89,0.03) 0%, transparent 70%)' }} />
          <div className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(151,196,89,0.02) 0%, transparent 70%)' }} />
        </>
      )}

      {/* Uploader Progress Backdrop Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6 transition-all duration-300">
          <div className="bg-[#FFFFFF] dark:bg-[#22241F] border border-[#E4E0D5] dark:border-[#32352F] p-6 rounded-3xl max-w-md w-full shadow-xl flex flex-col items-center gap-4 text-center animate-scale">
            <div className="w-12 h-12 border-4 border-[#173404] dark:border-[#97C459] border-t-transparent rounded-full animate-spin" />
            <div className="leading-normal">
              <h3 className="font-extrabold text-slate-900 dark:text-[#FFFFFF] text-sm">Parsing with Gemini AI</h3>
              <p className="text-[11px] text-[#5B5B52] dark:text-[#A19E95] font-bold mt-1 uppercase tracking-wider">{uploadProgress}</p>
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-6 pb-8 border-b border-[#E4E0D5]/30 dark:border-white/5 w-full">
        <div className="flex-1">
          <DisplayHeading size="hero" as="h1" className="md:whitespace-nowrap">
            {greeting}, <span className="text-[#173404] dark:text-[#97C459]">{displayName}.</span>
          </DisplayHeading>
          <p className="text-base text-[#5B5B52] dark:text-[#A19E95] mt-4 font-normal leading-relaxed">
            Let's build something exceptional today.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              navigate('/resume');
            }}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-[#C86A3D] dark:bg-[#E08553] text-white hover:opacity-95 rounded-xl shadow-md transition-all cursor-pointer border-none"
          >
            <UploadCloud size={14} /> Upload Resume
          </button>
        </div>
      </header>

      {/* HERO CARD (full width) */}
      <section className="bg-white dark:bg-[#22241F] border border-[#E4E0D5] dark:border-[#32352F] p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          {/* Circular readiness ring */}
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-[#E4E0D5] dark:stroke-[#32352F] fill-transparent"
                strokeWidth="8"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-[#173404] dark:stroke-[#97C459] fill-transparent"
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * Math.round(((atsScore || 75) + profileCompletion + (user?.skills ? 85 : 45) + (applications.length > 0 ? 80 : 60)) / 4)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {Math.round(((atsScore || 75) + profileCompletion + (user?.skills ? 85 : 45) + (applications.length > 0 ? 80 : 60)) / 4)}%
              </span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Career Readiness Score</h2>
            <p className="text-xs text-[#5B5B52] dark:text-[#A19E95] mt-1.5 font-bold">
              Add 2 more skills to unlock better matches
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="px-5 py-2.5 text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 border border-[#E4E0D5] dark:border-white/5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
        >
          Complete profile
        </button>
      </section>

      {/* SUPPORTING METRICS ROW (2 cards) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Applications */}
        <div className="bg-white dark:bg-[#22241F] border border-[#E4E0D5] dark:border-[#32352F] p-6 rounded-3xl shadow-sm text-left">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#5B5B52] dark:text-[#A19E95] uppercase tracking-wider">Applications</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-[#2C2C2A] dark:text-white">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{applications.length}</span>
            <span className="text-xs text-[#5B5B52] dark:text-[#A19E95] font-medium block mt-1">Active Tracker</span>
          </div>
        </div>

        {/* Job Matches */}
        <div className="bg-white dark:bg-[#22241F] border border-[#E4E0D5] dark:border-[#32352F] p-6 rounded-3xl shadow-sm text-left">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#5B5B52] dark:text-[#A19E95] uppercase tracking-wider">Job Matches</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-[#2C2C2A] dark:text-white">
              <Zap size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{latestJobs.length || 8}</span>
            <span className="text-xs text-[#173404] dark:text-[#97C459] font-bold block mt-1">Matched with your skills</span>
          </div>
        </div>
      </section>

      {/* RECOMMENDED JOBS (promoted above the fold) */}
      <section className="bg-white dark:bg-[#22241F] border border-[#E4E0D5] dark:border-[#32352F] p-6 rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-5 border-b border-[#E4E0D5] dark:border-white/5 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Recommended Jobs</h2>
          <button
            onClick={() => navigate('/jobs')}
            className="text-xs font-bold text-[#173404] dark:text-[#97C459] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
          >
            View all <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {latestJobs.length === 0 ? (
            <div className="col-span-full text-center py-8 flex flex-col items-center justify-center gap-3">
              <p className="text-xs font-bold text-[#5B5B52] dark:text-[#A19E95]">No recommended jobs found.</p>
              <p className="text-[11px] text-slate-400">Update your profile resume keys or search manually to fetch real-time matching postings.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/jobs')}
                className="font-bold border-[#E4E0D5] hover:border-slate-950 text-xs px-4"
              >
                Search manually
              </Button>
            </div>
          ) : (
            latestJobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="border border-[#E4E0D5] dark:border-white/5 p-4 rounded-2xl hover:border-slate-800 transition-all flex flex-col justify-between gap-4 text-left"
              >
                <div className="flex gap-3">
                  {job.logo ? (
                    <img
                      src={job.logo}
                      alt={job.company}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#E4E0D5] dark:border-white/10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg border border-[#E4E0D5] dark:border-white/10 flex items-center justify-center shrink-0 bg-slate-50 dark:bg-white/5 text-[#5B5B52] dark:text-[#A19E95]">
                      <Building size={16} />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{job.title}</h3>
                    <p className="text-xs text-[#5B5B52] dark:text-[#A19E95] mt-0.5 truncate">{job.company}</p>
                    <p className="text-[10px] text-slate-400 dark:text-[#A19E95] mt-0.5 truncate">{job.location}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#E4E0D5] dark:border-white/5 pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-[#EAF3DE] text-[#173404] dark:bg-[#223A12] dark:text-[#97C459] px-2 py-0.5 rounded">
                      {job.ai_match_score || 80}% Match
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-500 px-2 py-0.5 rounded truncate max-w-[80px]">
                      {job.salary || 'Full-time'}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="text-xs font-bold text-slate-900 dark:text-white hover:underline cursor-pointer bg-transparent border-none"
                  >
                    View Job
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* SECONDARY ROW (2 columns) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Recent Resume */}
        <div className="bg-white dark:bg-[#22241F] border border-[#E4E0D5] dark:border-[#32352F] p-6 rounded-3xl shadow-sm text-left">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">Recent Resume</h2>
          {bestResume ? (
            <div className="flex flex-col sm:flex-row gap-5 p-4 rounded-xl border border-[#E4E0D5] dark:border-white/5 bg-[#F7F4EE]/30 dark:bg-white/[0.01] text-left">
              <div className="w-full sm:w-28 bg-white dark:bg-white/5 border border-[#E4E0D5] dark:border-white/10 rounded-lg p-3 shrink-0 flex flex-col gap-1.5 shadow-sm">
                <div className="w-8 h-1 bg-[#173404] dark:bg-[#97C459] rounded" />
                <div className="w-full h-1 bg-[#E4E0D5] dark:bg-white/5 rounded" />
                <div className="w-5/6 h-1 bg-[#E4E0D5] dark:bg-white/5 rounded" />
                <hr className="border-[#E4E0D5] dark:border-white/5 my-1" />
                <div className="w-full h-1 bg-[#E4E0D5] dark:bg-white/5 rounded" />
                <div className="w-full h-1 bg-[#E4E0D5] dark:bg-white/5 rounded" />
              </div>
              <div className="flex-1 flex flex-col justify-between text-left">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{bestResume.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Updated {formatTimeAgo((bestResume as any).created_at || (bestResume as any).updated_at || (bestResume as any).timestamp)}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-white/5 border border-[#E4E0D5] dark:border-white/5 px-2.5 py-1 rounded-lg">
                    ATS Score: <span className="text-[#173404] dark:text-[#97C459] font-extrabold">{bestResume.atsScore || 75}%</span>
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/resume-builder?id=${bestResume.id}`)}
                    className="px-3 py-1.5 text-xs font-bold bg-[#173404] dark:bg-[#97C459] text-white dark:text-[#173404] rounded-lg hover:opacity-90 transition-all cursor-pointer border-none"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/resume-builder?id=${bestResume.id}`)}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-lg transition-all cursor-pointer border-none"
                  >
                    Optimize
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs font-medium border border-dashed border-[#E4E0D5] rounded-xl flex flex-col items-center justify-center gap-3">
              <p>No resumes found.</p>
              <button
                onClick={() => setShowScratchWizard(true)}
                className="px-4 py-2 text-xs font-bold bg-[#173404] text-white rounded-xl cursor-pointer border-none"
              >
                Create Resume
              </button>
            </div>
          )}
        </div>

        {/* Column 2: Recent Activity Timeline */}
        <div className="bg-white dark:bg-[#22241F] border border-[#E4E0D5] dark:border-[#32352F] p-6 rounded-3xl shadow-sm text-left">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="flex flex-col gap-4 text-left">
            {activities.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                No recent activity recorded.
              </div>
            ) : (
              activities.slice(0, 3).map((act, idx) => (
                <div key={idx} className="flex gap-3 text-left items-start">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[#173404] dark:bg-[#97C459]" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{act.activity}</p>
                    <p className="text-[10px] text-slate-400 dark:text-[#A19E95] mt-0.5">{formatTimeAgo(act.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full text-center border-t border-[#E4E0D5] dark:border-white/5 pt-6 mt-4">
        <p className="text-[11px] text-[#5B5B52] dark:text-[#A19E95] font-semibold">
          Bimba AI • Version 1.2.0 • Need help? <span className="underline cursor-pointer hover:text-slate-950 dark:hover:text-white">Contact Support</span>
        </p>
      </footer>

      {showWizard && (
        <UploadResumeWizard 
          initialStep={wizardInitialStep}
          initialFile={wizardFile}
          onClose={() => {
            setShowWizard(false);
            setWizardFile(null);
            setWizardInitialStep(2);
            fetchDashboardOverview();
          }}
          onSuccess={() => {
            setShowWizard(false);
            setWizardFile(null);
            setWizardInitialStep(2);
            fetchDashboardOverview();
          }}
          onSwitchToScratch={() => {
            setShowWizard(false);
            setWizardFile(null);
            setWizardInitialStep(2);
            setShowScratchWizard(true);
          }}
          isDark={isDark}
        />
      )}

      {showScratchWizard && (
        <CreateFromScratchWizard
          initialContact={{
            name: displayName === 'Student' ? '' : displayName,
            email: user?.personal_email || '',
            phone: (user as any)?.phone || '',
            location: (user as any)?.address || ''
          }}
          onClose={() => setShowScratchWizard(false)}
          onSuccess={() => {
            setShowScratchWizard(false);
            fetchDashboardOverview();
          }}
          isDark={isDark}
        />
      )}
    </div>
  );
};
