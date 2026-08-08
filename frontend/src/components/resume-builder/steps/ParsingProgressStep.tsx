import React, { useEffect, useState, useRef } from 'react';
import { useResumeBuilderContext } from '../ResumeBuilderContext';
import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../../Button';
import { apiClient } from '../../../services/api';

export const ParsingProgressStep: React.FC = () => {
  const { resumeId, setStep, setParsedData } = useResumeBuilderContext();
  const [completedIdx, setCompletedIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stages = [
    'Extracting document raw content text...',
    'Detecting structural layout boundaries...',
    'Parsing raw OCR nodes and alignments...',
    'Structuring normalized MongoDB tables...',
    'Validating schema fields integrity...'
  ];

  useEffect(() => {
    let active = true;
    let timer: any = null;

    const runProgress = () => {
      if (completedIdx < stages.length) {
        timer = setTimeout(() => {
          if (active) {
            setCompletedIdx(prev => prev + 1);
          }
        }, 800);
      } else {
        // Retrieve final parsed profile on completion
        const fetchFinal = async () => {
          try {
            const res = await apiClient.get(`/api/resume-studio/profile/${resumeId}`);
            if (active) {
              setParsedData(res.data);
              setStep(4); // Advance to Snapshot Editor
            }
          } catch (e) {
            if (active) {
              setErrorMsg("Failed to retrieve final structured profile. Try again.");
            }
          }
        };
        fetchFinal();
      }
    };

    runProgress();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [completedIdx, resumeId, setStep, setParsedData]);

  return (
    <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 py-6 text-left items-center">
      
      {/* Left Panel: Checklist */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-black tracking-tight">AI Resume Studio Parsing</h2>
          <p className="text-xs text-slate-500 mt-1">Running backend LLM validators on your uploaded profile.</p>
        </div>

        {errorMsg ? (
          <div className="p-5 border border-rose-500/20 bg-rose-500/5 rounded-2xl text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-md mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-sm font-extrabold text-rose-500">Heuristic Extraction Failed</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{errorMsg}</p>
            <Button onClick={() => setStep(2)} className="px-4 py-2 bg-[#0F4A3C] hover:bg-[#0B3A2E] text-white text-xs font-bold rounded-xl shadow-sm">
              Back to Ingestion
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
            {stages.map((stage, idx) => {
              const isCompleted = idx < completedIdx;
              const isActive = idx === completedIdx;
              return (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between transition-all duration-300 ${
                    isCompleted 
                      ? 'text-slate-450 font-medium' 
                      : isActive 
                        ? 'text-emerald-500 font-extrabold animate-pulse' 
                        : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  <span className="text-xs">{stage}</span>
                  {isCompleted ? (
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  ) : (
                    <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${isActive ? 'border-emerald-500 border-t-transparent animate-spin' : 'border-slate-200 dark:border-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Panel: Skeleton Loading Preview */}
      <div className="hidden md:flex flex-col border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] rounded-3xl p-6 shadow-md min-h-[300px] justify-between relative overflow-hidden">
        {/* Skeleton lines filling in */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full transition-all duration-700 ${completedIdx > 0 ? 'bg-emerald-500/25' : 'bg-slate-100 dark:bg-white/5'}`} />
            <div className="space-y-2 flex-grow">
              <div className={`h-3.5 rounded-md w-1/3 transition-all duration-700 ${completedIdx > 0 ? 'bg-emerald-500/20' : 'bg-slate-100 dark:bg-white/5'}`} />
              <div className={`h-2.5 rounded-md w-1/2 transition-all duration-700 ${completedIdx > 0 ? 'bg-emerald-500/10' : 'bg-slate-100 dark:bg-white/5'}`} />
            </div>
          </div>
          
          <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-3">
            <div className={`h-3 rounded-md w-1/4 transition-all duration-700 ${completedIdx > 1 ? 'bg-emerald-500/20' : 'bg-slate-100 dark:bg-white/5'}`} />
            <div className={`h-2.5 rounded-md w-full transition-all duration-700 ${completedIdx > 2 ? 'bg-emerald-500/10' : 'bg-slate-100 dark:bg-white/5'}`} />
            <div className={`h-2.5 rounded-md w-5/6 transition-all duration-700 ${completedIdx > 2 ? 'bg-emerald-500/10' : 'bg-slate-100 dark:bg-white/5'}`} />
          </div>

          <div className="space-y-3">
            <div className={`h-3 rounded-md w-1/5 transition-all duration-700 ${completedIdx > 3 ? 'bg-emerald-500/20' : 'bg-slate-100 dark:bg-white/5'}`} />
            <div className={`h-2.5 rounded-md w-full transition-all duration-700 ${completedIdx > 4 ? 'bg-emerald-500/10' : 'bg-slate-100 dark:bg-white/5'}`} />
          </div>
        </div>
        
        {/* Subtle overlay scanning line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/40 animate-bounce" />
      </div>

    </div>
  );
};
export default ParsingProgressStep;
