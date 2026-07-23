import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bookmark, Briefcase, MapPin, Sparkles, ChevronRight, Trash2, 
  Eye, Check, X, Building
} from 'lucide-react';
import { jobsService } from '../../services/jobs';
import type { SavedJob } from '../../services/jobs';

export const SavedJobs: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsService.getSavedJobs();
      setSavedJobs(data);
    } catch (err) {
      showToast('Error loading saved jobs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUnsave = async (jobId: string) => {
    try {
      await jobsService.unsaveJob(jobId);
      setSavedJobs(prev => prev.filter(j => j.job_id !== jobId));
      showToast('Job removed from saved list.', 'success');
    } catch (err) {
      showToast('Failed to unsave job.', 'error');
    }
  };

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

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-[22px] p-6 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Saved Job Openings <Bookmark className="text-blue-500 fill-blue-500" size={24} />
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-semibold mt-1">Review, manage, and apply to opportunities you've bookmarked.</p>
        </div>

        {/* Modular Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl self-stretch md:self-auto justify-around">
          <Link to="/jobs" className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all duration-200">
            Find Jobs
          </Link>
          <Link to="/jobs/saved" className="px-4 py-2 rounded-lg text-xs font-black bg-white text-blue-600 shadow-sm transition-all duration-200">
            Saved Jobs
          </Link>
          <Link to="/jobs/applications" className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all duration-200">
            Applications
          </Link>
        </div>
      </div>

      {/* SAVED JOBS CONTENT */}
      <div className="flex flex-col gap-4">
        {loading ? (
          /* Loading states */
          [1, 2].map((i) => (
            <div key={i} className="bg-white border border-slate-200/50 rounded-[20px] p-5 h-24 animate-pulse" />
          ))
        ) : savedJobs.length === 0 ? (
          /* Empty state */
          <div className="bg-white border border-slate-200/60 rounded-[22px] p-12 text-center shadow-sm flex flex-col items-center gap-4 max-w-xl mx-auto mt-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-inner">
              <Bookmark size={28} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">No Saved Jobs Yet</h3>
              <p className="text-xs text-slate-450 mt-1 max-w-xs mx-auto leading-relaxed">
                When searching for jobs on the Dashboard, click the bookmark icon on any job card to save it for later review.
              </p>
            </div>
            <Link 
              to="/jobs"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-xl shadow-sm transition-all duration-200 cursor-pointer text-center"
            >
              Browse Open Jobs
            </Link>
          </div>
        ) : (
          /* List of Saved Jobs */
          <div className="grid grid-cols-1 gap-4">
            {savedJobs.map((job) => (
              <div 
                key={job.id} 
                className="group relative bg-white border border-slate-200/60 rounded-[20px] p-5 shadow-sm hover:scale-[1.01] hover:border-slate-350 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="flex gap-4 items-center">
                  {job.logo ? (
                    <img 
                      src={job.logo} 
                      alt={job.company} 
                      className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm shrink-0" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                      <Building size={20} />
                    </div>
                  )}
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm text-slate-800 group-hover:text-blue-650 transition-all duration-200">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{job.company}</p>
                    <span className="flex items-center gap-0.5 text-[9.5px] font-bold text-slate-400 mt-1.5">
                      <MapPin size={10} /> {job.location}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto border-t sm:border-t-0 pt-3.5 sm:pt-0 border-slate-100 justify-end">
                  <button 
                    onClick={() => handleUnsave(job.job_id)}
                    className="p-2.5 bg-red-50 hover:bg-red-100 border border-red-150 text-red-650 rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
                    title="Remove Bookmark"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button 
                    onClick={() => navigate(`/jobs/${job.job_id}`)}
                    className="px-4.5 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1 hover:scale-102"
                  >
                    <Eye size={13} /> View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
