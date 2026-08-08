import React, { useEffect, useState } from 'react';
import { useResumeBuilderContext } from '../ResumeBuilderContext';
import { Sparkles, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '../../Button';

export const GenerationCompleteStep: React.FC = () => {
  const { setStep } = useResumeBuilderContext();
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let active = true;
    const interval = setInterval(() => {
      if (active) {
        setPercent(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              if (active) setStep(8); // Auto-advance to step 8
            }, 600);
            return 100;
          }
          return prev + 10;
        });
      }
    }, 150);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [setStep]);

  return (
    <div className="max-w-md w-full flex flex-col gap-6 py-12 text-center items-center justify-center">
      {percent < 100 ? (
        <>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-md animate-pulse">
            <RefreshIcon className="animate-spin" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black tracking-tight">Compiling PDF Layout</h3>
            <p className="text-xs text-slate-500">Assembling sections, formatting pages, and aligning margin variables...</p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden max-w-xs">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300" style={{ width: `${percent}%` }} />
          </div>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-md">
            <CheckCircle2 size={26} className="text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black tracking-tight">Resume Compilation Complete</h3>
            <p className="text-xs text-slate-500">Successfully formatted 100% compliant ATS structure.</p>
          </div>
          <Button onClick={() => setStep(8)} className="font-bold text-xs gap-1 py-2 px-5 mt-2">
            Proceed <ChevronRight size={13} />
          </Button>
        </>
      )}
    </div>
  );
};

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-7 h-7 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export default GenerationCompleteStep;
