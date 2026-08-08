import React, { useEffect, useState } from 'react';
import { useResumeBuilderContext } from '../ResumeBuilderContext';
import { Card } from '../../Card';
import { Button } from '../../Button';
import { Compass, Filter, MapPin, Briefcase, ExternalLink, ShieldCheck } from 'lucide-react';
import { useJobStore } from '../../../store/jobStore';

export const JobMatchesStep: React.FC = () => {
  const { resumeId } = useResumeBuilderContext();
  const { recommendations, loading, fetchRecommendations } = useJobStore();
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [filterLocation, setFilterLocation] = useState('India');

  useEffect(() => {
    if (resumeId) {
      fetchRecommendations(resumeId);
    }
  }, [resumeId, fetchRecommendations]);

  const filteredJobs = recommendations.filter(job => {
    if (remoteOnly && !job.location.toLowerCase().includes('remote')) {
      return false;
    }
    if (filterLocation && !job.location.toLowerCase().includes(filterLocation.toLowerCase()) && !job.location.toLowerCase().includes('remote')) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-4 gap-6 py-4 text-left items-start">
      
      {/* Left panel: Filter sidebar */}
      <Card className="p-5 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm flex flex-col gap-4">
        <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b pb-3 border-slate-100 dark:border-white/5">
          <Filter size={14} className="text-emerald-500" /> Filters
        </h4>
        
        {/* Location input */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-450 uppercase">Location</label>
          <input
            type="text"
            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
          />
        </div>

        {/* Remote toggle */}
        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
            className="w-4 h-4 rounded border-slate-200 dark:border-white/10 text-emerald-500 accent-emerald-500"
          />
          <span>Remote Only</span>
        </label>
      </Card>

      {/* Right panel: Jobs list view */}
      <div className="md:col-span-3 flex flex-col gap-4">
        <div className="mb-2">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-805 dark:text-white flex items-center gap-1.5">
            <Compass size={15} className="text-emerald-500" /> Matching Careers Found
          </h3>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Scored matching suitability aligned against your active profile</p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-white/5 rounded-2xl w-full" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-bold text-xs bg-white dark:bg-white/5 border border-dashed rounded-3xl p-6 flex flex-col items-center gap-3">
            <Briefcase size={32} className="text-slate-350" />
            <span>No matching jobs were found matching filters. Rescan recommendations.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="p-4 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">{job.title}</h4>
                    <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" /> {job.company} • {job.location}
                    </p>
                  </div>
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                    <ShieldCheck size={10} /> {job.match_score || 80}% Match
                  </span>
                </div>

                {job.matched_skills && job.matched_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.matched_skills.slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-extrabold px-2 py-0.5 rounded-lg text-[9px]">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-end border-t border-slate-100 dark:border-white/5 pt-2 mt-1">
                  <Button
                    onClick={() => window.open(job.url || job.apply_url, '_blank')}
                    size="sm"
                    className="font-bold text-[10px] py-1.5 px-4 flex items-center gap-1 cursor-pointer"
                    icon={<ExternalLink size={11} />}
                  >
                    Apply Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
export default JobMatchesStep;
