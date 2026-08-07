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
    <div className="h-[60px] border-t border-[#E5E5E2] flex justify-between items-center px-4 bg-white rounded-b-2xl mt-4 shrink-0 select-none">
      <button 
        onClick={onBack}
        className="text-[#6B6B68] hover:text-[#1A1A1A] text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all bg-transparent border-0"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <span className="text-[10px] font-semibold text-[#6B6B68]">All changes saved</span>

      <div className="flex items-center gap-4">
        <button 
          onClick={onSkip}
          className="text-[#6B6B68] hover:text-[#1A1A1A] text-xs font-bold transition-colors cursor-pointer bg-transparent border-0"
        >
          Skip Step
        </button>

        <button 
          onClick={onContinue} 
          className="bg-[#0F4A3C] hover:bg-[#0c3a2f] text-white text-xs font-bold py-2.5 px-6 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all border-0"
        >
          Continue <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
