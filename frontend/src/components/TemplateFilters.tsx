import React from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';

interface TemplateFiltersProps {
  atsFriendly: boolean;
  onAtsFriendlyChange: (val: boolean) => void;
  premium: boolean | null;
  onPremiumChange: (val: boolean | null) => void;
  layoutType: string | null;
  onLayoutTypeChange: (val: string | null) => void;
}

export const TemplateFilters: React.FC<TemplateFiltersProps> = ({
  atsFriendly,
  onAtsFriendlyChange,
  premium,
  onPremiumChange,
  layoutType,
  onLayoutTypeChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-extrabold uppercase tracking-wide">
        <SlidersHorizontal size={12} />
        <span>Filters</span>
      </div>

      {/* ATS Friendly Switch */}
      <button
        onClick={() => onAtsFriendlyChange(!atsFriendly)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
          atsFriendly
            ? 'bg-slate-900 border-slate-900 text-white'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        }`}
      >
        {atsFriendly && <Check size={12} />}
        <span>ATS Friendly (95+)</span>
      </button>

      {/* Premium vs Free */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-50 border border-slate-100 p-0.5">
        <button
          onClick={() => onPremiumChange(null)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            premium === null
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All
        </button>
        <button
          onClick={() => onPremiumChange(false)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            premium === false
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Free
        </button>
        <button
          onClick={() => onPremiumChange(true)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            premium === true
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Premium
        </button>
      </div>

      {/* Columns configuration filter */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-50 border border-slate-100 p-0.5">
        <button
          onClick={() => onLayoutTypeChange(null)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            layoutType === null
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All Layouts
        </button>
        <button
          onClick={() => onLayoutTypeChange('1')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            layoutType === '1'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Single Column
        </button>
        <button
          onClick={() => onLayoutTypeChange('2')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            layoutType === '2'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Two Columns
        </button>
      </div>
    </div>
  );
};
