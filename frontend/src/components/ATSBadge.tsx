import React from 'react';
import { Award } from 'lucide-react';

interface ATSBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ATSBadge: React.FC<ATSBadgeProps> = ({ score, size = 'md' }) => {
  const getScoreColor = (val: number) => {
    if (val >= 95) return 'from-emerald-500 to-teal-600 text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (val >= 85) return 'from-sky-500 to-blue-600 text-sky-500 bg-sky-500/10 border-sky-500/20';
    if (val >= 70) return 'from-amber-500 to-orange-600 text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'from-rose-500 to-red-600 text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  const dimensions = {
    sm: { container: 'px-2 py-0.5 text-[10px]', iconSize: 12 },
    md: { container: 'px-3 py-1 text-xs', iconSize: 14 },
    lg: { container: 'px-4 py-2 text-sm', iconSize: 18 },
  };

  const currentStyles = getScoreColor(score);
  const sizeStyles = dimensions[size];

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-xl border font-extrabold tracking-tight backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 ${currentStyles} ${sizeStyles.container}`}>
      <Award size={sizeStyles.iconSize} className="shrink-0 animate-bounce" />
      <span>ATS {score}%</span>
    </div>
  );
};
