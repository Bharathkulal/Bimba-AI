import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Briefcase, User, Settings, ArrowRight, 
  UploadCloud, Sparkles, Clock, CheckCircle2, ChevronRight, Building,
  ArrowUpRight, Award, Plus, Layers, Play, Zap, Compass, Download, Eye, FileEdit
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
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
    } catch (err) {
      console.error(err);
      alert("Failed to parse and save resume.");
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
    <div className="flex flex-col gap-6 text-left w-full max-w-[1440px] mx-auto px-4 py-6 bg-[#F8FAFC]">
      {/* Uploader Progress Backdrop Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white border border-[#E5E7EB] p-6 rounded-3xl max-w-md w-full shadow-2xl flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" />
            <div className="leading-normal">
              <h3 className="font-extrabold text-[#111827] text-sm">Parsing with Gemini AI</h3>
              <p className="text-[11px] text-[#6B7280] font-bold mt-1 uppercase tracking-wider">{uploadProgress}</p>
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
      <section className="bg-white border border-[#E5E7EB] rounded-[20px] p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="flex-1 text-left relative z-10">
          <span className="text-xs font-bold text-[#10B981] uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full mb-3 inline-block">Welcome Back</span>
          <h1 className="text-3xl md:text-[36px] font-bold text-[#111827] leading-tight">
            Good Morning, {displayName}
          </h1>
          <p className="text-sm md:text-base text-[#6B7280] mt-2 max-w-xl">
            Welcome back to Bimba AI. Continue building your professional career, parsing your profiles with AI and matching key local roles.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button 
              onClick={() => {
                if (bestResume) {
                  navigate(`/resume-builder?id=${bestResume.id}`);
                } else {
                  navigate('/resume');
                }
              }}
              className="bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-500/10"
            >
              Continue Resume <ArrowRight size={16} />
            </Button>
            <Button 
              onClick={() => navigate('/jobs')}
              variant="outline"
              className="border-[#E5E7EB] text-[#111827] hover:bg-[#F8FAFC] font-semibold py-2.5 px-5 rounded-xl cursor-pointer"
            >
              Find Jobs
            </Button>
          </div>
        </div>
        <div className="hidden lg:flex items-center justify-center shrink-0 w-48 h-48 bg-gradient-to-tr from-emerald-50 to-emerald-100/50 rounded-full border border-emerald-50 relative">
          <div className="absolute inset-4 rounded-full border border-emerald-100 flex items-center justify-center bg-white shadow-sm">
            <Zap size={48} className="text-[#10B981] animate-pulse" />
          </div>
        </div>
      </section>

      {/* SECTION 2: STATISTICS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Resume Score */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-sm flex items-center justify-between hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
          <div className="text-left">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block">ATS Resume Score</span>
            <span className="text-[28px] font-bold text-[#111827] mt-1 block">{atsScore}%</span>
            <span className="text-xs font-medium text-[#22C55E] mt-1 block flex items-center gap-0.5">
              <span className="font-bold">↑ 2.4%</span> vs last week
            </span>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-[#10B981] shrink-0 border border-emerald-100">
            <Award size={22} />
          </div>
        </div>

        {/* Card 2: Profile Completion */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-sm flex items-center justify-between hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
          <div className="text-left">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block">Profile Completion</span>
            <span className="text-[28px] font-bold text-[#111827] mt-1 block">{profileCompletion}%</span>
            <span className="text-xs font-medium text-[#6B7280] mt-1 block">Keep details up to date</span>
          </div>
          <div className="w-14 h-14 rounded-full bg-blue-50/50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100/50">
            <User size={22} />
          </div>
        </div>

        {/* Card 3: Jobs Matched */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-sm flex items-center justify-between hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
          <div className="text-left">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block">Jobs Matched</span>
            <span className="text-[28px] font-bold text-[#111827] mt-1 block">{latestJobs.length || 3}</span>
            <span className="text-xs font-medium text-[#22C55E] mt-1 block flex items-center gap-0.5">
              <span className="font-bold">New</span> recommendations ready
            </span>
          </div>
          <div className="w-14 h-14 rounded-full bg-purple-50/50 flex items-center justify-center text-purple-600 shrink-0 border border-purple-100/50">
            <Zap size={22} />
          </div>
        </div>

        {/* Card 4: Applications */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-sm flex items-center justify-between hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
          <div className="text-left">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block">Applications Submitted</span>
            <span className="text-[28px] font-bold text-[#111827] mt-1 block">{applications.length}</span>
            <span className="text-xs font-medium text-[#6B7280] mt-1 block">Active application tracker</span>
          </div>
          <div className="w-14 h-14 rounded-full bg-amber-50/60 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100/50">
            <Briefcase size={22} />
          </div>
        </div>
      </section>

      {/* SECTION 3: MAIN CONTENT */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Resume Card (65%) */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[#111827]">Active Resume Profile</h2>
              <span className="text-xs font-bold text-[#10B981] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Live & Ready</span>
            </div>

            {bestResume ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8FAFC] border border-[#E5E7EB] p-5 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-base text-[#111827]">{bestResume.name}</h3>
                    <p className="text-xs font-semibold text-[#6B7280] mt-1">
                      Updated {formatTimeAgo((bestResume as any).created_at || (bestResume as any).updated_at || (bestResume as any).timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#111827] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-lg shadow-sm">
                      ATS: {bestResume.atsScore || 75}%
                    </span>
                    <span className="text-sm font-bold text-[#10B981] bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                      Build: {bestResume.completion || 80}%
                    </span>
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Completeness Score</span>
                    <span className="text-xs font-extrabold text-[#111827]">{bestResume.completion || 80}%</span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#10B981] h-full rounded-full transition-all duration-550" 
                      style={{ width: `${bestResume.completion || 80}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button 
                    onClick={() => navigate(`/resume-builder?id=${bestResume.id}`)}
                    className="bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/10 text-sm"
                  >
                    <FileEdit size={14} /> Continue Editing
                  </Button>
                  <Button 
                    onClick={() => navigate(`/resume-builder?id=${bestResume.id}`)}
                    variant="outline"
                    className="border-[#E5E7EB] text-[#111827] hover:bg-[#F8FAFC] font-semibold py-2 px-4 rounded-xl cursor-pointer text-sm flex items-center gap-1.5"
                  >
                    <Eye size={14} /> Preview
                  </Button>
                  <Button 
                    onClick={() => navigate(`/resume-builder?id=${bestResume.id}`)}
                    variant="outline"
                    className="border-[#E5E7EB] text-[#111827] hover:bg-[#F8FAFC] font-semibold py-2 px-4 rounded-xl cursor-pointer text-sm flex items-center gap-1.5"
                  >
                    <Download size={14} /> Download PDF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-[#E5E7EB] rounded-2xl bg-[#F8FAFC]">
                <FileText className="text-[#6B7280] mb-3" size={32} />
                <p className="text-sm font-bold text-[#111827]">No resumes created yet</p>
                <p className="text-xs text-[#6B7280] mt-1 max-w-xs text-center">Upload an existing resume or build a new one using our premium builder.</p>
                <Button 
                  onClick={() => navigate('/resume')}
                  className="bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2 px-4 rounded-xl mt-4 cursor-pointer text-xs"
                >
                  Create Your First Resume
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: AI Career Coach (35%) */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center border border-emerald-100 shrink-0">
                <Sparkles size={16} />
              </div>
              <h2 className="text-lg font-bold text-[#111827]">AI Career Coach</h2>
            </div>
            
            <p className="text-sm font-semibold text-[#111827]">Hello!</p>
            <p className="text-xs text-[#6B7280] mt-1 mb-5">How can I help optimize your career applications today?</p>

            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => handleCoachAction('improve')}
                className="w-full text-left p-3.5 border border-[#E5E7EB] rounded-xl hover:border-[#10B981] hover:bg-emerald-50/5 cursor-pointer transition-all flex items-center justify-between text-xs font-bold text-[#111827]"
              >
                <span>Improve Resume Quality</span>
                <ArrowUpRight size={14} className="text-[#6B7280]" />
              </button>
              <button 
                onClick={() => handleCoachAction('ats')}
                className="w-full text-left p-3.5 border border-[#E5E7EB] rounded-xl hover:border-[#10B981] hover:bg-emerald-50/5 cursor-pointer transition-all flex items-center justify-between text-xs font-bold text-[#111827]"
              >
                <span>ATS Optimization Check</span>
                <ArrowUpRight size={14} className="text-[#6B7280]" />
              </button>
              <button 
                onClick={() => handleCoachAction('jobs')}
                className="w-full text-left p-3.5 border border-[#E5E7EB] rounded-xl hover:border-[#10B981] hover:bg-emerald-50/5 cursor-pointer transition-all flex items-center justify-between text-xs font-bold text-[#111827]"
              >
                <span>Find Matched Job Listings</span>
                <ArrowUpRight size={14} className="text-[#6B7280]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Recommended Jobs */}
      <section className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
          <h2 className="text-lg font-bold text-[#111827]">Recommended Local Placements</h2>
          <button 
            onClick={() => navigate('/jobs')}
            className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
          >
            Explore All Listings <ArrowRight size={12} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {latestJobs.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[#E5E7EB] rounded-2xl bg-[#F8FAFC] text-slate-400 text-xs font-semibold">
              No job recommendations matched. Update your skills or resume to unlock personalized listings.
            </div>
          ) : (
            latestJobs.slice(0, 3).map((job) => (
              <div 
                key={job.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-[#E5E7EB] rounded-2xl hover:border-[#10B981] transition-all duration-300 gap-4"
              >
                <div className="flex items-center gap-4 text-left">
                  {job.logo ? (
                    <img 
                      src={job.logo} 
                      alt={job.company} 
                      className="w-12 h-12 rounded-xl object-cover border border-[#E5E7EB] shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#10B981] shrink-0">
                      <Building size={20} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm text-[#111827]">{job.title}</h3>
                    <p className="text-xs font-semibold text-[#6B7280] mt-0.5">{job.company} • {job.location}</p>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-4 w-full md:w-auto justify-between md:justify-end border-t border-slate-50 md:border-t-0 pt-3 md:pt-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#6B7280] bg-slate-50 border border-[#E5E7EB] px-2.5 py-1 rounded-lg">
                      {job.salary || 'Competitive'}
                    </span>
                    <span className="text-xs font-bold text-[#10B981] bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                      {job.ai_match_score || 80}% Match
                    </span>
                  </div>
                  <Button 
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer shadow-sm shadow-emerald-500/10"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* SECTION 5: BOTTOM TIMELINE & ACTIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Recent Activity */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="text-base font-bold text-[#111827] mb-4 border-b border-slate-100 pb-2">
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
                  <div className="w-2 h-2 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
                  <div>
                    <p className="font-bold text-[#111827] leading-tight">{act.activity}</p>
                    <p className="text-[10px] text-[#6B7280] mt-0.5">{formatTimeAgo(act.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Quick Action Buttons */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="text-base font-bold text-[#111827] mb-4 border-b border-slate-100 pb-2">
            Workspace Hub
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => document.getElementById('dashboard-resume-upload-input')?.click()}
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#10B981] hover:bg-emerald-50/5 cursor-pointer transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center border border-emerald-100">
                <UploadCloud size={20} />
              </div>
              <span className="text-xs font-bold text-[#111827]">Upload Resume</span>
            </button>

            <button 
              onClick={() => navigate('/resume-builder')}
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#10B981] hover:bg-emerald-50/5 cursor-pointer transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center border border-emerald-100">
                <Sparkles size={20} />
              </div>
              <span className="text-xs font-bold text-[#111827]">Create Resume</span>
            </button>

            <button 
              onClick={() => navigate('/jobs')}
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#10B981] hover:bg-emerald-50/5 cursor-pointer transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center border border-emerald-100">
                <Compass size={20} />
              </div>
              <span className="text-xs font-bold text-[#111827]">Explore Jobs</span>
            </button>

            <button 
              onClick={() => navigate('/profile')}
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#10B981] hover:bg-emerald-50/5 cursor-pointer transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center border border-emerald-100">
                <User size={20} />
              </div>
              <span className="text-xs font-bold text-[#111827]">Edit Profile</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
