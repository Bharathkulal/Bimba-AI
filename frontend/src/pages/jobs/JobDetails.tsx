import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Building, MapPin, Briefcase, Sparkles, Bookmark, 
  Share2, ExternalLink, Calendar, DollarSign, Award, Heart, 
  AlertCircle, Check, X, FileText, Send
} from 'lucide-react';
import { jobsService } from '../../services/jobs';
import type { JobDetailResponse, JobApplication } from '../../services/jobs';

export const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [job, setJob] = useState<JobDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch all job and application details
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Fetch Job Details
        const jobDetails = await jobsService.getJobDetails(id);
        setJob(jobDetails);

        // Check if saved
        const saved = await jobsService.getSavedJobs();
        setIsSaved(saved.some(j => j.job_id === id));

        // Check if applied / has tracking
        const apps = await jobsService.getApplications();
        const existingApp = apps.find(a => a.job_id === id);
        if (existingApp) {
          setApplication(existingApp);
          setNotes(existingApp.notes || '');
        }
      } catch (err) {
        showToast('Error loading job details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveToggle = async () => {
    if (!job) return;
    try {
      if (isSaved) {
        await jobsService.unsaveJob(job.id);
        setIsSaved(false);
        showToast('Job removed from saved list.', 'success');
      } else {
        await jobsService.saveJob({
          job_id: job.id,
          company: job.company,
          title: job.title,
          location: job.location,
          logo: job.logo
        });
        setIsSaved(true);
        showToast('Job saved successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to save job.', 'error');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Job link copied to clipboard!', 'success');
  };

  const handleApply = async () => {
    if (!job) return;
    // Open external apply link
    window.open(job.apply_url || 'https://linkedin.com', '_blank');

    // Create a database application tracking history
    if (!application) {
      try {
        const app = await jobsService.applyJob({
          job_id: job.id,
          company: job.company,
          title: job.title,
          logo: job.logo,
          location: job.location,
          status: 'Applied',
          notes: 'Applied online via external application link.'
        });
        setApplication(app);
        setNotes(app.notes || '');
        showToast('Application tracking started!', 'success');
      } catch (err) {
        console.error("Could not register application tracker:", err);
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!application || !job) return;
    try {
      setUpdatingStatus(true);
      const updated = await jobsService.updateApplication(application.id, newStatus, notes);
      setApplication(updated);
      showToast(`Status updated to ${newStatus}!`, 'success');
    } catch (err) {
      showToast('Failed to update status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!application) return;
    try {
      const updated = await jobsService.updateApplication(application.id, application.status, notes);
      setApplication(updated);
      setIsEditingNotes(false);
      showToast('Notes saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save notes.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 animate-pulse">
        <div className="h-48 w-full bg-slate-100 rounded-[22px]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-100 rounded-[22px]" />
          <div className="h-96 bg-slate-100 rounded-[22px]" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white border border-slate-200 rounded-[22px] p-12 text-center max-w-xl mx-auto flex flex-col items-center gap-4 mt-12">
        <AlertCircle size={40} className="text-red-500" />
        <h2 className="text-lg font-black text-slate-800">Job Not Found</h2>
        <p className="text-xs text-slate-405">We couldn't retrieve the details for this job posting. It may have expired or been removed.</p>
        <Link to="/jobs" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow transition-all duration-200">
          Return to Job Search
        </Link>
      </div>
    );
  }

  const score = job.ai_match_score || 70;
  let scoreColor = 'from-blue-650 to-sky-500';
  let scoreBg = 'bg-blue-50 text-blue-700 border-blue-200';
  if (score >= 90) {
    scoreColor = 'from-emerald-500 to-teal-500';
    scoreBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (score >= 80) {
    scoreColor = 'from-teal-500 to-cyan-550';
    scoreBg = 'bg-teal-50 text-teal-850 border-teal-200';
  }

  const trackerStages = ['Applied', 'Interview', 'Rejected', 'Offer', 'Accepted'];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-1 md:px-4">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 transform scale-100 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* BACK NAVIGATION */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1.5 text-xs font-black text-slate-550 hover:text-slate-800 bg-white border border-slate-200/60 rounded-xl px-4 py-2.5 shadow-sm transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Listings
        </button>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSaveToggle}
            className={`p-2.5 border rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:scale-102 ${
              isSaved 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-white border-slate-200 text-slate-450 hover:bg-slate-50 hover:text-slate-700'
            }`}
            title="Save Job"
          >
            <Bookmark size={15} className={isSaved ? "fill-current" : ""} />
          </button>
          <button 
            onClick={handleShare}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-450 hover:text-slate-700 rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
            title="Share Job"
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>

      {/* JOB BANNER & PROFILE CARD */}
      <div className="bg-white border border-slate-200/60 rounded-[22px] overflow-hidden shadow-sm">
        {/* Banner Image */}
        <div className="h-44 w-full relative">
          <img 
            src={job.banner || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1000&auto=format&fit=crop&q=80'} 
            alt="Company Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>

        {/* Profile Card details */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex gap-4 md:gap-5 -mt-10 items-end">
            {job.logo ? (
              <img 
                src={job.logo} 
                alt={job.company} 
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white bg-white shadow-md relative z-10 shrink-0" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60';
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-blue-50 border-4 border-white flex items-center justify-center text-blue-600 shadow-md relative z-10 shrink-0">
                <Building size={32} />
              </div>
            )}
            <div className="text-left pb-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{job.title}</h2>
              <p className="text-xs text-slate-500 font-extrabold mt-0.5 flex items-center gap-1.5">
                <span>{job.company}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-0.5 text-slate-400 font-semibold"><MapPin size={11} /> {job.location}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto pt-3 border-t md:border-t-0 border-slate-100">
            {application ? (
              <span className="px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-250 font-black text-xs rounded-xl flex items-center gap-1.5">
                <Check size={14} /> Applied & Tracked
              </span>
            ) : (
              <button 
                onClick={handleApply}
                className="flex-grow md:flex-grow-0 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/10 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-102"
              >
                Apply Externally <ExternalLink size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Details Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Metadata Grid */}
          <div className="bg-white border border-slate-200/60 rounded-[22px] p-5 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Salary Range</span>
              <span className="text-xs font-black text-slate-800 mt-2 flex items-center gap-0.5"><DollarSign size={13} className="text-slate-400" /> {job.salary || 'Not specified'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Job Type</span>
              <span className="text-xs font-black text-slate-800 mt-2 flex items-center gap-0.5"><Briefcase size={13} className="text-slate-400" /> {job.employment_type || 'Full-time'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Experience</span>
              <span className="text-xs font-black text-slate-800 mt-2 flex items-center gap-0.5"><Award size={13} className="text-slate-400" /> {job.experience || 'Entry level'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Workplace</span>
              <span className="text-xs font-black text-blue-600 mt-2 uppercase tracking-wider text-[10px]">{job.remote ? 'Remote' : 'On-site'}</span>
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white border border-slate-200/60 rounded-[22px] p-6 shadow-sm text-left">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Job Description</h3>
            <p className="text-xs text-slate-600 mt-4 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {/* Requirements, Responsibilities, Benefits */}
          {(job.requirements?.length || job.responsibilities?.length || job.benefits?.length) ? (
            <div className="bg-white border border-slate-200/60 rounded-[22px] p-6 shadow-sm text-left flex flex-col gap-6">
              {job.requirements && job.requirements.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Key Requirements</h3>
                  <ul className="list-disc list-inside text-xs text-slate-650 mt-3.5 space-y-2 pl-1 leading-relaxed">
                    {job.requirements.map((req, idx) => (
                      <li key={idx}><span className="font-semibold">{req}</span></li>
                    ))}
                  </ul>
                </div>
              )}

              {job.responsibilities && job.responsibilities.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Primary Responsibilities</h3>
                  <ul className="list-disc list-inside text-xs text-slate-650 mt-3.5 space-y-2 pl-1 leading-relaxed">
                    {job.responsibilities.map((resp, idx) => (
                      <li key={idx}><span className="font-semibold">{resp}</span></li>
                    ))}
                  </ul>
                </div>
              )}

              {job.benefits && job.benefits.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Compensation & Perks</h3>
                  <ul className="list-disc list-inside text-xs text-slate-650 mt-3.5 space-y-2 pl-1 leading-relaxed">
                    {job.benefits.map((ben, idx) => (
                      <li key={idx}><span className="font-semibold">{ben}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Sidebar Status Tracker & Match Score Panel */}
        <div className="flex flex-col gap-6">
          {/* AI Match Score Circular Panel */}
          <div className="bg-white border border-slate-200/60 rounded-[22px] p-6 shadow-sm text-center flex flex-col items-center">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider self-start">AI Match Intelligence</h4>
            
            <div className="relative w-28 h-28 mt-6 flex items-center justify-center">
              {/* Outer Glow Ring */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${scoreColor} opacity-10 blur-xl`} />
              
              {/* Progress SVG */}
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="56" 
                  cy="56" 
                  r="48" 
                  stroke="#E2E8F0" 
                  strokeWidth="8" 
                  fill="transparent" 
                />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="48" 
                  className={`stroke-blue-650`}
                  strokeWidth="8" 
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - score / 100)}
                  strokeLinecap="round"
                  fill="transparent" 
                />
              </svg>
              
              {/* Inner score label */}
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-800 leading-none">{score}%</span>
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-1">Match Score</span>
              </div>
            </div>

            <div className="w-full border-t border-slate-100 pt-5 mt-6 text-left">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matched Skills</h5>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {job.skills_matched && job.skills_matched.length > 0 ? (
                  job.skills_matched.map((s, i) => (
                    <span key={i} className="text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 px-2.5 py-0.5 rounded-lg">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">No skills matched yet</span>
                )}
              </div>

              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Missing Skills</h5>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {job.skills_missing && job.skills_missing.length > 0 ? (
                  job.skills_missing.map((s, i) => (
                    <span key={i} className="text-[9.5px] font-bold bg-slate-50 text-slate-500 border border-slate-205 px-2.5 py-0.5 rounded-lg">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">None (Perfect match!)</span>
                )}
              </div>
            </div>
          </div>

          {/* APPLICATION STATUS TRACKER */}
          {application && (
            <div className="bg-white border border-slate-200/60 rounded-[22px] p-6 shadow-sm text-left">
              <div>
                <span className="text-[8px] font-black text-blue-600 tracking-wider uppercase">Pipeline Tracker</span>
                <h4 className="text-xs font-black text-slate-800 mt-0.5">Application Status</h4>
              </div>

              {/* Steps timeline */}
              <div className="flex flex-col gap-4 mt-5 relative pl-4 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
                {trackerStages.map((stage) => {
                  const isCurrent = application.status === stage;
                  const currentIndex = trackerStages.indexOf(application.status);
                  const thisIndex = trackerStages.indexOf(stage);
                  const isCompleted = thisIndex <= currentIndex && application.status !== 'Rejected';
                  const isRejected = application.status === 'Rejected' && stage === 'Rejected';

                  let dotColor = 'bg-slate-200 border-slate-200';
                  if (isCurrent) {
                    dotColor = isRejected ? 'bg-rose-500 border-rose-250 shadow shadow-rose-500/30' : 'bg-blue-600 border-blue-200 shadow shadow-blue-600/30';
                  } else if (isCompleted) {
                    dotColor = 'bg-emerald-500 border-emerald-250';
                  }

                  return (
                    <button
                      key={stage}
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange(stage)}
                      className={`group flex items-center gap-3 w-full text-left bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed`}
                    >
                      <div className={`w-3 h-3 rounded-full border-2 -ml-[15.5px] relative z-10 transition-all duration-300 ${dotColor}`} />
                      <span className={`text-[11px] font-bold tracking-wide transition-smooth ${
                        isCurrent 
                          ? isRejected 
                            ? 'text-rose-600 font-extrabold scale-102' 
                            : 'text-blue-600 font-extrabold scale-102' 
                          : 'text-slate-450 hover:text-slate-700'
                      }`}>
                        {stage}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Notes Logging Section */}
              <div className="border-t border-slate-100 pt-5 mt-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Application Notes</h5>
                  {!isEditingNotes ? (
                    <button 
                      onClick={() => setIsEditingNotes(true)}
                      className="text-[9px] font-black text-blue-650 hover:underline cursor-pointer"
                    >
                      Edit Notes
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setNotes(application.notes || ''); setIsEditingNotes(false); }}
                        className="text-[9px] font-black text-slate-400 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveNotes}
                        className="text-[9px] font-black text-emerald-600 hover:underline cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {isEditingNotes ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter interview dates, contact information, callbacks..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 h-24 resize-none"
                  />
                ) : (
                  <p className="text-[11px] text-slate-500 font-medium bg-slate-50 rounded-xl p-3 border border-slate-100 leading-relaxed whitespace-pre-wrap">
                    {application.notes || 'No custom notes logged yet. Click Edit to record milestones.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
