import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Briefcase, User, Settings, UploadCloud,
  Sparkles, Clock, CheckCircle2, ChevronRight, Building,
  Zap, Plus, Award
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
import { apiClient } from '../../services/api';
import { DisplayHeading } from '../../components/DisplayHeading';

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

export const DashboardMobile: React.FC = () => {
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
    <div className={`flex flex-col gap-6 text-left w-full px-2 py-4 pb-20 ${isDark ? 'bg-transparent' : 'bg-slate-50'}`}>
      
      {/* 1. Welcome Header */}
      <header className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white" style={{ fontWeight: 100 }}>
            {greeting},
          </h1>
          <p className="text-lg font-bold text-slate-800 dark:text-[#97C459]">{displayName}</p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm text-slate-500 dark:text-slate-400 min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer"
        >
          <Settings size={18} />
        </button>
      </header>

      {/* 2. Resume Progress (Career Readiness Score) */}
      <Card className="p-5 bg-white dark:bg-[#1E293B] border-slate-250 dark:border-white/5 shadow-md flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-slate-100 dark:stroke-slate-800 fill-transparent"
                strokeWidth="5"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-emerald-600 dark:stroke-[#97C459] fill-transparent"
                strokeWidth="5"
                strokeDasharray={175.8}
                strokeDashoffset={175.8 - (175.8 * Math.round(((atsScore || 75) + profileCompletion + (user?.skills ? 85 : 45) + (applications.length > 0 ? 80 : 60)) / 4)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-slate-950 dark:text-white">
                {Math.round(((atsScore || 75) + profileCompletion + (user?.skills ? 85 : 45) + (applications.length > 0 ? 80 : 60)) / 4)}%
              </span>
            </div>
          </div>
          <div className="text-left">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Career Readiness Score</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-bold">
              Add 2 more skills to unlock better matches
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/profile')}
          className="w-full py-3.5 text-xs font-bold border-slate-200 dark:border-white/10 dark:text-white hover:bg-slate-50 min-h-[48px] rounded-xl flex items-center justify-center"
        >
          Complete Profile
        </Button>
      </Card>

      {/* 3. ATS Score Card */}
      <Card className="p-5 bg-white dark:bg-[#1E293B] border-slate-250 dark:border-white/5 shadow-md flex justify-between items-center gap-4 text-left">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">ATS Score</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{atsScore || 75}</span>
          <span className="text-xs text-slate-400"> /100</span>
          <span className="text-[10px] text-emerald-600 dark:text-[#97C459] font-bold block mt-1">Excellent Score Match</span>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-[#97C459] flex-shrink-0">
          <Award size={22} />
        </div>
      </Card>

      {/* 4. AI Suggestions */}
      <Card className="p-5 bg-white dark:bg-[#1E293B] border-slate-250 dark:border-white/5 shadow-md text-left flex flex-col gap-3">
        <span className="text-[10px] text-slate-800 dark:text-white font-extrabold uppercase tracking-wide">AI Suggestions</span>
        <div className="flex flex-col gap-3">
          {[
            { title: 'Improve Summary', desc: 'Make your summary more impactful' },
            { title: 'Add Keywords', desc: '3 important keywords added' },
            { title: 'Enhance Skills', desc: 'Skills section optimized' }
          ].map((s, i) => (
            <div key={i} className="flex gap-3.5 items-start text-xs">
              <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-[#97C459] mt-0.5 flex-shrink-0">
                ✓
              </div>
              <div>
                <span className="font-extrabold text-slate-700 dark:text-slate-200 block leading-tight">{s.title}</span>
                <span className="text-slate-400 block mt-0.5 leading-snug">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Matching Jobs */}
      <div className="flex flex-col gap-3.5">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Job Matches ({latestJobs.length})</h2>
          <span onClick={() => navigate('/jobs')} className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer">View all</span>
        </div>
        <div className="flex flex-col gap-3">
          {latestJobs.map((job) => (
            <Card
              key={job.id}
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="p-4 bg-white dark:bg-[#1E293B] border-slate-250 dark:border-white/5 shadow-sm flex flex-col gap-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                  <Building size={18} className="text-slate-500" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">{job.title}</h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">{job.company} • {job.location}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3">
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-[#223A12] dark:text-[#97C459] px-2.5 py-1 rounded">
                  {job.ai_match_score || 80}% Match
                </span>
                <span className="text-[9px] font-bold text-slate-900 dark:text-white">View Details →</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 6. Applications Section */}
      <div className="flex flex-col gap-3.5">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Tracked Applications</h2>
          <span onClick={() => navigate('/jobs/applications')} className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer">View all</span>
        </div>
        {applications.length === 0 ? (
          <Card className="p-6 text-center text-xs font-bold text-slate-400 bg-white dark:bg-[#1E293B] border-slate-250 dark:border-white/5">
            No active trackers yet.
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {applications.slice(0, 2).map((app) => (
              <Card
                key={app.id}
                onClick={() => navigate('/jobs/applications')}
                className="p-4 bg-white dark:bg-[#1E293B] border-slate-250 dark:border-white/5 shadow-sm text-left flex flex-col gap-3"
              >
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">{app.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{app.company}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-2.5">
                  <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase">
                    {app.status}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Updated {formatTimeAgo(app.application_date)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 7. Quick Actions (Bottom sticky/grouped list) */}
      <div className="flex flex-col gap-3.5">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white px-1">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => {
              setWizardInitialStep(2);
              setShowWizard(true);
            }}
            className="flex flex-col items-center justify-center gap-2 p-5 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm min-h-[96px] cursor-pointer"
          >
            <UploadCloud size={20} className="text-slate-700 dark:text-[#97C459]" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-white">Upload Resume</span>
          </button>
          
          <button
            onClick={() => navigate('/resume')}
            className="flex flex-col items-center justify-center gap-2 p-5 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm min-h-[96px] cursor-pointer"
          >
            <Sparkles size={20} className="text-slate-700 dark:text-[#97C459]" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-white">Build Resume</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input & Wizard */}
      <input
        type="file"
        id="dashboard-resume-upload-input"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />
      
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
          isDark={isDark}
        />
      )}
    </div>
  );
};
