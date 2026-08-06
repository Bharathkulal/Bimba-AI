import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface BottomNavigationProps {
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onBack,
  onSkip,
  onContinue
}) => {
  return (
    <div className="h-[60px] border-t border-slate-200/80 flex justify-between items-center px-4 bg-white rounded-xl shadow-xs mt-4 shrink-0">
      <button 
        onClick={onBack}
        className="px-4 py-2 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-655 cursor-pointer flex items-center gap-1.5 transition-all"
      >
        <ArrowLeft size={14} /> Back to Snapshot
      </button>

      <span className="text-[10px] font-bold text-slate-400">All Changes Saved</span>

      <div className="flex items-center gap-4">
        <button 
          onClick={onSkip}
          className="text-slate-455 hover:text-slate-600 text-xs font-bold transition-colors cursor-pointer"
        >
          Skip Step
        </button>

        <button 
          onClick={onContinue} 
          className="bg-[#14532D] hover:bg-[#0f3d21] text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all border-0"
        >
          Continue to Interview <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
