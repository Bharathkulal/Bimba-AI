import React, { useEffect } from 'react';
import { useJobStore } from '../../store/jobStore';
import { JobCard } from './JobCard';
import { Sparkles, AlertTriangle, RefreshCw, Compass } from 'lucide-react';
import { Button } from '../Button';

interface JobRecommendationDashboardProps {
  resumeId: number;
}

export const JobRecommendationDashboard: React.FC<JobRecommendationDashboardProps> = ({
  resumeId
}) => {
  const { recommendations, loading, errors, fetchRecommendations, generateRecommendations } = useJobStore();

  useEffect(() => {
    if (resumeId) {
      fetchRecommendations(resumeId);
    }
  }, [resumeId, fetchRecommendations]);

  const handleScan = () => {
    if (resumeId) {
      generateRecommendations(resumeId);
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 text-left max-w-5xl mx-auto">
      
      {/* Header section with scanning controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Compass size={16} className="text-emerald-500" /> AI Matched Recommendations
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">Scored matching suitability aligned against your active profile</p>
        </div>

        <Button
          onClick={handleScan}
          isLoading={loading}
          size="sm"
          className="font-bold gap-1 px-4 text-xs"
          icon={<Sparkles size={13} className="fill-current" />}
        >
          Scan & Recommend Jobs
        </Button>
      </div>

      {/* Errors */}
      {errors && (
        <div className="bg-rose-500/10 border border-rose-500/10 text-rose-500 p-4.5 rounded-2xl text-xs font-bold flex items-center gap-2 max-w-md mx-auto">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{errors}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-44 bg-slate-200 dark:bg-white/5 rounded-3xl w-full" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12 text-slate-450 font-bold text-xs bg-slate-50/50 dark:bg-white/5 border border-dashed rounded-3xl flex flex-col items-center gap-3">
          <span>No recommendations cached. Click the button to scan your resume details.</span>
          <Button
            onClick={handleScan}
            size="sm"
            variant="outline"
            className="font-bold text-[10px]"
            icon={<Sparkles size={11} />}
          >
            Run Matching Scan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recommendations.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

    </div>
  );
};
export default JobRecommendationDashboard;
