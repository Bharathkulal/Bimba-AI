import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Briefcase, User, Settings, ArrowRight, 
  UploadCloud, Sparkles, Clock, CheckCircle2, ChevronRight, Building
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatsCard } from '../components/StatsCard';
import { useUserStore } from '../store/userStore';
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
  
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch dashboard summary analytics
  const fetchDashboardOverview = async () => {
    try {
      setIsLoading(true);
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 min-h-screen pb-12 text-left animate-pulse">
        <div className="h-32 w-full bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="h-28 bg-slate-100 rounded-2xl" />
          <div className="h-28 bg-slate-100 rounded-2xl" />
          <div className="h-28 bg-slate-100 rounded-2xl" />
          <div className="h-28 bg-slate-100 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-100 rounded-2xl" />
          <div className="h-72 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

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

  return (
    <div className="flex flex-col gap-6 text-left w-full max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Good Morning, {displayName}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Welcome back to Bimba AI. Here is what is happening with your profile today.
          </p>
        </div>
      </section>

      {/* Statistics Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard 
          label="Resume Completion" 
          value={`${resumeHealth}%`} 
          percentage={resumeHealth} 
          description="Based on your top resume template"
        />
        <StatsCard 
          label="Highest ATS Score" 
          value={`${atsScore}%`} 
          percentage={atsScore} 
          description="Optimal score matched to industry keywords"
        />
        <StatsCard 
          label="Profile Completion" 
          value={`${profileCompletion}%`} 
          percentage={profileCompletion} 
          description="Keep details up to date for recruiters"
        />
        <StatsCard 
          label="Active Applications" 
          value={applications.length} 
          icon={Briefcase} 
          description="Jobs you have applied for"
        />
      </section>

      {/* Main Grid: Details & Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Quick Actions & Latest Jobs */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Quick Actions Card */}
          <Card className="p-6">
            <h3 className="text-base font-extrabold text-slate-900 mb-4 border-b border-slate-100 pb-2">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button 
                onClick={() => navigate('/resume')}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-200/80 hover:border-emerald-200 hover:bg-emerald-50/10 cursor-pointer transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UploadCloud size={18} />
                </div>
                <span className="text-xs font-bold text-slate-800">Upload Resume</span>
              </button>
              
              <button 
                onClick={() => navigate('/resume-builder')}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-200/80 hover:border-emerald-200 hover:bg-emerald-50/10 cursor-pointer transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <span className="text-xs font-bold text-slate-800">Create New CV</span>
              </button>

              <button 
                onClick={() => navigate('/jobs')}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-200/80 hover:border-emerald-200 hover:bg-emerald-50/10 cursor-pointer transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Briefcase size={18} />
                </div>
                <span className="text-xs font-bold text-slate-800">Explore Jobs</span>
              </button>

              <button 
                onClick={() => navigate('/profile')}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-200/80 hover:border-emerald-200 hover:bg-emerald-50/10 cursor-pointer transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <User size={18} />
                </div>
                <span className="text-xs font-bold text-slate-800">Edit Profile</span>
              </button>
            </div>
          </Card>

          {/* Latest Jobs Recommendations */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Latest Job Recommendations
              </h3>
              <button 
                onClick={() => navigate('/jobs')}
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
              >
                View Portal <ArrowRight size={12} />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {latestJobs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  No job recommendations found at this time.
                </div>
              ) : (
                latestJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="flex items-center justify-between p-3.5 border border-slate-150 rounded-xl hover:border-slate-350 transition-colors"
                  >
                    <div className="flex items-center gap-3">
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
                      <div className="text-left">
                        <h4 className="font-bold text-xs text-slate-800 truncate max-w-[180px]">{job.title}</h4>
                        <p className="text-[10px] text-slate-450 font-bold">{job.company}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 rounded-md">
                        {job.ai_match_score || 75}% Match
                      </span>
                      <button 
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Recent Activity & Application Status */}
        <div className="flex flex-col gap-6">
          
          {/* Application Progress Timeline */}
          <Card className="p-6">
            <h3 className="text-base font-extrabold text-slate-900 mb-4 border-b border-slate-100 pb-2">
              Application Tracker
            </h3>
            <div className="flex flex-col gap-3">
              {applications.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  No active job applications tracked.
                </div>
              ) : (
                applications.slice(0, 4).map((app) => (
                  <div key={app.id} className="flex justify-between items-center text-xs">
                    <div className="text-left">
                      <p className="font-bold text-slate-800 truncate max-w-[120px]">{app.title}</p>
                      <p className="text-[10px] text-slate-400">{app.company}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      app.status === 'Accepted' || app.status === 'Offer' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : app.status === 'Rejected' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                        : app.status === 'Interview'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Activity Timeline */}
          <Card className="p-6">
            <h3 className="text-base font-extrabold text-slate-900 mb-4 border-b border-slate-100 pb-2">
              Recent Activity
            </h3>
            <div className="flex flex-col gap-4">
              {activities.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  No recent activities logged.
                </div>
              ) : (
                activities.slice(0, 4).map((act, idx) => (
                  <div key={idx} className="flex gap-3 text-left items-start text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{act.activity}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatTimeAgo(act.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
