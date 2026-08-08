import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResumeBuilderContext } from './ResumeBuilderContext';
import { X, Sparkles, AlertTriangle, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { Button } from '../Button';

interface ResumeBuilderShellProps {
  children: React.ReactNode;
}

export const ResumeBuilderShell: React.FC<ResumeBuilderShellProps> = ({ children }) => {
  const navigate = useNavigate();
  const { currentStep, setStep, isAutosaving, resetBuilderState } = useResumeBuilderContext();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Group steps into Phases
  // Phase 1: Import -> Steps 1-3
  // Phase 2: Build -> Steps 4-5
  // Phase 3: Coach & Polish -> Steps 6-10
  // Phase 4: Finalize -> Steps 11-13
  const getPhaseName = () => {
    if (currentStep <= 3) return 'Phase 1: Import';
    if (currentStep <= 5) return 'Phase 2: Build';
    if (currentStep <= 10) return 'Phase 3: Coach & Polish';
    return 'Phase 4: Finalize';
  };

  const handleCloseClick = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    resetBuilderState();
    navigate('/dashboard');
  };

  const handleStepClick = (stepIdx: number) => {
    // Only allow clicking steps we have already completed/visited
    if (stepIdx < currentStep) {
      setStep(stepIdx);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col text-slate-900 dark:text-white transition-colors duration-200">
      
      {/* Top Header Bar */}
      <header className="h-16 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#111827] relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-bold text-sm shadow-md">
            B
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
              Bimba AI Resume Suite <Sparkles size={13} className="text-emerald-400" />
            </h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold">{getPhaseName()} — Step {currentStep} of 13</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAutosaving && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Autosaving...
            </span>
          )}
          
          <button
            onClick={confirmExit}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-all flex items-center gap-1"
          >
            <Save size={13} /> Save & Exit
          </button>

          <button 
            onClick={handleCloseClick}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Progress Rail segment layout */}
      <div className="px-6 py-2 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-white/10 shrink-0">
        <div className="flex gap-1.5 w-full">
          {Array.from({ length: 13 }).map((_, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isActive = stepNum === currentStep;
            return (
              <div
                key={idx}
                onClick={() => handleStepClick(stepNum)}
                className={`h-1.5 rounded-full flex-grow cursor-pointer transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-emerald-500' 
                    : isActive 
                      ? 'bg-emerald-500/40 dark:bg-emerald-500/30 animate-pulse border border-emerald-500/60' 
                      : 'bg-slate-200 dark:bg-white/10'
                }`}
                title={`Go to Step ${stepNum}`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto p-4 md:p-8 flex flex-col justify-between">
        <div className="flex-grow flex items-center justify-center w-full max-w-5xl mx-auto">
          {children}
        </div>

        {/* Global Footer Buttons */}
        <div className="mt-8 border-t border-slate-200 dark:border-white/10 pt-4 flex justify-between items-center w-full max-w-5xl mx-auto shrink-0">
          <Button
            onClick={() => setStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            variant="outline"
            className="font-bold text-xs gap-1.5"
            icon={<ArrowLeft size={13} />}
          >
            Back
          </Button>

          <Button
            onClick={() => setStep(Math.min(13, currentStep + 1))}
            disabled={currentStep === 13}
            className="font-bold text-xs gap-1.5"
          >
            Continue <ArrowRight size={13} />
          </Button>
        </div>
      </main>

      {/* Confirmation Dialog Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl flex flex-col gap-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle size={22} />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Unsaved Progress Safety Check</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Are you sure you want to exit? Your parsed resume configurations are auto-saved locally, but matching recommendations will need a rescan.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={confirmExit}
                className="flex-1 py-2 bg-rose-500 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer hover:bg-rose-600 transition-all"
              >
                Discard & Exit
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ResumeBuilderShell;
