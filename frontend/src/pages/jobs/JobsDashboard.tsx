import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Briefcase, Sparkles, Bookmark, 
  Clock, DollarSign, SlidersHorizontal, X, Check, 
  Building, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { jobsService } from '../../services/jobs';
import type { JobListItem, JobDetailResponse, JobApplication } from '../../services/jobs';
import { useUserStore } from '../../store/userStore';

export const JobsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  // Active Tab: 'explore' | 'saved' | 'applications'
  const [activeTab, setActiveTab] = useState<'explore' | 'saved' | 'applications'>('explore');

  // Search & Filter State
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [remote, setRemote] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState('relevant');
  
  // API States
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  
  // Selected Job (for right pane)
  const [selectedJob, setSelectedJob] = useState<JobDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Application Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyNotes, setApplyNotes] = useState('');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await jobsService.searchJobs({
        keyword: keyword || undefined,
        location: location || undefined,
        page,
        experience: experience || undefined,
        remote: remote === null ? undefined : remote,
        employment_type: employmentType || undefined,
        limit: 8
      });
      
      let sortedJobs = [...res.jobs];
      if (sortBy === 'salary') {
        sortedJobs.sort((a, b) => {
          const aSal = parseInt(a.salary?.replace(/[^0-9]/g, '') || '0');
          const bSal = parseInt(b.salary?.replace(/[^0-9]/g, '') || '0');
          return bSal - aSal;
        });
      } else {
        sortedJobs.sort((a, b) => (b.ai_match_score || 0) - (a.ai_match_score || 0));
      }

      setJobs(sortedJobs);
      setTotalPages(res.pages);
      
      // Auto-select first job if available
      if (sortedJobs.length > 0) {
        loadJobDetails(sortedJobs[0].id);
      } else {
        setSelectedJob(null);
      }
    } catch (err) {
      showToast('Failed to fetch jobs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [keyword, location, page, experience, employmentType, remote, sortBy]);

  const loadJobDetails = async (jobId: string) => {
    try {
      setDetailLoading(true);
      const details = await jobsService.getJobDetails(jobId);
      setSelectedJob(details);
    } catch (err) {
      console.error("Failed to load job details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const saved = await jobsService.getSavedJobs();
      setSavedJobs(saved);
      setSavedJobIds(saved.map(j => j.job_id));
      if (activeTab === 'saved' && saved.length > 0) {
        loadJobDetails(saved[0].job_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const apps = await jobsService.getApplications();
      setApplications(apps);
      if (activeTab === 'applications' && apps.length > 0) {
        loadJobDetails(apps[0].job_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'explore') {
      fetchJobs();
    } else if (activeTab === 'saved') {
      fetchSavedJobs();
    } else if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [activeTab, fetchJobs]);

  const handleSaveToggle = async (job: any) => {
    const isSaved = savedJobIds.includes(job.job_id || job.id);
    const targetId = job.job_id || job.id;
    try {
      if (isSaved) {
        await jobsService.unsaveJob(targetId);
        setSavedJobIds(prev => prev.filter(id => id !== targetId));
        showToast('Job removed from saved list.', 'success');
        if (activeTab === 'saved') {
          fetchSavedJobs();
        }
      } else {
        await jobsService.saveJob({
          job_id: targetId,
          company: job.company,
          title: job.title,
          location: job.location,
          logo: job.logo
        });
        setSavedJobIds(prev => [...prev, targetId]);
        showToast('Job saved successfully!', 'success');
      }
    } catch (err) {
      showToast('Could not update saved status.', 'error');
    }
  };

  const handleApplySubmit = async () => {
    if (!selectedJob) return;
    try {
      await jobsService.applyJob({
        job_id: selectedJob.id,
        company: selectedJob.company,
        title: selectedJob.title,
        logo: selectedJob.logo,
        location: selectedJob.location,
        status: 'Applied',
        notes: applyNotes
      });
      setIsApplyModalOpen(false);
      setApplyNotes('');
      showToast('Application submitted successfully!', 'success');
      fetchApplications();
    } catch (err) {
      showToast('Application submission failed.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto text-left relative">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 transform ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Careers Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Browse and apply to jobs matched dynamically to your skill set.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl shrink-0 z-10">
          <button 
            onClick={() => { setActiveTab('explore'); setSelectedJob(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'explore' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Find Jobs
          </button>
          <button 
            onClick={() => { setActiveTab('saved'); setSelectedJob(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'saved' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Saved Jobs
          </button>
          <button 
            onClick={() => { setActiveTab('applications'); setSelectedJob(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'applications' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Applications
          </button>
        </div>
      </section>

      {/* SEARCH AND FILTERS */}
      {activeTab === 'explore' && (
        <Card className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Keyword Search */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search jobs, titles, or skills..." 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
              />
            </div>

            {/* Location Search */}
            <div className="md:col-span-4 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="City, region, or Remote..." 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
              />
            </div>

            {/* Filters Row */}
            <div className="md:col-span-3 flex gap-2">
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-1/2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-750 focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
              >
                <option value="">Experience</option>
                <option value="Entry-level">Entry</option>
                <option value="Mid-level">Mid</option>
                <option value="Senior">Senior</option>
              </select>

              <Button 
                onClick={fetchJobs}
                variant="primary"
                className="w-1/2 text-xs py-2.5 rounded-xl"
              >
                Search
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* DUAL PANE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Pane: Job List */}
        <div className="lg:col-span-5 flex flex-col gap-4 max-h-[650px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
              Loading jobs...
            </div>
          ) : (activeTab === 'explore' ? jobs : activeTab === 'saved' ? savedJobs : applications).length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold bg-white border border-slate-200/80 rounded-2xl">
              No jobs found.
            </div>
          ) : (
            (activeTab === 'explore' ? jobs : activeTab === 'saved' ? savedJobs : applications).map((job: any) => {
              const jobId = job.job_id || job.id;
              const isSelected = selectedJob?.id === jobId;
              return (
                <div
                  key={job.id}
                  onClick={() => loadJobDetails(jobId)}
                  className={`p-4 border rounded-2xl cursor-pointer text-left transition-all ${
                    isSelected 
                      ? 'bg-emerald-50/10 border-emerald-500 shadow-sm' 
                      : 'bg-white border-slate-200/80 hover:border-slate-350'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                      {job.logo ? (
                        <img 
                          src={job.logo} 
                          alt={job.company} 
                          className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <Building size={16} />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 leading-tight truncate max-w-[160px]">
                          {job.title}
                        </h4>
                        <p className="text-[10px] text-slate-450 font-bold mt-0.5">{job.company}</p>
                        <span className="text-[9px] text-slate-400 font-semibold block mt-1">{job.location}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {job.ai_match_score !== undefined && (
                        <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded border border-emerald-100">
                          {job.ai_match_score}% Match
                        </span>
                      )}
                      {job.status && (
                        <span className="bg-slate-100 text-slate-700 text-[8px] font-bold px-2 py-0.5 rounded">
                          {job.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Pane: Selected Job Details */}
        <div className="lg:col-span-7">
          {detailLoading ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 flex items-center justify-center h-full min-h-[400px]">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selectedJob ? (
            <Card className="p-6 h-full flex flex-col justify-between gap-5 min-h-[400px] text-left">
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    {selectedJob.logo ? (
                      <img 
                        src={selectedJob.logo} 
                        alt={selectedJob.company} 
                        className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <Building size={20} />
                      </div>
                    )}
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                        {selectedJob.title}
                      </h2>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        {selectedJob.company} • {selectedJob.location}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSaveToggle(selectedJob)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        savedJobIds.includes(selectedJob.id)
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <Bookmark size={15} />
                    </button>
                  </div>
                </div>

                {/* Job metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 border border-slate-150 p-3.5 rounded-xl mb-4 text-xs font-semibold">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Salary</span>
                    <span className="text-slate-800 mt-1 block">{selectedJob.salary || 'Competitive'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Type</span>
                    <span className="text-slate-800 mt-1 block">{selectedJob.employment_type || 'Full-time'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Location</span>
                    <span className="text-slate-800 mt-1 block">{selectedJob.remote ? 'Remote' : 'On-site'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Experience</span>
                    <span className="text-slate-800 mt-1 block">{selectedJob.experience || 'Mid-level'}</span>
                  </div>
                </div>

                {/* Description Body */}
                <div className="max-h-[300px] overflow-y-auto pr-1">
                  <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider mb-2">
                    Job Description
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                    {selectedJob.description}
                  </p>
                  
                  {/* Requirements List */}
                  {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider mb-2">
                        Requirements
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.requirements.map((req, index) => (
                          <span 
                            key={index}
                            className="bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Apply Action CTA */}
              <div className="flex justify-end pt-4 border-t border-slate-100 shrink-0">
                <Button 
                  onClick={() => setIsApplyModalOpen(true)}
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  Apply Now
                </Button>
              </div>

            </Card>
          ) : (
            <div className="text-center py-24 text-slate-400 text-xs font-semibold bg-white border border-slate-200/80 rounded-2xl h-full flex items-center justify-center min-h-[400px]">
              Select a job from the list to view comprehensive descriptions.
            </div>
          )}
        </div>

      </div>

      {/* Application submission Modal */}
      {isApplyModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
              <div className="leading-tight">
                <h3 className="font-extrabold text-slate-900 text-base">Apply for Position</h3>
                <p className="text-[10px] text-slate-450 font-semibold mt-1">{selectedJob.title} at {selectedJob.company}</p>
              </div>
              <button 
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-750 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">Add Notes for Recruiter (Optional)</label>
              <textarea
                placeholder="Introduce yourself or add portfolio links..."
                value={applyNotes}
                onChange={(e) => setApplyNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 h-28 font-medium"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button 
                onClick={() => setIsApplyModalOpen(false)}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleApplySubmit}
                variant="primary"
                size="sm"
              >
                Submit Application
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default JobsDashboard;
