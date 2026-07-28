import React from 'react';
import { motion } from 'framer-motion';
import { useJobStore } from '../../store/jobStore';
import type { Job } from '../../store/jobStore';
import { JobMatchScore } from './JobMatchScore';
import { Bookmark, BookmarkCheck, ExternalLink, Briefcase, MapPin, Check, AlertCircle } from 'lucide-react';
import { Button } from '../Button';

interface JobCardProps {
  job: Job;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { savedJobs, saveJob, removeSavedJob, applyForJob, applications } = useJobStore();

  const isSaved = savedJobs.some(s => s.job_id === job.id);
  const isApplied = applications.some(a => a.job_id === job.id);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      await removeSavedJob(job.id);
    } else {
      await saveJob(job);
    }
  };

  const handleApply = async () => {
    if (!isApplied) {
      await applyForJob(job, 'applied', 'Applied from Bimba AI recommendations');
    }
    window.open(job.url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-5 rounded-3xl shadow-md hover:shadow-lg transition-all duration-200 text-left relative overflow-hidden flex flex-col gap-4"
    >
      {/* Upper header */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/20 text-emerald-600 dark:text-emerald-450 border border-emerald-500/10 flex items-center justify-center shrink-0">
            <Briefcase size={16} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight">
              {job.title}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-bold">
              {job.company}
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveToggle}
          className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
        >
          {isSaved ? <BookmarkCheck className="text-emerald-500" size={15} /> : <Bookmark size={15} />}
        </button>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-450 dark:text-slate-400 font-extrabold -mt-1">
        <MapPin size={12} className="text-emerald-500" />
        <span>{job.location || 'India'}</span>
      </div>

      {/* Match Rating */}
      {job.match_score !== undefined && (
        <div className="border-t border-b border-slate-100 dark:border-white/5 py-3">
          <JobMatchScore score={job.match_score} />
          {job.reason && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed italic">
              " {job.reason} "
            </p>
          )}
        </div>
      )}

      {/* Matched vs Missing Skills */}
      {((job.matched_skills && job.matched_skills.length > 0) || 
        (job.missing_skills && job.missing_skills.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
          {/* Matched */}
          {job.matched_skills && job.matched_skills.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Matched Skills</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {job.matched_skills.map((skill, idx) => (
                  <span key={idx} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 font-extrabold px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                    <Check size={8} /> {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing */}
          {job.missing_skills && job.missing_skills.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="font-extrabold uppercase text-rose-500 tracking-wider">Missing Skills</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {job.missing_skills.map((skill, idx) => (
                  <span key={idx} className="bg-rose-500/10 text-rose-600 dark:text-rose-450 font-extrabold px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                    <AlertCircle size={8} /> {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Apply Button */}
      <div className="flex justify-end border-t border-slate-100 dark:border-white/5 pt-3.5 mt-auto">
        <Button
          onClick={handleApply}
          size="sm"
          variant={isApplied ? 'outline' : 'primary'}
          className="font-bold gap-1 text-[11px]"
          icon={<ExternalLink size={12} />}
        >
          {isApplied ? 'Applied (Visit Link)' : 'Apply Now'}
        </Button>
      </div>

    </motion.div>
  );
};
export default JobCard;
