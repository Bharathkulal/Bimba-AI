import React from 'react';
import { Sparkles } from 'lucide-react';

interface AISuggestionBannerProps {
  onOptimize: () => void;
}

export const AISuggestionBanner: React.FC<AISuggestionBannerProps> = ({
  onOptimize
}) => {
  return (
    <div className="bg-[#14532D]/5 border border-[#14532D]/10 px-4 py-2 rounded-2xl flex items-center justify-between gap-3 shadow-xs shrink-0 select-none text-left">
      <div className="flex items-center gap-2 text-xs">
        <div className="p-1 bg-[#14532D]/10 text-[#14532D] rounded-lg animate-pulse">
          <Sparkles size={14} />
        </div>
        <span className="font-extrabold text-[#14532D]">Bimba Suggestion:</span>
        <span className="font-medium text-slate-650">This template is ATS 98% compatible.</span>
      </div>
      <button 
        onClick={onOptimize}
        className="px-3.5 py-1.5 bg-[#14532D] hover:bg-[#0f3d21] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
      >
        Optimize Resume
      </button>
    </div>
  );
};

export default AISuggestionBanner;
