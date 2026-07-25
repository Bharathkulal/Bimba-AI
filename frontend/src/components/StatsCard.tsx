import React from 'react';
import { Card } from './Card';

interface StatsCardProps {
  label: string;
  value: string | number;
  percentage?: number;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  color?: string;
  description?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  percentage,
  icon: Icon,
  color = 'text-emerald-600',
  description,
}) => {
  return (
    <Card className="hover:border-emerald-300">
      <div className="flex justify-between items-start">
        <div className="text-left">
          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
            {label}
          </span>
          <span className={`text-3xl font-extrabold ${color} mt-2.5 block leading-none`}>
            {value}
          </span>
          {description && (
            <span className="text-[11px] text-slate-450 mt-1.5 block font-medium">
              {description}
            </span>
          )}
        </div>
        
        {/* Metric Icon or Circular Progress */}
        <div className="shrink-0">
          {percentage !== undefined ? (
            <svg className="w-8 h-8" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-500"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          ) : Icon ? (
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
              <Icon size={18} />
            </div>
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
