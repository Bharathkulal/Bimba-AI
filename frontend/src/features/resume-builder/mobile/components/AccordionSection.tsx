import React, { useState } from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react';

interface AccordionSectionProps {
  title: string;
  isLowConfidence?: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  isLowConfidence = false,
  defaultExpanded = false,
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isLowConfidence);

  return (
    <div 
      className={`rounded-2xl border bg-white dark:bg-[#1f2937] transition-all overflow-hidden mb-3 ${
        isLowConfidence 
          ? 'border-amber-400 dark:border-amber-500/50 shadow-sm ring-1 ring-amber-400/20' 
          : 'border-slate-200 dark:border-white/10'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer active:bg-slate-50 dark:active:bg-white/5"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
            {title}
          </span>
          {isLowConfidence && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20 shrink-0">
              <AlertTriangle size={10} />
              Review
            </span>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#1f2937] animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
};
