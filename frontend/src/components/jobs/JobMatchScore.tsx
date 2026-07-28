import React from 'react';

interface JobMatchScoreProps {
  score: number;
}

export const JobMatchScore: React.FC<JobMatchScoreProps> = ({ score }) => {
  const getBadgeColor = () => {
    if (score >= 85) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20';
    if (score >= 70) return 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20';
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20';
  };

  const getLabel = () => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Good Match';
    return 'Low Match';
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${getBadgeColor()}`}>
        {score}% Match
      </span>
      <span className="text-[10px] text-slate-450 dark:text-slate-400 font-extrabold">{getLabel()}</span>
    </div>
  );
};
export default JobMatchScore;
