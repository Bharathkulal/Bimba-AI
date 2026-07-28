import React, { useEffect } from 'react';
import { useJobStore } from '../../store/jobStore';
import { Bookmark, Calendar, CheckSquare, Trash2, ArrowUpRight, Compass } from 'lucide-react';

export const SavedJobs: React.FC = () => {
  const { savedJobs, fetchSavedJobs, removeSavedJob, applications, fetchApplications, updateApplicationStatus, applyForJob } = useJobStore();

  useEffect(() => {
    fetchSavedJobs();
    fetchApplications();
  }, [fetchSavedJobs, fetchApplications]);

  const handleStatusChange = async (jobId: string, company: string, title: string, status: string) => {
    // Check if application already exists
    const app = applications.find(a => a.job_id === jobId);
    if (app) {
      await updateApplicationStatus(app.id, status);
    } else {
      // Create new application
      await applyForJob({
        id: jobId,
        company,
        title,
        location: 'India',
        description: '',
        url: 'https://linkedin.com',
        source: 'saved_list'
      }, status as any);
    }
  };

  const getJobApplicationStatus = (jobId: string) => {
    const app = applications.find(a => a.job_id === jobId);
    return app ? app.status : 'saved';
  };

  return (
    <div className="w-full flex flex-col gap-5 text-left max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-white/10 pb-2.5">
        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Bookmark size={16} className="text-emerald-500" /> Saved & Applications Tracker
        </h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">Track interview progress, offers, and follow-ups</p>
      </div>

      {savedJobs.length === 0 ? (
        <div className="text-center py-12 text-slate-400 font-bold text-xs bg-slate-50/50 dark:bg-white/5 border border-dashed rounded-3xl">
          No saved jobs yet. Explore recommended roles to build your tracking pipeline.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedJobs.map((job) => {
            const currentStatus = getJobApplicationStatus(job.job_id);
            
            return (
              <div 
                key={job.id}
                className="bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-4.5 rounded-3xl flex flex-col gap-3 shadow-sm relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[200px]">
                      {job.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-bold">
                      {job.company} — <span className="font-semibold text-slate-450">{job.location}</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={() => removeSavedJob(job.job_id)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Remove Job"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Tracking status dropdown */}
                <div className="flex items-center justify-between border-t border-slate-150 dark:border-white/5 pt-2.5 mt-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-450 uppercase">
                    <CheckSquare size={12} className="text-emerald-500" /> Pipeline Status:
                  </div>
                  
                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(job.job_id, job.company, job.title, e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1 text-[10px] font-bold focus:outline-none focus:border-emerald-500 text-slate-700 dark:text-white"
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="rejected">Rejected</option>
                    <option value="offer">Offer Received</option>
                  </select>
                </div>

                {/* Status indicator badges */}
                <div className="flex justify-end">
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    currentStatus === 'offer' ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-500' :
                    currentStatus === 'interview' ? 'bg-blue-500/10 border-blue-500/10 text-blue-500' :
                    currentStatus === 'applied' ? 'bg-amber-500/10 border-amber-500/10 text-amber-500' :
                    currentStatus === 'rejected' ? 'bg-rose-500/10 border-rose-500/10 text-rose-500' :
                    'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500'
                  }`}>
                    {currentStatus === 'offer' ? 'Offer' : currentStatus}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default SavedJobs;
